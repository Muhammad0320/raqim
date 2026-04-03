use arrow_array::Array;
use futures::StreamExt;
use futures::lock::Mutex;
use lancedb::query::ExecutableQuery;
use lancedb::query::QueryBase;
use memmap2::MmapOptions;
use rkyv::{Archive, Archived};
use std::collections::HashMap;
use std::io::{Read, Seek, SeekFrom};
use std::sync::atomic::AtomicU64;
use std::{fs::File, sync::Arc, u64};
use tokio::sync::broadcast;
use tokio::sync::broadcast::Sender;
use tokio::sync::mpsc;
use wasmtime_wasi::WasiCtxBuilder;

pub enum RebuildMode {
    Resurrection,
    TimeTravel(u64), //
}

use crate::AgentStatus;
use crate::aegis::AegisGateKeeper;
use crate::axon::AxonGateKeeper;
use crate::network::GlobalNetworkBridge;
use crate::sandbox::CheckPointTracker;
use crate::sandbox::SandboxContent;
use crate::sandbox::WasmEngine;
use crate::telemetry::TelemetryEngine;
use crate::{
    OpLog, SystemEvent, config::RaqimConfig, lancedb_store::LanceEngine, nucleus::WalEngine,
    state::SwarmState,
};

pub struct MemoryRouter {
    wal_path: String,
    lance_engine: Arc<LanceEngine>,
    config: RaqimConfig,
    telemetry: Arc<TelemetryEngine>,
    aegis: Arc<AegisGateKeeper>,
    axon: Arc<AxonGateKeeper>,
    brain: Arc<SwarmState>,
    wasm_engine: Arc<WasmEngine>,
    wal_engine: Arc<WalEngine>,
    cortex_tx: mpsc::UnboundedSender<Vec<u8>>,
    global_net: Arc<GlobalNetworkBridge>,
    global_tx_counter: Arc<AtomicU64>,
    event_tx: Sender<SystemEvent>,
}

impl MemoryRouter {
    pub fn new(
        wal_path: &str,
        lance_engine: Arc<LanceEngine>,
        config: RaqimConfig,
        telemetry: Arc<TelemetryEngine>,
        aegis: Arc<AegisGateKeeper>,
        axon: Arc<AxonGateKeeper>,
        brain: Arc<SwarmState>,
        wasm_engine: Arc<WasmEngine>,
        wal_engine: Arc<WalEngine>,
        cortex_tx: mpsc::UnboundedSender<Vec<u8>>,
        global_net: Arc<GlobalNetworkBridge>,
        global_tx_counter: Arc<AtomicU64>,
        event_tx: Sender<SystemEvent>,
    ) -> Self {
        Self {
            wal_path: wal_path.to_string(),
            lance_engine,
            config,
            telemetry,
            aegis,
            axon,
            brain,
            wasm_engine,
            wal_engine,
            cortex_tx,
            global_net,
            global_tx_counter,
            event_tx,
        }
    }

    /// PRIVATE DRY HELPER: Scans the WAL and executes a closure on the Zero-Copy Archived data
    fn scan_wal_zero_copy<F>(&self, mut callback: F)
    where
        F: FnMut(&Archived<OpLog>),
    {
        if let Ok(file) = File::open(&self.wal_path) {
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
        limit: usize,
    ) -> Result<Vec<String>, anyhow::Error> {
        let mut final_context = Vec::new();

        // 1. The WAL is the absolute truth of present. We take ALL recent active thoughts.
        self.scan_wal_zero_copy(|archived| {
            final_context.push(format!("[Recent] {} ", archived.state.text.as_str()));
        });

        // 2. Supplement with Deep Semantic search
        let mut deep_memories = self.lance_engine.search_memory(query, limit).await?;
        final_context.append(&mut deep_memories);

        Ok(final_context)
    }

    /// THE RESURRECTION ENGINE
    /// Rebuild the LORO CRDT Hive Mind from Cold storage and Hot Memory.
    pub async fn rebuild_swarm_brain(
        &self,
        mode: RebuildMode,
    ) -> Result<Arc<SwarmState>, anyhow::Error> {
        println!("[SYSTEM] Bismillah. Initializing Swarm State Rebuild Sequence...");

        let target_tx_id = match mode {
            RebuildMode::Resurrection => u64::MAX,
            RebuildMode::TimeTravel(tx) => tx,
        };

        // Initilaize a blank CRDT Brain
        // TODO: In production pass the actual sender!
        let (tx, _rx) = broadcast::channel::<SystemEvent>(1000);
        let rebuilt_brain = Arc::new(SwarmState::new("rqm_global", tx));

        // We stream the OpLogs from the WAL up to the Target tx_id
        let mut applied_count = 0;

        self.scan_wal_zero_copy(|log| {
            if log.state.transaction_id <= target_tx_id {
                // Re-assimilate the histocal thought into the new brain
                if let Err(e) = rebuilt_brain.assimilate_foreign_thought(&log.delta.as_slice()) {
                    eprintln!("Failed to assimilate historical delta during build: {}", e);
                }

                applied_count += 1;
            }
        });

        println!(
            "[SYSTEM] BRAIN REBUILD COMPLETE. Assimilated {} historical deltas.",
            applied_count
        );
        Ok(rebuilt_brain)
    }

    pub async fn rebuild_agent_timeline(
        &self,
        agent_hex: &str,
        target_tx_id: u64,
        wal_engine: Arc<WalEngine>,
    ) -> Result<(Vec<u8>, Vec<OpLog>, u64), anyhow::Error> {
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
                let (max_lance_tx, _) = self
                    .lance_engine
                    .fetch_closest_snapshot(agent_hex, i64::MAX)
                    .await
                    .unwrap_or((0, Vec::new()));
                max_lance_tx as u64
            }
        } else {
            target_tx_id
        };

