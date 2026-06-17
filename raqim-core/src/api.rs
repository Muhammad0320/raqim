use axum::extract::ws::{Message, WebSocket, WebSocketUpgrade};
use axum::extract::{Multipart, Path, Query};
use axum::response::Response;
use axum::{
    Json, async_trait,
    extract::{FromRef, FromRequestParts, State},
    http::{StatusCode, request::Parts},
    routing::{get, post},
};

use axum::body::Bytes;
use axum::response::sse::{Event, KeepAlive, Sse};
use dashmap::DashMap;
use ed25519_dalek::{Signer, SigningKey};
use futures_util::stream::Stream;
use futures_util::{SinkExt, stream::StreamExt};
use serde_json::{Value, json};
use std::convert::Infallible;
use std::time::{SystemTime, UNIX_EPOCH};
use tokio_stream::wrappers::BroadcastStream;

use jsonwebtoken::{Algorithm, DecodingKey, Validation, decode};
use serde::{Deserialize, Serialize};
use std::result::Result::{Err, Ok};
use std::sync::atomic::AtomicU64;
use std::{collections::HashMap, sync::Arc};
use tokio::io::AsyncWriteExt;
use tokio::sync::broadcast::Sender;
use tokio::sync::mpsc::UnboundedSender;
use tokio::sync::{mpsc, oneshot};
use tokio::time::{Duration, timeout};
use uuid::Uuid;

use crate::aegis::{CapabilityCertificate, QuarantineRecord};
use crate::axon::AxonGateKeeper;
use crate::health::SystemHealth;
use crate::lancedb_store::LanceEngine;
use crate::nucleus::WalEngine;
use crate::registry::SwarmRegistry;
use crate::state::SwarmStateRegistry;
use crate::{
    A2AEnvelope, aegis::AegisGateKeeper, config::RaqimConfig, memory_router::MemoryRouter,
    network::GlobalNetworkBridge, telemetry::TelemetryEngine,
};
use crate::{AgentState, IngressEnvelope, SystemEvent, execute_raqim_cascade, utils};

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type")] // Enables brilliant json parsing {"type": "AskQuestion", }
pub enum WsMessage {
    // Python -> Daemon: "I want to listen here"
    RegisterCapability {
        capability: String,
    },

    // Python -> Daemon: "Ask the swarm this question"
    AskQuestion {
        request_id: String,
        capability: String,
        question: Vec<u8>,
        sender_hex: String,
        public_key: String,
        signature: Vec<u8>,
        capability_cert: String,
    },

    // Daemon -> python: "Someone is asking you a question"
    IncomingQuestion {
        request_id: String,
        capability: String,
        question: Vec<u8>,
    },

    // Python -> Daemom: "Here's my answer to the incoming question"
    ReplyToQuestion {
        request_id: String,
        answer: Vec<u8>,
        responder_hex: String,
    },

    // Deamon -> Python: "Here's the answer for the AskQueustion you sent earlier"
    QuestionAnswered {
        request_id: String,
        answer: Vec<u8>,
    },

    Error {
        message: String,
    },
}

#[derive(serde::Serialize, Clone, Debug)]
#[serde(tag = "event_type")]
pub enum UiEvent {
    ThoughtCommitted {
        agent_hex: String,
        intent_path: String,
        tx_id: u64,
        text: String,
    },

    A2aMessageRouted {
        source_hex: String,
        target_hex: String,
        namespace: String,
        question_payload: String,
        answer_payload: String,
        latency_ms: u32,
    },

    AegisAlert {
        record: QuarantineRecord,
    },
}

#[derive(Serialize, Clone, Debug)]
pub struct VaultSearchResult {
    pub tx_id: u64,
    pub agent_hex: String,
    pub namespace: String,
    pub payload: String,
    pub timestamp: String,
    pub source: String,
    pub similarity_score: f32,
}

#[derive(Serialize, Clone, Debug)]
pub struct VaultTelemetry {
    pub total_vectors: usize,
    pub index_size_mb: f64,
    pub wal_pending_count: usize,
    pub densest_namespace: String,
}

#[derive(Serialize, Clone, Debug)]
pub struct ActiveAgentNode {
    pub namespace: String,
    pub status: String, // Active, Quarantined, Idle
}

#[derive(Clone)]
pub struct ApiState {
    pub config: Arc<RaqimConfig>,

