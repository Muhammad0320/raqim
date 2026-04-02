use axum::{
    async_trait,
    Json, Router,
    extract::{FromRef, FromRequestParts, Multipart, State},
    http::{HeaderMap, Request, StatusCode, request::Parts},
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::{get, post},
};
use jsonwebtoken::{Algorithm, DecodingKey, Validation, decode};
use serde::{Deserialize, Serialize};


#[derive(Clone)]
pub struct ApiState {
    pub config: RaqimConfig,
    

    pub decoding_key: Arc<DecodingKey>,
}

#[derive(Serialize, Deserialize, Debug)]
struct EnterpriseClaim {
    pub sub: String, // Tenant id
    pub features: Vec<String>,
    pub exp: usize,
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

        let auth_header = parts.headers.get("Authorization").and_then(|h| h.to_str().ok()).filter(|s| s.starts_with("Bearer ")).map(|s| &s[7..] ).ok_or(StatusCode::UNAUTHORIZED)?;

        // TRUE CRYPTOGRAPHIC VERIFICATION
        let validation = Validation::new(Algorithm::RS256);
        match decode::<EnterpriseClaim>(auth_header, &api_state.decoding_key, &validation) {

            Ok(token_data) => {
                // Feature gating! If they didn't pay for Aegis block the admin API
                if !token_data.claims.features.comtains(&"aegis".to_string()) {
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
        .route("/v1/admin/quarantine", get( |_auth: ValidatedEnterprise, State(s): State<ApiState>| async move {
            get_quarantine 
        } ))
        .route(
            "/v1/admin/quarantine/lift",
            post(lift_qurantine_and_resurrect),
        )
        .route("/v1/admin/upload_agent", post(upload_agent_wasm))
        .with_state(state)
}
