use axum::{
    Json, Router,
    extract::{Multipart, State},
    http::{HeaderMap, Request, StatusCode},
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::{get, post},
};
use jsonwebtoken::{Algorithm, DecodingKey, Validation, decode};
use serde::{Deserialize, Serialize};
use serde::{Deserialize, Serialize};
use tokio::sync::{broadcast::Sender, mpsc};
use wasmtime_wasi::WasiCtx;

use crate::{
    SystemEvent,
    aegis::AegisGateKeeper,
    axon::AxonGateKeeper,
    config::RaqimConfig,
    lancedb_store::LanceEngine,
    memory_router::MemoryRouter,
    network::GlobalNetworkBridge,
    nucleus::WalEngine,
    sandbox::{SandboxContent, WasmEngine},
    state::SwarmState,
    telemetry::TelemetryEngine,
};
use std::{
    fs,
    sync::{Arc, atomic::AtomicU64},
};

#[derive(Clone)]
pub struct ApiState {
    pub config: RaqimConfig,
    pub aegis: Arc<AegisGateKeeper>,
    pub axon: Arc<AxonGateKeeper>,
    pub brain: Arc<SwarmState>,
    pub router: Arc<MemoryRouter>,
    pub wasm_engine: Arc<WasmEngine>,
    pub telemetry: Arc<TelemetryEngine>,
    pub wal_engine: Arc<WalEngine>,
    pub lance: Arc<LanceEngine>,
    pub cortex_tx: mpsc::UnboundedSender<Vec<u8>>,
    pub global_net: Arc<GlobalNetworkBridge>,
    pub global_tx_counter: Arc<AtomicU64>,
    pub event_tx: Sender<SystemEvent>,
    pub wasi: WasiCtx,

    pub live_seeds: Vec<u64>,
    pub live_responses: Vec<String>,
    pub live_timestamps: Vec<i64>,

    pub replay_seeds: Vec<u64>,
    pub replay_responses: Vec<String>,
    pub replay_timestamps: Vec<i64>,
}

#[derive(Serialize, Deserialize)]
struct AdminClaims {
    sub: String,
    role: String,
    exp: usize,
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

    // 2. Rebuild the Timeline
    let (base_snapshot, historical_oplog) = state
        .router
        .rebuild_agent_timeline(
            &payload.agent_id,
            payload.target_tx_id,
            state.wal_engine.clone(),
            state.telemetry.clone(),
        )
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // 3. Extract the Deterministic Variables for WASM injection
    let mut replay_seeds = Vec::new();
    let mut replay_responses = Vec::new();
    let mut replay_timestamps = Vec::new();

    for log in historical_oplog {
        replay_seeds.extend(log.entropy_seeds);
        replay_responses.extend(log.network_responses);
        replay_timestamps.extend(log.state.timestamp);
    }

    // 4. Construct the Sandbox Content for Resurrection
    let content = SandboxContent {
        axon: state.axon,
        aegis: state.aegis,
        brain: state.brain,

        wal: state.wal_engine,
        cortex_tx: state.cortex_tx,
        global_net: state.global_net,
        global_tx_counter: state.global_tx_counter,
        event_tx: state.event_tx,
        wasi: state.wasi,
        lance: state.lance,
        agent_hex: payload.agent_id,
        live_responses: Vec::new(),
        live_seeds: Vec::new(),
        live_timestamps: Vec::new(),
        telemetry: state.telemetry,

        replay_responses: replay_responses,
        replay_seeds: replay_seeds,
        replay_timestamps: replay_timestamps,
    };

    Ok(StatusCode::OK)
}

async fn upload_agent_wasm(
    headers: HeaderMap,
    State(state): State<ApiState>,
    mut multipart: Multipart,
) -> Result<StatusCode, StatusCode> {
    // Stream the file to disk
    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|_| StatusCode::BAD_REQUEST)?
    {
        let file_name = field
            .file_name()
            .unwrap_or("unknown_agent.wasm")
            .to_string();

        if !file_name.ends_with(".wasm") {
            return Err(StatusCode::UNSUPPORTED_MEDIA_TYPE);
        }

        let data = field
            .bytes()
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        let file_path = format!("./plugins/{}", file_name);
        fs::write(&file_path, data).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        println!(
            "[API] Successfully received and staged agent: {}",
            file_name
        );
        return Ok(StatusCode::CREATED);
    }

    Err(StatusCode::BAD_REQUEST)
}

// Route Builder
pub fn build_admin_router(state: ApiState) -> Router {
    Router::new()
        .route("/v1/admin/quarantine", get(get_quarantine))
        .route(
            "/v1/admin/quarantine/lift",
            post(lift_qurantine_and_resurrect),
        )
        .route_layer(middleware::from_fn_with_state(
            state.clone(),
            auth_middleware,
        ))
        .with_state(state)
}