    pub mem_router: Arc<MemoryRouter>,
    pub axon: Arc<AxonGateKeeper>,
    pub brain: Arc<SwarmStateRegistry>,
    pub aegis: Arc<AegisGateKeeper>,
    pub decoding_key: Arc<DecodingKey>,
    pub global_net: Arc<GlobalNetworkBridge>,
    pub telemetry: Arc<TelemetryEngine>,
    pub cortex_tx: UnboundedSender<Vec<u8>>,
    pub wal: Arc<WalEngine>,
    pub lance: Arc<LanceEngine>,
    pub global_tx_counter: Arc<AtomicU64>,

    pub event_tx: Sender<SystemEvent>,
    pub ui_tx: Sender<UiEvent>,
    pub phantom_ui_tx: Sender<UiEvent>,
    pub health_tx: Sender<SystemHealth>,
    pub swarm_registry: Arc<SwarmRegistry>,
    pub master_signing_key: SigningKey,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct EnterpriseClaim {
    pub sub: String, // Tenant id
    pub features: Vec<String>,
    pub exp: usize,
}

pub struct ValidatedIdentity(pub EnterpriseClaim);

// THE AXUM EXTRACTOR: This automatically protects any route it is attached onto.
#[async_trait]
impl<S> FromRequestParts<S> for ValidatedIdentity
where
    ApiState: axum::extract::FromRef<S>,
    S: Send + Sync,
{
    type Rejection = StatusCode;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let api_state = ApiState::from_ref(state);

        let auth_header = parts
            .headers
            .get("Authorization")
            .and_then(|h| h.to_str().ok())
            .filter(|s| s.starts_with("Bearer "))
            .map(|s| &s[7..])
            .ok_or(StatusCode::UNAUTHORIZED)?;

        // TRUE CRYPTOGRAPHIC VERIFICATION
        let validation = Validation::new(Algorithm::RS256);
        match decode::<EnterpriseClaim>(auth_header, &api_state.decoding_key, &validation) {
            Ok(token_data) => Ok(ValidatedIdentity(token_data.claims)),

            Err(e) => {
                eprintln!("[SECURITY] Invalid or Expired License Key: {}", e);
                Err(StatusCode::UNAUTHORIZED)
            }
        }
    }
}

// The shared state for this speciific ws connection
struct WsConnectionstate {
    // Maps req_id -> the pipe that wakes up the waiting zenoh thread
    pending_a2a_requests: DashMap<String, oneshot::Sender<(Vec<u8>, String)>>,
    // Channel to send mesages DOWN to the Python client
    downstream_tx: mpsc::Sender<Message>,
}

// 3. The Axum Handler (Protected by ValidatedIdentity)
pub async fn mcp_ws_handler(
    _auth: ValidatedIdentity,
    State(state): State<ApiState>,
    ws: WebSocketUpgrade,
) -> Response {
    ws.on_upgrade(move |socket| handle_mcp_socket(socket, state))
}

pub async fn handle_mcp_socket(socket: WebSocket, state: ApiState) {
    let (mut ws_sender, mut ws_receiver) = socket.split();
    let (downstream_tx, mut downstream_rx) = mpsc::channel::<Message>(100);

    let conn_state = Arc::new(WsConnectionstate {
        pending_a2a_requests: DashMap::new(),
        downstream_tx: downstream_tx.clone(),
    });

    // Task 1: Forward downstream message to the actual WS
    let mut send_task = tokio::spawn(async move {
        while let Some(msg) = downstream_rx.recv().await {
            if ws_sender.send(msg).await.is_err() {
                break;
            }
        }
    });

    // Task 2: Process incoming message from Python
    let conn_state_clone = conn_state.clone();
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = ws_receiver.next().await {
            if let Message::Text(text) = msg {
                if let Ok(ws_msg) = serde_json::from_str::<WsMessage>(&text) {
                    process_ws_message(ws_msg, conn_state_clone.clone(), state.clone()).await;
                }
            }
        }
    });

    // If either task fails (socket closed), kill both.
    tokio::select! {
        _ = (&mut send_task) => recv_task.abort(),
        _ = (&mut recv_task) => send_task.abort()
    };
}

