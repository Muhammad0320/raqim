use clap::Parser;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Parser, Debug)]
#[command(author, version, about = "Synapse Daemon configuration")]
pub struct CliArgs {
    #[arg(short, long)]
    pub topic: Option<String>,

    #[arg(short, long)]
    pub wal_path: Option<String>,

    #[arg(short, long)]
    pub lance_path: Option<String>,

    #[arg(short, long)]
    pub aegis_path: Option<String>,

    #[arg(short, long)]
    pub public_key_path: Option<String>,

    #[arg(long)]
    pub tenant_id: Option<String>,

    #[arg(long)]
    pub license_key: Option<String>,

    #[arg(short, long)]
    pub dims: Option<i32>,

    #[arg(short, long)]
    pub limit: Option<usize>,

    #[arg(short, long)]
    port: Option<u16>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SynapseConfig {
    pub topic: String,
    pub wal_path: String,
    pub lance_path: String,
    pub aegis_path: String,
    pub table_name: String,
    pub tenant_id: String,
    pub license_key: String,
    pub public_key_path: String,
    pub dims: i32,
    pub limit: usize,
    pub port: u16,
}

impl Default for SynapseConfig {
    fn default() -> Self {
        Self {
            topic: "synapse_default".to_string(),
            wal_path: "./production.wal".to_string(),
            lance_path: "./production_semantic.lancedb".to_string(),
            aegis_path: "./aegis.toml".to_string(),
            table_name: "agent_history".to_string(),
            tenant_id: "open_core_local".to_string(),
            license_key: "dev_move".to_string(),
            public_key_path: "public_key.pem".to_string(),
            dims: 384,
            limit: 5,
            port: 8080,
        }
    }
}

impl SynapseConfig {
    pub fn load_or_bootstrap() -> Self {
        let args = CliArgs::parse();
        let config_path = "synapse.toml";

        // Load from the disk or rely on default
        let mut config = if Path::new(config_path).exists() {
            let content =
                fs::read_to_string(config_path).expect("[FATAL] Failed to read synapse.toml");

            toml::from_str(&content).expect("[FATAL] Invalid TOML syntax in synapse.toml")
        } else {
            let default_cfg = Self::default();
            let toml_string = toml::to_string(&default_cfg).unwrap();
            fs::write(config_path, toml_string).expect("Failed to bootstap synapse.toml");
            println!(
                "[SYSTEM] Bootstapped  default configuration at {}",
                config_path
            );
            default_cfg
        };

        //  THE OVERRIDE MATRIX: CLI Args always win if provided
        if let Some(t) = args.topic {
            config.topic = t;
        }
        if let Some(w) = args.wal_path {
            config.wal_path = w;
        }

        if let Some(p_key) = args.public_key_path {
            config.public_key_path = p_key;
        }

        if let Some(l) = args.lance_path {
            config.lance_path = l;
        }
        if let Some(d) = args.dims {
            config.dims = d;
        }
        if let Some(t_id) = args.tenant_id {
            config.tenant_id = t_id;
        }

        if let Some(a) = args.aegis_path {
            config.aegis_path = a;
        }

        if let Some(key) = args.license_key {
            config.license_key = key;
        }

        if let Some(l) = args.limit {
            config.limit = l;
        }
        if let Some(p) = args.port {
            config.port = p
        }

        config
    }
}
