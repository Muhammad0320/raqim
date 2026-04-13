use ed25519_dalek::{Signer, SigningKey, VerifyingKey};
use mcp_rust_sdk::error::ErrorCode;
use mcp_rust_sdk::server::{Server, ServerHandler};
use mcp_rust_sdk::transport::stdio::StdioTransport;
use mcp_rust_sdk::types::{ClientCapabilities, Implementation, ServerCapabilities, Tool};
use rand::rngs::OsRng;
use serde_json::{Value, json};
use std::collections::HashMap;
use std::fs;
use std::sync::Arc;
use synapse_core::config::{RaqimConfig, SynapseConfig};

use async_trait::async_trait;
use std::time::{SystemTime, UNIX_EPOCH};
use synapse_core::{AgentState, AgentStatus, IngressEnvelope};
use tokio::io::AsyncWriteExt;
use tokio::net::TcpStream;

// 1. Define our custom handler struct
struct RaqimHandler {
    signing_key: SigningKey,
    pub_key_bytes: [u8; 32],
    daemon_http_url: String,

    commit_tool: Tool,
    query_tool: Tool,
    ask_swarm_tool: Tool,
}

impl RaqimHandler {
    fn new(private_key_path: &str, daemon_http_url: &str) -> Self {
        // ENTERPRISE CRYTOGRAPHY: Load from config
        let key_bytes = fs::read(private_key_path)
            .expect("FATAL: Missing Private Key. Aegis identity is required.");
        let signing_key = SigningKey::from_bytes(key_bytes.as_slice().try_into().unwrap());
        let pub_key_bytes = signing_key.verifying_key().to_bytes();

        Self {
            signing_key,
            pub_key_bytes,
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
                let config = SynapseConfig::load_or_bootstrap();

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
                        state,
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
                    let query = args.get("query").unwrap().as_str().unwrap();

                    // Boot read-only semantic engine
                    let engine = Raqim_core::lancedb_store::LanceEngine::new(
                        &config.lance_path,
                        &config.table_name,
                        config.dims,
                    )
                    .await;

                    let memories = engine
                        .search_memory(qeury, 5)
                        .await
                        .unwrap_or_else(|_| vec!["No memories found.".to_string()]);

                    return Ok(json!({
                        "content": [{
                            "type": "text",
                            "text": format!("Retreived Memories: \n{}", memories.join("\n"))
                        }]
                    }));
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

    let (transport, _message_sender) = StdioTransport::new();

    let handler = Arc::new(RaqimHandler::new(
        "./keys/mcp_private.pem",
        " http://127.0.0.1:8081",
    ));
    let server = Server::new(Arc::new(transport), handler as Arc<dyn ServerHandler>);

    server.start().await?;

    Ok(())
}
