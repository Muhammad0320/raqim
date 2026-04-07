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

use crate::{
    SystemEvent, aegis::AegisGateKeeper,  config::RaqimConfig,  memory_router::MemoryRouter, network::GlobalNetworkBridge, nucleus::WalEngine, sandbox::{SandboxContent, WasmEngine}, state::SwarmState, telemetry::TelemetryEngine
};

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type")] // Enables brilliant json parsing {"type": "AskQuestion", }
pub enum WsMessage {

    // Python -> Daemon: "I want to listen here"
    RegisterCapability { capability: String },

    // Python -> Daemon: "Ask the swarm this question"
    AskQuestion { request_id: String, capability: String, question: Vec<u8> },

    // Daemon -> python: "Someone is asking you a question"
    IncomingQuestion {request_id: String, capability: String, question: Vec<u8>},

    // Python -> Daemom: "Here's my answer to the incoming question"
    ReplyToQuestion {request_id: String, answer: Vec<u8>},

    // Deamon -> Python: "Here's the answer for the AskQueustion you sent earlier"
    QuestionAnswered {request_id: String, answer: Vec<u8>}

}

#[derive(Clone)]
pub struct ApiState {
    pub config: Arc<RaqimConfig>,

    pub mem_router: Arc<MemoryRouter>,
    pub aegis: Arc<AegisGateKeeper>,
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
        .with_state(state);
}
