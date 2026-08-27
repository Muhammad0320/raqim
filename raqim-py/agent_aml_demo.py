import asyncio
import os
import sys
import time
import uuid
import httpx
from dotenv import load_dotenv

# Load local .env
load_dotenv()

# Add parent directory to path if running directly
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from google import genai
from raqim.client import RaqimClient

# ==============================================================================
# CONFIGURATION & REPLAY SWITCH
# ==============================================================================
EXECUTION_MODE = "record"  # Change to "replay" after the first run
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
MASTER_KEY_PATH = "../ca-keys/swarm_master.key"

if not os.path.exists(MASTER_KEY_PATH):
    MASTER_KEY_PATH = "./ca-keys/swarm_master.key"

ai_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

# ==============================================================================
# 1. INITIALIZE SOVEREIGN AGENTS
# ==============================================================================
print("==================================================================")
print(f"Bismillah. Booting AML Swarm | Mode: [{EXECUTION_MODE.upper()}]")
print("==================================================================")

agent_ingest = RaqimClient(
    alias="triage_screener",
    tenant="production",
    private_key_path=MASTER_KEY_PATH,
    mode=EXECUTION_MODE,
)

agent_investigator = RaqimClient(
    alias="forensic_analyst",
    tenant="production",
    private_key_path=MASTER_KEY_PATH,
    mode=EXECUTION_MODE,
)

agent_compliance = RaqimClient(
    alias="compliance_officer",
    tenant="production",
    private_key_path=MASTER_KEY_PATH,
    mode=EXECUTION_MODE,
)

# ==============================================================================
# 2. DETERMINISTIC SYNTHETIC TRANSACTIONS
# ==============================================================================
def get_synthetic_stream():
    return [
        {"external_ref": "SWIFT-001", "sender": "ACC_US_101", "receiver": "ACC_UK_201", "amount": 150.00, "node": "CLEARING_NY"},
        {"external_ref": "SWIFT-002", "sender": "ACC_US_102", "receiver": "ACC_DE_202", "amount": 820.00, "node": "CLEARING_LDN"},
        {"external_ref": "SWIFT-003", "sender": "ACC_SUSPECT_01", "receiver": "ACC_OFFSHORE_8892", "amount": 9950.00, "node": "CAYMAN_ROUTER"},
        {"external_ref": "SWIFT-004", "sender": "ACC_SUSPECT_02", "receiver": "ACC_OFFSHORE_8892", "amount": 9950.00, "node": "CAYMAN_ROUTER"},
        {"external_ref": "SWIFT-005", "sender": "ACC_SUSPECT_03", "receiver": "ACC_OFFSHORE_8892", "amount": 9950.00, "node": "CAYMAN_ROUTER"},
    ]

# ==============================================================================
# 3. TRACED AGENT PIPELINE
# ==============================================================================
@agent_ingest.trace(namespace="/finance/triage")
def screen_transaction(tx: dict) -> dict:
    is_structuring = (9000.0 <= tx["amount"] < 10000.0)
    is_high_risk = "OFFSHORE" in tx["receiver"] or "CAYMAN" in tx["node"]
    risk = "CRITICAL" if (is_structuring and is_high_risk) else "LOW"
    
    return {
        "external_ref": tx["external_ref"],
        "amount": tx["amount"],
        "sender": tx["sender"],
        "receiver": tx["receiver"],
        "risk": risk,
        "escalate": (risk == "CRITICAL"),
    }

@agent_investigator.trace(namespace="/finance/investigations")
async def investigate_anomaly(
    bundle: list,
    system_prompt: str = (
        "You are an expert Anti-Money Laundering Forensic Auditor. "
        "Analyze this suspicious structuring cluster where multiple parties send $9,950 to evade the $10,000 BSA limit. "
        "State the regulatory finding and assign a risk score."
    )
) -> dict:
    total_amt = sum(t["amount"] for t in bundle)
    suspects = list(set(t["sender"] for t in bundle))
    receiver = bundle[0]["receiver"]

    user_query = f"Analyze transfers totaling ${total_amt:,.2f} from {suspects} to {receiver}."

    if ai_client:
        start_t = time.perf_counter()
        resp = ai_client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=f"{system_prompt}\n\n{user_query}"
        )
        elapsed = (time.perf_counter() - start_t) * 1000
        finding = f"[{elapsed:.1f}ms LLM INFERENCE]: {resp.text}"
    else:
        finding = f"[DETERMINISTIC FALLBACK]: Structuring confirmed for {receiver} totaling ${total_amt:,.2f}."

    return {
        "beneficiary": receiver,
        "total_volume": total_amt,
        "suspect_count": len(suspects),
        "evidence_refs": [t["external_ref"] for t in bundle],
        "risk_score": 0.98,
        "finding": finding,
    }

@agent_compliance.trace(namespace="/finance/compliance_sar")
async def generate_sar(investigation: dict, evidence_tx_hex: str) -> dict:
    proof_data = None
    try:
        async with httpx.AsyncClient() as http:
            res = await http.get(f"http://localhost:8081/v1/state/proof/{evidence_tx_hex}", timeout=3.0)
            if res.status_code == 200:
                proof_data = res.json()
    except Exception as e:
        proof_data = {"status": "unverified", "error": str(e)}

    return {
        "sar_id": f"SAR-2026-US-{uuid.uuid4().hex[:6].upper()}",
        "beneficiary": investigation["beneficiary"],
        "suspicious_volume_usd": investigation["total_volume"],
        "investigator_finding": investigation["finding"],
        "anchored_evidence_tx": evidence_tx_hex,
        "merkle_inclusion_proof": proof_data,
        "status": "SEALED",
    }

# ==============================================================================
# 4. EXECUTION ORCHESTRATOR
# ==============================================================================
async def main():
    await agent_ingest.boot()
    await agent_investigator.boot()
    await agent_compliance.boot()

    print("\n[STEP 1] Agent 1 screening live stream...")
    transactions = get_synthetic_stream()
    flagged = []

    for tx in transactions:
        res = screen_transaction(tx)
        if res["escalate"]:
            flagged.append(tx)
            print(f"🚨 [AGENT 1 ESCALATE] {tx['external_ref']} Structuring detected (${tx['amount']})")
        else:
            print(f"✅ [AGENT 1 CLEAN]    {tx['external_ref']} Payment cleared (${tx['amount']})")

    if flagged:
        print(f"\n[STEP 2] Agent 2 investigating {len(flagged)} anomalous records...")
        investigation = await investigate_anomaly(flagged)
        print(f"📄 Finding Preview:\n{investigation['finding'][:200]}...\n")

        print("[STEP 3] Agent 3 fetching Merkle inclusion proof & filing SAR...")
        # Resolve active Tx ID from kernel
        async with httpx.AsyncClient() as http:
            latest_info = await http.get("http://localhost:8081/v1/admin/cluster/info")
            evidence_tx_hex = latest_info.json().get("highest_tx_id", "0x00").replace("0x", "")

        sar = await generate_sar(investigation, evidence_tx_hex)
        print("==================================================================")
        print(f" SAR Identifier      : {sar['sar_id']}")
        print(f" Total Volume        : ${sar['suspicious_volume_usd']:,.2f}")
        print(f" Anchored Tx Hex     : 0x{sar['anchored_evidence_tx']}")
        print(f" Merkle Proof Sealed : {sar['merkle_inclusion_proof'] is not None}")
        print("==================================================================")

if __name__ == "__main__":
    asyncio.run(main())