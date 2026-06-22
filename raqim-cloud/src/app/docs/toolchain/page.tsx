"use client";

import React from 'react';
import { DynamicCodeBlock } from "@/components/docs/DynamicCodeBlock";
import { ToolchainTopology } from "@/components/docs/ToolchainTopology";
import { 
  ArticleWrapper, CategoryTag, MainTitle, LeadParagraph, 
  ContentSection, SectionTitle, Paragraph, InlineCode, 
  CardGrid, NextStepCard, CardTitle, CardDesc
} from './styles';

export default function ToolchainPage() {
  const forgeCode = `$ raqim keys forge --name finance_node --group finance_worker --count 3 --env external

Bismillah. Initiating Sovereign Fleet Forge... 
Target Group [finance_worker] 
Requested Size [3]
Environmental Scope [external]

  [OK] Forged Agent: finance_node_01 -> 8f3a9b2c...
  [OK] Forged Agent: finance_node_02 -> 4e1d7f6a...
  [OK] Forged Agent: finance_node_03 -> d8cd98f0...

✅ Fleet Forge Complete. Successfully generated 3/3 secure artifacts in ./vault/identities`;

  const clusterInfoCode = `$ raqim cluster info

📡 Raqim Swarm Cluster Information:
  Active Nodes: 3
  Cluster ID: swarm_recon_0991
  License Tier: ENTERPRISE
  Gossip Protocol: Zenoh (Active)`;

  const topologyCode = `$ raqim cluster topology --license {{LICENSE_KEY}}

🧠 Allocated Swarm Brain Shards (Loro Documents): 
  Shard Space Namespace: [/finance/ledger]
  Active Peer Timelines: 14
  Total Memory Size: 143,872 bytes`;

  const aegisListCode = `$ raqim aegis list
🔒 Active Quarantine Perimeters (Blocklisted Hashes):
   -> 8f3a9b2c4e1d7f6a`;

  const timeTravelCode = `$ raqim time-travel --agent-id 8f3a9b2c4e1d7f6a --tx-id 1780842242 --fork-config override.json
⌛ Initializing Time Travel for 8f3a9b... to TxID 1780842242...
⚡ Isolation Matrix Deployed. Replay Successfully forked onto independent thread.`;

  return (
    <ArticleWrapper>
      <div>
        <CategoryTag>Toolchain</CategoryTag>
        <MainTitle>Altitude 2.5: The Toolchain & CLI</MainTitle>
        <LeadParagraph>
          Raqim is not a toy framework; it is bare-metal infrastructure. To understand the toolchain, we will build a narrative: Deploying a Global Financial Reconciliation Swarm. We will provision the cryptographic identities, boot the nodes, and observe the cluster memory using the raqim administrative CLI.
        </LeadParagraph>
      </div>

      <ToolchainTopology />

      <div>
        <ContentSection id="fleet-provisioning">
          <SectionTitle>Cryptographic Fleet Provisioning</SectionTitle>
          <Paragraph>
            We do not manually type out configs. We forge them. Every node or agent operating in the Swarm requires cryptographic identity bounds to pass Aegis Firewall handshakes.
          </Paragraph>
          <Paragraph>
            Using the <InlineCode>keys forge</InlineCode> CLI sub-command, the CA builds three unique cryptographic envelopes, generating ready-to-mount secrets and certificates immediately.
          </Paragraph>
          <DynamicCodeBlock 
            codeTemplate={forgeCode} 
            language="bash" 
          />
        </ContentSection>

        <ContentSection id="swarm-observability">
          <SectionTitle>Swarm Observability</SectionTitle>
          <Paragraph>
            Headless administration demands zero-dashboard console transparency. We query the daemon directly via local IPC sockets to assert peer health and partition topologies.
          </Paragraph>
          <Paragraph>
            Use <InlineCode>raqim cluster info</InlineCode> to fetch the high-level health of active nodes, network links, and active licensing bounds.
          </Paragraph>
          <DynamicCodeBlock 
            codeTemplate={clusterInfoCode} 
            language="bash" 
          />
          <Paragraph className="mt-6">
            To view individual brain shard state, database size metrics, and timeline depths for specific document namespaces, execute the <InlineCode>cluster topology</InlineCode> command.
          </Paragraph>
          <DynamicCodeBlock 
            codeTemplate={topologyCode} 
            language="bash" 
          />
        </ContentSection>

        <ContentSection id="aegis-diagnostics">
          <SectionTitle>Aegis Diagnostics & Time Travel</SectionTitle>
          <Paragraph>
            When an agent malfunctions, exhibits erratic trading behavior, or triggers firewall alerts, operators must coordinate containment immediately.
          </Paragraph>
          <Paragraph>
            Query <InlineCode>raqim aegis list</InlineCode> to check for active perimeters and retrieve the blocklisted public key hashes quarantined by local node daemons.
          </Paragraph>
          <DynamicCodeBlock 
            codeTemplate={aegisListCode} 
            language="bash" 
          />
          <Paragraph className="mt-6">
            Once isolated, clone the rogue memory workspace onto a sandboxed thread using the <InlineCode>time-travel</InlineCode> utility. This forks the environment configuration to debug the exact transaction history.
          </Paragraph>
          <DynamicCodeBlock 
            codeTemplate={timeTravelCode} 
            language="bash" 
          />
        </ContentSection>

        <ContentSection id="sdk-handoff" className="mt-16 border-t border-zinc-800/80 pt-12">
          <SectionTitle>Next Steps: Writing Agent Logic</SectionTitle>
          <Paragraph>
            With the identities forged and commands understood, choose your integration route to build and run agent models.
          </Paragraph>
          <CardGrid>
            <NextStepCard href="/docs/toolchain/rust-sdk">
              <CardTitle>
                <span>Vector 1: The Rust WASM SDK (In-Process)</span>
                <span className="text-[#00E5FF]">→</span>
              </CardTitle>
              <CardDesc>
                Run in-process inside the Raqim hypervisor with zero-latency casts, memory alignment, and absolute sandbox isolation.
              </CardDesc>
            </NextStepCard>

            <NextStepCard href="/docs/toolchain/external-sdk">
              <CardTitle>
                <span>Vector 2 & 3: Python SDK & MCP Bridge</span>
                <span className="text-[#00E5FF]">→</span>
              </CardTitle>
              <CardDesc>
                Interact out-of-process via secure TCP loops, Zenoh control channels, and synapse-mcp translation hosts.
              </CardDesc>
            </NextStepCard>
          </CardGrid>
        </ContentSection>
      </div>
    </ArticleWrapper>
  );
}
