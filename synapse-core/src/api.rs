use axum::extract::ws::{Message, WebSocket, WebSocketUpgrade};
use axum::{
    Json, async_trait,
    extract::{FromRef, FromRequestParts, State},
    http::{Request, StatusCode, request::Parts},
    middleware::Next,
    response::Response,
    routing::{get, post},
};
use dashmap::DashMap;
use futures_util::{SinkExt, stream::StreamExt};
use jsonwebtoken::{Algorithm, DecodingKey, Validation, decode};
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, sync::Arc};
use tokio::sync::{mpsc, oneshot};
use tokio::time::{Duration, timeout};
use uuid::Uuid;

use crate::{
    A2AEnvelope, aegis::AegisGateKeeper, config::RaqimConfig, memory_router::MemoryRouter,
    network::GlobalNetworkBridge, telemetry::TelemetryEngine,
};

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
        public_key: Vec<u8>,
        signature: Vec<u8>,
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

#[derive(Clone)]
pub struct ApiState {
    pub config: Arc<RaqimConfig>,

    pub mem_router: Arc<MemoryRouter>,
    pub aegis: Arc<AegisGateKeeper>,
    pub decoding_key: Arc<DecodingKey>,
    pub global_net: Arc<GlobalNetworkBridge>,
    pub telemetry: Arc<TelemetryEngine>,
}

#[derive(Serialize, Deserialize, Debug)]
struct EnterpriseClaim {
    pub sub: String, // Tenant id
    pub features: Vec<String>,
    pub exp: usize,
}

#[derive(Deserialize, Clone)]
pub struct ForkConfig {
    pub override_seed: Option<u64>,
    pub inject_network: Option<String>,
    pub env_overrides: HashMap<String, String>,
    pub config_overrides: HashMap<String, String>,
}

struct TimeTravelRequest {
    agent_id: String,
    target_tx_id: u64,
    fork_config: ForkConfig,
}

// THE AXUS EXTRACTOR: This automatically protects any route it is attached to.
pub struct ValidatedEnterprise;

#[async_trait]
impl<S> FromRequestParts<S> for ValidatedEnterprise
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
            Ok(token_data) => {
                // Feature gating! If they didn't pay for Aegis block the admin API
                if !token_data.claims.features.contains(&"aegis".to_string()) {
                    return Err(StatusCode::FORBIDDEN);
                }
                Ok(ValidatedEnterprise)
            }

            Err(e) => {
                eprintln!("[SECURITY] Crytographic JWT validation failed: {}", e);
                Err(StatusCode::UNAUTHORIZED)
            }
        }
    }
}

// The shared state for this speciific ws connection
struct WsConnectionstate {
    // Maps req_id -> the pipe that wakes up the waiting zenoh thread
    pending_a2a_requests: DashMap<String, oneshot::Sender<Vec<u8>>>,
    // Channel to send mesages DOWN to the Python client
    downstream_tx: mpsc::Sender<Message>,
}

// 3. The Axum Handler (Protected by ValidatedEnterprise)
pub async fn mcp_ws_handler(
    _auth: ValidatedEnterprise,
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
            let cap_clone = capability.to_string();

            // OS spawns the zenoh listener.
            tokio::spawn(async move {
                os_state
                    .global_net
                    .register_agent_capability(&cap_clone.as_str(), move |question_bytes| {
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
                            Ok(Ok(answer)) => answer, // Python replied in time.
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

        WsMessage::ReplyToQuestion { request_id, answer } => {
            // Remove the wakeup ppipe from dashmap and fire the answer into it!
            if let Some((_, reply_tx)) = conn.pending_a2a_requests.remove(&request_id) {
                let _ = reply_tx.send(answer);
            }
        }

        WsMessage::AskQuestion {
            request_id,
            capability,
            question,
            sender_hex,
            public_key,
            signature,
        } => {
            let os_state_clone = os_state.clone();
            let conn_clone = conn.clone();

            tokio::spawn(async move {
                // Construct Envelope.
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

                let envelope = A2AEnvelope {
                    sender_id: sender_id_bytes,
                    target_capability: capability,
                    payload: question,
                    signature: sig_bytes,
                };

                match os_state_clone
                    .global_net
                    .execute_a2a_rpc(
                        envelope,
                        os_state_clone.aegis.clone(),
                        os_state_clone.telemetry.clone(),
                    )
                    .await
                {
                    Ok(answer) => {
                        let res = WsMessage::QuestionAnswered { request_id, answer };
                        let _ = conn_clone
                            .downstream_tx
                            .send(Message::Text(serde_json::to_string(&res).unwrap()))
                            .await;
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

// Authorization middleware ( The enterprise firewall )
async fn auth_middleware(
    State(state): State<ApiState>,
    req: Request<axum::body::Body>,
    next: Next,
) -> Result<Response, StatusCode> {
    if let Some(auth_header) = req.headers().get("Authorization") {
        if let Ok(auth_str) = auth_header.to_str() {
            if auth_str == format!("Bearer {}", state.config.license_key) {
                return Ok(next.run(req).await);
            }
        }
    }

    eprintln!(
        "[SECURITY] Blocked unauthorized API request to {}",
        req.uri()
    );
    Err(StatusCode::UNAUTHORIZED)
}

// THE ACTIVE DEBUGGING ROUTE HANDLER
async fn time_travel(
    _auth: ValidatedEnterprise,
    State(state): State<ApiState>,
    Json(payload): Json<TimeTravelRequest>,
) -> Result<StatusCode, StatusCode> {
    println!(
        "[TIME TRAVEL] Admin requested Reality Forkk for Agent {} at TxID {} ",
        payload.agent_id, payload.target_tx_id
    );

    // 1. Lift aegis Quarantine so that the agent can actually boot
    state.aegis.lift_quarantine(&payload.agent_id);

    match state
        .mem_router
        .boot_historical_agent(
            &payload.agent_id,
            payload.target_tx_id,
            Some(payload.fork_config),
            true,
        )
        .await
    {
        Ok(()) => StatusCode::OK,
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR,
    }
}

async fn get_quarantine(State(state): State<ApiState>) -> Result<Json<Vec<String>>, StatusCode> {
    Ok(Json(state.aegis.fetch_quaratined_agents()))
}

#[derive(Deserialize)]
struct ResurrectPayload {
    agent_id: String,
}

async fn lift_qurantine_and_resurrect(
    State(state): State<ApiState>,
    Json(payload): Json<ResurrectPayload>,
) -> Result<StatusCode, StatusCode> {
    // List the Aegis Block.
    state.aegis.lift_quarantine(&payload.agent_id);

    match state
        .mem_router
        .boot_historical_agent(&payload.agent_id, None, None, false)
        .await
    {
        Ok(()) => Ok(StatusCode::OK),
        Err(_) => Ok(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

// Route Builder
pub fn build_admin_router(state: ApiState) -> axum::Router {
    axum::Router::new()
        .route("/v1/admin/quarantine", get(get_quarantine))
        .route(
            "/v1/admin/quarantine/lift",
            post(lift_qurantine_and_resurrect),
        )
        .route("/v1/admin/time_travel", post(time_travel))
        // .route("/v1/admin/upload_agent", post(upload_agent_wasm))
        .with_state(state)
}
