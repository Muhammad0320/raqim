import { DynamicCodeBlock } from "@/components/docs/DynamicCodeBlock";
import { K8sTopologyDiagram } from "@/components/docs/K8sTopologyDiagram";

export default function KubernetesDeploymentPage() {
  const helmValuesCode = `# raqim-values.yaml
replicaCount: 3

image:
  repository: ghcr.io/raqim-os/raqim-core
  tag: v2.1.0

storage:
  size: 500Gi
  className: "local-nvme"

licenseKey: "{{LICENSE_KEY}}"`;

  const helmInstallCode = `$ helm repo add raqim https://charts.raqim.cloud
$ helm install raqim-swarm raqim/raqim-core -f raqim-values.yaml`;

  return (
    <main className="prose prose-zinc prose-invert prose-lg leading-relaxed max-w-none prose-headings:tracking-tight prose-a:text-cyan-400 hover:prose-a:text-cyan-300">
      <div className="mb-12">
        <div className="text-cyan-500 font-mono text-sm uppercase tracking-[0.1em] mb-4">Deployment</div>
        <h1 className="text-4xl md:text-5xl font-semibold text-white mb-6">Altitude 3: The Deployment Plane</h1>
        <p className="text-xl text-zinc-400 leading-relaxed">
          Orchestrating high-throughput database engines inside virtualised systems requires total mechanical sympathy. 
          Raqim OS discards hypervisor virtualization overhead to deploy directly to bare-metal hardware.
        </p>
      </div>

      <K8sTopologyDiagram />

      <div className="space-y-12">
        <section id="sovereign-philosophy" className="scroll-mt-24">
          <h2 className="text-2xl font-medium text-zinc-100 border-b border-zinc-800/80 pb-3 mb-6">The Sovereign Philosophy</h2>
          <p className="text-zinc-400">
            Raqim is not a traditional user-space library running inside a bulky virtual machine; it is a Database OS. 
            Standard cloud orchestration engines abstract away memory layouts and storage persistence through generic container platforms. 
            Raqim rejects this. We strip away managed control planes to bind agent compute resources directly to bare-metal hardware interfaces.
          </p>
          <p className="text-zinc-400">
            This design eliminates standard hypervisor resource scheduling constraints, bringing raw performance 
            straight to decentralized agent applications.
          </p>
        </section>

        <section id="distroless-armor" className="scroll-mt-24">
          <h2 className="text-2xl font-medium text-zinc-100 border-b border-zinc-800/80 pb-3 mb-6">The Distroless Armor</h2>
          <p className="text-zinc-400">
            Security at the edge cannot rely on firewalls alone. Raqim Core compiles into a single, static 40MB distroless scratch binary. 
            The container environment contains no shell utilities (<code className="text-zinc-300">/bin/sh</code>, <code className="text-zinc-300">/bin/bash</code>) and no standard C libraries (<code className="text-zinc-300">glibc</code>).
          </p>
          <p className="text-zinc-400">
            By removing the entire user-space tooling layer, we reduce the container's attack surface to absolute zero. 
            Remote code execution (RCE) attempts become mathematically impossible, as there are no libraries or executables 
            available for shell spawning or exploit payloads.
          </p>
        </section>

        <section id="data-gravity" className="scroll-mt-24">
          <h2 className="text-2xl font-medium text-zinc-100 border-b border-zinc-800/80 pb-3 mb-6">Data Gravity & StatefulSets</h2>
          <p className="text-zinc-400">
            Traditional Kubernetes deployments treat pods as ephemeral, stateless workloads. When a node experiences failure, 
            the scheduler mounts storage onto a new node, causing severe data replication bottlenecks.
          </p>
          <p className="text-zinc-400">
            Raqim bans standard stateless Deployments. Instead, we enforce Kubernetes StatefulSets to preserve storage identity. 
            Each pod (<code className="text-zinc-300">raqim-0</code>, <code className="text-zinc-300">raqim-1</code>) is bound directly to its local 
            NVMe Persistent Volume Claim (PVC) using strict host-path hardware binding. If a node fails, the scheduler is forced 
            to bring the pod back online on the exact same physical machine, maintaining immediate write access to the local Write-Ahead Log (WAL) 
            and CRDT memory segments.
          </p>
        </section>

        <section id="headless-mesh" className="scroll-mt-24">
          <h2 className="text-2xl font-medium text-zinc-100 border-b border-zinc-800/80 pb-3 mb-6">The Headless Mesh</h2>
          <p className="text-zinc-400">
            Standard Kubernetes routing utilizes Services that rely on iptables or IPVS rules via kube-proxy. 
            This layer introduces virtual routing hops and latency.
          </p>
          <p className="text-zinc-400">
            Raqim bypasses kube-proxy entirely by enforcing a Headless Service (<code className="text-zinc-300">ClusterIP: None</code>). 
            This allows Core DNS to resolve individual, stable DNS records pointing directly to the real IP interfaces of the pods 
            (e.g., <code className="text-zinc-300">raqim-0.raqim-headless.svc.cluster.local</code>). The Zenoh mesh uses these raw IPs 
            to initiate peer-to-peer TCP tunnels directly between swarm nodes, bypassing load balancer overhead entirely.
          </p>
        </section>

        <section id="license-cryptography" className="scroll-mt-24">
          <h2 className="text-2xl font-medium text-zinc-100 border-b border-zinc-800/80 pb-3 mb-6">License Cryptography (Helm Injection)</h2>
          <p className="text-zinc-400">
            To unlock global WAN synchronization capabilities, the Swarm daemon requires validation of the Enterprise RSA JWT license. 
            This is managed securely at deployment time by injecting the license key via Kubernetes Secrets.
          </p>
          
          <div className="my-6">
            <DynamicCodeBlock 
              codeTemplate={helmValuesCode} 
              language="yaml" 
            />
          </div>

          <p className="text-zinc-400">
            Deploy the chart using the following Helm command to provision the pods and mount local NVMe storage resources:
          </p>

          <div className="my-6">
            <DynamicCodeBlock 
              codeTemplate={helmInstallCode} 
              language="bash" 
            />
          </div>
        </section>
      </div>
    </main>
  );
}
