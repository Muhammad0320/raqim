use mcp_rust_sdk::error::ErrorCode;
use mcp_rust_sdk::server::{Server, ServerHandler};
use mcp_rust_sdk::transport::stdio::StdioTransport;
use mcp_rust_sdk::types::{ClientCapabilities, Implementation, ServerCapabilities, Tool};
use serde_json::{Value, json};
use std::collections::HashMap;
use std::sync::Arc;

use async_trait::async_trait;
use std::time::{SystemTime, UNIX_EPOCH};
use synapse_core::{AgentState, AgentStatus};
use tokio::io::AsyncWriteExt;
use tokio::net::TcpStream;

// 1. Define our custom handler struct
struct RaqimHandler {
    commit_tool: Tool,
}

impl RaqimHandler {
    fn new() -> Self {
        Self {
            commit_tool: Tool {
                name: "commit_thought".to_string(),
                description: "Commits a verified thought to the Raqim OS".to_string(),
                schema: json!({
                    "type": "object",
                    "properties": {
                        "thought_text": {"type": "string"},
                        "status": {"type": "string"},
                        "agent_hex_id": {"type": "string"}
                    },
                    "required": ["thought_text", "status"]
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
        let mut tool_cap = HashMap::new();
        tool_cap.insert("listChanged".to_string(), json!(false));

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
            "tools/list" => Ok(json!({"tools": [self.commit_tool.clone()]})),

            // LLM says: "Execute this tool!"
            "tools/call" => {
                let p = params.ok_or_else(|| {
                    mcp_rust_sdk::Error::protocol(ErrorCode::InvalidParams, "Missing params")
                })?;
                let name = p.get("name").and_then(|v| v.as_str()).unwrap_or("");

                if name != "commit_thought" {
                    return Err(mcp_rust_sdk::Error::protocol(
                        ErrorCode::MethodNotFound,
                        "Unknown tool",
                    ));
                }

                let args = p.get("arguments").ok_or_else(|| {
                    mcp_rust_sdk::Error::protocol(ErrorCode::InvalidParams, "Missing args")
                })?;

                // --- Tranlation layer ----
                let text = args
                    .get("thought_text")
                    .unwrap()
                    .as_str()
                    .unwrap()
                    .to_string();
                let status_str = args.get("status").unwrap().as_str().unwrap();
                let agent_id = args
                    .get("agent_id_hex")
                    .and_then(|id| id.as_str())
                    .and_then(|hex_str| hex::decode(hex_str).ok())
                    .and_then(|bytes: Vec<u8>| bytes.try_into().ok());

                let status = match status_str {
                    "Reasoning" => AgentStatus::Reasoning,
                    "ToolExecution" => AgentStatus::ToolExecution,
                    "Halted" => AgentStatus::Halted,
                    _ => AgentStatus::Idle,
                };

                // Translate into synapse core logic
                let state = AgentState {
                    agent_id,
                    transaction_id: 0,
                    timestamp: SystemTime::now()
                        .duration_since(UNIX_EPOCH)
                        .unwrap()
                        .as_secs() as i64,
                    status,
                    text: text.clone(),
                };

                // Zero-copy serialize the state
                let serialized_state = rkyv::to_bytes::<rkyv::rancor::Error>(&state).unwrap();
                let payload_len = (serialized_state.len() as u32).to_le_bytes();

                // Fire to the running synapse daemon Over TCP
                if let Ok(mut stream) = TcpStream::connect("127.0.0.1:8080").await {
                    let _ = stream.write_all(&payload_len).await;
                    let _ = stream.write_all(&serialized_state).await;
                }

                //  Twll the LLM it succeeded
                Ok(json!({
                   "content": [{
                       "type": "text",
                       "text": format!("Successfully commited to Roqim OS: {}", text)
                   }]
                }))
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
    println!("Bismillah. Booting RQM MPC Universal Translator... ");

    let (transport, _message_sender) = StdioTransport::new();

    let handler = Arc::new(RaqimHandler::new());
    let server = Server::new(Arc::new(transport), handler);

    server.start().await?;

    Ok(())
}