// The Memory router
async fn process_ws_message(msg: WsMessage, conn: Arc<WsConnectionstate>, os_state: ApiState) {
    match msg {
        WsMessage::RegisterCapability { capability } => {
            let conn_clone = conn.clone();
            let cap_clone = capability.clone();

            // OS spawns the zenoh listener.
            tokio::spawn(async move {
                os_state
                    .global_net
                    .register_agent_capability(&capability.as_str(), move |question_bytes| {
                        let request_id = Uuid::new_v4().to_string();
                        let (reply_tx, reply_rx) = oneshot::channel();

                        // Store the wakeup pipe in the dashMap
                        conn_clone
                            .pending_a2a_requests
                            .insert(request_id.clone(), reply_tx);

                        let incoming_msg = WsMessage::IncomingQuestion {
                            request_id: request_id.clone(),
                            capability: cap_clone.clone(),
                            question: question_bytes.to_vec(),
                        };

                        // Send down to python
                        let json = serde_json::to_string(&incoming_msg).unwrap();
                        let _ = conn_clone.downstream_tx.blocking_send(Message::Text(json));

                        // ZERO CPU WAIT: Yield OS thread until Python replies. 15 seconds max wait time.
                        match tokio::runtime::Handle::current()
                            .block_on(timeout(Duration::from_secs(15), reply_rx))
                        {
                            Ok(Ok(answer)) => answer.0,
                            _ => {
                                // Python crashed or too long. Clean up the DashMap to prevent memory leaks.
                                conn_clone.pending_a2a_requests.remove(&request_id);
                                b"A2A_TIMEOUT_OR_CRASH".to_vec()
                            }
                        }
                    })
                    .await;
            });
        }

        WsMessage::ReplyToQuestion {
            request_id,
            answer,
            responder_hex,
        } => {
            // Remove the wakeup ppipe from dashmap and fire the answer into it!
            if let Some((_, reply_tx)) = conn.pending_a2a_requests.remove(&request_id) {
                let _ = reply_tx.send((answer, responder_hex));
            }
        }

        WsMessage::AskQuestion {
            request_id,
            capability,
            question,
            sender_hex,
            public_key,
            signature,
            capability_cert,
        } => {
            let os_state_clone = os_state.clone();
            let conn_clone = conn.clone();

            tokio::spawn(async move {
                // Decode Raw bytes from Hex Containers

                let cert_bytes = match hex::decode(&capability_cert) {
                    Ok(b) => b,
                    Err(_) => return,
                };

                let mut public_key_bytes = [0u8; 32];
                if let Ok(b) = hex::decode(&public_key) {
                    if b.len() == 32 {
                        public_key_bytes.copy_from_slice(&b);
                    }
                }

                let mut sender_id_bytes = [0u8; 16];
                if let Ok(decoded) = hex::decode(&sender_hex) {
                    if decoded.len() == 16 {
                        sender_id_bytes.copy_from_slice(&decoded);
                    }
                }

                let mut sig_bytes = [0u8; 64];
                if signature.len() == 64 {
                    sig_bytes.copy_from_slice(&signature)
                }

                let (agent_hex, group_name) =
                    match os_state_clone.aegis.verify_session_lineage(&cert_bytes) {
                        Ok((agent, group)) => (agent, group),
                        Err(_) => return (),
                    };

                let _agent_hex = match os_state_clone.aegis.authorize_packet_fast(
                    agent_hex.as_str(),
                    group_name.as_str(),
                    &public_key_bytes,
                    &question,
                    &sig_bytes,
                    &capability,
                ) {
                    Ok(hex) => hex,
                    Err(e) => {
                        let err = WsMessage::Error {
                            message: format!("[AEGIS Gate block] {}  ", e),
                        };
                        let _ = conn_clone
                            .downstream_tx
                            .send(Message::Text(serde_json::to_string(&err).unwrap()))
                            .await;
                        return;
                    }
                };

                let envelope = A2AEnvelope {
                    sender_id: sender_id_bytes,
                    sender_public_key: public_key_bytes,
                    target_capability: capability.clone(),
                    payload: question.clone(),

                    signature: sig_bytes,
                    sender_capability_cert: cert_bytes,
                };

                // Start the stopwatch
                let start_time = std::time::Instant::now();

                match os_state_clone
                    .global_net
                    .execute_a2a_rpc(
                        envelope,
                        os_state_clone.aegis.clone(),
                        os_state_clone.telemetry.clone(),
                    )
                    .await
                {
                    Ok((answer, responder_hex)) => {
                        // stop the stopwatch
                        let latency_ms = start_time.elapsed().as_millis() as u32;

                        // Send the answer back to the requesting agentn
                        let res = WsMessage::QuestionAnswered {
                            request_id,
                            answer: answer.clone(),
                        };
                        let _ = conn_clone
                            .downstream_tx
                            .send(Message::Text(serde_json::to_string(&res).unwrap()))
                            .await;

                        // Fire the laser beam to the UI
                        let ui_event = UiEvent::A2aMessageRouted {
                            source_hex: sender_hex,
                            target_hex: responder_hex,
                            namespace: capability.clone(),
                            question_payload: String::from_utf8_lossy(&question).into_owned(),
                            answer_payload: String::from_utf8_lossy(&answer).into_owned(),
                            latency_ms,
                        };

                        let _ = os_state_clone.ui_tx.send(ui_event);
                    }

                    Err(e) => {
                        let err = WsMessage::Error {
                            message: e.to_string(),
                        };
                        let _ = conn_clone
                            .downstream_tx
                            .send(Message::Text(serde_json::to_string(&err).unwrap()))
                            .await;
                    }
                }
            });
        }

        _ => {}
    }
}

