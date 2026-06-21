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
  const pythonCode = `def _reality_fork_hook(new_system_prompt: str):
    # Received command via Out-of-Band (OOB) Zenoh topic: raqim/tenant/control/agent_hex
    print(f"[OS DIRECTIVE]: {new_system_prompt}")
    llm_memory.clear() # Memory wiped. Reality reset.

agent.register_eviction_hook(_reality_fork_hook)`;

  const forkConfigRustCode = `#[derive(Serialize, Deserialize, Clone)]
pub struct ForkConfig {
    pub override_seed: Option<u64>,
    pub env_overrides: HashMap<String, String>,
    pub inject_network: Option<Vec<u8>>, // Mock external API calls
}`;

  const xorRustCode = `// Derive a 16-byte salt directly from the target Transaction ID
let tx_id_bytes = target_tx_id.unwrap_or(0).to_be_bytes();
let mut salt = [0u8; 16];
salt[0..8].copy_from_slice(&tx_id_bytes);
salt[8..16].copy_from_slice(&tx_id_bytes);

// Apply the bitwise XOR mutation against the live Agent ID
for i in 0..16 {
    phantom_bytes[i] ^= salt[i];
    phantom_bytes[i] ^= 0xFF; 
}`;

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
            A CRDT is an append-only Merkle DAG. You cannot 'undo' or delete a hallucinated thought once it achieves global consensus. The Temporal Router is not a database rollback—it is a forensic execution sandbox. It allows you to fork an agent's memory at a specific <InlineCode>tx_id</InlineCode>, mutate its environment, and observe its alternate execution path. To correct the live Swarm, the fixed agent must issue a compensating transaction.
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

          <DynamicCodeBlock 
            codeTemplate={forkConfigRustCode} 
            language="rust" 
          />
          
          <div className="mt-8">
            <SectionSubtitle>The Zenoh Control Plane: Out-of-Band Eviction</SectionSubtitle>
            <Paragraph>
              External SDKs hold memory in their own process. To cure a hallucinating Python agent, Raqim fires a highly-privileged <code>SystemCommand::EvictContext</code> down an Out-of-Band (OOB) Zenoh topic (<code>raqim/tenant/control/agent_hex</code>). The SDK intercepts this bypassing the LLM, triggering a developer-defined <code>_reality_fork_hook</code> to instantly wipe the local array.
            </Paragraph>
          </div>
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

          <DynamicCodeBlock 
            codeTemplate={xorRustCode} 
            language="rust" 
          />

          <UnorderedList className="mt-6">
            <ListItem>The phantom sandbox derives an <InlineCode>Agent ID</InlineCode> that is mathematically distinct from the live network.</ListItem>
            <ListItem>Any outbound packets are instantly dropped by the Aegis Interdiction Engine as "Unverified Topology".</ListItem>
            <ListItem>Local isolation is achieved in ~400 nanoseconds via DashMap insertion. Global propagation completes in &lt; 50ms via the Zenoh mesh.</ListItem>
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

          <RequiresEnterprise 
            description="Deterministic Reality Forking is reserved for Enterprise-tier Swarms. Upgrade your organization to access temporal debugging and WASI environment subversion."
          >
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
