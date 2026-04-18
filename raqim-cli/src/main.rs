use clap::{Parser, Subcommand};
use ed25519_dalek::{Signer, SigningKey};
use rand::rngs::OsRng;
use reqwest::Client;
use serde_json::json;
use std::fs;
use std::path::Path;

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