#[derive(Serialize, Clone)]
pub struct UiThought {
    pub agent_hex: String,
    pub intent_path: String,
    pub text: String,
    pub tx_id: u64,
}

// The Firehose Route Handler
pub async fn sse_firehose_endpoint(
    _auth: ValidatedIdentity,
    State(state): State<ApiState>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    // Subscribe to the live broadcast channel
    let receiver = state.ui_tx.subscribe();

    // Convert the Tokio Receiver into a standard async Stream.
    let stream = BroadcastStream::new(receiver).filter_map(|msg| async move {
        match msg {
            Ok(ui_event) => {
                let json_string = serde_json::to_string(&ui_event).unwrap();
                Some(Ok::<Event, Infallible>(Event::default().data(json_string)))
            }
            Err(_) => {
                // Lagging subscribers are skipped automatically by tokio broadcast
                None
            }
        }
    });

    // Return the SSE stream to the browser.
    Sse::new(stream).keep_alive(axum::response::sse::KeepAlive::new())
}

// The Observatiton deck ( Only used by the time machine UI )
pub async fn sse_phantom_endpoint(
    _auth: ValidatedIdentity,
    State(state): State<ApiState>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    let receiver = state.phantom_ui_tx.subscribe();

    let stream = BroadcastStream::new(receiver).filter_map(|msg| async move {
        match msg {
            Ok(p_event) => {
                let json_string = serde_json::to_string(&p_event).unwrap();
                Some(Ok::<Event, Infallible>(Event::default().data(json_string)))
            }

            Err(_) => None,
        }
    });

    Sse::new(stream).keep_alive(KeepAlive::new())
}

pub async fn agent_alias_endpoint(
    _auth: ValidatedIdentity,
    State(state): State<ApiState>,
) -> axum::Json<HashMap<String, String>> {
    let mut map = HashMap::new();
    for entry in state.swarm_registry.active_agents.iter() {
        map.insert(entry.key().clone().to_string(), entry.value().alias.clone());
    }
    axum::Json(map)
}

#[derive(Deserialize)]
pub struct UnifiedSearchQuery {
    pub query: String,
    pub namespace: Option<String>,
    pub include_wal: Option<bool>,
}

pub async fn unified_vault_search(
    _auth: ValidatedIdentity,
    State(state): State<ApiState>,
    Query(params): Query<UnifiedSearchQuery>,
) -> Result<Json<Vec<VaultSearchResult>>, StatusCode> {
    // The Scatter: Launch both searches concurrently on different OS threads
    let lance_future = state
        .lance
        .semantic_search(&params.query, params.namespace.as_deref(), 50);
    let wal_future = async {
        // Only hit the disk if the user explicitely requested the WAL inclusion
        if params.include_wal.unwrap_or(true) {
            state.wal.lexical_scan(
                &params.query,
                params.namespace.as_deref(),
                50,
                &state.config.wal_path,
            )
        } else {
            Ok(vec![])
        }
    };

    let (lance_res, wal_res) = tokio::join!(lance_future, wal_future);

    // THE GATHER: Starting with the hot wal reasult
    let mut unified_results = wal_res.unwrap_or_default();

    if let Ok(mut cold_results) = lance_res {
        unified_results.append(&mut cold_results)
    }

    // Sort the unified results purely semantic score (Highest first)
    unified_results.sort_by(|a, b| {
        b.similarity_score
            .partial_cmp(&a.similarity_score)
            .unwrap_or(std::cmp::Ordering::Equal)
    });

    // Cap at top 100 for UI performance
    unified_results.truncate(100);

    Ok(Json(unified_results))
}

pub async fn vault_telemetry_endpoint(
    _auth: ValidatedIdentity,
    State(state): State<ApiState>,
) -> Result<Json<VaultTelemetry>, StatusCode> {
    let wal_pending_count = state.wal.get_pending_count();

    let total_vectors = state.lance.get_total_vector_count().await.unwrap_or(0);

    let index_size_mb = state.lance.get_index_size_mb().await;

    let densest_namespace = state
        .lance
        .get_densest_namespace()
        .await
        .unwrap_or_else(|_| "UNKNOWN (0%)".to_string());

    let telemetry = VaultTelemetry {
        total_vectors,
        wal_pending_count,
        index_size_mb,
        densest_namespace,
    };

    Ok(Json(telemetry))
}

