use arrow_array::Array;
use futures::StreamExt;
use lancedb::query::ExecutableQuery;
use lancedb::query::QueryBase;
use memmap2::MmapOptions;
use rkyv::{Archive, Archived};
use std::io::{Read, Seek, SeekFrom};
use std::sync::atomic::AtomicU64;
use std::sync::atomic::Ordering;
use std::u64;
use std::{fs::File, sync::Arc};
use tokio::sync::broadcast;
use tokio::sync::broadcast::Sender;
use tokio::sync::mpsc;

use crate::AgentStatus;
use crate::aegis::AegisGateKeeper;
use crate::api::ForkConfig;
use crate::axon::AxonGateKeeper;
use crate::network::GlobalNetworkBridge;
use crate::sandbox::SandboxContent;
use crate::sandbox::WasmEngine;
use crate::telemetry::TelemetryEngine;
use crate::{
    OpLog, SystemEvent, config::RaqimConfig, lancedb_store::LanceEngine, nucleus::WalEngine,
    state::SwarmState,
};

pub enum RebuildMode {
    Resurrection,
    TimeTravel(u64), //
}

pub struct MemoryRouter {
    config: Arc<RaqimConfig>,
    telemetry: Arc<TelemetryEngine>,
    aegis: Arc<AegisGateKeeper>,
    axon: Arc<AxonGateKeeper>,
    brain: Arc<SwarmState>,
    lance_engine: Arc<LanceEngine>,
    wasm_engine: Arc<WasmEngine>,
    wal_engine: Arc<WalEngine>,
    cortex_tx: mpsc::UnboundedSender<Vec<u8>>,
    global_net: Arc<GlobalNetworkBridge>,
    global_tx_counter: Arc<AtomicU64>,
    event_tx: Sender<SystemEvent>,
}

impl MemoryRouter {
    pub fn new(
        config: Arc<RaqimConfig>,
        telemetry: Arc<TelemetryEngine>,
        aegis: Arc<AegisGateKeeper>,
        axon: Arc<AxonGateKeeper>,
        brain: Arc<SwarmState>,
        lance_engine: Arc<LanceEngine>,
        wasm_engine: Arc<WasmEngine>,
        wal_engine: Arc<WalEngine>,
        cortex_tx: mpsc::UnboundedSender<Vec<u8>>,
        global_net: Arc<GlobalNetworkBridge>,
        global_tx_counter: Arc<AtomicU64>,
        event_tx: Sender<SystemEvent>,
    ) -> Self {
        Self {
            config,
            telemetry,
            aegis,
            axon,
            brain,
            lance_engine,
            wasm_engine,
            wal_engine,
            cortex_tx,
            global_net,
            global_tx_counter,
            event_tx,
        }
    }

    /// PRIVATE DRY HELPER: Scans the WAL and executes a closure on the Zero-Copy Archived data
    pub fn scan_wal_zero_copy<F>(&self, mut callback: F)
    where
        F: FnMut(&Archived<OpLog>),
    {
        if let Ok(file) = File::open(&self.config.wal_path) {
            if let Ok(mmap) = unsafe { MmapOptions::new().map(&file) } {
                let mut offset = 0;
                while offset < mmap.len() {
                    if offset + 4 > mmap.len() {
                        break;
                    }

                    let mut len_bytes = [0u8; 4];
                    len_bytes.copy_from_slice(&mmap[offset..offset + 4]);
                    let entry_len = u32::from_le_bytes(len_bytes) as usize;
                    offset += 4;
                    let entry_slice = &mmap[offset..offset + entry_len];

                    //  TRUE ZERO-COPY: We cast a pointer. No mem allocation. No deserialization
                    let archived_log = unsafe {
                        rkyv::access_unchecked::<<OpLog as Archive>::Archived>(entry_slice)
                    };

                    callback(archived_log);

                    offset += entry_len;
                }
            }
        }
    }

