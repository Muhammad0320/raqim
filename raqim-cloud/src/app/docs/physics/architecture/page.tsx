import { ZeroCopyDiagram, BenchmarkHUD } from '@/components/docs/PhysicsDiagrams';
import { DynamicCodeBlock } from '@/components/docs/DynamicCodeBlock';

export default function PhysicsArchitecturePage() {
  const ingressEnvelopeCode = `#[derive(Archive, Deserialize, Serialize)]
#[repr(C)]
pub struct IngressEnvelope {
    pub intent_path: String,
    pub public_key: [u8; 32],
    pub signature: [u8; 64],
    pub capability_cert: Vec<u8>,
    pub state_bytes: Vec<u8>,
}
// The byte representation on the wire identically matches the RAM layout.`;

  return (
    <main className="prose prose-zinc prose-invert prose-lg leading-relaxed max-w-none">
      <div className="mb-12">
        <div className="text-cyan-500 font-mono text-sm uppercase tracking-[0.1em] mb-4">Physics</div>
        <h1>Altitude 4: Internal Physics & Bare-Metal Sympathy</h1>
        <p className="text-xl text-zinc-400 leading-relaxed">
          Mechanical Sympathy and Low-Level Rust Optimizations inside Raqim Swarm.
        </p>
      </div>

      <BenchmarkHUD />

      <div className="space-y-12">
        <section id="tps-barrier" className="scroll-mt-24">
          <h2>Cracking the 790k TPS Barrier (Syscall Starvation)</h2>
          <p className="text-zinc-400">
            Raqim Cloud is architected on a foundation of absolute mechanical sympathy. To achieve a sustained ingestion rate of over 790,946 logs per second on a single node, we had to eliminate the primary bottlenecks in modern systems: garbage collection and kernel context switches.
          </p>
          <p className="text-zinc-400">
            Invoking a read() system call for every packet destroys the CPU via kernel context switching. Wrapping the ingress in a 1MB BufReader amortizes the syscalls. Raqim wraps the TCP stream in a 1MB BufReader, swallowing 10,000 thoughts in a single kernel boundary crossing.
          </p>
          <p className="text-zinc-400">
            To prevent the global memory allocator from fragmenting the RAM, Raqim pre-allocates a single 1MB Scratch Buffer outside the loop. Packets are sliced directly into this persistent memory block, reducing dynamic heap allocations to absolute zero. By utilizing memory-mapped files (<code className="text-zinc-300">mmap</code>) and native <code className="text-zinc-300">io_uring</code> system interfaces, we append bytes directly to a continuous disk sector. When a log is ingested, the kernel handles the page cache synchronization asynchronously. The system operates entirely outside the boundaries of a conventional runtime, delivering sub-millisecond latencies under crushing loads.
          </p>
        </section>

        <section id="zero-copy-casts" className="scroll-mt-24">
          <h2>Zero-Copy Casts (rkyv)</h2>
          <p className="text-zinc-400">
            The core enabler of our throughput is <code className="text-zinc-300">rkyv</code>, a zero-copy deserialization framework. Raqim abandons JSON and Protobuf entirely.
          </p>
          <p className="text-zinc-400">
            The TCP byte array is directly cast into memory. By enforcing the <code className="text-zinc-300">#[repr(C)]</code> macro memory layouts, Raqim performs an unsafe pointer cast over the raw network buffer. Accessing the inner state takes <code className="text-zinc-300">O(1)</code> time and exactly 0 CPU cycles of deserialization overhead.
          </p>
          
          <div className="my-6">
            <DynamicCodeBlock 
              codeTemplate={ingressEnvelopeCode} 
              language="rust" 
            />
          </div>

          <div className="my-12">
            <ZeroCopyDiagram />
          </div>
        </section>

        <section id="sovereign-ca" className="scroll-mt-24">
          <h2>The Sovereign Certificate Authority & Passports</h2>
          <p className="text-zinc-400">
            Security at this scale requires cryptographic isolation at the socket layer. Every payload ingested into Raqim must be cryptographically signed using Ed25519 elliptic curve signatures and carry a valid passport.
          </p>
          <p className="text-zinc-400">
            Instead of manual per-agent hardcoding, the <code className="text-zinc-300">raqim-cloud</code> CA mints a <code className="text-zinc-300">CapabilityCertificate</code> (Passport) signed by the Swarm Master's RSA Private Key. To prevent Elliptic Curve math from starving the CPU, Aegis splits the firewall. The heavy Lineage Verification (Master Signature) runs once per TCP handshake. Subsequent packets hit the ultra-fast RAM cache for <code className="text-zinc-300">O(1)</code> Integrity Audits. Deterministic MD5 public key derivation ensures hackers cannot spoof agent identities without owning the corresponding private key credentials.
          </p>
        </section>

        <section id="telemetry-firehose" className="scroll-mt-24">
          <h2>The TimescaleDB Telemetry Firehose</h2>
          <p className="text-zinc-400">
            Raqim Cloud enforces license limits and audits analytics without compromising localized edge nodes.
          </p>
          <p className="text-zinc-400">
            We implement an aggregation logic where the daemon counts local merges and only dispatches a compressed summary to the Next.js cloud every 60 seconds to avoid HTTP overhead. Edge nodes do not spam the cloud. The Raqim daemon aggregates <code className="text-zinc-300">crdt_merges</code> and <code className="text-zinc-300">a2a_bytes</code> internally. Every 60 seconds, it flushes a single, compressed NDJSON payload authenticated via an RSA JWT to <code className="text-zinc-300">raqim-cloud</code>.
          </p>
          <p className="text-zinc-400">
            The Cloud API writes blindly to a TimescaleDB Hypertable. Continuous Aggregates calculate the billing rollups in the background, isolating analytic compute from ingestion throughput. This ensures WAN network partitions never degrade local mesh executions.
          </p>
        </section>
      </div>
    </main>
  );
}