#[derive(Deserialize)]
struct ResurrectPayload {
    agent_hex: String,
    system_prompt_override: String,
}

async fn lift_qurantine_and_resurrect(
    identity: ValidatedIdentity,
    State(state): State<ApiState>,
    Json(payload): Json<ResurrectPayload>,
) -> Result<StatusCode, StatusCode> {
    if !identity.0.features.contains(&"aegis".to_string()) {
        eprintln!(
            "[BILLING] Tenant {} attempted to use Aegis without a license.",
            identity.0.sub
        );
        return Err(StatusCode::PAYMENT_REQUIRED);
    }

    // Fire the Out-of-Band Context Eviction Via Zenoh
    println!(
        "[AEGIS] Dispatching Context Eviction to: {}... ",
        payload.agent_hex.clone()
    );
    state
        .global_net
        .dispatch_control_override(&payload.agent_hex, &payload.system_prompt_override)
        .await;

    // Unfreeze the Agent (Remove from DashhMap)
    if state
        .aegis
        .quarantine_blocklist
        .remove(&payload.agent_hex)
        .is_some()
    {
        // Also update the Ram process table so the Topology page knows it's alive again.
        // TODO: Update the  namespace
        state
            .swarm_registry
            .touch_agent(&payload.agent_hex, "Unknown", "Rebooting", "Unknown");

        println!(
            "[AEGIS] Agent {} quarantine lifted. Reality re-seeded.",
            payload.agent_hex
        );

        match state
            .mem_router
            .boot_historical_agent(&payload.agent_hex, None, None, false, state.phantom_ui_tx)
            .await
        {
            Ok(()) => Ok(StatusCode::OK),

            Err(e) => {
                eprintln!(
                    "[TIME MACHINE FATAL] Failed to resurrect WASM state for {}: {} ",
                    &payload.agent_hex, e
                );
                Ok(StatusCode::INTERNAL_SERVER_ERROR)
            }
        }
    } else {
        Err(StatusCode::NOT_FOUND)
    }
}

#[derive(Deserialize, Clone)]
pub struct ForkConfig {
    pub override_seed: Option<u64>,
    pub inject_network: Option<String>,
    pub env_overrides: HashMap<String, String>,
    pub config_overrides: HashMap<String, String>,
}

#[derive(Deserialize)]
struct TimeTravelRequest {
    agent_hex: String,
    target_tx_id: u64,
    fork_config: ForkConfig,
}

// THE ACTIVE DEBUGGING ROUTE HANDLER
async fn time_travel(
    identity: ValidatedIdentity,
    State(state): State<ApiState>,
    Json(payload): Json<TimeTravelRequest>,
) -> Result<StatusCode, StatusCode> {
    if !identity.0.features.contains(&"time_travel".to_string()) {
        return Err(StatusCode::PAYMENT_REQUIRED);
    }

    println!(
        "[TIME TRAVEL] Admin requested Reality Forkk for Agent {} at TxID {} ",
        payload.agent_hex, payload.target_tx_id
    );

    // 1. Lift aegis Quarantine so that the agent can actually boot
    // Unfreeze the Agent (Remove from DashhMap)
    if state
        .aegis
        .quarantine_blocklist
        .remove(&payload.agent_hex)
        .is_some()
    {
        match state
            .mem_router
            .boot_historical_agent(
                &payload.agent_hex,
                Some(payload.target_tx_id),
                Some(payload.fork_config),
                true,
                state.phantom_ui_tx,
            )
            .await
        {
            Ok(()) => Ok(StatusCode::OK),

            Err(e) => {
                eprintln!(
                    "[TIME MACHINE FATAL] Failed to Determinstically Replay {}: {} ",
                    &payload.agent_hex, e
                );
                Ok(StatusCode::INTERNAL_SERVER_ERROR)
            }
        }
    } else {
        Err(StatusCode::NOT_FOUND)
    }
}

pub async fn upload_wasm_endpoint(
    _auth: ValidatedIdentity,
    State(_): State<ApiState>,
    mut multipart: Multipart,
) -> Result<StatusCode, StatusCode> {
    while let Some(mut field) = multipart
        .next_field()
        .await
        .map_err(|_| StatusCode::BAD_REQUEST)?
    {
        let file_name = field.file_name().unwrap_or("").to_string();

        // Strict Hex Validation
        let hex_str = file_name.trim_end_matches(".wasm");
        if utils::parse_agent_id(hex_str).is_err() {
            eprintln!("[SECURITY] Rejected WASM upload: Invalid Agent ID Hex");
            return Err(StatusCode::BAD_REQUEST);
        }

        let filepath = format!("./plugins/{}", file_name);
        let mut file = tokio::fs::File::create(&filepath)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        // RAM-SAFE CHUNK STREAMING
        while let Some(chunk) = field.chunk().await.unwrap() {
            if file.write_all(&chunk).await.is_err() {
                let _ = tokio::fs::remove_file(&filepath).await; // Clean up the corrpted upload
                return Err(StatusCode::INTERNAL_SERVER_ERROR);
            }
        }

        println!(
            "[SYSTEM] Securely streamed new agent binary to disk: {}",
            filepath
        );
    }

    Ok(StatusCode::CREATED)
}

