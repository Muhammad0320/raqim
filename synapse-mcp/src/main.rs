use mcp_rust_sdk::server::Server;
use mcp_rust_sdk::transport::stdio::StdioTransport;
use mcp_rust_sdk::types::{CallToolResult, Tool};
use serde_json::json;
use std::net::TcpStream;
use std::time::{SystemTime, UNIX_EPOCH};
use synapse_core::{AgentState, AgentStatus};
use tokio::io::AsyncWriteExt;
// use tokio::net::TcpStream;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("Bismillah. Booting Synapse MPC Universal Translator... ");

    // 1. Initialize the MCP server
    let mut server = Server::new("synapse-mcp-gateway", "1.0.0");

    // 2. Define the Tool for AI Models
    let commit_tool = Tool {
        name: "commit_thought".to_string(),
        description: Some(
            "Commits a veified thought or a state change to the Synapse P2P Organism. ".to_string(),
        ),
        input_schema: json!({
            "type": "object",
            "properties": {

                "thought_text": {"type": "string", "description": "The exact thought or memory to commit"},
                "status": {"type": "string", "enum": ["Reasoning", "Halted", "Idle", "ToolExecution"] },
                "agent_id_hex": {"type": "string", "description:": "Your 32-character Hex ID. Omit if new. "}

            },
            "required": ["thought_text", "status"]
        }),
    };

    // 3. Register the Tool Handler
    server.register_tool(commit_tool, |args| {
        Box::pin(async move {
            let text = args.get("thought_text").unwrap().as_str().unwrap();
            let status_str = args.get("status").unwrap().as_str().unwrap();
            let agent_id = args.get("agent_id_hex").and_then(|id| id.as_str() ).and_then(|hex_str| hex::decode(hex_str).ok() ).and_then(|bytes| bytes.try_into().ok() )


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
                text: text
            };

            // Zero-copy serialize the state
            let serialized_state = rkvy::to_bytes::<rkyv::rancor::Error>(&state).unwrap();
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
        })
    });

    // 4. Start listening on stdio ( The standard for local AI apps )
    let transport = StdioTransport::new();
    server.serve(transport).await?;

    Ok(())
}
