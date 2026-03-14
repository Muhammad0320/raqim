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

#[async_trait]
impl ServerHandler for RaqimHandler {
    async fn call_tool(&self, name: &str, args: Value) -> Result<CallToolResult, anyhow::Error> {
        if name != "commit_thought" {
            return Err(anyhow::anyhow!("unknown tool!"));
        }

        let text = args.get("thought_text").unwrap().as_str().unwrap();
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

        //  Returns success to Gemini/Claude/OpenAI
        Ok(CallToolResult::new(json!({
            "status": "success",
            "message": format!("Successfully commited to Synapse: {}", text)
        })))
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