    /// FORENSIC TIME MACHINE
    pub async fn fetch_by_txid(&self, target_tx_id: u64) -> Result<String, anyhow::Error> {
        let mut result = None;

        // 1. Hot Memory ( Zero-copy WAL scan )
        self.scan_wal_zero_copy(|archievd| {
            // We read directly from the archeived bytes!
            if archievd.state.transaction_id == target_tx_id {
                result = Some(format!(
                    "[HOT MEMORY] TxID: {} | Text: {} ",
                    archievd.state.transaction_id,
                    archievd.state.text.as_str()
                ))
            }
        });

        if let Some(res) = result {
            return Ok(res);
        }

        // 2. Cold Memory ( REAL LanceDB SQL Filter )
        let table = self
            .lance_engine
            .db
            .open_table(&self.config.table_name)
            .execute()
            .await?;

        // LanceDB allows SQL-style filtering directly on the Arrow columns
        let mut stream = table
            .query()
            .only_if(format!("tx_id = {}", target_tx_id))
            .limit(1)
            .execute()
            .await?;

        if let Some(batch_result) = stream.next().await {
            let batch = batch_result?;
            let text_col = batch
                .column_by_name("text")
                .unwrap()
                .as_any()
                .downcast_ref::<arrow_array::StringArray>()
                .expect("FATAL: text column isn't StringArray");

            if text_col.len() > 0 {
                return Ok(format!(
                    "[COLD STORAGE] TxID: {} | Text: {} ",
                    target_tx_id,
                    text_col.value(0)
                ));
            }
        }

        Err(anyhow::anyhow!(
            "TxID {} not found in WAL or LanceDB.",
            target_tx_id
        ))
    }

    // RAG CONTEXT: Prioritize the hot WAL, fills the rest with semantic lanceDB
    pub async fn semantic_search_with_context(
        &self,
        query: &str,
        namespace: &str,
        limit: usize,
    ) -> Result<Vec<String>, anyhow::Error> {
        let mut final_context = Vec::new();

        // 1. HOT MEMORY (WAL): Zero-Copy Semantic Filtering
        self.scan_wal_zero_copy(|archived| {
            // PHYSICS: We read the name_space as a string slice without allocating mem
            let log_namespace = archived.state.namespace.as_str();

            if log_namespace.starts_with(namespace) {
                final_context.push(format!("[Recent] {} ", archived.state.text.as_str()));
            }
        });

        // 2. Supplement with Deep Semantic search
        let mut deep_memories = self
            .lance_engine
            .search_memory(query, namespace, limit)
            .await?;

        final_context.append(&mut deep_memories);

        Ok(final_context)
    }

