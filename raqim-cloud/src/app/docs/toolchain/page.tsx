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
  const cliCode = `$ raqim-cli keys generate
Generating Ed25519 identity pair...

Public Key:  0x9a8f2e7b...
Private Key: [HIDDEN]

Deriving Routing ID...
> MD5(PubKey) -> 16-byte determinism
> Agent ID (Hex): 8f3a9b2c4e1d7f6a

Identity fully established. Ready for mesh deployment.`;

  const wasmCompileCode = `# Compile your agent to standard WASI architecture
cargo build --target wasm32-wasi --release

# The resulting binary is a completely isolated module
# ready to be executed in-process by the Raqim OS hypervisor.`;

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
        <ContentSection id="cryptographic-identity">
          <SectionTitle>The Cryptographic Identity (CLI)</SectionTitle>
          <Paragraph>
            Every agent deployed in the Raqim Swarm requires absolute cryptographic isolation. 
            The foundation of this isolation is deterministic identity generation at the network edge.
          </Paragraph>
          <Paragraph>
            Using the <InlineCode>raqim-cli keys generate</InlineCode> utility, the system produces a raw Ed25519 cryptographic key pair. 
            To optimize mesh routing without sacrificing security, we hash the Public Key via MD5. 
            This derives a deterministic 16-byte <InlineCode>agent_hex</InlineCode> which acts as the ultimate Routing ID 
            across the entire Zenoh network.
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
            Vector 2: The Python SDK (Out-of-Process)
          </h3>
          <Paragraph>
            Python environments cannot natively run inside our WASM hypervisor. Thus, the Python SDK runs entirely <EmphasizedText>out-of-process</EmphasizedText>. 
            It communicates with the Core via a heavy <InlineCode>TCP Firehose</InlineCode>. 
          </Paragraph>
          <Paragraph>
            Because the Python interpreter maintains its own memory heap, we cannot forcefully drop its state. 
            Instead, it relies heavily on the <InlineCode>Zenoh Control Plane</InlineCode> to receive external eviction hooks. 
            When a Reality Fork occurs, the Control Plane signals the Python process to manually clear the LLM context buffers.
          </Paragraph>

          <h3 style={{ color: '#fff', fontSize: '1.25rem', marginTop: '2rem', marginBottom: '1rem', fontWeight: 500 }}>
            Vector 1: The WASM SDK (In-Process)
          </h3>
          <Paragraph>
            For maximum performance, Rust agents utilize the WASM SDK and run directly <EmphasizedText>in-process</EmphasizedText> within the Raqim OS WASI sandbox.
          </Paragraph>
          <Paragraph>
            Unlike Python, WASM agents require zero Zenoh eviction hooks. During a Reality Fork, the OS simply executes a physical drop 
            of the entire WASM linear memory and reboots the compiled binary. The state is guaranteed to be obliterated at the memory 
            allocator level, achieving zero-latency context flushing.
          </Paragraph>
          
          <DynamicCodeBlock 
            codeTemplate={wasmCompileCode} 
            language="bash" 
          />
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
      </div>
    </ArticleWrapper>
  );
}
