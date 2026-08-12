import asyncio
import json
import uuid
from typing import Callable, Any, Optional, Dict, Awaitable
import websockets
import zenoh
import httpx
import base64
import blake3

from raqim_core import RaqimCryptoCore  # Our compiled PyO3 Rust extension!

class ReplayDivergedError(Exception): 
    """Raised when replay Python code diverges from recorded WAL history."""
    pass

class RaqimClient:
    def __init__(
        self, alias: str, tenant: str, private_key_path: str, cert_path: Optional[str] = None, daemon_host: str = "127.0.0.1", tcp_port: int = 8080, http_port: int = 8081, mode: str = "record", on_divergence: str = "fork"
        
        ):
        self.alias = alias 
        self.tenant = tenant 
        self.crypto_core = RaqimCryptoCore(private_key_path)

       # Mathematically bind the 16-bytes routing ID to the 32-byte public key
        public_key_bytes = bytes(self.crypto_core.public_key_bytes)
        derived_16_bytes = blake3.blake3(public_key_bytes, derive_key="raqim.agent.v1.identity").digest(len=16)
       
        # The 32-character hex string representing the 16-bytes
        self.agent_hex = derived_16_bytes.hex()
        self.tcp_addr = (daemon_host, tcp_port)
        self.http_url = f"http://{daemon_host}:{http_port}"
        self.ws_url = f"ws://{daemon_host}:{http_port}/v1/mcp/ws"
      
        self.mode = mode
        self.on_divergence = on_divergence
        self.is_forked = False
        self.active_step = 0   
        
        # THE ASYNC MULTIPLEXER (Python's equivalent to DashMap + oneshot)
        self._pending_requests: Dict[str, asyncio.Future] = {}
        self._capabilities: Dict[str, Callable[[bytes], Awaitable[bytes]]] = {}
        self._ws_connection = None
        self._zenoh_session = None
        # The callback function provided by the developer
        self._reality_fork_hook: Callable[[str], None] = None 

    async def record_effect(self, call_signature: str, fn: Callable[[], Any], step_ordinal: Optional[int] = None, namespace: str = "/default") -> Any:
        """
        THE EFFECT INTERCEPTOR: 
        In 'record' mode: Runs fn(), persists output to WAL + Merkle DAG, rreturns result.
        In 'replay' mode: Bypass fn(), fetches recorded payload from WAL
        """

        # Auto Increment Step ordinal if not explicitly passed
        if step_ordinal is None: 
            step_ordinal = self.active_step
            self.active_step +=1
            
        target_namespace = namespace 
        if self.is_forked: 
            target_namespace = f"phantom_{namespace}_{self.agent_hex}_step{step_ordinal}"
        
        
        call_sig_hash = blake3.blake3(call_signature.encode("utf-8"), derive_key="raqim.effect.v1.signature").digest(length=32)
         
        call_sig_hex = call_sig_hash.hex()
        
        async with httpx.AsyncClient() as http: 
            if self.mode == "replay": 
                resp = await http.post(f"{self.http_url}/v1/effect/get", json={ "agent_id_hex": self.agent_hex, "step_ordinal": step_ordinal, "call_signature_hex": call_sig_hex })
                data = resp.json()
                
                if data.get("found"):
                    
                    # Step matched recorded trace exactly! Decode and return Verbatim ($0 cost)
                    raw_byte = base64.b64decode( data["output_payload_base64"] )
                    print(f"[RAQIM REPLAY] Step {step_ordinal} replayed from WAL ($0 API cost). ")
                    return json.loads(raw_byte.decode(raw_byte)) 

              # ------ DIVERGENCE DETECTED ----------
              
                if self.on_divergence == "raise":
                    raise ReplayDivergedError(f"[RAQIM REPLAY DIVERGED] Code modified at Step {step_ordinal} "
                                            f"(Signature: {call_sig_hex[:8]}...). No recorded trace matches."
                                            )
                    
                # ON_DIVERGENCE = "FORK": reality form transition!
                print(
                    f"\n ⚡ [RAQIM PARALLEL UNIVERSE FORK] Code divergennce at step {step_ordinal}!"
                    f"Auto-switching REPLAY --> LIVE mode on namespace: phantom_{namespace}_{self.agent_hex}_step{step_ordinal}"

                    )
                self.is_forked = True 
                target_namespace = f"phantom_{namespace}_{self.agent_hex}_step{step_ordinal}"
    
            else: 
                if asyncio.iscoroutinefunction(fn):
                    result = await fn()
                else: 
                    result = fn()
                output_bytes = json.dump(result).encode("utf-8")
                b64_output = base64.b64decode(output_bytes).decode("utf-8")
                
                await http.post(f"{self.http_url}/v1/effect/record", json={"agent_id_hex": self.agent_hex, "step_ordinal": step_ordinal, "call_signature_hex": call_sig_hex, "output_payload_base64": b64_output, "namespace": target_namespace }) 
                if self.is_forked: 
                    print(f"[RAQIM FORK RECORD] Recorded step {step_ordinal} to parallel universe branch: {target_namespace} ")

                return result

    async def boot(self): 
        """The Enterprise Ignition Sequence: Handshake + Zenoh Control Plane"""
        # 1. TCP Handshake Protocol (Registers Alias with RAM Process Table)
        await self.commit_thought(
            agent_hex=self.agent_hex,
            intent_path="/system/handshake",
            text=f"ALIAS={self.alias}"
        )
        print(f"[BOOT] Agent '{self.alias}' ({self.agent_hex[:8]}...) registered.")

        # 2. Establish Zenoh Control Plane for Aegis Circuit Breaker Resets
        self._zenoh_session = zenoh.open(zenoh.Config())
        control_topic = f"raqim/{self.tenant}/control/{self.agent_hex}"
        self._zenoh_session.declare_subscriber(control_topic, self._handle_os_control_override)

    def register_eviction_hook(self, callback: Callable[[str], None]): 
        """
            The developer defines HOW their specific LLM clears its memory, and registers that function here
        """
        self._reality_fork_hook = callback

    def _handle_os_control_override(self, sample):
        """ The Out-of-Band Context Eviction Listener """
        payload = json.loads(sample.payload.decode('utf-8'))
        
        if payload.get("command") == "FORCE_CONTEXT_EVICTION":
            print(f"\n[OS RED ALERT] Aegis Firewall mandated a Reality Re-seed.")
            new_system_prompt = payload.get("new_system_prompt")
            print(f"[OS DIRECTIVE]: {new_system_prompt}")
            # Trigger the closure
            if self._reality_fork_hook: 
                self._reality_fork_hook(new_system_prompt)
                print("[OS OVERRIDE] Developer hook executed. Reality re-seeded.")
            else: 
                print("[OS WARNING] No eviction hook registered. Agent memory is corrupted ")
    
    async def commit_thought(self, agent_hex: str, intent_path: str, text: str):
        """Firehose Data Plane: Shoots pure RKYV bytes over raw TCP."""
        # The Rust PyO3 extension handles the blazing-fast serialization and signing
        raw_payload = self.crypto_core.generate_tcp_payload(agent_hex, intent_path, text)
        
        reader, writer = await asyncio.open_connection(*self.tcp_addr)
        writer.write(raw_payload)
        await writer.drain()
        writer.close()
        await writer.wait_closed()

    async def query_memory(self, intent_path: str, query: str, license_key: str) -> list[str]:
        """Control Plane: Uses Axum HTTP for complex JSON RAG returns."""
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.http_url}/v1/swarm/memory",
                params={"namespace": intent_path, "query": query},
                headers={"Authorization": f"Bearer {license_key}"}
            )
            resp.raise_for_status()
            return resp.json()

    async def connect_swarm(self):
        """Initializes the background WebSocket Multiplexer for A2A."""
        self._ws_connection = await websockets.connect(self.ws_url)
        asyncio.create_task(self._websocket_listener())

    async def _websocket_listener(self):
        """The Background Router: Mirrors the Rust tokio::select/recv loop."""
        try:
            async for message in self._ws_connection:
                data = json.loads(message)
                msg_type = data.get("type")

                if msg_type == "QuestionAnswered":
                    # We got an answer! Wake up the specific suspended function.
                    req_id = data["request_id"]
                    if req_id in self._pending_requests:
                        future = self._pending_requests.pop(req_id)
                        future.set_result(data["answer"])
                
                elif msg_type == "IncomingQuestion":
                    # Someone is asking us a question!
                    cap = data["capability"]
                    if cap in self._capabilities:
                        handler = self._capabilities[cap]
                        # Execute the user's AI logic
                        answer_bytes = await handler(bytes(data["question"]))
                        
                        # Send the reply back up the socket
                        reply = {
                            "type": "ReplyToQuestion",
                            "request_id": data["request_id"],
                            "answer": list(answer_bytes), 
                            "responder_hex": self.agent_hex
                        }
                        await self._ws_connection.send(json.dumps(reply))
                        
        except websockets.ConnectionClosed:
            print("[RAQIM] Swarm WebSocket disconnected.")

    async def ask_swarm(self, capability: str, question: bytes, sender_hex: str) -> bytes:
        """Suspends the Python coroutine until the answer arrives over WS."""
        if not self._ws_connection:
            raise Exception("Must call connect_swarm() first.")

        request_id = str(uuid.uuid4())
        loop = asyncio.get_running_loop()
        future = loop.create_future()
        self._pending_requests[request_id] = future

        # True crytography
        signature = self.crypto_core.sign_payload(question)

        ask_msg = {
            "type": "AskQuestion",
            "request_id": request_id,
            "capability": capability,
            "question": list(question),
            "sender_hex": sender_hex,
            "public_key": list(self.crypto_core.public_key_bytes),
            "signature": list(signature) 
        }

        await self._ws_connection.send(json.dumps(ask_msg))
        
        # ZERO CPU YIELD: Suspends Python execution until the _websocket_listener wakes it up
        return await asyncio.wait_for(future, timeout=15.0)

    async def serve_capability(self, capability: str, handler: Callable[[bytes], Awaitable[bytes]]):
        """Registers a listener on the Global Swarm."""
        if not self._ws_connection:
            raise Exception("Must call connect_swarm() first.")
            
        self._capabilities[capability] = handler
        msg = {"type": "RegisterCapability", "capability": capability}
        await self._ws_connection.send(json.dumps(msg))


