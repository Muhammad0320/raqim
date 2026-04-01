use axum::{
    Json, Router,
    extract::State,
    http::{HeaderMap, Request, StatusCode},
    middleware::{self, Next},
    response::Response,
    routing::{get, post},
};
use serde::{Deserialize, Serialize};

use crate::{
    aegis::AegisGateKeeper, config::RaqimConfig, memory_router::MemoryRouter, sandbox::WasmEngine,
    telemetry::TelemetryEngine,
};
use std::sync::Arc;

#[derive(Clone)]
pub struct ApiState {
    pub config: RaqimConfig,
    pub aegis: Arc<AegisGateKeeper>,
    pub router: Arc<MemoryRouter>,
    pub wasm_engine: Arc<WasmEngine>,
    pub telemetry: Arc<TelemetryEngine>,
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
    let (base_snapshot, historical_oplog) = state.router.rebuild_agent_timeline(
        &payload.agent_id,
        payload.target_tx_id,
        state.wasm_engine.clone(),
        state.telemetry.clone(),
    );

    Ok(StatusCode::OK)
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
