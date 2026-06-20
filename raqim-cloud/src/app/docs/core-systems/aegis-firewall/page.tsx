import { DynamicCodeBlock } from "@/components/docs/DynamicCodeBlock";
import { RequiresEnterprise } from "@/components/docs/RequiresEnterprise";

export default function AegisFirewallPage() {
  const aegisTomlCode = `# aegis.toml (Hot-Reloaded RAM Firewall)
[groups.finance_worker]
allowed_namespaces = ["/finance/ledger/*"]
blocked_namespaces = ["/core/admin"]

[groups.logistics_node]
allowed_namespaces = ["/supply_chain/*"]`;

  const certRustCode = `#[derive(Serialize, Deserialize, Clone)]
pub struct CapabilityCertificate {
    pub agent_hex: String,
    pub group_name: String,
    pub expiration_timestamp: u64,
    pub master_signature: Vec<u8>, // Cryptographic proof of Raqim Cloud authorization
}`;

  return (
    <article className="prose prose-lg prose-invert prose-zinc max-w-none prose-headings:tracking-tight prose-a:text-cyan-400 hover:prose-a:text-cyan-300">
      <div className="mb-16">
        <div className="text-cyan-500 font-mono text-sm uppercase tracking-widest mb-3">Core Systems</div>
        <h1 className="text-4xl md:text-5xl font-semibold text-white mb-6">Aegis Firewall</h1>
        <p className="text-xl text-zinc-400 leading-relaxed">
          The mathematical vanguard of the Sovereign OS. Aegis entirely replaces traditional API keys with socket-layer Ed25519 cryptography to guarantee zero-trust agent interdiction.
        </p>
      </div>

      <div className="space-y-16">
        <section id="philosophy" className="scroll-mt-24">
          <h2 className="text-2xl font-medium text-zinc-100 border-b border-zinc-800/80 pb-3 mb-6">The Philosophy: Why API Keys Fail</h2>
          <p className="text-zinc-400 leading-relaxed mb-4">
            In standard microservice architectures, an API key operates as a bearer token. If intercepted, it grants full impersonation rights. 
            For Agentic Operating Systems running high-velocity, autonomous cross-border transactions, this paradigm is fundamentally insecure.
          </p>
          <p className="text-zinc-400 leading-relaxed">
            The Aegis Firewall completely discards bearer tokens. Instead, every single agent operates with an asymmetric Ed25519 keypair. 
            The Private Key never leaves your hardware. Every packet transmitted into the Swarm is cryptographically signed, ensuring that 
            even if a malicious actor sits on your network line, they cannot forge a single instruction.
          </p>
        </section>

        <section id="physics" className="scroll-mt-24">
          <h2 className="text-2xl font-medium text-zinc-100 border-b border-zinc-800/80 pb-3 mb-6">The Sovereign Certificate Authority & Passports</h2>
          <p className="text-zinc-400 leading-relaxed mb-4">
            Raqim abandons manual per-agent hardcoding. Instead, the <code>raqim-cloud</code> Certificate Authority (CA) mints a <code>CapabilityCertificate</code> (Passport) signed by the Swarm Master's RSA Private Key.
          </p>
          <p className="text-zinc-400 leading-relaxed mb-4">
            Raqim Cloud signs a deterministic passport that is passed down to the edge node. Because the Daemon knows the Cloud's Public Key, it validates the passport in native Rust without a single database query.
          </p>
          
          <DynamicCodeBlock 
            codeTemplate={certRustCode} 
            language="rust" 
          />

          <p className="text-zinc-400 leading-relaxed mb-4">
            To prevent Elliptic Curve math from starving the CPU, Aegis splits the firewall. The heavy Lineage Verification (Master Signature) runs once per TCP handshake. Subsequent packets hit the ultra-fast RAM cache for O(1) Integrity Audits.
          </p>
          <ul className="text-zinc-400 space-y-2 mb-6">
            <li><strong className="text-zinc-200">The Genesis:</strong> An Ed25519 keypair is generated entirely locally on the host machine.</li>
            <li><strong className="text-zinc-200">The Derivation:</strong> The public key (32 bytes) is hashed using MD5.</li>
            <li><strong className="text-zinc-200">The Identity:</strong> The resulting 16 bytes serve as the immutable, global <code>Agent ID</code>.</li>
          </ul>
        </section>

        <section id="interdiction" className="scroll-mt-24">
          <h2 className="text-2xl font-medium text-zinc-100 border-b border-zinc-800/80 pb-3 mb-6">The Interdiction Engine</h2>
          <p className="text-zinc-400 leading-relaxed mb-6">
            When a TCP packet hits the Raqim ingress, the Aegis Interdiction Engine executes the Ed25519 signature verification at the socket layer. 
            If the verification fails, the packet is instantly dropped.
          </p>
          
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mt-6">
            <h3 className="text-lg font-medium text-white mb-3">Deep-Packet Rules</h3>
            <p className="text-zinc-400 mb-4 text-sm leading-relaxed">
              You can configure complex interdiction rules based on the authenticated <code>Agent ID</code>. 
              For example, you can mathematically restrict <code>FINANCE_ROUTER</code> to only commit thoughts to the <code>/finance/ledger/*</code> path.
            </p>
            
            <DynamicCodeBlock 
              codeTemplate={aegisTomlCode} 
              language="Bash" 
            />
            
            <p className="text-zinc-400 mt-4 text-sm leading-relaxed">
              Because Aegis executes these rules in native Rust before the packet even reaches the CRDT Swarm, malicious or malformed intents consume exactly zero compute resources from your core processing cluster.
            </p>
          </div>
        </section>

        <section id="quarantine" className="scroll-mt-24">
          <RequiresEnterprise>
            <h2 className="text-2xl font-medium text-zinc-100 border-b border-zinc-800/80 pb-3 mb-6">Global Fleet Quarantine Sync</h2>
            <p className="text-zinc-400 leading-relaxed">
              When an agent goes rogue in an Open Core swarm, it is quarantined locally by the node that caught it. In Enterprise swarms, Aegis fires a hyper-priority <code>SystemCommand::GlobalQuarantineSync</code> via Zenoh. Within 50 milliseconds, every edge node on Earth updates its local <code>DashMap</code> blocklist, mathematically excising the rogue agent from the global network.
            </p>
          </RequiresEnterprise>
        </section>
      </div>
    </article>
  );
}