// THE ZERO-COPY HTTP INGRESS: The endpoint expects raw binary `rkyv` bytes, Not JSON.
pub async fn http_ingress_endpoint(
    State(state): State<ApiState>,
    body: Bytes,
) -> Result<StatusCode, StatusCode> {
    // Zero copy access the IngressEnvelope
    let ingress_envelope =
        match rkyv::access::<<IngressEnvelope as rkyv::Archive>::Archived, rkyv::rancor::Error>(
            &body,
        ) {
            Ok(valid_archived) => valid_archived,
            Err(e) => {
                eprintln!(
                    "Invalid body. Malformed memory layout (IngressEnvelope): {}",
                    e
                );
                return Err(StatusCode::BAD_REQUEST);
            }
        };

    let state_bytes = ingress_envelope.state_bytes.as_slice();

    let archived_state =
        match rkyv::access::<<AgentState as rkyv::Archive>::Archived, rkyv::rancor::Error>(
            state_bytes,
        ) {
            Ok(valid_state) => valid_state,
            Err(e) => {
                eprintln!("Invalid body. Malformed memory layout (AgentState): {}", e);
                return Err(StatusCode::BAD_REQUEST);
            }
        };

    let path_intent = ingress_envelope.intent_path.as_str();

    // O(1) Aegis Policy Check.
    let mut packet_sig = [0u8; 64];
    packet_sig.copy_from_slice(ingress_envelope.signature.as_slice());

    let (agent_hex, group_name) = match state
        .aegis
        .verify_session_lineage(&ingress_envelope.capability_cert.as_slice())
    {
        Ok((agent, group)) => (agent, group),
        Err(_) => return Err(StatusCode::UNAUTHORIZED),
    };

    let _agent_hex = match state.aegis.authorize_packet_fast(
        agent_hex.as_str(),
        group_name.as_str(),
        &ingress_envelope.public_key,
        &state_bytes,
        &packet_sig,
        &path_intent,
    ) {
        Ok(hex) => hex,
        Err(_) => return Err(StatusCode::UNAUTHORIZED),
    };
    let task_telemetry = state.telemetry.clone();
    let task_event = state.event_tx.clone();
    let task_axon = state.axon.clone();
    let task_wal = state.wal.clone();
    let task_cortex = state.cortex_tx.clone();
    let task_net = state.global_net.clone();
    let task_counter_tx = state.global_tx_counter.clone();
    let task_brain = state.brain.clone();

    let body_clone = body.clone();

    tokio::spawn(async move {
        // Recast the pointer inside the 'static task bounds
        let envelope = unsafe {
            rkyv::access_unchecked::<<IngressEnvelope as rkyv::Archive>::Archived>(&body_clone)
        };

        let state = unsafe {
            rkyv::access_unchecked::<<AgentState as rkyv::Archive>::Archived>(&envelope.state_bytes)
        };

        // Pass
        let res = execute_raqim_cascade(
            &state,
            task_axon,
            task_wal,
            task_brain,
            task_cortex,
            task_net,
            task_counter_tx,
            task_event,
            Vec::new(),
            Vec::new(),
            task_telemetry,
        )
        .await;

        let _ = match res {
            Ok(id) => id,
            Err(_) => {
                eprintln!("[SECURITY FATAL] Unsigned/Anonymous payload hit the cascade. Dropped.");

                return;
            }
        };
    });

    Ok(StatusCode::ACCEPTED)
}

// 2. THE RAG SEMANTIC SEARCH ENDPOINT
#[derive(Deserialize)]
pub struct RagQuery {
    namespace: String,
    query: String,
    limit: Option<usize>,
}

