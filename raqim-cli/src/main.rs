use clap::{Parser, Subcommand};
use ed25519_dalek::SigningKey;
use rand_core::OsRng;
use reqwest::Client;
use serde_json::json;
use std::fs;

#[derive(Parser)]
#[command(name = "raqim", about = "Raqim OS Adminstration CLI", version = "1.0")]
struct Cli {
    /// URL of the Raqim OS Daemon
    #[arg(short, long, default_value = "http://127.0.0.1:8081", global = true)]
    daemon_url: String,

    /// Enterprise License Key for Axum Auth
    #[arg(short, long, env = "RAQIM_LICENSE_KEY", global = true)]
    license_key: Option<String>,

    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Cryptographic Identity Management
    Keys {
        #[command(subcommand)]
        action: KeyAction,
    },

    /// Aegis Quarantine Management
    Aegis {
        #[command(subcommand)]
        action: AegisAction,
    },

    /// Time Machine Administration
    TimeTravel {
        agent_id: String,
        tx_id: u64,

        /// Optional path to a JSON ForkConfig file
        #[arg(short, long)]
        fork_config: Option<String>,
    },
}

#[derive(Subcommand)]
enum KeyAction {
    /// Generates a new Ed25519 Private/Public Keypair
    Generate {
        /// Name of the key (e.g., 'finance_agent')
        name: String,
    },
}

#[derive(Subcommand)]
enum AegisAction {
    List,

    Lift { agent_id: String },
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let cli = Cli::parse();
    let http_client = Client::builder().build()?;

    // Helper Closure to inject the Enterprise JWT.
    let get_auth = || -> String {
        cli.license_key
            .clone()
            .expect("FATAL: --license_key or RAQIM_LICENSE_KEY env variable required")
    };

    match &cli.command {
        // 1. Crytographic Key Generation
        Commands::Keys {
            action: KeyAction::Generate { name },
        } => {
            let mut csprng = OsRng;
            let signing_key = SigningKey::generate(&mut csprng);
            let public_key = signing_key.verifying_key();
            let pub_hex = hex::encode(public_key.to_bytes());

            let priv_path = format!("{}_private.pem", name);

            // Write the exact bytes needed by the PyO3/Rust SDKs
            fs::write(&priv_path, signing_key.to_bytes())?;

            // Unix Systems: Set tight permissions on private keys
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                fs::set_permissions(&priv_path, fs::Permissions::from_mode(0o600))?;
            }

            println!("✅ Keypair generated successfully");
            println!("Private Key saved to: {}", priv_path);
            println!("\n[ACTION REQUIRED] Add this to your daemon's aegis.toml: ");
            println!(
                "[\"{}\"]\npublic_key_hex = \"{}\"\ncapability = [\"*\"]",
                name, pub_hex
            );
        }

        // 2. Aegis GateKeeper Management
        Commands::Aegis {
            action: AegisAction::List,
        } => {
            let url = format!("{}/v1/admin/quarantine", cli.daemon_url);
            let res = http_client
                .get(&url)
                .header("Authorization", format!("Bearer {}", get_auth()))
                .send()
                .await?;

            if res.status().is_success() {
                let agents: Vec<String> = res.json().await?;
                println!("🔒 Quarantined Agents: {:?}", agents);
            } else {
                eprintln!("❌ Failed to fetchh Aegis state: {}", res.status());
            }
        }

        Commands::Aegis {
            action: AegisAction::Lift { agent_id },
        } => {
            let url = format!("{}/v1/admin/quarantine/lift", cli.daemon_url);
            let res = http_client
                .post(&url)
                .header("Authorization", format!("Bearer {}", get_auth()))
                .json(&json!({"agent_id": agent_id}))
                .send()
                .await?;

            if res.status().is_success() {
                println!("🔓 Quarantine lifted for agent: {}", agent_id)
            } else {
                eprintln!("❌ Failed to lift quarantine: {}", res.status())
            }
        }

        // 3. The Time Machine (Reality Forking)
        Commands::TimeTravel {
            agent_id,
            tx_id,
            fork_config,
        } => {
            let mut payload =
                json!({ "agent_id": agent_id, "target_tx_id": tx_id, "fork_config": null });

            // Override is the admin provides a JSON file with overrides
            if let Some(config_path) = fork_config {
                let config_str = fs::read_to_string(config_path)?;
                let fork_json: serde_json::Value = serde_json::from_str(&config_str)?;
                payload["fork_config"] = fork_json;
            }

            let url = format!("{}/v1/admin/time_travel", cli.daemon_url);
            println!(
                "⌛ Initializing Time Travel for {} to TxID {}...",
                agent_id, tx_id
            );

            let res = http_client
                .post(&url)
                .header("Autorization", format!("Bearer {}", get_auth()))
                .json(&payload)
                .send()
                .await?;

            if res.status().is_success() {
                println!("⚡Reality successfully forked. Agent execution thread spawned.");
            } else {
                eprintln!("❌ Time Travel Failed: {}", res.status());
            }
        }
    }

    Ok(())
}