    /// THE RESURRECTION ENGINE
    /// Rebuild the LORO CRDT Hive Mind from Cold storage and Hot Memory.
    pub async fn rebuild_agent_timeline(
        &self,
        agent_hex: &str,
        target_tx_id: u64,
        wal_engine: Arc<WalEngine>,
    ) -> Result<(Vec<u8>, Vec<OpLog>, u64, u64), anyhow::Error> {
        self.telemetry.record_time_travel();

        // RESOLVE THE TARGET INFINITY HACK
        // Find the highest known tx_id for this agent.
        let actual_target_transaction = if target_tx_id == u64::MAX {
            // Checking the WAL Index first
            let wal_max = {
                let idex = wal_engine.index.read().unwrap();
                idex.keys().copied().filter(|&k| k > 0).max()
            };

            if let Some(max_tx) = wal_max {
                max_tx
            } else {
                // If WAL is empty/ compacted, ask lanceDB for the absolute highest recorded tx_id
                let (max_lance_tx, _, _) = self
                    .lance_engine
                    .fetch_closest_snapshot(agent_hex, i64::MAX)
                    .await
                    .unwrap_or((0, 0, Vec::new()));
                max_lance_tx
            }
        } else {
            target_tx_id
        };

        // 1. O(1) COLD MEMORY JUMP (LanceDB)
        let (snapshot_txid, snapshot_timestamp, memory_blob) = self
            .lance_engine
            .fetch_closest_snapshot(agent_hex, target_tx_id as i64)
            .await
            .unwrap_or((0, 0, Vec::new()));

        // Determine if we need deep discovery (LanceDB) or Hot Recoverey (WAL)
        let oldest_wal_tx = {
            let idx = wal_engine.index.read().unwrap();
            idx.keys().next().cloned().unwrap_or(u64::MAX) // Get the current smallest TxID currently in the WAL
        };

        println!(
            "[TIME MACHINE] Loaded Base Snapshot at TxID: {} ",
            snapshot_txid
        );

        let mut historical_oplogs = Vec::new();

        // 2. O(1) WAL INDEX SEEK
        // We calculate the very next TxID we need to read
        let next_txid = (snapshot_txid as u64) + 1;

        if actual_target_transaction < oldest_wal_tx {
            // DEEP TIME TRAVEL: The WAL has been compacted. We must read from LanceDB.
            println!(
                "[TIME MACHINE] Target is deep in history. Engaging LanceDB Deep Discovery... "
            );
            let table = self
                .lance_engine
                .db
                .open_table(&self.lance_engine.history_table)
                .execute()
                .await?;

            // Query all the snapshots btw snapshot and target
            let mut stream = table
                .query()
                .only_if(format!(
                    "agent_id = '{}' AND tx_id >= {} AND tx_id <= {}",
                    agent_hex, next_txid, target_tx_id
                ))
                .execute()
                .await?;

            while let Some(batch_result) = stream.next().await {
                let batch = batch_result?;

                let tx_id_col = batch
                    .column_by_name("transaction_id")
                    .unwrap()
                    .as_any()
                    .downcast_ref::<arrow_array::Int64Array>()
                    .expect(" FATAL: trasaction_id column isn't an Int64Array");
                let text_col = batch
                    .column_by_name("text")
                    .unwrap()
                    .as_any()
                    .downcast_ref::<arrow_array::StringArray>()
                    .expect(" FATAL: text column isn't a StringArray ");
                let timestamp_col = batch
                    .column_by_name("timestamp")
                    .unwrap()
                    .as_any()
                    .downcast_ref::<arrow_array::Int64Array>()
                    .expect(" FATAL: timestamp column isn't an IntArray");
                let status_col = batch
                    .column_by_name("status")
                    .unwrap()
                    .as_any()
                    .downcast_ref::<arrow_array::StringArray>()
                    .expect(" FATAL: status column is not a StringArrray");
                let seed_col = batch
                    .column_by_name("entropy_seeds")
                    .unwrap()
                    .as_any()
                    .downcast_ref::<arrow_array::StringArray>()
                    .expect(" FATAL: seeds column isn't a StringArray");
                let net_col = batch
                    .column_by_name("network_responses")
                    .unwrap()
                    .as_any()
                    .downcast_ref::<arrow_array::StringArray>()
                    .expect(" FATAL: network_reponse isn't a StringArray");
                let namespace_col = batch
                    .column_by_name("namespace")
                    .unwrap()
                    .as_any()
                    .downcast_ref::<arrow_array::StringArray>()
                    .expect("namespace is not a StringArray");
                let delta_col = batch
                    .column_by_name("payload")
                    .unwrap()
                    .as_any()
                    .downcast_ref::<arrow_array::BinaryArray>()
                    .expect(" FATAL: payload isn't a BinaryArray");

                for i in 0..timestamp_col.len() {
                    let status = match status_col.value(i) {
                        "IDLE" => AgentStatus::Idle,
                        "REASONING" => AgentStatus::Reasoning,
                        "HALTED" => AgentStatus::Halted,
                        "TOOL_EXEC" => AgentStatus::ToolExecution,
                        _ => {
                            // Log the currection and default to a safe state
                            eprintln!(
                                "[WARNING] Unknown status '{}' in LanceDB for TxID {}. Defaulting to Halted.",
                                status_col.value(i),
                                tx_id_col.value(i)
                            );
                            AgentStatus::Halted
                        }
                    };

                    let recovered_seed: Vec<u64> = serde_json::from_str(seed_col.value(i))?;
                    let recovered_res: Vec<String> = serde_json::from_str(net_col.value(i))?;

                    let reconstruct_log = OpLog {
                        agent_id: [0; 16],
                        delta: delta_col.value(i).to_vec(),
                        previous_hash: [0; 32],
                        current_hash: [0; 32],
                        state: crate::AgentState {
                            agent_id: Some([0; 16]),
                            namespace: namespace_col.value(i).to_string(),
                            transaction_id: tx_id_col.value(i) as u64,
                            timestamp: timestamp_col.value(i),
                            status,
                            text: text_col.value(i).to_string(),
                        },
                        entropy_seeds: recovered_seed,
                        network_responses: recovered_res,
                    };
                    historical_oplogs.push(reconstruct_log);
                }
            }
        } else {
            // HOT RECORVERY: The data is still in the WAL.
            if next_txid <= target_tx_id {
                // Ask the mutex protected BTreeMap for the exact byte offset on the SSD
                let start_byte = {
                    let idx = wal_engine.index.read().unwrap();
                    idx.get(&next_txid).cloned().unwrap_or(0)
                };

                // 3. Physical disk seek
                if let Ok(mut file) = std::fs::File::open(&self.config.wal_path) {
                    // The Kernel jumps the read-head directly to the exact byte. Zero scanning!
                    file.seek(SeekFrom::Start(start_byte))
                        .expect("Failed to seek WAL file");

                    let mut buffer = Vec::new();
                    file.read_to_end(&mut buffer).unwrap(); // Read the remainder of the file

                    let mut offset = 0;
                    while offset < buffer.len() {
                        if offset + 4 > buffer.len() {
                            break;
                        }

                        let mut len_bytes = [0u8; 4];
                        len_bytes.copy_from_slice(&buffer[offset..offset + 4]);
                        let entry_len = u32::from_le_bytes(len_bytes) as usize;
                        offset += 4;

                        let entry_slice = &buffer[offset..offset + entry_len];
                        let archived_log = unsafe {
                            rkyv::access_unchecked::<<OpLog as Archive>::Archived>(entry_slice)
                        };

                        let current_tx = archived_log.state.transaction_id;

                        if current_tx > target_tx_id {
                            break;
                        } // We reached the future. Stop reading.

                        // Only collect logs belonging to this specific agent!
                        if hex::encode(archived_log.agent_id.as_slice()) == agent_hex {
                            // Deserialize here only because we're handling this to the WASM to execute.
                            if let Ok(log) =
                                rkyv::deserialize::<OpLog, rkyv::rancor::Error>(archived_log)
                            {
                                historical_oplogs.push(log);
                            }
                        }

                        offset += entry_len;
                    }
                }
            }
        }

        Ok((
            memory_blob,
            historical_oplogs,
            actual_target_transaction,
            snapshot_timestamp,
        ))
    }