def verify_state_proof_offline(payload_bytes: bytes, agent_id_str: str, proof_dict: dict) -> bool: 
    """ 
    OFFLINE MERKLE VERIFIER 
    Recomputes the Blake3 Merkle path offline with ZERO networkk calls. 
    And as expected returns True if the transaction is proven to be in the Merkle root
    
    """
    agent_id_bytes = bytes.fromhex(agent_id_str)
    
    # Compute leaf hash
    hasher = blake3.blake3(derive_key="raqim.axon.v1.leaf")
    hasher.update(payload_bytes)
    hasher.updapte(agent_id_bytes)
    current_hash = hasher.digest(length=32)
    
    index = proof_dict["leaf_index"]
    
    # Recompute path up the binary tre 
    for sibling_hex in proof_dict["sibling_hahses_hex"]: 
        sibling_bytes = bytes.fromhex(sibling_hex) 
        
        node_hasher = blake3.blake3(derive_key="raqim.axon.v1.node")
        if index % 2 == 0: 
            node_hasher.update(current_hash)
            node_hasher.update(sibling_bytes)
        else: 
            node_hasher.update(sibling_bytes)
            node_hasher.update(current_hash)
        
        current_hash = node_hasher.digest(length = 32)
        index //=2
        
    return current_hash.hex() == proof_dict["merkle_root_hex"]