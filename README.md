# Raqim Synapse (`core/lean-mvp`)

**Raqim Synapse** is a sovereign, self-hosted multi-agent runtime kernel designed for zero-trust agent execution, cryptographic identity, and real-time state synchronization across bare-metal environments.

> **Archived Enterprise Surface**: For the full multi-tenant SaaS architecture (Stripe billing, Supabase org management, RSA license gating, and cloud portal), refer to the archived tag [`v0-full-vision`](https://github.com/Muhammad0320/raqim/tree/v0-full-vision) or branch [`archive/full-enterprise-vision`](https://github.com/Muhammad0320/raqim/tree/archive/full-enterprise-vision).

---

## Core Capabilities (`core/lean-mvp`)

- **Aegis Cryptographic Identity & ACL Engine**: Ed25519 Swarm Master Key root of trust, signed capability certificates, and out-of-band context eviction/interdiction.
- **Nucleus WAL & Loro CRDT State Engine**: High-performance write-ahead logging (WAL) paired with Loro CRDT memory stores for conflict-free state resolution across agent nodes.
- **Deterministic Replay & Time Travel**: Replay agent thought streams and fork past states using Merkle/Axon hash chains.
- **Wasmtime Sandbox Engine**: Isolated WASM runtime for executing untrusted agent tools and plugins safely.
- **Zenoh Peer-to-Peer Swarm Networking**: Zero-copy IPC telemetry (via iceoryx2) and low-latency p2p networking across distributed agents.

---

## Workspace Structure

```
+-- raqim-core          # Rust Monolith (Nucleus WAL, Loro CRDT, Aegis Security, Wasmtime)
+-- raqim-cli           # Developer CLI for swarm management & node operations
+-- raqim-mcp           # Model Context Protocol (MCP) gateway
+-- raqim-agent-sdk     # Rust SDK for building sovereign agents
+-- raqim-py            # Native Python C-extensions (PyO3)
+-- raqim-siege         # High-concurrency load testing & benchmark suite
+-- raqim-tui           # Terminal User Interface for live swarm observability
+-- raqim-console       # Local Next.js operational dashboard
+-- ca-keys/            # Local Swarm Master Ed25519 key storage
```

---

## Quick Start

### Build & Test Core Workspace
```bash
cargo build --workspace
cargo test --workspace
```

### Run the Raqim Core Daemon
```bash
cargo run --bin raqim-core
```
