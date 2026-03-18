#[derive(Parser, Debug)]
#[command(author, version, about = "RQM Daemon configuration")]
pub struct CliArgs {
    #[arg(short, long)]
    pub topic: Option<String>,

    #[arg(short, long)]
    pub wal_path: Option<String>,

    #[arg(short, long)]
    pub lance_path: Option<String>,

    #[arg(short, long)]
    pub dims: Option<i32>,

    #[arg(short, long)]
    pub limit: Option<usize>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RaqimConfig {
    pub topic: String,
    pub wal_path: String,
    pub lance_path: String,
    pub table_name: String,
    pub dims: i32,
    pub limit: usize,
}

impl Default for RaqimConfig {
    fn default() -> Self {
        Self {
            topic: "rqm_default".to_string(),
            wal_path: "./production.wal".to_string(),
            lance_path: "./production_semantic.lancedb".to_string(),
            table_name: "agent_history".to_string(),
            dims: 384,
            limit: 5,
        }
    }
}

impl RaqimConfig {
    pub fn load_or_bootstrap() -> Self {
        let args = CliArgs::parse();
        let config_path = "raqim.toml";

        let mut config = if Path::new(config_path).exists() {
            let contents = fs::read_to_string(config_path).expect("Failed to read roqim.toml");

            toml::from_str(&content).expect("Imvalid toml format")
        } else {
            // BOOTSTRAP: File is missing create it using defaults + CLI args.
            let mut new_config = Self::default();
            if let Some(t) = &args.topic {
                new_config.topic = t.clone();
            }
            if let Some(w) = &args.wal_path {
                new_config.wal_path = t.clone();
            }
            if let Some(l) = &args.lance_path {
                new_config.lance_path = l.clone();
            }
            if let Some(d) = args.dims {
                new_config.dims = d;
            }
            if let Some(l) = args.limit {
                new_config.dims = l;
            }

            let toml_string = toml::to_string(&new_config).unwrap();
            fs::write(config_path, toml_string).expect("Failed to bootstap raqim.toml");
            println!("[SYSTEM] Bootstrapped new config file at {} ", config_path);

            return new_config;
        };

        //  OVERRIDE: File exists. Override in memory with CLI Args
        if let Some(t) = args.topic {
            config.topic = t;
        }
        if let Some(w) = args.wal_path {
            config.wal_path = w;
        }
        if let Some(l) = args.lance_path {
            config.lance_path = l;
        }
        if let Some(d) = args.dims {
            config.dims = d;
        }
        if let Some(l) = args.limit {
            config.limit = l;
        }

        config
    }
}
