use ed25519_dalek::{Signer, SigningKey};
use futures_util::{SinkExt, StreamExt};
use mcp_rust_sdk::error::ErrorCode;
use mcp_rust_sdk::server::{Server, ServerHandler};
use mcp_rust_sdk::transport::stdio::StdioTransport;
use mcp_rust_sdk::types::{ClientCapabilities, Implementation, ServerCapabilities, Tool};
use raqim_core::api::WsMessage;
use raqim_core::config::RaqimConfig;
use serde_json::{Value, json};
use std::fs;
use std::sync::Arc;

use async_trait::async_trait;
use raqim_core::{AgentState, AgentStatus, IngressEnvelope};
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tokio::io::AsyncWriteExt;
use tokio::net::TcpStream;

// 1. Define our custom handler struct
struct RaqimHandler {
    signing_key: SigningKey,
    pub_key_bytes: [u8; 32],
    daemon_http_url: String,
    license_key: String,
    http_client: reqwest::Client,

    commit_tool: Tool,
    query_tool: Tool,
    ask_swarm_tool: Tool,
}

impl RaqimHandler {
    fn new(private_key_path: &str, daemon_http_url: &str, license_key: &str) -> Self {
        // ENTERPRISE CRYTOGRAPHY: Load from config
        let key_bytes = fs::read(private_key_path)
            .expect("FATAL: Missing Private Key. Aegis identity is required.");
        let signing_key = SigningKey::from_bytes(key_bytes.as_slice().try_into().unwrap());
        let pub_key_bytes = signing_key.verifying_key().to_bytes();
        let http_client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(10))
            .build()
            .unwrap();

        Self {
            signing_key,
            pub_key_bytes,
            license_key: license_key.to_string(),
            http_client,
            daemon_http_url: daemon_http_url.to_string(),
            ask_swarm_tool: Tool {
                name: "ask_swarm".to_string(),
                description: "Ask another agent a question via the A2A Zero-Trust network"
                    .to_string(),
                schema: json!({
                    "type": "object",
                    "properties": {
                        "target_capability": {"type": "string", "description": "e.g. rqm_medical/vitals"},
                        "question": {"type": "string"}
                    },
                    "required": ["target_capability", "question"]
                }),
            },

            commit_tool: Tool {
                name: "commit_thought".to_string(),
                description: "Commits a verified thought to the Raqim OS CRDT".to_string(),
                schema: json!({
                    "type": "object",
                    "properties": {
                        "thought_text": {"type": "string"},
                        "status": {"type": "string", "enum": ["Reasoning", "ToolExecution", "Halted", "Idle"]},
                        "intent_path": {"type": "string", "description": "The namespace e.g rqm_finance/ledger"},
                        "agent_id_hex": {"type": "string", "description": "The exact 32-char hex UUID of this agent thread."}
                    },
                    "required": ["thought_text", "status", "intent_path", "agent_id_hex"]
                }),
            },

            query_tool: Tool {
                name: "query_memory".to_string(),
                description: "Semantic RAG search bounded by namespace.".to_string(),
                schema: json!({
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "The english question to search for"},
                        "intent_path": {"type": "string", "description": "The namespase to isolate the search" }

                    },
                    "required": ["query", "intent_path"]
                }),
            },
        }
    }
}

#[async_trait]
impl ServerHandler for RaqimHandler {
    // 1. The Boot sequence
    async fn initialize(
        &self,
        _client_info: Implementation,
        _client_caps: ClientCapabilities,
    ) -> Result<ServerCapabilities, mcp_rust_sdk::Error> {
        // let mut tool_cap = HashMap::new();
        // tool_cap.insert("listChanged".to_string(), json!(false));

        Ok(ServerCapabilities { custom: None })
    }

