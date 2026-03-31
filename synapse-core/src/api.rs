use axum::{
    Json, Router,
    extract::State,
    http::{HeaderMap, StatusCode},
    routing::{get, post},
};
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};

use crate::{aegis::AegisGateKeeper, config::RaqimConfig};

#[derive(Clone)]
pub struct ApiState {
    pub config: RaqimConfig,
    pub aegis: Arc<AegisGateKeeper>,
}

// Authorization middleware ( The enterprise firewall )
fn authenticate(headers: &HeaderMap, expected_key: &str) -> Result<(), StatusCode> {
    if let Some(auth_header) = headers.get("Authorization") {
        if let Ok(auth_str) = auth_header.to_str() {
            if auth_str == format!("Bearer {}", expected_key) {
                return Ok(());
            }
        }
    }

    eprintln!("[SECURITY] Unauthorized API access atttempt blocked.");
    Err(StatusCode::UNAUTHORIZED)
}

async fn get_quarantine(
    headers: HeaderMap,
    State(state): State<ApiState>,
) -> Result<Json<Vec<String>>, StatusCode> {
    authenticate(&headers, &state.config.license_key)?;
    Ok(Json(state.aegis.get_quarantined_agents()))
}

#[derive(Deserialize)]
struct LiftRequest {
    agent_id: String,
}

async fn lift_qurantitne(
    headers: HeaderMap,
    State(state): State<ApiState>,
    Json(payload): Json<LiftRequest>,
) -> Result<StatusCode, StatusCode> {
    authenticate(&headers, &state.config.license_key)?;
    state.aegis.lift_quarantine(&payload.agent_id);
    Ok(StatusCode::OK)
}

// Route Builder
pub fn build_admin_router(state: ApiState) -> Router {
    Router::new()
        .route("/v1/admin/quarantine", get(get_quarantine))
        .route("/v1/admin/quarantine/lift", post(lift_qurantitne))
        .with_state(state)
}