pub async fn semantic_search_endpoint(
    identity: ValidatedIdentity,
    State(state): State<ApiState>,
    Query(params): Query<RagQuery>,
) -> Result<Json<Vec<String>>, StatusCode> {
    let limit = params.limit.unwrap_or(5);

    match state
        .mem_router
        .semantic_search_with_context(&params.query, &params.namespace, limit)
        .await
    {
        Ok(memories) => Ok(Json(memories)),
        Err(e) => {
            eprintln!("[RAG ERROR] {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn sse_health_endpoint(
    _auth: crate::api::ValidatedIdentity,
    State(state): State<ApiState>,
) -> Sse<impl futures_util::Stream<Item = Result<Event, std::convert::Infallible>>> {
    let receiver = state.health_tx.subscribe();

    let stream = BroadcastStream::new(receiver).filter_map(|msg| async move {
        match msg {
            Ok(health_payload) => {
                let json_string = serde_json::to_string(&health_payload).unwrap();

                Some(Ok(Event::default().data(json_string)))
            }
            Err(_) => None,
        }
    });

    Sse::new(stream).keep_alive(KeepAlive::new())
}

pub async fn active_qurantine_endpoint(
    _auth: ValidatedIdentity,
    State(state): State<ApiState>,
) -> Result<Json<Vec<QuarantineRecord>>, StatusCode> {
    let mut quarantined_agents = Vec::new();

    // Iterate over Dashmap Shards safely.
    for entry in state.aegis.quarantine_blocklist.iter() {
        quarantined_agents.push(entry.value().clone());
    }

    // Sort by most recent first
    quarantined_agents.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));

    Ok(Json(quarantined_agents))
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct TimelineNode {
    pub tx_id: u64,
    pub timestamp: String,
    pub agent_status: String,
    pub payload_preview: String,
}

pub async fn fetch_agent_timeline(
    _auth: ValidatedIdentity,
    State(state): State<ApiState>,
    Path(agent_hex): Path<String>,
) -> Result<Json<Vec<TimelineNode>>, StatusCode> {
    // The scatter: Let the engines do their native work
    let lance_future = state.lance.fetch_historical_timeline(&agent_hex);
    let wal_future = async {
        state
            .wal
            .fetch_hot_timeline(&agent_hex, &state.config.wal_path)
    };

    let (lance_res, wal_res) = tokio::join!(lance_future, wal_future);

    let mut nodes = wal_res.unwrap_or_default();
    if let Ok(mut cold_res) = lance_res {
        nodes.append(&mut cold_res)
    }

    nodes.sort_by(|a, b| a.tx_id.cmp(&b.tx_id));

    Ok(Json(nodes))
}

#[derive(Serialize)]
pub struct DashboardCards {
    pub global_transactions: u64,
    pub active_agents: usize,
    pub vault_capacity: usize,
}

pub async fn dashboard_cards_endpoint(
    _auth: ValidatedIdentity,
    State(state): State<ApiState>,
) -> Result<Json<DashboardCards>, StatusCode> {
    // Vault capacity (Direct from lance)
    let total_vec = state.lance.get_total_vector_count().await.unwrap_or(0);

    // Global Transactions (Direct from the Atomic counter)
    let highest_tx = state
        .global_tx_counter
        .load(std::sync::atomic::Ordering::SeqCst);

    // Active agents (60s Rolling window)
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();

    // Iterate through the Dashmap
    let active_count = state
        .swarm_registry
        .active_agents
        .iter()
        .filter(|entry| {
            let is_recent = now.saturating_sub(entry.last_seen_ts) <= 60;
            let is_not_jailed = entry.status != "Quarantined";
            is_recent && is_not_jailed
        })
        .count();

    Ok(Json(DashboardCards {
        global_transactions: highest_tx,
        active_agents: active_count,
        vault_capacity: total_vec,
    }))
}

#[derive(Serialize)]
pub struct AegisMetricsData {
    pub total_quarantined: usize,
    pub recent_interdictions: usize,
    pub signarure_spoofs: usize,
    pub namespace_breaches: usize,
}

pub async fn aegis_metics_endpoint(
    _auth: ValidatedIdentity,
    State(state): State<ApiState>,
) -> Result<Json<AegisMetricsData>, StatusCode> {
    let mut metrics = AegisMetricsData {
        total_quarantined: 0,
        recent_interdictions: 0,
        signarure_spoofs: 0,
        namespace_breaches: 0,
    };

    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();
    let ten_minutes_ago = now.saturating_sub(600);

    // Safely iterate the dashmap shards.
    for entry in state.aegis.quarantine_blocklist.iter() {
        metrics.total_quarantined += 1;
        let record = entry.value();

        // Check if it happens 10 minutes ago
        if record.timestamp >= ten_minutes_ago {
            metrics.recent_interdictions += 1;
        }

        // Tally strict violation types
        match record.violation_type.as_str() {
            "CRYPTO_SPOOF" => metrics.signarure_spoofs += 1,
            "NAMESPACE_BREACH" => metrics.namespace_breaches += 1,
            _ => {}
        }
    }

    Ok(Json(metrics))
}

#[derive(serde::Deserialize)]
pub struct MintRequest {
    pub agent_hex: String,
    pub group: String,
}

pub async fn handle_ca_mint(
    _auth: ValidatedIdentity,
    State(state): State<ApiState>,
    Json(payload): Json<MintRequest>,
) -> Result<Json<String>, StatusCode> {
    // Contruct the unsigned Certificate Passport
    let expiration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs()
        + (365 * 24 * 60 * 60);

    let mut cert = CapabilityCertificate {
        agent_hex: payload.agent_hex.clone(),
        group_name: payload.group.clone(),
        expiration_timestamp: expiration,
        master_signature: Vec::new(),
    };

    // Serialize and sign using the master private key inside api_state
    let serialized_raw =
        postcard::to_allocvec(&cert).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let signature = state.master_signing_key.sign(&serialized_raw);

    cert.master_signature = signature.to_bytes().to_vec();

    // Returned the fully serialized and signed passport to the CLI
    let final_bytes =
        postcard::to_allocvec(&cert).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(hex::encode(final_bytes)))
}

/// Maps to `raqim cluster info`
pub async fn cluster_info_endpoint(
    _auth: ValidatedIdentity,
    State(state): State<ApiState>,
) -> Result<Json<Value>, StatusCode> {
    let highest_tx = state
        .global_tx_counter
        .load(std::sync::atomic::Ordering::SeqCst);

    let pending_wal_items = state.wal.get_pending_count();
    let wal_size = std::fs::metadata(&state.config.wal_path)
        .map(|m| m.len())
        .unwrap_or(0);

    let node_id = state.global_net.os_node_id.clone();

    let payload = json!({
        "node_id": node_id,
        "highest_tx_id": highest_tx,
        "wal_bytes": wal_size,
        "buffer_load": pending_wal_items
    });

    Ok(Json(payload))
}

/// Maps to  `raqim cluster topology`
pub async fn cluster_topology_endpoint(
    _auth: ValidatedIdentity,
    State(state): State<ApiState>,
) -> Result<Json<Value>, StatusCode> {
    let mut shards = Vec::new();

    // Iterate through the DashMap of the active swarmbrain document
    for entry in state.brain.shards.iter() {
        let namespace = entry.key();
        let brain = entry.value();

        // Acquire a brief read lock on the Loro CRDT to extract topology metrics
        let doc_lock = brain.doc.read();

        // Count how many unique agent timelines exist within this specific shard
        let active_timelines = brain.root_timeline_map.len();

        // For CLI diagnostics: we measure the length of the underlying operations log.
        let ops_count = doc_lock.len_ops();

        shards.push(json!({ "namespace": namespace, "active_timelines": active_timelines, "total_crdt_operation": ops_count }));
    }

    Ok(Json(json!(shards)))
}

// Route Builder
pub fn build_admin_router(state: ApiState) -> axum::Router {
    axum::Router::new()
        // Admin / Debugging endpoints
        .route("/v1/aegis/quarantine_list", get(active_qurantine_endpoint))
        .route(
            "/v1/admin/quarantine/lift",
            post(lift_qurantine_and_resurrect),
        )
        .route("/v1/admin/time_travel", post(time_travel))
        .route("/v1/time_travel/fork", post(time_travel))
        .route("/v1/admin/time_travel/fork", post(time_travel))
        .route(
            "/v1/admin/time_travel/timeline/:agent_hex",
            get(fetch_agent_timeline),
        )
        .route("/v1/admin/cluster/info", get(cluster_info_endpoint))
        .route("/v1/admin/cluster/topology", get(cluster_topology_endpoint))
        // System / Deployment endpoints
        .route("/v1/system_boot_agent", post(upload_wasm_endpoint))
        .route("/v1/system/health/live", get(sse_health_endpoint))
        .route("/v1/system/agents/aliases", get(agent_alias_endpoint))
        // Agent Swarm endpoints
        .route("/v1/mcp/ws", post(mcp_ws_handler))
        .route("/v1/swarm/ingress", post(http_ingress_endpoint))
        .route("/v1/swarm/memory", get(semantic_search_endpoint))
        // UI endpoints
        .route("/v1/dashboard/cards", get(dashboard_cards_endpoint))
        .route("/v1/system/firehose", get(sse_firehose_endpoint))
        .route("/v1/time-travel/stream", get(sse_phantom_endpoint))
        .route("/v1/vault/search", post(unified_vault_search))
        .route("/v1/vault/tellemetry", get(vault_telemetry_endpoint))
        .route("/v1/aegis/metrics", get(aegis_metics_endpoint))
        .with_state(state)
}
