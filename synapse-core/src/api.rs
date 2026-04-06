use std::{
    collections::HashMap,
    sync::{Arc, atomic::AtomicU64},
};

use axum::{
    Json, Router, async_trait,
    extract::{FromRef, FromRequestParts, Multipart, State},
    http::{HeaderMap, Request, StatusCode, request::Parts},
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::{get, post},
};
use jsonwebtoken::{Algorithm, DecodingKey, Validation, decode};
use serde::{Deserialize, Serialize};
use tokio::sync::{broadcast::Sender, mpsc, oneshot};
use wasmtime_wasi::WasiCtx;

use crate::{
    SystemEvent, aegis::AegisGateKeeper, axon::AxonGateKeeper, config::RaqimConfig, lancedb_store::LanceEngine, memory_router::MemoryRouter, network::GlobalNetworkBridge, nucleus::WalEngine, sandbox::{SandboxContent, WasmEngine}, state::SwarmState, telemetry::TelemetryEngine
};

#[derive(Clone)]
pub struct ApiState {
    pub config: Arc<RaqimConfig>,
    pub axon: Arc<AxonGateKeeper>,
    pub aegis: Arc<AegisGateKeeper>,
    pub brain: Arc<SwarmState>,
    pub wal: Arc<WalEngine>,
    pub wasm: Arc<WasmEngine>,
    pub cortex_tx: mpsc::UnboundedSender<Vec<u8>>,
    pub global_net: Arc<GlobalNetworkBridge>,
    pub global_tx_counter: Arc<AtomicU64>,
    pub event_tx: Sender<SystemEvent>,
    pub lance: Arc<LanceEngine>,
    pub mem_router: Arc<MemoryRouter>,

    pub agent_hex: String,
    pub telemetry: Arc<TelemetryEngine>,

    // LIVE MODE: We collect seeds and HTTP responses as they happen
    pub live_seeds: Vec<u64>,
    pub live_responses: Vec<String>,
    pub live_timestamps: Vec<i64>,

    // REPLAY MODE: We load the seeds and HTTP responses here before booting
    pub replay_seeds: Vec<u64>,
    pub replay_responses: Vec<String>,
    pub replay_timestamps: Vec<i64>,

    // Temporary Cache
    pub a2a_response_cache: Vec<u8>,
    pub http_response_cache: Vec<u8>,

    pub a2a_receiver: Option<mpsc::Receiver<(Vec<u8>, oneshot::Sender<Vec<u8>>)>>,
    pub a2a_reply_channel: Option<oneshot::Sender<Vec<u8>>>,
    pub decoding_key: Arc<DecodingKey>,
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

   match  state.mem_router.boot_historical_agent(&payload.agent_id, payload.target_tx_id, Some(payload.fork_config), true).await {
    Ok(()) => StatusCode::OK,
    Err(_) => StatusCode::INTERNAL_SERVER_ERROR 
   }
   
}

async fn get_quarantine(State(state): State<ApiState>) -> Result<Json<Vec<String>>, StatusCode> {
    Ok(Json(state.aegis.fetch_quaratined_agents()))
}

#[derive(Deserialize)]
struct ResurrectPayload {
    agent_id: String,
    target_tx_id: u64,
}

async fn lift_qurantine_and_resurrect(
    State(state): State<ApiState>,
    Json(payload): Json<ResurrectPayload>,
) -> Result<StatusCode, StatusCode> {
    // List the Aegis Block.
    state.aegis.lift_quarantine(&payload.agent_id);

        match  state.mem_router.boot_historical_agent(&payload.agent_id, payload.target_tx_id, Some(payload.fork_config), false).await {
    Ok(()) => StatusCode::OK,
    Err(_) => StatusCode::INTERNAL_SERVER_ERROR 
   }
}

// Route Builder
pub fn build_admin_router(state: ApiState) -> Router {
    Router::new()
        .route("/v1/admin/quarantine", get(get_quarantine))
        .route(
            "/v1/admin/quarantine/lift",
            post(lift_qurantine_and_resurrect),
        )
        route("/v1/admin/time_travel", post(time_travel))
        .route("/v1/admin/upload_agent", post(upload_agent_wasm))
        .with_state(state)
}
