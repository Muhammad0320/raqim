"use client";

import React from 'react';
import { DynamicCodeBlock } from "@/components/docs/DynamicCodeBlock";
import { RequiresEnterprise } from "@/components/docs/RequiresEnterprise";
import { 
  ArticleWrapper, CategoryTag, MainTitle, LeadParagraph, 
  ContentSection, SectionTitle, Paragraph, InlineCode, 
  HighlightCode, EmphasizedText, UnorderedList, ListItem,
  EnterpriseBox, SectionSubtitle
} from './styles';

export default function TemporalRouterPage() {
  const pythonCode = `def reality_reseed_hook(new_system_prompt: str):
    print(f"[OS DIRECTIVE]: {new_system_prompt}")
    llm_memory.clear() # Memory wiped. Reality reset.

agent.register_eviction_hook(reality_reseed_hook)`;

  return (
    <ArticleWrapper>
      <div>
        <CategoryTag>Core Systems</CategoryTag>
        <MainTitle>Temporal Router</MainTitle>
        <LeadParagraph>
          The deterministic engine for Agentic Time Travel. The Temporal Router allows you to fork reality 
          at the WASI layer, executing isolated <code>git checkout -b phantom_fork</code> operations against live 
          agent memory state without polluting the global Swarm topology.
        </LeadParagraph>
      </div>

      <div>
        <ContentSection id="philosophy">
          <SectionTitle>The Philosophy: Git for AI State</SectionTitle>
          <Paragraph>
            Traditional agent architectures treat LLM context windows as mutable, append-only streams. If an agent hallucinates 
            or corrupts its ledger, recovering the system requires a hard restart, devastating global consensus.
          </Paragraph>
          <Paragraph>
            Raqim OS conceptualizes the live Swarm CRDT as the <EmphasizedText>main branch</EmphasizedText>. 
            When you invoke Time Travel, the Temporal Router executes a physical <InlineCode>git checkout -b phantom_fork &lt;tx_id&gt;</InlineCode>. 
            It spins up an isolated, detached memory state. The phantom agent operates perfectly within this simulation, 
            executing speculative transactions that mathematically cannot pollute the live network.
          </Paragraph>
        </ContentSection>

        <ContentSection id="wasi-boundary">
          <SectionTitle>The WASI Boundary: Reality Forking</SectionTitle>
          <Paragraph>
            Raqim achieves true isolation at the OS layer by utilizing Wasmtime's <InlineCode>WasiP1Ctx</InlineCode>. 
            We do not rely on fragile application-level logic to simulate memory separation.
          </Paragraph>
          <Paragraph>
            When an admin injects <InlineCode>env_overrides</InlineCode>, the Temporal Router intercepts the instruction. 
            It physically mutates the OS-level environment variables presented to the WASM sandbox during instantiation. 
            The agent wakes up under the absolute illusion of a new reality—complete with alternate database URIs or 
            mocked API endpoints—without requiring a daemon reboot or disrupting the parent process.
          </Paragraph>
          
          <SectionSubtitle>The Zenoh Control Plane: Out-of-Band Eviction</SectionSubtitle>
          <Paragraph>
            External SDKs hold memory in their own process. To cure a hallucinating Python agent, Raqim fires a highly-privileged <code>SystemCommand::EvictContext</code> down an Out-of-Band (OOB) Zenoh topic (<code>raqim/tenant/control/agent_hex</code>). The SDK intercepts this bypassing the LLM, triggering a developer-defined <code>_reality_fork_hook</code> to instantly wipe the local array.
          </Paragraph>
        </ContentSection>

        <ContentSection id="cryptographic-xor">
          <SectionTitle>Mathematical Isolation: The Cryptographic XOR</SectionTitle>
          <Paragraph>
            If a phantom agent attempts to dial out to the Zenoh A2A Mesh, how do we prevent the Aegis Firewall from authenticating 
            its packets as the live agent?
          </Paragraph>
          <Paragraph>
            We implement a strict Cryptographic XOR. During the fork, the Temporal Router intercepts the agent's 32-byte Ed25519 public key. 
            Before deriving the 16-byte <InlineCode>Agent ID</InlineCode>, we apply a bitwise XOR mutation using a cryptographic salt 
            unique to that specific <InlineCode>tx_id</InlineCode>.
          </Paragraph>
          <UnorderedList>
            <ListItem>The phantom sandbox derives an <InlineCode>Agent ID</InlineCode> that is mathematically distinct from the live network.</ListItem>
            <ListItem>Any outbound packets are instantly dropped by the Aegis Interdiction Engine as "Unverified Topology".</ListItem>
            <ListItem>Complete mathematical quarantine is achieved in 0.004 milliseconds.</ListItem>
          </UnorderedList>
        </ContentSection>

        <ContentSection id="telemetry-stream">
          <SectionTitle>The Telemetry Stream</SectionTitle>
          <Paragraph>
            To prevent dashboard hallucination, the phantom WASM module's <InlineCode>stdout</InlineCode> and logging buffers 
            are physically re-routed at the hypervisor level.
          </Paragraph>
          <Paragraph>
            Thoughts generated by the phantom agent are streamed exclusively to a completely isolated <HighlightCode>phantom_event_tx</HighlightCode> SSE channel. 
            This allows system administrators to monitor the speculative timeline in real-time, observing the butterfly effect of 
            their <InlineCode>env_overrides</InlineCode>, entirely decoupled from the production telemetry rollups.
          </Paragraph>
        </ContentSection>

        <ContentSection id="configuration">
          <SectionTitle>Reality Fork Configuration</SectionTitle>
          <Paragraph>
            Configuring a Reality Fork requires binding your application-level LLM memory arrays to the Raqim OS Control Plane.
          </Paragraph>

          <RequiresEnterprise>
            <EnterpriseBox>
              <SectionSubtitle>Enterprise Reality Overrides</SectionSubtitle>
              <Paragraph>
                As an Enterprise user, you can register custom <InlineCode>eviction_hooks</InlineCode> that execute precisely when the 
                Temporal Router triggers a memory reseed. This allows you to surgically overwrite the agent's system prompt 
                without rebooting the Python interpretor.
              </Paragraph>
              
              <DynamicCodeBlock 
                codeTemplate={pythonCode} 
                language="Python" 
              />
              
              <Paragraph style={{ marginTop: '1rem' }}>
                When <InlineCode>WasiP1Ctx</InlineCode> signals an environment shift, Raqim invokes your hook via Zenoh RPC, 
                flushing the memory buffer and cementing the new reality into the LLM's context window.
              </Paragraph>
            </EnterpriseBox>
          </RequiresEnterprise>
        </ContentSection>
      </div>
    </ArticleWrapper>
  );
}