    // 2.The Router, handles Tool Discovery
    async fn handle_method(
        &self,
        method: &str,
        params: Option<Value>,
    ) -> Result<Value, mcp_rust_sdk::Error> {
        match method {
            // LLM asks: "What tools do you have?"
            "tools/list" => Ok(
                json!({"tools": [self.commit_tool.clone(), self.query_tool.clone(), self.ask_swarm_tool.clone()]}),
            ),

            // LLM says: "Execute this tool!"
            "tools/call" => {
                let p = params.ok_or_else(|| {
                    mcp_rust_sdk::Error::protocol(ErrorCode::InvalidParams, "Missing params")
                })?;
                let name = p.get("name").and_then(|v| v.as_str()).unwrap_or("");
                let args = p.get("arguments").ok_or_else(|| {
                    mcp_rust_sdk::Error::protocol(ErrorCode::InvalidParams, "Missing args")
                })?;

                if name == "commit_thought" {
                    // Enforce agent identity
                    let agent_id_hex = args
                        .get("agent_id_hex")
                        .and_then(|v| v.as_str())
                        .ok_or_else(|| {
                            mcp_rust_sdk::Error::Other("Missing agent_id_hex".to_string())
                        })?;
                    let agent_id_bytes = hex::decode(agent_id_hex)
                        .map_err(|_| mcp_rust_sdk::Error::Other("Invalid Hex".to_string()))?;

                    // --- Translation layer ----
                    let intent_path = args
                        .get("intent_path")
                        .unwrap()
                        .as_str()
                        .unwrap()
                        .to_string();

                    let text = args
                        .get("thought_text")
                        .unwrap()
                        .as_str()
                        .unwrap()
                        .to_string();

                    let status_str = args.get("status").unwrap().as_str().unwrap();
                    let status = match status_str {
                        "Reasoning" => AgentStatus::Reasoning,
                        "ToolExecution" => AgentStatus::ToolExecution,
                        "Halted" => AgentStatus::Halted,
                        _ => AgentStatus::Idle,
                    };

                    // Translate into Raqim core logic
                    let state = AgentState {
                        agent_id: Some(agent_id_bytes.try_into().unwrap_or([0; 16])),
                        transaction_id: 0,
                        namespace: intent_path.clone(),
                        timestamp: SystemTime::now()
                            .duration_since(UNIX_EPOCH)
                            .unwrap()
                            .as_secs() as i64,
                        status,
                        text: text.clone(),
                    };

                    // THE CRYPTOGRAPHIC ENVELOPE
                    //  Hash the state bytes.
                    let state_bytes = rkyv::to_bytes::<rkyv::rancor::Error>(&state).unwrap();

                    // Mathematically sign the state bytes with our private key.
                    let signature = self.signing_key.sign(&state_bytes).to_bytes();

                    let envelope = IngressEnvelope {
                        intent_path,
                        public_key: self.pub_key_bytes,
                        signature,
                        state_bytes: state_bytes.into_vec(),
                    };

                    // Zero-copy serialize the state
                    let serialized_envelope =
                        rkyv::to_bytes::<rkyv::rancor::Error>(&envelope).unwrap();
                    let payload_len = (serialized_envelope.len() as u32).to_le_bytes();

                    // Fire to the running Raqim daemon Over TCP
                    if let Ok(mut stream) = TcpStream::connect("127.0.0.1:8080").await {
                        let _ = stream.write_all(&payload_len).await;
                        let _ = stream.write_all(&serialized_envelope).await;

                        //  Tell the LLM it succeeded
                        return Ok(json!({
                           "content": [{
                               "type": "text",
                               "text": "Thought securely committed."
                           }]
                        }));
                    }

                    Err(mcp_rust_sdk::Error::Other(
                        "Failed to connect to Raqim Deamon TCP".into(),
                    ))
                } else if name == "query_memory" {
                    let intent_path = args.get("intent_path").unwrap().as_str().unwrap();
                    let query = args.get("query").unwrap().as_str().unwrap();

                    let url = format!(
                        "{}/v1/swarm/memory?namespace={}&query={}",
                        self.daemon_http_url, intent_path, query
                    );

                    // AXUM HTTP RAG CALL
                    let response = self
                        .http_client
                        .get(&url)
                        .header("Authorization", format!("Bearer {}", self.license_key))
                        .send()
                        .await
                        .map_err(|e| mcp_rust_sdk::Error::Other(e.to_string()))?;

                    if response.status().is_success() {
                        let memories: Vec<String> =
                            response.json::<Vec<String>>().await.unwrap_or_default();
                        return Ok(
                            json!({"content": [{"type": "text", "text": format!("Retrieved:\n{}", memories.join("\n"))}]}),
                        );
                    }
                    return Err(mcp_rust_sdk::Error::Other("RAG Query Failed".to_string()));
                } else if name == "ask_swarm" {
                    let target_capability = args
                        .get("target_capability")
                        .unwrap()
                        .as_str()
                        .unwrap()
                        .to_string();
                    let question_text = args.get("question").unwrap().as_str().unwrap().to_string();
                    let request_id = uuid::Uuid::new_v4().to_string();

                    // 1. SIGN THE QUESTION
                    let question_bytes = question_text.into_bytes();
                    let signature = self.signing_key.sign(&question_bytes).to_bytes();
                    let sender_hex = hex::encode("agent_id");

                    let ask_msg = WsMessage::AskQuestion {
                        request_id: request_id.clone(),
                        capability: target_capability,
                        question: question_bytes,
                        sender_hex,
                        public_key: self.pub_key_bytes.to_vec(),
                        signature: signature.to_vec(),
                    };

                    // 2. Connect to RQM Daemon Websocket.
                    let ws_url = self.daemon_http_url.replace("http", "ws") + "/v1/mcp/ws";

                    let (mut ws_stream, _) = tokio_tungstenite::connect_async(&ws_url)
                        .await
                        .map_err(|e| {
                            mcp_rust_sdk::Error::Other(format!("WS Connect Failed: {}", e))
                        })?;

                    // 3. SEND THE REQUEST
                    let json_payload = serde_json::to_string(&ask_msg).unwrap();
                    ws_stream
                        .send(tokio_tungstenite::tungstenite::Message::Text(json_payload))
                        .await
                        .map_error(|e| mcp_rust_sdk::Error::Other(e.to_string()))?;

                    // 4. AWAIT THE RESPONSE (With Timeout)
                    let response = tokio::time::timeout(Duration::from_secs(15), async {
                        while let Some(Ok(msg)) = ws_stream.next().await {
                            if let tokio_tungstenite::tungstenite::Message::Text(text) = msg {
                                if let Ok(WsMessage::QuestionAnswered {
                                    request_id: incoming_id,
                                    answer,
                                }) = serde_json::from_str(&text)
                                {
                                    if incoming_id == request_id {
                                        return Ok(String::from_utf8(answer).unwrap());
                                    }
                                } else if let Ok(WsMessage::Error { message }) =
                                    serde_json::from_str(&text)
                                {
                                    return Err(message);
                                }
                            }
                        }

                        Err("WebSocket closed unexpectedly".to_string())
                    })
                    .await;

                    match response {
                        Ok(Ok(answer_text)) => {
                            let _ = ws_stream.close(None).await; // Graceful cleanup 
                            return Ok(json!({"content": [{"type": "text", "text": answer_text}]}));
                        }
                        Ok(Err(e)) => return Err(mcp_rust_sdk::Error::Other(e)),
                        Err(_) => {
                            return Err(mcp_rust_sdk::Error::Other(
                                "A2A Timeout exceeed 15s".to_string(),
                            ));
                        }
                    }
                } else {
                    return Err(mcp_rust_sdk::Error::protocol(
                        ErrorCode::MethodNotFound,
                        "Unknown tool",
                    ));
                }
            }

            _ => Err(mcp_rust_sdk::Error::protocol(
                ErrorCode::MethodNotFound,
                "Method not supported",
            )),
        }
    }

    // 4. Clean shutdowm
    async fn shutdown(&self) -> Result<(), mcp_rust_sdk::Error> {
        Ok(())
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("Bismillah. Booting Raqim MPC Universal Translator... ");

    // Load from environment
    let key_path =
        std::env::var("RQM_MCP_KEY_PATH").unwrap_or_else(|_| "./keys/mcp_private.pem".to_string());
    let daemon_url =
        std::env::var("RQM_DEAMON_URL").unwrap_or_else(|_| "http://127.0.0.1:8081".to_string());
    let license_key = std::env::var("RQM_LICENSE_KEY").unwrap_or_else(|_| "".to_string());

    let (transport, _message_sender) = StdioTransport::new();

    let handler = Arc::new(RaqimHandler::new(&key_path, &daemon_url, &license_key));
    let server = Server::new(Arc::new(transport), handler as Arc<dyn ServerHandler>);

    server.start().await?;

    Ok(())
}
