# Raqim (Synapse) Architecture Deep Dive: Definitive Technical Specification

> **Classification:** Comprehensive Technical Architecture Specification & Implementation Reference  
> **Target Workspace:** `/home/muhammad/projects/raqim/synapse`  
> **Scope:** `raqim-core` (Kernel Core), `raqim-py` (Python Runtime & PyO3 C-Extension), `raqim-cli` (Fleet Provisioning & Administration), `raqim-mcp` (Model Context Protocol Universal Bridge), `raqim-siege` (Zero-Copy Stress & Benchmark Harness), `raqim-console` (Next.js 16 / React 19 Observability Deck), and daemon configuration systems (`raqim.toml`, `aegis.toml`).  
> *(Explicitly Excluded: `raqim-agent-sdk`)*

---

## Table of Contents

1. [Macro Architecture & System Topology](#1-macro-architecture--system-topology)
2. [Workspace Inventory & Crate Graph](#2-workspace-inventory--crate-graph)
3. [`raqim-core`: Sovereign Kernel & Microkernel Engine](#3-raqim-core-sovereign-kernel--microkernel-engine)
   - [3.1 Kernel Data Contracts & Cascade Pipeline (`lib.rs`)](#31-kernel-data-contracts--cascade-pipeline-librs)
   - [3.2 OS Bootloader, Ingress Multiplexer & Signal Handlers (`main.rs`)](#32-os-bootloader-ingress-multiplexer--signal-handlers-mainrs)
   - [3.3 Nucleus: Group Commit WAL Engine & Aho-Corasick Scanner (`nucleus.rs`)](#33-nucleus-group-commit-wal-engine--aho-corasick-scanner-nucleusrs)
   - [3.4 Axon: Domain-Separated Merkle DAG & $O(\log_2 N)$ Proofs (`axon.rs`)](#34-axon-domain-separated-merkle-dag--olog_2-n-proofs-axonrs)
   - [3.5 Aegis: Cryptographic Firewall & Lock-Free Rate Limiter (`aegis.rs`)](#35-aegis-cryptographic-firewall--lock-free-rate-limiter-aegisrs)
   - [3.6 Memory Router: RRF Hybrid Search & Deterministic Effects (`memory_router.rs`)](#36-memory-router-rrf-hybrid-search--deterministic-effects-memory_routerrs)
   - [3.7 Sandbox: Wasmtime Hypervisor & WASI Jailing (`sandbox.rs`)](#37-sandbox-wasmtime-hypervisor--wasi-jailing-sandboxrs)
   - [3.8 LanceDB Storage: Columnar Vector Vault & Arrow Schemas (`lancedb_store.rs`)](#38-lancedb-storage-columnar-vector-vault--arrow-schemas-lancedb_storers)
   - [3.9 Compactor: Two-Phase Commit WAL Lifecycle Manager (`compactor.rs`)](#39-compactor-two-phase-commit-wal-lifecycle-manager-compactorrs)
   - [3.10 Worm Witness Engine: Immutable Storage & Linux `chattr +i` (`witness.rs`)](#310-worm-witness-engine-immutable-storage--linux-chattr-i-witnessrs)
   - [3.11 Network Bridge: Zenoh P2P Swarm Gossip (`network.rs`)](#311-network-bridge-zenoh-p2p-swarm-gossip-networkrs)
   - [3.12 State Substrate: Sharded Loro CRDT Documents (`state.rs`)](#312-state-substrate-sharded-loro-crdt-documents-staters)
   - [3.13 Hot Memory: 10k Ring Buffer & SIMD Cosine Proximity (`hot_memory.rs`)](#313-hot-memory-10k-ring-buffer--simd-cosine-proximity-hot_memoryrs)
   - [3.14 Embedding Subsystem: FastEmbed BGE vs OpenAI Providers (`embedding.rs`)](#314-embedding-subsystem-fastembed-bge-vs-openai-providers-embeddingrs)
   - [3.15 Registry & Live Process Table (`registry.rs`)](#315-registry--live-process-table-registryrs)
   - [3.16 Health & Vitals Telemetry (`health.rs`, `telemetry.rs`)](#316-health--vitals-telemetry-healthrs-telemetryrs)
   - [3.17 Shared Memory IPC: Iceoryx2 Data Plane (`cortex.rs`)](#317-shared-memory-ipc-iceoryx2-data-plane-cortexrs)
   - [3.18 Kernel Configuration & Utilities (`config.rs`, `utils.rs`)](#318-kernel-configuration--utilities-configrs-utilsrs)
   - [3.19 HTTP, SSE, WebSocket & Ingress API Layer (`api.rs`)](#319-http-sse-websocket--ingress-api-layer-apirs)
4. [`raqim-py`: Native PyO3 Extension & Python Deterministic Client](#4-raqim-py-native-pyo3-extension--python-deterministic-client)
   - [4.1 Native Rust Extension (`src/lib.rs`)](#41-native-rust-extension-srclibrs)
   - [4.2 Python Runtime & `@raqim.trace` Engine (`raqim/client.py`)](#42-python-runtime--raqimtrace-engine-raqimclientpy)
   - [4.3 Real-World AML Swarm Demo (`agent_aml_demo.py`)](#43-real-world-aml-swarm-demo-agent_aml_demopy)
5. [`raqim-cli`: Fleet Administration & Key Provisioning](#5-raqim-cli-fleet-administration--key-provisioning)
6. [`raqim-mcp`: Model Context Protocol Universal Bridge](#6-raqim-mcp-model-context-protocol-universal-bridge)
7. [`raqim-siege`: Hardened Microsecond Stress & Benchmark Suite](#7-raqim-siege-hardened-microsecond-stress--benchmark-suite)
8. [`raqim-console`: Next.js 16 / React 19 Observability Deck](#8-raqim-console-nextjs-16--react-19-observability-deck)
9. [End-to-End Execution Lifecycles](#9-end-to-end-execution-lifecycles)
   - [9.1 Ingress to Cascade Lifecycle](#91-ingress-to-cascade-lifecycle)
   - [9.2 Agent-to-Agent (A2A) RPC Query Flow](#92-agent-to-agent-a2a-rpc-query-flow)
   - [9.3 Deterministic Replay & Universe Branching](#93-deterministic-replay--universe-branching)
   - [9.4 Autonomous 2PC Compaction & WORM Witness Anchoring](#94-autonomous-2pc-compaction--worm-witness-anchoring)
10. [Architectural Invariants & Engineering Reference](#10-architectural-invariants--engineering-reference)

---

## 1. Macro Architecture & System Topology

Raqim is an **Agent Operating System (AOS)** and **Cryptographic Flight Recorder** engineered to transform stochastic, non-deterministic AI agent executions into cryptographically verifiable, durable, and deterministically replayable state transitions.

```
                                  +---------------------------------------+
                                  |    raqim-console (Next.js 16 Deck)    |
                                  |   [Dashboard, Topology, Time-Travel]  |
                                  +-------------------+-------------------+
                                                      | SSE / HTTP / WS
                                                      v
+-------------------+      TCP (rkyv)      +-------------------------------------------------------+
|     raqim-py      | -------------------> |                      raqim-core                       |
|   (Python SDK)    | < - - - - - - - - -  |                 (Sovereign Kernel OS)                 |
+-------------------+     Zenoh / WS       |                                                       |
                                           |  +-----------------+  +----------------------------+  |
+-------------------+      Stdio MCP       |  | Aegis GateKeep  |  | Axon Merkle DAG (BLAKE3)   |  |
|     raqim-mcp     | -------------------> |  | (Ed25519 Firew) |  | (1024-Leaf Crystallize)    |  |
|  (Universal LLM)  | < - - - - - - - - -  |  +-----------------+  +----------------------------+  |
+-------------------+       TCP / WS       |  +-----------------+  +----------------------------+  |
                                           |  | Nucleus WAL     |  | Loro CRDT State Registry   |  |
+-------------------+      Admin HTTP      |  | (Group Commit)  |  | (Namespaced DashMap Shards)|  |
|     raqim-cli     | -------------------> |  +-----------------+  +----------------------------+  |
|  (Fleet Provision)|                      |  +-----------------+  +----------------------------+  |
+-------------------+                      |  | 2PC Compactor   |  | MemoryRouter (Hybrid RRF)  |  |
                                           |  | (WAL -> LanceDB)|  | (Hot RAM + Cold Vector)    |  |
+-------------------+      TCP Siege       |  +-----------------+  +----------------------------+  |
|    raqim-siege    | -------------------> |  +-----------------+  +----------------------------+  |
| (500k TPS Bench)  |                      |  | Wasmtime Engine |  | GlobalNetworkBridge (Zenoh)|  |
+-------------------+                      |  +-----------------+  +----------------------------+  |
                                           +---------------------------+---------------------------+
                                                                       |
                                         +-----------------------------+-----------------------------+
                                         |                             |                             |
                                         v                             v                             v
                             +-----------------------+    +--------------------------+   +-----------------------+
                             |   NVMe Storage        |    | LanceDB Cold Vector      |   | Immutable WORM        |
                             |   production.wal      |    | production_semantic      |   | ./vault/witnesses/    |
                             +-----------------------+    +--------------------------+   +-----------------------+
```

### Core Architecture Pillars
1. **Zero-Trust Cryptographic Perimeter:** All agents hold an Ed25519 keypair. Identity is derived via domain-separated BLAKE3 hashing. Every thought and RPC packet is signed and verified by the **Aegis** firewall before touching memory.
2. **Causal Merkle DAG:** State transitions form an append-only cryptographic directed acyclic graph (DAG) yielding $O(\log_2 N)$ Merkle inclusion proofs.
3. **Hierarchical 2PC Memory Hierarchy:**
   - *Hot Tier:* High-throughput WAL with group commits (2ms / 6,000 entries) + 10k-slot SIMD RAM ring buffer.
   - *Cold Tier:* LanceDB columnar vector storage backed by Apache Arrow.
   - *Witness Tier:* Write Once Read Many (WORM) storage with Ed25519 master root signatures and Linux `chattr +i` immutability.
4. **Decentralized Convergence:** Loro CRDTs sharded across namespaces synchronize state via Zenoh 1.7.2 P2P mesh; local node IPC is accelerated by Iceoryx2 shared memory.
5. **Deterministic Replay & Time Travel:** Ability to freeze execution at any transaction ID ($Tx_{id}$), evaluate cached side-effects ($0 API cost), or branch into parallel `phantom_` simulation namespaces via Wasmtime memory-page snapshotting.

---

## 2. Workspace Inventory & Crate Graph

```
synapse/ (Cargo Workspace Root)
  ├── Cargo.toml
  ├── raqim.toml
  ├── aegis.toml
  ├── ARCHITECTURE_DEEP_DIVE.md
  │
  ├── raqim-core/          [Central Kernel Daemon & Microkernel]
  ├── raqim-py/            [Python Runtime SDK & PyO3 C-Extension Module]
  ├── raqim-cli/           [Sovereign Fleet CLI & Key Provisioning Engine]
  ├── raqim-mcp/           [Model Context Protocol Universal Stdio Translator]
  ├── raqim-siege/         [Microsecond-Precision Latency Benchmark & Stress Suite]
  └── raqim-console/       [Next.js 16 / React 19 Observability Deck & Mission Control]
```

---

## 3. `raqim-core`: Sovereign Kernel & Microkernel Engine

### 3.1 Kernel Data Contracts & Cascade Pipeline (`lib.rs`)

`raqim-core/src/lib.rs` defines the central data contracts, serialization invariants (`rkyv`), broadcast events, and the primary pipeline coordinator: `execute_raqim_cascade()`.

#### Data Contracts
- **`AgentStatus`** (`enum`): Lifecycle states: `Idle`, `Reasoning`, `ToolExecution`, `Halted`.
- **`AgentState`** (`struct`):
  - `agent_id: Option<[u8; 16]>`: Cryptographic 16-byte identity hash.
  - `transaction_id: u128`: Monotonically increasing UUIDv7 identifier.
  - `timestamp: i64`: Unix epoch timestamp (seconds).
  - `status: AgentStatus`: Lifecycle status.
  - `text: String`: Natural language reasoning, action payload, or tool input.
  - `namespace: String`: Shard destination (e.g., `/finance/triage`).
- **`OpLog`** (`struct`): Encapsulates an `AgentState` alongside CRDT delta bytes for durable storage and network transmission.
- **`IngressEnvelope`** (`struct`): Wire protocol format for TCP/HTTP thought ingestion:
  - `intent_path: String`, `public_key: [u8; 32]`, `signature: [u8; 64]`, `state_bytes: Vec<u8>`, `capability_cert: Vec<u8>`.
- **`A2AEnvelope`** (`struct`): Wire format for Agent-to-Agent Remote Procedure Calls:
  - `sender_id: [u8; 16]`, `sender_public_key: [u8; 32]`, `target_capability: String`, `payload: Vec<u8>`, `signature: [u8; 64]`, `sender_capability_cert: Vec<u8>`, `timestamp: i64`.
- **`EffectKey` & `EffectRecord`** (`structs`): Deterministic side-effect cache:
  - `EffectKey`: `agent_id: [u8; 16]`, `step_ordinal: u64`, `call_signature_hash: [u8; 32]`.
  - `EffectRecord`: `effect_key: EffectKey`, `output_payload: Vec<u8>`, `timestamp: i64`, `tx_id: u128`, `namespace: String`.
- **`SystemEvent`** (`enum`): System-wide broadcast event bus variants (`ThoughtCommitted`, `AegisInterdiction`, `SecurityBreach`, `RealityForked`, `CompactionTriggered`, `QuarantineSynchronized`).

#### Pipeline Coordinator: `execute_raqim_cascade`
Orchestrates every verified thought through the 6-stage kernel cascade:
1. **CRDT Local Shard Update:** Mutates the Loro document corresponding to `archived_state.namespace` and exports the delta.
2. **Axon Merkle Sealing:** Calculates leaf hash ($\text{BLAKE3}(\text{state\_bytes} \mathbin{\Vert} \text{agent\_id})$) and records the leaf in the active Merkle DAG.
3. **Nucleus WAL Group Append:** Dispatches the `OpLog` to the background group-commit queue.
4. **Cortex Zero-Copy IPC:** Serializes the `OpLog` to Iceoryx2 shared memory for local consumers.
5. **Global Mesh Egress:** Asynchronously broadcasts the verified `OpLog` across the Zenoh network.
6. **SSE Firehose Dispatch:** Emits `SystemEvent::ThoughtCommitted` to the Axum broadcast channel.

---

### 3.2 OS Bootloader, Ingress Multiplexer & Signal Handlers (`main.rs`)

`raqim-core/src/main.rs` initializes all subsystems, manages master keys, handles signal termination, and binds network transports.

#### Startup & Lifecycle
1. **Master Key Bootstrap:** Reads `./ca-keys/swarm_master.key` (or generates a fresh Ed25519 signing key with `0o600` permissions).
2. **Aegis Hot-Reloader:** Spawns a file watcher on `aegis.toml` using `notify::RecommendedWatcher`.
3. **Storage & Engine Initializations:** Boots `LanceEngine`, `WalEngine`, `AxonGateKeeper`, `SwarmStateRegistry`, and `GlobalNetworkBridge`.
4. **Phoenix State Hydration:** Scans the active WAL file and WORM witness blocks to reconstruct active Merkle roots and warm up the in-memory `HotVectorBuffer`.
5. **Background Daemons:** Boots `WalCompactor`, `HealthMonitor` (1Hz sysinfo SSE), `CortexPublisher` (Iceoryx2), and the WASM plugin file watcher (`./plugins/`).
6. **Multithreaded TCP Server (Port 8080):** Accepts incoming agent connections, parses 4-byte LE length-prefixed frames, verifies lineage and signatures via Aegis, and executes `execute_raqim_cascade()`.
7. **Graceful Drain:** Intercepts `SIGINT`/`SIGTERM`, pauses network ingress, flushes pending WAL group-commit batches, flushes vector tables, disconnects Zenoh, and executes an NVMe hardware `fsync`.

---

### 3.3 Nucleus: Group Commit WAL Engine & Aho-Corasick Scanner (`nucleus.rs`)

`nucleus.rs` provides append-only disk logging with group commits and zero-copy substring scanning.

#### Binary Frame Layout
```
+-------------------+-------------------+-----------------------------------+
| 4 Bytes (u32 LE)  | 4 Bytes (u32 LE)  | N Bytes                           |
| Payload Length    | CRC32 Checksum    | rkyv-aligned Archived Vec<OpLog>  |
+-------------------+-------------------+-----------------------------------+
```

#### Core Components & Functions
- **`WalEngine`**: Manages a background IO worker loop over an async `mpsc` channel.
- **Group Commit Protocol:** Gathers up to 6,000 logs or waits for a 2ms timeout before writing a single contiguous batch with CRC32 verification and `file.sync_data()`.
- **`recover_and_truncate_torn_frames(path)`**: Scans the log on boot, detects torn or uncommitted tails caused by OS power failure, and truncates the file back to the last valid byte offset.
- **`lexical_scan(query, namespace, limit, path)`**: Memory-maps (`memmap2::Mmap`) the WAL segment and performs zero-copy substring search using the **Aho-Corasick automaton** (`aho_corasick::AhoCorasick`).
- **`fetch_hot_timeline(agent_hex, path)`**: Extracts recent chronological entries directly from the active WAL.

---

### 3.4 Axon: Domain-Separated Merkle DAG & $O(\log_2 N)$ Proofs (`axon.rs`)

`axon.rs` builds append-only binary Merkle trees with cryptographic domain separation and batch crystallization.

#### Cryptographic Domain Separation
- **Merkle Leaf KDF:** `blake3::Hasher::new_derive_key("raqim.axon.v1.leaf")` over `delta_bytes || agent_id`.
- **Merkle Node KDF:** `blake3::Hasher::new_derive_key("raqim.axon.v1.node")` over `left_child || right_child`.
- **Agent Identity KDF:** `blake3::Hasher::new_derive_key("raqim.agent.v1.identity")` over `ed25519_public_key` (derived to 16 bytes).

#### Key Operations
- **`seal_thought(tx_id, agent_id, delta_bytes, namespace)`**: Calculates the leaf hash and appends it to the active tree buffer for the namespace.
- **`compute_markle_root(leaves)`**: Computes the root of a binary Merkle tree. Odd leaves are balanced by duplicating the final node.
- **Batch Crystallization (1,024 Leaves):** When an active tree reaches 1,024 leaves, it is crystallized into an immutable `MarkleBatch`, linked to the previous batch root, and handed to `WormWitnessEngine`.
- **`generate_proof_for_tx(tx_id) -> Option<InclusionProof>`**: Generates an audit trail of sibling hashes ($O(\log_2 N)$) from leaf to root.
- **`verify_inclusion(leaf_hash, agent_id, proof) -> bool`**: Client-side verifiable calculation confirming inclusion in the root.
- **`execute_forensic_boot_audit()`**: Recomputes historical roots on boot and compares them against signed WORM witness blocks.

---

### 3.5 Aegis: Cryptographic Firewall & Lock-Free Rate Limiter (`aegis.rs`)

`aegis.rs` enforces security policies, anti-replay constraints, lock-free rate limiting, and cluster-wide quarantine synchronization.

#### Key Mechanics
- **`CapabilityCertificate`**: Postcard-serialized credential containing `agent_hex`, `group_name`, expiration timestamp, and master key signature.
- **`AtomicTokenBucket`**: Lock-free token-bucket rate limiter. Uses relaxed atomic loads and atomic compare-and-swap (CAS) loops on token counts without mutex contention.
- **`authorize_packet_fast(...) -> Result<(), AegisViolation>`**:
  1. *Quarantine Evaluation:* Drops packets if `agent_hex` is present in `quarantine_blocklist`.
  2. *Anti-Replay Verification:* Enforces $|T_{\text{packet}} - T_{\text{system}}| \le 30\text{s}$.
  3. *Ed25519 Payload Signature:* Verifies packet integrity using the sender's public key.
  4. *Namespace Policy Rules:* Validates access against `allowed_namespaces` and `blocked_namespaces`.
  5. *Token Bucket Evaluation:* Consumes rate-limiter tokens.
- **`verify_session_lineage(cert_bytes, agent_public_key)`**: Verifies that the agent's public key matches the certificate identity hash and verifies the master key's signature.
- **Quarantine Mesh Synchronization:** Quarantines agents locally upon violation and broadcasts `QuarantineRecord` alerts across the Zenoh network.

---

### 3.6 Memory Router: RRF Hybrid Search & Deterministic Effects (`memory_router.rs`)

`memory_router.rs` handles hybrid search across memory tiers, side-effect caching, and time-travel reality branching.

#### Hybrid RAG Search
Combines cold vector ANN from LanceDB and hot RAM vector search from `HotVectorBuffer` using **Reciprocal Rank Fusion (RRF, $k=60$)** with exponential time decay:
$$\text{Score} = \sum_{m \in \{\text{Hot}, \text{Cold}\}} \frac{1}{k + \text{rank}_m} \times e^{-\lambda \cdot (T_{\text{now}} - T_{\text{thought}})}$$

#### Deterministic Side-Effect Cache
- **`record_effect(agent_id, step_ordinal, call_signature_hash, output_payload, namespace)`**: Caches tool outputs using a BLAKE3 key derived from `agent_id || step_ordinal || call_signature_hash`. Commits the record to the WAL and Merkle DAG.
- **`get_effect(agent_id, step_ordinal, call_signature_hash)`**: Retrieves cached tool outputs during replay mode, bypassing external API invocations ($0 token/API cost).
- **`boot_historical_agent(agent_hex, target_tx_id, fork_config, is_fork, phantom_tx)`**: Restores WASM linear memory to the closest prior snapshot, replays WAL deltas up to `target_tx_id`, applies configuration mutations, and branches execution into a `phantom_` namespace.

---

### 3.7 Sandbox: Wasmtime Hypervisor & WASI Jailing (`sandbox.rs`)

`sandbox.rs` implements sandboxed WebAssembly execution with Wasmtime v29, WASI Preview 1 jailing, fuel metering, and memory snapshotting.

#### Security & Execution Bounds
- **Fuel Metering:** Limits execution to 1,000,000 fuel units per invocation.
- **Memory Limits:** Maximum reservation ceiling of 50MB per instance.
- **WASI Jailing:** Direct file system and raw socket operations are blocked. All I/O is routed through host functions.

#### Host ABI Functions
- `host_emit_thought(ptr, len)`: Commits a thought directly to the kernel cascade.
- `host_request_entropy(out_ptr, len)`: Returns host CSPRNG entropy.
- `host_fetch_url(url_ptr, len, out_ptr)`: Proxies external HTTP calls through Aegis firewall inspection.
- `host_ask_agent(cap_ptr, len, q_ptr, q_len)`: Dispatches an A2A query to the swarm.
- `host_register_capability(cap_ptr, len)`: Registers capability query handlers.
- `host_await_a2a_question()` / `host_reply_a2a()`: Coordinates incoming A2A queries.
- `host_get_time()`: Returns synchronized system time.
- **Memory Checkpointing:** `create_checkpoint()` and `inject_historical_state()` dump and restore WebAssembly linear memory pages for state reproduction.

---

### 3.8 LanceDB Storage: Columnar Vector Vault & Arrow Schemas (`lancedb_store.rs`)

`lancedb_store.rs` manages long-term cold storage, columnar Arrow schemas, and vector ANN search.

#### Arrow Table Schemas
- **`agent_history`**: `tx_id: Utf8`, `agent_id: Utf8`, `namespace: Utf8`, `text: Utf8`, `status: Utf8`, `timestamp: Int64`, `vector: FixedSizeList<Float32>[dims]`.
- **`agent_snapshot`**: `agent_id: Utf8`, `tx_id: Utf8`, `timestamp: Int64`, `wasm_memory_dump: Binary`.
- **`system_audit_vault`**: `event_id: Utf8`, `event_type: Utf8`, `agent_id: Utf8`, `details: Utf8`, `timestamp: Int64`.

#### Key Operations
- **`archive_batch(logs, vectors)`**: Encodes `OpLog` entries and embedding vectors into Arrow `RecordBatch` instances and appends them to LanceDB.
- **`semantic_search(query, namespace, limit)`**: Executes cosine similarity ANN searches across historical records.
- **`save_snapshot()` / `fetch_closest_snapshot()`**: Manages WASM memory dumps for historical time travel.
- **`generate_compliance_report(agent_hex, start_ts, end_ts)`**: Compiles historical thoughts and Merkle roots into regulatory audit reports.

---

### 3.9 Compactor: Two-Phase Commit WAL Lifecycle Manager (`compactor.rs`)

`compactor.rs` migrates committed thoughts from the hot WAL into cold LanceDB storage using a **Two-Phase Commit (2PC)** state machine.

```
[Active WAL File] 
       |
       v (1GB size or 24hr timer)
[Rotate Barrier] -> WalEngine seals & renames WAL to production.wal.<timestamp>
       |
       v (2PC Step 1: Write PENDING Manifest)
[Vector Embedding] -> FastEmbed / OpenAI batch vectorization
       |
       v
[LanceDB Archive] -> Ingest RecordBatch into Arrow tables
       |
       v (2PC Step 2: Write COMMITTED Manifest)
[Cleanup] -> Delete processed WAL segment & clear manifest
```

#### Manifest Invariants
- `CompactionState::Pending`: Manifest written atomically via temporary file rename. If interrupted by an OS crash, boot recovery resumes ingestion.
- `CompactionState::Committed`: Ingestion complete. If interrupted before segment deletion, boot recovery cleans up the orphaned WAL segment.

---

### 3.10 Worm Witness Engine: Immutable Storage & Linux `chattr +i` (`witness.rs`)

`witness.rs` anchors crystallized Merkle roots into immutable storage targets.

#### Data Structures & Immutability Targets
- **`AnchoredRootWitness`**: Contains batch metadata, root hashes, timestamps, and the master private key signature.
- **`CertifiedBundleBlock`**: Pairs the signed witness with the raw `OpLog` batch.
- **Local Immutable File Storage:** Saves bundles to `./vault/witnesses/batch_{id}.json`. On Linux, executes `chattr +i` to apply kernel-level append-only immutability.
- **Cloud WORM Storage:** Replicates bundles via HTTP PUT to cloud object stores configured with Object Lock policies.

---

### 3.11 Network Bridge: Zenoh P2P Swarm Gossip (`network.rs`)

`network.rs` coordinates peer-to-peer swarm synchronization and RPC routing using Zenoh 1.7.2.

#### Topic Topology
- `raqim/{tenant}/{swarm}/thoughts/{node_id}`: Broadcast topic for locally committed thoughts.
- `raqim/{tenant}/{swarm}/thoughts/*`: Wildcard subscription for foreign thought ingestion.
- `raqim/{tenant}/{swarm}/a2a/{capability}`: Queryable path for A2A RPC requests.
- `raqim/{tenant}/{swarm}/system/quarantine`: Synchronization topic for cluster quarantine alerts.
- `raqim/{tenant}/{swarm}/control/{agent_hex}`: Control topic for out-of-band context eviction directives.

---

### 3.12 State Substrate: Sharded Loro CRDT Documents (`state.rs`)

`state.rs` provides deterministic state convergence across nodes using Loro CRDTs.

- **`SwarmState`**: Contains an isolated `LoroDoc` wrapped in a `parking_lot::RwLock` for a specific namespace, with diff event listeners attached to the root map.
- **`SwarmStateRegistry`**: Sharded `DashMap<String, Arc<SwarmState>>` utilizing two-pass speculative allocation to eliminate write-lock contention.
- **`purge_phantom_shards()`**: Scans and garbage-collects completed simulation shards (`phantom_*`) when their reference counts drop to 1.

---

### 3.13 Hot Memory: 10k Ring Buffer & SIMD Cosine Proximity (`hot_memory.rs`)

`hot_memory.rs` maintains an in-memory ring buffer of recent thought embeddings.

- **`HotVectorBuffer`**: Thread-safe `VecDeque<HotVectorEntry>` ring buffer holding up to 10,000 entries.
- **`search_hot(query_vector, namespace_filter, top_k)`**: Performs SIMD-accelerated cosine similarity search directly in RAM.
- **`evict_compacted_up_to(max_compacted_tx)`**: Evicts entries that have been durably written to LanceDB, maintaining an efficient memory footprint.

---

### 3.14 Embedding Subsystem: FastEmbed BGE vs OpenAI Providers (`embedding.rs`)

`embedding.rs` abstracts vector generation across local and remote providers via the `EmbeddingProvider` trait.

- **`LocalBgeProvider`** (`BGE-Base-EN-v1.5`): Local embedding generation producing 768-dimensional vectors via `fastembed`. Offloads inference to `tokio::task::spawn_blocking`.
- **`OpenAIProvider`** (`text-embedding-3-large`): Remote embedding generation producing 3,072-dimensional vectors via the OpenAI REST API.
- **`MockEmbeddingProvider`**: Benchmark provider returning zero-filled vectors for stress-testing raw throughput.

---

### 3.15 Registry & Live Process Table (`registry.rs`)

`registry.rs` tracks active agent processes in a concurrent `DashMap<String, AgentProcess>`.
- Updates agent status (`Idle`, `Reasoning`, `ToolExecution`, `Quarantined`) on every ingress packet.
- Provides real-time process metadata for topology visualization in `raqim-console`.

---

### 3.16 Health & Vitals Telemetry (`health.rs`, `telemetry.rs`)

- **`HealthMonitor` (`health.rs`)**: Uses `sysinfo` to monitor CPU load, RSS memory usage, host memory, and core temperature, broadcasting metrics to `/v1/system/health/live` at 1Hz when subscribers are active.
- **`TelemetryEngine` (`telemetry.rs`)**: Implements lock-free atomic counters (`AtomicU64`) tracking CRDT merges, routed A2A bytes, and time-travel query volumes.

---

### 3.17 Shared Memory IPC: Iceoryx2 Data Plane (`cortex.rs`)

`cortex.rs` provides zero-copy shared-memory IPC via Iceoryx2 (`iceoryx2::prelude::*`) for low-latency communication between local processes on the same host.

---

### 3.18 Kernel Configuration & Utilities (`config.rs`, `utils.rs`)

- **`RaqimConfig` (`config.rs`)**: Parses `raqim.toml` and CLI flags (`CliArgs`), applying configuration overrides for daemon ports, storage paths, and cryptographic keys.
- **`utils.rs`**: Provides helper functions, including `parse_agent_id()`, for converting 32-character hex strings into 16-byte fixed arrays.

---

### 3.19 HTTP, SSE, WebSocket & Ingress API Layer (`api.rs`)

`api.rs` exposes the HTTP/REST endpoints, SSE streams, and WebSocket bridges.

#### API Route Reference

| Method | Route | Handler | Purpose |
| :--- | :--- | :--- | :--- |
| **`GET`** | `/v1/state/proof/:tx_id` | `get_state_proof_handler` | Returns $O(\log_2 N)$ Merkle inclusion proof for a given $Tx_{id}$ |
| **`POST`**| `/v1/effect/record` | `record_effect_handler` | Commits tool side-effects to WAL and Merkle DAG |
| **`POST`**| `/v1/effect/get` | `get_effect_handler` | Retrieves cached side-effects during deterministic replay |
| **`GET`** | `/v1/aegis/quarantine_list` | `active_qurantine_endpoint` | Lists all currently quarantined agents |
| **`POST`**| `/v1/admin/quarantine/lift` | `lift_qurantine_and_resurrect` | Clears quarantine and sends context eviction signal via Zenoh |
| **`GET`** | `/v1/aegis/metrics` | `aegis_metics_endpoint` | Returns security violation counts and rate-limiter token states |
| **`POST`**| `/v1/admin/ca/mint` | `handle_ca_mint` | Mints Ed25519 Capability Certificates signed by the Master Key |
| **`POST`**| `/v1/admin/time_travel` | `time_travel_endpoint` | Branches execution into a `phantom_` simulation shard |
| **`GET`** | `/v1/admin/time_travel/timeline/:agent_hex` | `fetch_agent_timeline` | Returns historical thought sequence for an agent |
| **`GET`** | `/v1/admin/cluster/info` | `cluster_info_endpoint` | Returns kernel vitals, WAL size, and CRDT operation totals |
| **`GET`** | `/v1/admin/cluster/topology` | `cluster_topology_endpoint` | Returns active CRDT shards and connected agents |
| **`GET`** | `/v1/cluster/enclaves` | `cluster_enclaves_endpoint` | Returns active agent enclaves and status |
| **`GET`** | `/v1/dashboard/cards` | `dashboard_cards_endpoint` | Returns high-level metrics for dashboard cards |
| **`POST`**| `/v1/admin/ingress/toggle` | `toggle_ingress_endpoint` | Toggles TCP ingress pausing (Zero-Window flow control) |
| **`POST`**| `/v1/admin/compactor/trigger` | `trigger_compaction_endpoint`| Manually triggers 2PC WAL compaction to LanceDB |
| **`POST`**| `/v1/system/boot_agent` | `upload_wasm_endpoint` | Uploads and registers `.wasm` agent binaries to `./plugins/` |
| **`GET`** | `/v1/system/health/live` | `sse_health_endpoint` | 1Hz SSE stream of hardware and process metrics |
| **`GET`** | `/v1/system/firehose` | `sse_firehose_endpoint` | Real-time SSE stream of all committed swarm thoughts |
| **`GET`** | `/v1/time-travel/stream` | `sse_phantom_endpoint` | Dedicated SSE stream for simulation shard events |
| **`GET`** | `/v1/system/agents/aliases` | `agent_alias_endpoint` | Returns map of `agent_hex -> alias` |
| **`GET`** | `/v1/mcp/ws` | `mcp_ws_handler` | Bi-directional WebSocket bridge for MCP tool calling & A2A RPC |
| **`POST`**| `/v1/swarm/ingress` | `http_ingress_endpoint` | Zero-copy binary `rkyv` HTTP thought ingestion |
| **`GET`** | `/v1/swarm/memory` | `semantic_search_endpoint` | Hybrid vector search (Hot RAM + Cold LanceDB) |
| **`GET`** | `/v1/vault/search` | `unified_vault_search` | Concurrent search combining LanceDB ANN and WAL lexical scanning |
| **`GET`** | `/v1/vault/telemetry` | `vault_telemetry_endpoint` | Returns index sizes, vector counts, and storage metrics |

---

## 4. `raqim-py`: Native PyO3 Extension & Python Deterministic Client

### 4.1 Native Rust Extension (`src/lib.rs`)

`raqim-py/src/lib.rs` compiles into the `raqim_core` C-extension module, exposing high-performance cryptographic primitives and `rkyv` serialization directly to Python.

#### Native Class: `RaqimCryptoCore`
- **`new(pem_path: &str, cert_path: Option<&str>)`**: Loads the Ed25519 private key, derives the 16-byte agent identity via BLAKE3 domain separation, and loads the capability certificate.
- **`sign_payload(payload: &[u8]) -> PyBytes`**: Produces a 64-byte Ed25519 signature over arbitrary bytes.
- **`generate_tcp_payload(agent_hex, intent_path, text) -> PyBytes`**: Serializes an `AgentState` struct with a UUIDv7 transaction ID to `rkyv` bytes, signs the payload, and formats an `IngressEnvelope` with a 4-byte LE length prefix for direct TCP transmission.
- **`hash_call_signatures(call_inputs: &str) -> PyBytes`**: Computes a 32-byte BLAKE3 call signature hash (`raqim.effect.v1.signature`) over serialized function arguments.

---

### 4.2 Python Runtime & `@raqim.trace` Engine (`raqim/client.py`)

`raqim-py/raqim/client.py` provides the high-level Python client interface.

#### Key Components
- **`CanonicalSerializer`**: Normalizes Python primitives, dictionaries, dataclasses, and Pydantic models (v1 and v2) into deterministic JSON format (`sort_keys=True, separators=(',', ':')`) for repeatable BLAKE3 hashing.
- **`RaqimClient`**:
  - Manages connections, authentication, and execution modes (`record` vs. `replay`).
  - **`boot()`**: Sends an initial `/system/handshake` over TCP to register the agent alias, and subscribes to Zenoh control topics.
  - **`commit_thought(agent_hex, intent_path, text)`**: Sends signed zero-copy payloads to the daemon over TCP port 8080.
  - **`query_memory(intent_path, query, limit)`**: Queries hybrid memory via HTTP.
  - **`connect_swarm()` / `ask_swarm()` / `serve_capability()`**: Manages A2A RPC queries over WebSockets.
  - **`_handle_os_control_override()`**: Listens for `FORCE_CONTEXT_EVICTION` directives from Aegis to reset corrupted agent context.
- **`@raqim.trace(namespace, custom_signature)` Decorator**:
  - Instruments synchronous functions, async coroutines, and async generators (streaming LLM tokens).
  - **Record Mode:** Executes functions live, caches results via `/v1/effect/record`, and commits thoughts to the Merkle DAG.
  - **Replay Mode:** Fetches cached results from `/v1/effect/get` without invoking the underlying function.
  - **Automatic Divergence Handling:** If function arguments or code signatures change during replay, branches execution into a `phantom_{namespace}_{agent_hex}_step{step}` namespace and transitions from replay to live mode.
- **`verify_state_proof_offline(payload_bytes, agent_id_str, proof_dict) -> bool`**: Recomputes the BLAKE3 Merkle path client-side to verify inclusion proofs with zero network dependencies.

---

### 4.3 Real-World AML Swarm Demo (`agent_aml_demo.py`)

Demonstrates an end-to-end pipeline with three sovereign agents:

```
[Synthetic Transaction Stream]
             |
             v
  [Agent 1: Triage Screener] ----(Screens transactions below $10,000 threshold)
             |
             v (If flagged: Escalates anomaly)
[Agent 2: Forensic Analyst] ----(Analyzes structuring cluster via Gemini 2.5 Flash)
             |
             v
[Agent 3: Compliance Officer] --(Fetches Merkle Inclusion Proof & files sealed SAR)
```

1. **`triage_screener` (`/finance/triage`)**: Screens payments to detect structuring patterns (e.g., transfers between $9,000 and $10,000 targeting offshore nodes).
2. **`forensic_analyst` (`/finance/investigations`)**: Analyzes transaction clusters using Gemini 2.5 Flash to generate forensic audit findings.
3. **`compliance_officer` (`/finance/compliance_sar`)**: Attaches cryptographic Merkle inclusion proofs from `/v1/state/proof/:tx_id` and files a sealed Suspicious Activity Report (SAR).

---

## 5. `raqim-cli`: Fleet Administration & Key Provisioning

`raqim-cli/src/main.rs` provides command-line management for the Raqim OS.

```
raqim (CLI Entrypoint)
  |-- keys forge       -> Batch-mints Ed25519 identities & Capability Passports
  |-- aegis list       -> Displays active quarantine blocks
  |-- aegis lift       -> Clears agent quarantine and triggers context reseeding
  |-- timetravel       -> Displays historical causal timelines for an agent
  `-- cluster info/top -> Inspects node vitals, WAL buffer loads, and CRDT shards
```

### Command Reference
- **`raqim keys forge --name <name> --group <group> --count <N> --out-dir <dir>`**:
  - Generates $N$ Ed25519 keypairs using `OsRng`.
  - Derives 16-byte agent identities using BLAKE3 domain separation.
  - Requests signed capability certificates from the daemon (`/v1/admin/ca/mint`).
  - Writes `.pem` private keys (with Unix `0o600` permissions) and `.cert` capability files to the output directory.
- **`raqim aegis list`**: Queries `/v1/aegis/quarantine_list` to display active quarantine records.
- **`raqim aegis lift --agent-id <hex> --reason <text>`**: Calls `/v1/admin/quarantine/lift` to clear quarantine status and send a context reset signal.
- **`raqim timetravel --agent-id <hex>`**: Queries `/v1/admin/time_travel/timeline/:agent_hex` to display an agent's historical causal timeline.
- **`raqim cluster info`** and **`raqim cluster topology`**: Queries `/v1/admin/cluster/info` and `/v1/admin/cluster/topology` to report WAL size, memory usage, and CRDT shard state.

---

## 6. `raqim-mcp`: Model Context Protocol Universal Bridge

`raqim-mcp/src/main.rs` implements a Model Context Protocol (MCP) server over standard I/O (`StdioTransport`), allowing LLMs to interface directly with the Raqim OS.

```
+--------------------------+
|  LLM Client / MCP Host   |
+-------------+------------+
              | Stdio (JSON-RPC)
              v
+-------------+------------+
|        raqim-mcp         |
+-------------+------------+
              |
              +---> commit_thought --> Ed25519 Sign -> 4B Frame -> TCP (Port 8080) -> WalEngine
              +---> query_memory   --> HTTP GET -> /v1/swarm/memory (Hybrid RAG)
              `---> ask_swarm      --> WebSocket -> /v1/mcp/ws -> Zenoh A2A RPC
```

### Exposed MCP Tools
1. **`commit_thought`**:
   - **Arguments:** `thought_text`, `status` (`Reasoning`, `ToolExecution`, `Halted`, `Idle`), `intent_path`.
   - **Action:** Derives the caller's agent identity, signs the state using its Ed25519 key, and writes the framed binary payload to TCP port 8080.
2. **`query_memory`**:
   - **Arguments:** `query`, `intent_path`.
   - **Action:** Queries `/v1/swarm/memory` to perform hybrid search across hot and cold storage tiers.
3. **`ask_swarm`**:
   - **Arguments:** `target_capability`, `question`.
   - **Action:** Connects to `/v1/mcp/ws`, dispatches an `AskQuestion` payload, and awaits the response over the A2A network.

---

## 7. `raqim-siege`: Hardened Microsecond Stress & Benchmark Suite

`raqim-siege/src/main.rs` is a high-concurrency load-testing harness designed to evaluate kernel throughput and measure microsecond-level latency percentiles.

```
[Master CA Key Loaded]
          |
          v
[Mint 50 Virtual Agents with Ed25519 Keys + Capability Passports]
          |
          v
[Connect 50 Concurrent TCP Sockets to Kernel (Port 8080)]
          |
          v
[Synchronize on tokio::sync::Barrier]
          |
          v
[Firehose Ingestion: 500,000 Thoughts Streamed Across Sockets]
          |
          v
[Collect Microsecond Latency Samples -> Calculate Percentile Distribution]
```

### Performance Metrics Captured
- **Total Ingestion Volume:** 500,000 thoughts distributed across 50 concurrent worker shards.
- **Latency Distribution:** Records write and transport times per thought to calculate $P_{50}$, $P_{90}$, $P_{95}$, $P_{99}$, $P_{99.9}$, $\text{Max}$, and $\text{Mean}$ metrics.
- **Throughput:** Calculates operations per second (TPS) and data transfer rates under closed-loop TCP backpressure.

---

## 8. `raqim-console`: Next.js 16 / React 19 Observability Deck

`raqim-console` is an administrative dashboard built with Next.js 16, React 19, Tailwind CSS, Zustand, and XYFlow.

```
raqim-console Navigation & Layout
  |-- / (Command Deck)        -> Hardware vitals, live semantic firehose, key metrics
  |-- /topology               -> Interactive XYFlow graph of CRDT shards & live A2A beams
  |-- /router & /replay       -> Step scrubber, WASM state hypervisor, effect diff inspector
  |-- /aegis & /firewall      -> Token bucket gauges, quarantine table, remediation drawer, CA minting
  `-- /vault & /audit-vault   -> Unified hybrid search workbench, Merkle proof inspector
```

### Core Architecture & State Management
- **`src/lib/store/useSwarmStore.ts` (Zustand Store):**
  - Manages real-time state for thoughts, active transaction selections, rolling TPS histories, hardware vitals, and topology nodes/edges.
  - Subscribes to SSE streams (`/v1/system/firehose`, `/v1/system/health/live`, `/v1/time-travel/stream`) and processes UI events.
- **`src/lib/api.ts` (Authoritative Client API):**
  - Type-safe fetch bindings for all `raqim-core` HTTP endpoints with structured error handling.
- **Key UI Modules:**
  - **`DagCanvas` & `TopologyCanvas`:** Visualizes CRDT namespace shards and renders animated A2A message routing edges using XYFlow.
  - **`TemporalRouter` (`StepScrubberDeck`, `PhantomTerminal`, `WasmHypervisorPanel`):** Provides step-by-step timeline scrubbing, state diffing, and execution controls for `phantom_` simulation branches.
  - **`AegisClientLayout` (`TokenBucketGauges`, `QuarantineTable`, `CaMintStation`):** Displays live rate-limiting token levels and manages quarantined agents.
  - **`VaultClientLayout` (`MerkleProofInspector`, `UnifiedSearchWorkbench`):** Supports interactive verification of Merkle proofs and semantic search exploration across storage tiers.

---

## 9. End-to-End Execution Lifecycles

### 9.1 Ingress to Cascade Lifecycle

```
[Agent / SDK]
      | (rkyv IngressEnvelope: intent_path, public_key, signature, state_bytes, cert)
      v
[TCP Server (Port 8080)]
      |
      v
[Aegis GateKeeper]
      |-- 1. Verify Session Lineage against Master Public Key
      |-- 2. Verify Anti-Replay Timestamp (|T_p - T_s| <= 30s)
      |-- 3. Verify Ed25519 Packet Signature
      |-- 4. Check Group Policy Namespace Access Rules
      `-- 5. Consume Rate Limiter Token (AtomicTokenBucket CAS)
      |
      v (Authorization Passed)
[execute_raqim_cascade]
      |
      +---> 1. Loro CRDT Shard: Append thought to namespace timeline map & export delta
      +---> 2. Axon Merkle DAG: Hash leaf (BLAKE3) & append to active tree buffer
      +---> 3. Nucleus WAL: Send OpLog to background group-commit queue (2ms / 6k batch)
      +---> 4. Iceoryx2 Cortex: Publish rkyv bytes to shared-memory zero-copy IPC
      +---> 5. Zenoh Network: Broadcast OpLog across P2P mesh
      `---> 6. Axum API: Emit ThoughtCommitted event to SSE Firehose
```

---

### 9.2 Agent-to-Agent (A2A) RPC Query Flow

```
[Agent A (Requester)]                    [raqim-core Daemon]                  [Agent B (Responder)]
        |                                         |                                     |
        |--- 1. AskQuestion (WS /v1/mcp/ws) ---->|                                     |
        |    (Signed question + cert)             |                                     |
        |                                         |-- 2. Aegis Verification             |
        |                                         |-- 3. Seal Tx_ask in WAL/Merkle      |
        |                                         |-- 4. Dispatch Zenoh Query --------->|
        |                                         |      (Key: .../a2a/{capability})    |
        |                                         |                                     |-- 5. Execute AI logic
        |                                         |<-- 6. Reply over Zenoh Queryable --|
        |                                         |      (Signed answer)                |
        |                                         |-- 7. Seal Tx_reply in WAL/Merkle    |
        |                                         |-- 8. Emit A2aMessageRouted to SSE   |
        |<-- 9. QuestionAnswered (WebSocket) ----|                                     |
        |    (Coroutines resume execution)        |                                     |
```

---

### 9.3 Deterministic Replay & Universe Branching

```
[Replay Run: @raqim.trace]
            |
            v
[CanonicalSerializer: Extract Function Signature + Canonical JSON Arguments]
            |
            v
[Compute 32-Byte BLAKE3 Signature Hash (Context: raqim.effect.v1.signature)]
            |
            v
[Query Daemon: POST /v1/effect/get (agent_hex, step_ordinal, call_signature_hex)]
            |
    +-------+-------+
    |               |
(Found in WAL)   (Missing / Code Changed)
    |               |
    v               v
[Return Cached]  [Trigger Divergence Handling: on_divergence="fork"]
[$0 API Cost]       |
                    v
                 [Switch Agent Mode: REPLAY -> LIVE]
                 [Branch Namespace: phantom_{namespace}_{agent_hex}_step{step}]
                 [Restore Memory Snapshot via Wasmtime Linear Memory Injection]
                 [Execute Modified Code Live]
                 [Commit New Branch to WAL, Axon Merkle DAG & SSE Streams]
```

---

### 9.4 Autonomous 2PC Compaction & WORM Witness Anchoring

```
[Background Compactor Loop]
            | (Triggered by 1GB WAL threshold or 24h timer)
            v
[1. Send WalCommand::Rotate to WalEngine]
            | (WalEngine seals active file -> renames to production.wal.<timestamp>)
            v
[2. Write CompactionManifest (State: PENDING)]
            |
            v
[3. Decode 16-byte Aligned OpLog Batches + Verify CRC32 Checksums]
            |
            v
[4. Compute Vector Embeddings (FastEmbed BGE-Base / OpenAI Large)]
            |
            v
[5. Ingest RecordBatch into LanceDB agent_history Table]
            |
            v
[6. Write CompactionManifest (State: COMMITTED)]
            |
            +---> Delete Rotated WAL Segment & Clear Manifest
            +---> Evict Archived Entries from HotVectorBuffer Ring Buffer
            `---> Emit SystemEvent::CompactionTriggered
            |
            v
[7. WormWitnessEngine: Anchor Crystallized Merkle Root (1,024 leaves)]
            |
            +---> Sign Witness Payload with Master Private Key (Ed25519)
            +---> Write Bundle Block to ./vault/witnesses/batch_{id}.json
            +---> Apply Linux Kernel Immutability (chattr +i)
            `---> Replicate to Cloud WORM Bucket (Optional)
```

---

## 10. Architectural Invariants & Engineering Reference

| Layer / Invariant | Technical Rule / Standard | Primary Code Implementation |
| :--- | :--- | :--- |
| **Zero-Copy Memory Alignment** | `rkyv` structs containing 128-bit fields (`transaction_id: u128`) require 16-byte alignment (`rkyv::util::AlignedVec<16>`) before deserialization. | [`lib.rs`](file:///wsl.localhost/Ubuntu-22.04/home/muhammad/projects/raqim/synapse/raqim-core/src/lib.rs), [`nucleus.rs`](file:///wsl.localhost/Ubuntu-22.04/home/muhammad/projects/raqim/synapse/raqim-core/src/nucleus.rs), [`compactor.rs`](file:///wsl.localhost/Ubuntu-22.04/home/muhammad/projects/raqim/synapse/raqim-core/src/compactor.rs) |
| **Domain-Separated Cryptography** | Distinct BLAKE3 contexts for identity (`raqim.agent.v1.identity`), Merkle leaves (`raqim.axon.v1.leaf`), nodes (`raqim.axon.v1.node`), and effect signatures (`raqim.effect.v1.signature`). | [`axon.rs`](file:///wsl.localhost/Ubuntu-22.04/home/muhammad/projects/raqim/synapse/raqim-core/src/axon.rs), [`api.rs`](file:///wsl.localhost/Ubuntu-22.04/home/muhammad/projects/raqim/synapse/raqim-core/src/api.rs), [`client.py`](file:///wsl.localhost/Ubuntu-22.04/home/muhammad/projects/raqim/synapse/raqim-py/raqim/client.py) |
| **Lock-Free Rate Limiting** | `AtomicTokenBucket` relies on relaxed atomic loads and compare-and-swap (CAS) loops on `AtomicU64` to prevent lock poisoning and eliminate thread blocking. | [`aegis.rs`](file:///wsl.localhost/Ubuntu-22.04/home/muhammad/projects/raqim/synapse/raqim-core/src/aegis.rs) |
| **Zero Lock Contention CRDTs** | `SwarmStateRegistry` uses two-pass speculative allocation to manage Loro document shards without holding global write locks during document allocation. | [`state.rs`](file:///wsl.localhost/Ubuntu-22.04/home/muhammad/projects/raqim/synapse/raqim-core/src/state.rs) |
| **Group Commit Durability** | `WalEngine` batches up to 6,000 entries (or flushes after 2ms), using CRC32 checksums and physical `file.sync_data()` calls to protect against torn frames. | [`nucleus.rs`](file:///wsl.localhost/Ubuntu-22.04/home/muhammad/projects/raqim/synapse/raqim-core/src/nucleus.rs) |
| **2PC Storage Boundary** | `WalCompactor` tracks segment transitions via atomic manifest writes (`Pending` $\rightarrow$ `Committed`) to guarantee crash resilience during WAL-to-LanceDB migration. | [`compactor.rs`](file:///wsl.localhost/Ubuntu-22.04/home/muhammad/projects/raqim/synapse/raqim-core/src/compactor.rs) |
| **Immutable Proof Anchoring** | 1,024-leaf Merkle roots are signed with Ed25519 master keys, written to append-only storage, and locked with Linux kernel `chattr +i` attributes. | [`witness.rs`](file:///wsl.localhost/Ubuntu-22.04/home/muhammad/projects/raqim/synapse/raqim-core/src/witness.rs), [`axon.rs`](file:///wsl.localhost/Ubuntu-22.04/home/muhammad/projects/raqim/synapse/raqim-core/src/axon.rs) |
| **Deterministic Side-Effect Replay** | Tool executions are cached by signature hash. Deterministic replays bypass external API invocations ($0 cost), auto-branching into `phantom_` namespaces on code divergence. | [`memory_router.rs`](file:///wsl.localhost/Ubuntu-22.04/home/muhammad/projects/raqim/synapse/raqim-core/src/memory_router.rs), [`client.py`](file:///wsl.localhost/Ubuntu-22.04/home/muhammad/projects/raqim/synapse/raqim-py/raqim/client.py) |
| **Zero-Trust Network Perimeter** | All A2A queries verify lineage certificates, validate anti-replay timestamps ($\pm 30\text{s}$), check Ed25519 signatures, and log causal Merkle links for asks and replies. | [`network.rs`](file:///wsl.localhost/Ubuntu-22.04/home/muhammad/projects/raqim/synapse/raqim-core/src/network.rs), [`aegis.rs`](file:///wsl.localhost/Ubuntu-22.04/home/muhammad/projects/raqim/synapse/raqim-core/src/aegis.rs), [`api.rs`](file:///wsl.localhost/Ubuntu-22.04/home/muhammad/projects/raqim/synapse/raqim-core/src/api.rs) |
