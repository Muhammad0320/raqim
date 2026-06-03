use clap::{Parser, Subcommand};
use ed25519_dalek::SigningKey;
use md5::{Digest, Md5};
use rand::rngs::OsRng;
use reqwest::Client;
use serde_json::json;
use std::fs;
use std::path::Path;

#[derive(Parser)]
#[command(
    name = "raqim",
    about = "Raqim OS  Master Control Plane",
    version = "1.0"
)]
struct Cli {
    /// URL of the Raqim OS Daemon Control plane
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
    /// Batch forge cryptographic agents with signed CA
    Forge {
        // Base name for the agents (e.g finance_bot)
        #[arg(short, long)]
        name: String,

        /// The security group mapping declared in aegis.toml (e.g finance_worker)
        #[arg(short, long)]
        group: String,

        #[arg(short, long, default_value_t = 1)]
        count: u32,

        /// Target directory for the atomic artifact
        #[arg(short, long, default_value = "./target_workspace")]
        out_dir: String,

        /// Execution environment: 'internal' (WASM) or 'external' (Python/MCP/SDK)
        #[arg(short, long, default_value = "external")]
        env: String,
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
            action:
                KeyAction::Forge {
                    name,
                    group,
                    count,
                    out_dir,
                    env,
                },
        } => {
            println!("Bismillah. Initiating Sovereign Fleet Forge... ");
            println!("Target Group [{}] | Fleet Size [{}] ", group, count);

            let workspace = Path::new(out_dir);
            fs::create_dir_all(workspace)?;

            let mint_url = format!("{}/v1/admin/ca/mint", cli.daemon_url);
            let mut success_count = 0;

            for i in 1..=*count {
                let agent_alias = if *count > 1 {
                    format!("{}_{:02}", name.clone(), i)
                } else {
                    name.clone()
                };

                // Local cryptographic generation
                let mut csprng = OsRng;
                let signing_key = SigningKey::generate(&mut csprng);
                let public_key = signing_key.verifying_key().to_bytes();

                // Identity Hash Derivation
                let mut hasher = Md5::new();
                hasher.update(public_key);
                let agent_id_bytes: [u8; 16] = hasher.finalize().into();
                let agent_hex = hex::encode(agent_id_bytes);

                // Request Capability passport from the Daemon Control Plane

                let payload = json!({"agent_hex": agent_hex.clone(), "group": group.clone() });

                let res = http_client
                    .post(&mint_url)
                    .header("Authorization", format!("Bearer {}", get_auth()))
                    .json(&payload)
                    .send()
                    .await;

                match res {
                    Ok(response) if response.status().is_success() => {
                        let cert_hex: String = response.json().await?;
                        let cert_bytes = hex::decode(cert_hex)?;

                        // Atomic bundling in the Workspace
                        let key_path = workspace.join(format!("{}.pem", agent_alias));
                        let cert_path = workspace.join(format!("{}.cert", agent_alias));
                        let wasm_path = workspace.join(format!("{}.wasm", agent_alias));

                        fs::write(&key_path, signing_key.to_bytes())?;
                        fs::write(&cert_path, cert_bytes)?;

                        // Create a dummy WASM file to satisfy hot-reloader schema requirement
                        if env == "internal" && !wasm_path.exists() {
                            fs::write(&wasm_path, b"// Raqim WASM Plugin Scaffold")?;
                        }

                        // Set strict Unix permissions for the private key
                        #[cfg(unix)]
                        {
                            use std::os::unix::fs::PermissionsExt;
                            fs::set_permissions(&key_path, fs::Permissions::from_mode(0o600))?;
                        }

                        println!("  [OK] Forged Agent: {} -> {} ", agent_alias, agent_hex);
                        success_count += 1;
                    }

                    Ok(response) => {
                        eprintln!(
                            "     [FAIL] Agent: {}: CA Minting Rejected {}",
                            agent_alias,
                            response.status()
                        )
                    }

                    Err(e) => {
                        eprintln!("     [FAIL] Agent: {} - Network Error: {} ", agent_alias, e);
                    }
                }
            }

            println!(
                "\n✅ Fleet Forge Complete. Successfully generated {}/{} secure artifacts in {} ",
                success_count, count, out_dir
            );
            println!("Deploy these agents by moving them into the Daemon's /plugins directory.");
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
