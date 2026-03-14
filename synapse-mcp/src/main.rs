use mcp_rust_sdk::server::{Server, ServerHandler};
use mcp_rust_sdk::transport::Transport;
use mcp_rust_sdk::transport::stdio::StdioTransport;
use mcp_rust_sdk::types::{ClientCapabilities, Implementation, ServerCapabilities, Tool};
use serde_json::{Value, json};
use std::sync::Arc;

use async_trait::async_trait;
use std::future::Future;
use std::pin::Pin;
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
    fn initialize<'a>(
        &'a self,
        _client_info: Implementation,
        _client_caps: ClientCapabilities,
    ) -> Pin<Box<dyn Future<Output = Result<ServerCapabilities, mcp_rust_sdk::Error>> + Send + 'a>>
    {
        Box::pin(async move {
            Ok(ServerCapabilities {
                custom: Some(json!({"listChanged": false})), // We tell the LLm we have tools
                ..Default::default()
            })
        })
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("Bismillah. Booting RQM MPC Universal Translator... ");

    let transport = Arc::new(StdioTransport::new());
    let handler = Arc::new(RaqimHandler);

    // API Compliant server initialization
    let mut server = Server::new(
        transport.clone() as Arc<dyn Transport>,
        handler as Arc<dyn ServerHandler>,
    );

    let commit_tool = Tool {
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
    };

    server.register_tool(commit_tool);

    Ok(())
}
