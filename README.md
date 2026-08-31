<div align="center">

# RAQIM OS

### Sovereign Flight Recorder & Deterministic Replay Engine for AI Agent Swarms

[![CI/CD Release](https://github.com/raqim-ai/raqim/actions/workflows/release.yml/badge.svg)](https://github.com/raqim-ai/raqim/actions)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Throughput](https://img.shields.io/badge/Engine_Throughput-105k+_TPS-emerald.svg)](#benchmarks)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB.svg?logo=python&logoColor=white)](https://pypi.org/project/raqim/)
[![Docker](https://img.shields.io/badge/Docker_Image-35MB-2496ED.svg?logo=docker&logoColor=white)](https://github.com/raqim-ai/raqim/pkgs/container/core)

[Quickstart](#quickstart) • [Architecture](#system-architecture) • [Benchmarks](#benchmarks) • [Console UI](#mission-control-console) • [Python SDK](#python-sdk-integration)

</div>

---

## What is Raqim?

Current AI agent frameworks (LangChain, CrewAI, AutoGen) store non-deterministic decisions in volatile RAM or standard SQL databases. When an agent hallucinates, performs an unauthorized action, or fails in production, diagnosing the root cause requires paying for duplicate API calls and guessing historical execution state.

**Raqim** is an operating system substrate built in Rust that acts as a **Cryptographic Flight Recorder**. It records every agent action, tool call, and state transition to an append-only, zero-copy Write-Ahead Log (WAL) backed by an in-memory BLAKE3 Merkle DAG.

### Core Capabilities

- **105,000+ TPS Ingress:** Zero-copy binary serialization (`rkyv`) with 2ms hardware `io_uring`/NVMe flush barriers.
- **$0 Deterministic Replay:** Re-run historical agent workflows from local disk in $<1\text{ms}$ with zero token charges.
- **Reality Forking:** Branch execution into isolated `phantom_` CRDT state shards when prompts or logic diverge during debugging.
- **Aegis Security Perimeter:** Kernel-level Ed25519 signature checks, namespace access control, and dynamic rate-limiting.
- **$O(\log N)$ Cryptographic Inclusion Proofs:** Generate self-contained mathematical proofs for any transaction to satisfy regulatory compliance.

---

## System Architecture

                   INCOMING AGENT THOUGHT / ACTION
                                  │
                                  ▼
                    ┌───────────────────────────┐
                    │   AEGIS SECURITY GATE     │
                    │   - Ed25519 Verification  │
                    │   - Token-Bucket Quotas   │
                    └─────────────┬─────────────┘
                                  │ (Authorized)
                                  ▼
           ┌─────────────────────────────────────────────┐
           │              RAQIM CASCADE                  │
           ├──────────────────────┬──────────────────────┤
           │                      │                      │
           ▼                      ▼                      ▼
  ┌─────────────────┐   ┌──────────────────┐   ┌──────────────────┐
  │ NUCLEUS WAL     │   │ AXON MERKLE DAG  │   │ LORO CRDT MEMORY │
  │ Zero-Copy NVMe  │   │ O(log N) Proofs  │   │ Conflict-Free    │
  │ Append-Only Log │   │ BLAKE3 SIMD Tree │   │ Graph Sharding   │
  └─────────────────┘   └──────────────────┘   └──────────────────┘

---

## Quickstart

### 1. Launch the Core Daemon

Run the containerized engine with local volume persistence:

```bash
docker run -d \
  --name raqim-core \
  -p 8080:8080 \
  -p 8081:8081 \
  -v ./data:/var/lib/raqim/data \
  ghcr.io/raqim-ai/raqim/core:latest
The daemon initializes:Port 8080: Raw TCP Zero-Copy Ingress Firehose.Port 8081: Axum HTTP Administrative Control Plane & Live SSE Firehose.2. Python SDK IntegrationInstall the client:Bashpip install raqim
Decorate your LLM pipelines or tool invocations with @client.trace:Pythonimport asyncio
import os
from google import genai
from raqim import RaqimClient

# 1. Initialize client in record mode
client = RaqimClient(
    alias="fraud_analyst",
    tenant="production",
    private_key_path="./ca-keys/swarm_master.key",
    mode="record",  # Switch to 'replay' for $0 execution!
)

ai = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# 2. Decorate execution steps
@client.trace(namespace="/finance/sanctions")
async def screen_transaction(account_id: str, amount: float) -> dict:
    response = ai.models.generate_content(
        model="gemini-2.5-flash",
        contents=f"Evaluate sanctions risk for account {account_id} with transfer amount ${amount}."
    )
    return {"account": account_id, "amount": amount, "analysis": response.text}

async def main():
    await client.boot()
    result = await screen_transaction("ACC-9821", 9950.00)
    print("[AGENT RESULT]:", result)

if __name__ == "__main__":
    asyncio.run(main())
BenchmarksMeasured on standard consumer hardware (Intel Core i7, NVMe PCIe Gen 4 SSD):MetricResultSystem SignificancePeak Ingress Velocity105,240 TPSExceeds standard payment network throughputMedian Tail Latency ($p_{50}$)$2\,\mu\text{s}$Sub-microsecond memory-mapped pointer handoffRecovery Ingestion (Phoenix)500,000 logs in $<1.5\text{s}$16-byte aligned binary WAL hydrationDeterministic Replay$<0.3\text{ms}$Zero network latency; loads directly from diskMission Control Consoleraqim-console provides live cluster observability:Bashcd raqim-console
npm install && npm run dev
Dashboard: Real-time ingestion counters, live SSE thought streams, and hardware RSS memory gauges.Topology: Loro CRDT memory shard mapping across swarm namespaces.Aegis Governance: Active quarantine perimeters, rate-limit buckets, and capability minting.Time Travel / Replay: Causal decision tree visual scrubbing and side-by-side state diffs.LicenseRaqim is open-source software licensed under the Apache License 2.0.