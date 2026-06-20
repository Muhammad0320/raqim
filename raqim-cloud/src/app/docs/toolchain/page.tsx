"use client";

import React from 'react';
import { DynamicCodeBlock } from "@/components/docs/DynamicCodeBlock";
import { ToolchainTopology } from "@/components/docs/ToolchainTopology";
import { 
  ArticleWrapper, CategoryTag, MainTitle, LeadParagraph, 
  ContentSection, SectionTitle, Paragraph, InlineCode, 
  EmphasizedText, UnorderedList, ListItem
} from './styles';

export default function ToolchainPage() {
  const cliCode = `$ raqim-cli keys forge --name finance_node --group finance_worker --count 3 --env external

Bismillah. Initiating Sovereign Fleet Forge...
Target Group : [finance_worker]
Requested Size : [3] Nodes
Environment Scope : [external]

  [OK] Certified Node Provisioned: finance_node_01 -> 8f3a9b2c...
  [OK] Certified Node Provisioned: finance_node_02 -> 4e1d7f6a...
  [OK] Certified Node Provisioned: finance_node_03 -> d8cd98f0...

✅ Fleet Forge Completed. Generated 3/3 secure identities inside ./vault/identities`;

  const wasmCompileCode = `# Compile your agent to standard WASI architecture
cargo build --target wasm32-wasi --release

# The resulting binary is a completely isolated module
# ready to be executed in-process by the Raqim OS hypervisor.`;

  const telemetryCode = `$ raqim-cli cluster topology --license {{LICENSE_KEY}}

🧠 Allocated Swarm Brain Shards (Loro Documents):
  Shard Space Namespace: [/finance/ledger]
    Active Peer Timelines: 14
    Total Memory Size    : 143,872 bytes`;

  return (
    <ArticleWrapper>
      <div>
        <CategoryTag>Toolchain</CategoryTag>
        <MainTitle>Altitude 2.5: The Toolchain</MainTitle>
        <LeadParagraph>
          A highly deterministic, cryptographically isolated runtime for distributed AI agents. 
          The Raqim Toolchain provides the precise integration vectors required to orchestrate both 
          in-process hypervisor components and out-of-process daemon architectures.
        </LeadParagraph>
      </div>

      <ToolchainTopology />

      <div>
        <ContentSection id="fleet-forge">
          <SectionTitle>The Sovereign Fleet Forge (CLI)</SectionTitle>
          <Paragraph>
            Every agent deployed in the Raqim Swarm requires absolute cryptographic isolation. 
            Raqim abandons manual, one-off key generation for batch Certificate Authority (CA) minting at the network edge.
          </Paragraph>
          <Paragraph>
            Using the <InlineCode>raqim-cli keys forge</InlineCode> utility, operators batch-provision node credentials directly. 
            The Swarm Master CA generates and signs capabilities, packaging them into deterministic 16-byte identities 
            stored securely inside local cryptographic storage.
          </Paragraph>
          
          <DynamicCodeBlock 
            codeTemplate={cliCode} 
            language="bash" 
          />
        </ContentSection>

        <ContentSection id="paradigm-shift">
          <SectionTitle>The In-Process vs. Out-of-Process Paradigm</SectionTitle>
          <Paragraph>
            Raqim OS fundamentally segregates agent execution environments into two distinct physical topologies. 
            Understanding the distinction is critical for system reliability during high-stress Reality Forks.
          </Paragraph>

          <h3 style={{ color: '#fff', fontSize: '1.25rem', marginTop: '2rem', marginBottom: '1rem', fontWeight: 500 }}>
            Vector 1: The WASM SDK (In-Process)
          </h3>
          <Paragraph>
            For maximum performance, Rust agents utilize the WASM SDK and run directly <EmphasizedText>in-process</EmphasizedText> within the Raqim OS WASI sandbox.
          </Paragraph>
          <Paragraph>
            Because WASM runs natively inside the Raqim hypervisor, Reality Forking occurs with zero network latency. The OS physically drops the linear memory block and injects a historical snapshot in microseconds.
          </Paragraph>
          
          <DynamicCodeBlock 
            codeTemplate={wasmCompileCode} 
            language="bash" 
          />

          <h3 style={{ color: '#fff', fontSize: '1.25rem', marginTop: '2.5rem', marginBottom: '1rem', fontWeight: 500 }}>
            Vector 2: The Python SDK (Out-of-Process)
          </h3>
          <Paragraph>
            Python environments cannot natively run inside our WASM hypervisor. Thus, the Python SDK runs entirely <EmphasizedText>out-of-process</EmphasizedText>.
          </Paragraph>
          <Paragraph>
            External SDKs communicate over two sovereign channels: The TCP Data Plane for zero-copy CRDT ingestion, and the Zenoh Control Plane. When Aegis mandates a reality reseed, it bypasses the LLM execution loop entirely, firing a cryptographic command down the Zenoh mesh to physically wipe the Python array.
          </Paragraph>
        </ContentSection>

        <ContentSection id="mcp-bridge">
          <SectionTitle>Vector 3: The MCP Bridge</SectionTitle>
          <Paragraph>
            The MCP Bridge (<InlineCode>synapse-mcp</InlineCode>) represents our third integration vector. 
            It is imperative to understand that <EmphasizedText>synapse-mcp is not an SDK</EmphasizedText>.
          </Paragraph>
          <Paragraph>
            Instead, it is a standardized Model Context Protocol (MCP) translation layer. It acts as an external server 
            that allows commercial AI environments—such as Claude or Cursor IDE—to natively leverage the Raqim OS as an injected context tool. 
            The commercial AI pipes inputs to the MCP Server, which bridges the gap to the Raqim Core via secure TCP sockets, 
            allowing external systems to perform read/write operations against the Swarm memory matrix.
          </Paragraph>
        </ContentSection>

        <ContentSection id="cluster-observability">
          <SectionTitle>Headless Cluster Observability</SectionTitle>
          <Paragraph>
            During network partitions, enterprise operators cannot rely on web dashboards. Raqim-CLI delivers low-level diagnostics 
            straight from local loops.
          </Paragraph>
          <Paragraph>
            Operators can run the <InlineCode>cluster topology</InlineCode> utility to audit memory allocations, inspect active timelines, 
            and assert direct synchronization status of Loro CRDT document shards across the swarm.
          </Paragraph>
          
          <DynamicCodeBlock 
            codeTemplate={telemetryCode} 
            language="bash" 
          />
        </ContentSection>
      </div>
    </ArticleWrapper>
  );
}