        // 1. O(1) COLD MEMORY JUMP (LanceDB)
        let (snapshot_txid, memory_blob) = self
            .lance_engine
            .fetch_closest_snapshot(agent_hex, target_tx_id as i64)
            .await
            .unwrap_or((0, Vec::new()));

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
                                "[WARNING] Unknown statuts '{}' in LanceDB for TxID {}. Defaulting to Halted.",
                                status_col.value(i),
                                tx_id
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

        Ok((memory_blob, historical_oplogs, actual_target_transaction))
    }

    /// Fully resurrect a crashed or quarantined agent to its absolute latest state
    pub async fn resurrect_wasm_thread(
        &self,
        agent_hex: &str,
        wal_engine: Arc<WalEngine>,
    ) -> Result<(), anyhow::Error> {
        println!(
            "[SYSTEM] Initiating Resurrection Sequence for Agent: {}",
            agent_hex
        );

        // 1. Fetch the absolute latest timeline (Snapshot + delta)
        let (memory_blob, historical_oplog, resolved_tx) = self
            .rebuild_agent_timeline(&agent_hex, u64::MAX, wal_engine)
            .await?;

        // 2. Extract deterministic flight recorder from oplogs
        let mut recovered_seeds = Vec::new();
        let mut recovered_network = Vec::new();
        let mut recovered_timestamps = Vec::new();

        for log in historical_oplog {
            recovered_seeds.extend(log.entropy_seeds);
            recovered_network.extend(log.network_responses);
            recovered_timestamps.push(log.state.timestamp);
        }

        // 3. Prepare the Sandbox content for a reboot
        let wasm_bytes = std::fs::read(format!("./plugins_arhive/{}.wasm.running", agent_hex))
            .map_err(|_| anyhow::anyhow!("WASM binary not found on disk for resurrection"))?;

        let wasi_ctx = WasiCtxBuilder::new().build();

        let content = SandboxContent {
            axon: self.axon.clone(),
            aegis: self.aegis.clone(),
            brain: self.brain.clone(),
            wal: self.wal_engine.clone(),
            global_net: self.global_net.clone(),
            cortex_tx: self.cortex_tx.clone(),
            global_tx_counter: self.global_tx_counter.clone(),
            event_tx: self.event_tx.clone(),
            wasi: wasi_ctx,
            lance: self.lance_engine.clone(),
            agent_hex: agent_hex.to_string(),
            telemetry: self.telemetry.clone(),
            live_seeds: Vec::new(),
            live_responses: Vec::new(),
            live_timestamps: Vec::new(),

            replay_responses: recovered_network,
            replay_seeds: recovered_seeds,
            replay_timestamps: recovered_timestamps.clone(),
            a2a_response_cache: Vec::new(),
            http_response_cache: Vec::new(),
        };

        // 4. Spawn the brand new engine thread
        let engine = self.wasm_engine.clone();

        let mut tracker = CheckPointTracker {
            last_snapshot_tx: resolved_tx,
            last_snapshot_time: recovered_timestamps.last().cloned().unwrap_or(0) as u64,
        };

        // Get the exact current Transaction ID
        let current_tx = self
            .global_tx_counter
            .clone()
            .load(std::sync::atomic::Ordering::SeqCst);

        // Now use the unified execute_agent function
        tokio::spawn(async move {
            if let Err(e) = engine.execute_agent(
                &wasm_bytes,
                content,
                &mut tracker,
                current_tx,
                Some(memory_blob),
            ) {
                eprintln!("[RESURRECTION FAILED] Agent crached: {} ", e);
            }
        });

        println!("[SYSTEM] Agent {} successfully resurrected. ", agent_hex);
        Ok(())
    }
}