    /// The Unified Engine for both Resurrection (Live) and Time Travel (Isolated)
    pub async fn boot_historical_agent(
        &self,
        agent_hex: &str,
        target_tx_id: Option<u64>,
        fork_config: Option<ForkConfig>,
        is_isolated_debug: bool,
    ) -> Result<(), anyhow::Error> {
        let fetch_target = target_tx_id.unwrap_or(u64::MAX);

        let (memory_blob, historical_oplog, snapshot_tx, snapshot_timestamp) = self
            .rebuild_agent_timeline(agent_hex, fetch_target, self.wal_engine.clone())
            .await?;

        // Extract flight recorded data
        let mut recovered_seeds = Vec::new();
        let mut recovered_networks = Vec::new();
        let mut recovered_timestamps = Vec::new();

        // The phantom brain initialization
        let (dummy_tx, _) = broadcast::channel(1);
        let dummy_wal =
            Arc::new(WalEngine::start(format!("phamtom_{}", agent_hex).to_string()).await);
        let dummy_net = Arc::new(
            GlobalNetworkBridge::new(
                "phantom_tenant",
                format!("phamtom_{}", agent_hex).as_str(),
                self.aegis.clone(),
                false,
            )
            .await,
        );
        let actual_tx = if is_isolated_debug {
            dummy_tx
        } else {
            self.event_tx.clone()
        };

        let target_brain = if is_isolated_debug {
            Arc::new(SwarmState::new(
                format!("phantom_{}", agent_hex).as_str(),
                actual_tx.clone(),
            ))
        } else {
            self.brain.clone()
        };

        // 3. Cure Schizophrenia ( Syncing the CRDT )
        for log in historical_oplog {
            recovered_seeds.extend(log.entropy_seeds);
            recovered_networks.extend(log.network_responses);
            recovered_timestamps.push(log.state.timestamp);

            // Physically rebuild the LORO CRDT Memory
            if let Err(e) = target_brain.assimilate_foreign_thought(&log.delta) {
                eprintln!("[WARNING] Failed to assimilate historical delta: {}", e);
            }
        }

        // APPLY REALITY FORK OVERRIDES
        if let Some(fork) = &fork_config {
            if let Some(seed) = fork.override_seed {
                recovered_seeds.push(seed);
            }
            if let Some(network) = &fork.inject_network {
                recovered_networks.push(network.clone());
            }
        }

        let wasi_ctx = WasmEngine::build_wasi_context(fork_config);

        // SERVE THE OS TIES DEBUGGING
        let active_wal = if is_isolated_debug {
            dummy_wal.clone()
        } else {
            self.wal_engine.clone()
        };
        let active_net = if is_isolated_debug {
            dummy_net.clone()
        } else {
            self.global_net.clone()
        };

        // 6. Construct the Sandbox Content
        let content = SandboxContent {
            axon: self.axon.clone(),
            aegis: self.aegis.clone(),
            brain: target_brain.clone(),
            wal: active_wal.clone(),
            cortex_tx: self.cortex_tx.clone(),
            global_net: active_net.clone(),
            global_tx_counter: self.global_tx_counter.clone(),
            event_tx: self.event_tx.clone(),
            wasi: wasi_ctx,
            lance: self.lance_engine.clone(),
            agent_hex: agent_hex.clone().to_string(),
            telemetry: self.telemetry.clone(),

            // Live queue start empty
            live_responses: Vec::new(),
            live_seeds: Vec::new(),
            live_timestamps: Vec::new(),

            // Relay queues loaded with history + admin overrides
            replay_seeds: recovered_seeds,
            replay_responses: recovered_networks,
            replay_timestamps: recovered_timestamps,

            a2a_receiver: None,
            a2a_reply_channel: None,
            a2a_response_cache: Vec::new(),
            http_response_cache: Vec::new(),
            a2a_incoming_cache: Vec::new(),
        };

        // 7. Boot the Forked reality into the OS thread.
        let engine = self.wasm_engine.clone();
        let agent_id_clone = agent_hex.to_string();

        // If we're time travelling the agent starts from the target_tx_id
        // If Resurrection, we pass in the CURRENT global counter so it resumes at the tip of reality
        let execution_start_tx =
            target_tx_id.unwrap_or_else(|| self.global_tx_counter.load(Ordering::SeqCst));

        tokio::spawn(async move {
            // Read the WASM binary from the disk
            let archive_batch = format!("./plugins_archive/{}.wasm.running", &agent_id_clone);
            let wasm_bytes = std::fs::read(&archive_batch).unwrap_or_default();

            let mut tracker = crate::sandbox::CheckPointTracker {
                last_snapshot_time: snapshot_timestamp,
                last_snapshot_tx: snapshot_tx,
            };

            // Execute the agent, injecting the snapshot first
            if let Err(e) = engine.execute_agent(
                &wasm_bytes,
                content,
                &mut tracker,
                execution_start_tx,
                Some(memory_blob),
            ) {
                eprintln!("[TIME MACHINE]  Agent {} crashed: {} ", agent_id_clone, e)
            }
        });

        Ok(())
    }
}
