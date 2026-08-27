import asyncio
import os
import sys
import json
import time
import uuid
import httpx
from google import genai
from raqim import RaqimClient
from dotenv import load_dotenv


# ==================================================
# Configuration and crytographic passport resolution
# =================================================
load_dotenv()
GEMINI_API_KEY  = os.getenv("GEMINI_API_KEY", "")
MASTER_KEY_PATH = "./ca-keys/swarm_master.key"

if not os.path.exists(MASTER_KEY_PATH): 
    print(f"[FATAL] Master key not found at '{MASTER_KEY_PATH}'. Ensure raqim-core has booted at least once. ")
    sys.exit(1) 

# Initiate Gemini Client for causal investigation 
ai_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None 

# Initialize agent clients 
print("==================================================================")
print("Bismillah. Booting Soverign AML & Financial Forensic Swarm v1.0.0 ")
print("==================================================================")

# Agent 1: High-Frequency Ingestion & Sanction Screening
agent_ingest = RaqimClient(alias="triage_screener", tenant="production", private_key_path=MASTER_KEY_PATH, mode="record")

# Agent 2: Forensic Causal Investigator 
agent_investigator = RaqimClient(alias="forensic_analyst", tenant="production", private_key_path=MASTER_KEY_PATH, mode="record")

# Agent 3: Compliance officer and merkle sealer
agent_compliance = RaqimClient(alias="compliance_officer", tenant="production", private_key_path=MASTER_KEY_PATH, mode="record")


# ==============================================================
# Local synthetic transaction stream generator
# ==============================================================
def generate_synthetic_transactions():
    """ Generate realistic banking transaction frames with an embedded structuring anomaly."""
    txs = []
    
    # 10 Normal Baseline payments 
    for i in range(10): 
        txs.append({
            "tx_id": str(uuid.uuid4()), 
            "sender": f"ACCT_US_{1000 + i}", 
            "receiver": f"ACCT_UK_{2000 + i}", 
            "amount": float(120 + (i * 45)), 
            "currency": "USD",
            "routing_node": "SWIFT_US_CLEARING",
            "is_flagged": False  
            
        })

    # Inject Money Laundering Smurfing Attacks: 5 Rapid transfers of $9,950 to Offshore 
    offshore_target = "ACCT_OFFSHORE_8892"
    for j in range(5): 
        txs.append({

            "tx_id": str(uuid.uuid4()), 
            "sender": f"ACCT_SUSPECT_00{j+1}",
            "receiver": offshore_target,
            "amount": 9950.00, 
            "currency": "USD",
            "routing_node": "ROUTING_HOP_CAYMAN_01", 
            "is_flaged": True 
        })

    return txs 

# ===============================================================
# Agent 1: High-Frequency Screening and triage
# ===============================================================
@agent_ingest.trace(namespace="/finance/triage")
def screen_transaction(tx:dict) -> dict: 
    """Evaluates transaction velocity and geofence rules in microseconds """
    is_structuring = (9000.0 <= tx["amount"] < 10000.0 )
    is_high_risk_node = "OFFSHORE" in tx["receiver"] or "CAYMAN" in tx["routing_node"]
    risk_level = "CRITICAL" if (is_structuring and is_high_risk_node) else "LOW"
    
    return {
        "tx_id": tx["tx_id"], 
        "amount": tx["amount"],
        "sender": tx["sender"],
        "receiver": tx["receiver"],
        "risk_level": risk_level,
        "requires_escalation": (risk_level == "CRITICAL")
    }

# ===========================================================
# Agent 2: Forensic Investigator (Deep LLM analysis)
# ===========================================================
@agent_investigator.trace(namespace="/finance/investigations")
async def investigate_anomaly(escalation_bundle: list) -> dict: 
    """ Executes deep causal reasoning over suspicious transaction clusters."""
    total_laundered = sum(t["amount"] for t in escalation_bundle)
    suspected_senders = list(set(t["sender"] for t in escalation_bundle ))
    target_receiver = escalation_bundle[0]["receiver"]
    
    prompt = (
        f"You're an expert Anti-Money Laundering Forensic Auditor."
        f"Analyze this suspicious payment cluster: {len(escalation_bundle)} transfers totalling ${total_laundered:,.2f}"
        f"sent from accounts {suspected_senders} to beneficiary {target_receiver}."
        f"All transactions are structured at $9,950.00 to evade the $10,000 Bank Secrecy Act CTR threshold."
        f"Provide a concise regulatory finding and assign an AML rist score between 0.0 and 1.0."
    )

    if ai_client: 
        response = ai_client.models.generate_content(
            model="gemini-3.5-flash-lite", 
            content=prompt 
        )
        finding_narrative = response.text 
        print(finding_narrative)
    
    else: 
        finding_narrative = (
            f"[LOCAL HEURISTIC FALLBACK] Structuring/Smurfing patterb confirmed."
            f"{len(escalation_bundle)} structured deposits detected below $10,000 threshold totalling ${total_laundered:,.2f}."
            f"High confidence layering operation targeting beneficiary {target_receiver}."
        )

    return {
        "investigation_id": f"INV-{uuid.uuid4().hex[:8]}", 
        "beneficiary": target_receiver, 
        "total_amount": total_laundered, 
        "tx_count": len(escalation_bundle), 
        "evidence_tx_ids": [ t["tx_id"] for t in escalation_bundle ], 
        "risk_score": 0.98, 
        "narrative": finding_narrative
    }


# ======================================================
# Agent 3: Compliance officer & Merkle inclusion sealer
# ======================================================
@agent_compliance.trace(namespace="/finance/compliance_sar")
async def generate_and_seal_sar(investiigation: dict) -> dict: 
    """ Generate a formal Suspicious Activity Report and anchors Merkle proofs."""
    target_evidence_tx = investiigation["evidence_tx_ids"][0]
    
    # Query Rawim Daemon for Merkle Inclusion Proof 
    proof_url = f"http://localhost:8081/v1/state/proof/{target_evidence_tx}"
    markle_proof_data = None 
    
    try: 
        async with httpx.AsyncClient() as client: 
            res = await client.get(proof_url, timeout=5.0)
            if res.status_code == 200: 
                merkle_proof_data = res.json()
    except Exception as e: 
        markle_proof_data = {"error": f"Faiiled to fetch Merkle proof: {e}"}
        
    
    sar_record = {
        "sar_id": f"SAR-2026-US-{uuid.uuid4().hex[:6].upper()}", 
        "filling_timestamp": int(time.time()), 
        "beneficiary": investiigation["beneficiary"], 
        "total_suspicious_volume_usd": investiigation["total_volume"], 
        "investigator_narrative": investiigation['narrative'],
        "primary_evidence_tx_id": target_evidence_tx, 
        "merkle_inclusion_proof": merkle_proof_data, 
        "regulatory_status": "SEALED_FOR_FINCEN_SUBMISSION" 
    }

    return sar_record


# =================================================
# MAIN PIPELINE EXECUTION
# =================================================
async def main(): 
    # Boot Agent Connection to kernel 
    await agent_ingest.boot()
    await agent_investigator.boot() 
    await agent_compliance.boot()
    
    print("\n[STREAM] Ingesting synthetic banking stream...")
    txns = generate_synthetic_transactions()
    
    suspicious_cluster = []
    
    # Step 1: High-Velocity Screening by Agent 1
    for tx in txns: 
        result = screen_transaction(tx)
        if result["requires_escalation"]: 
            suspicious_cluster.append(tx)
            print(f"[AGENT 1 ALERT] Structuring Anomaly Detected! Tx: {tx["tx_id"][:8]}... Amount: ${tx['amount']} ")
        else: 
            print(f"[AGENT 1 CLEAN] Routine payment cleared. Tx: {tx["tx_id"]}... Amount: ${tx["amount"]} ")
            
    # Step 2: Escalation to forensic analyst
    if suspicious_cluster: 
        print(f"\n[ESCALATION] Routing {len(suspicious_cluster)} flagged transactions to Forensic Investigator...")
        investigation_report = await investigate_anomaly(suspicious_cluster) 
        
        print("\n==================================================================")
        print("\n             AGENT 2 FORENSIIC INVESTIGATION REPORT              ")
        print("\n==================================================================")
        print("====================================================================")
        print(f" Beneficiary Target : {investigation_report['beneficiary']}")
        print(f" Total Laundered    : ${investigation_report['total_amount']:,.2f}")
        print(f" Assessed Risk Score: {investigation_report['risk_score']}")
        print(f" Finding Narrative  :\n{investigation_report['narrative']}")
        print("------------------------------------------------------------------")
        
        # Step 3: Compliance Sealing and Merkle Proof anchoring 
        if investigation_report["risk_score"] >= 0.85: 
            print("\n [COMPLIANCE] Filing Suspicious Activity Report (SAR) & Anchoring Proof...")
            sealed_sar = await generate_and_seal_sar(investigation_report)
            
            print("\n==============================================================")
            print("\n        AGENT 3 SEALED COMPLIANCE AUDIT PACKAGE (SAR)        ")
            print("\n==============================================================")
            print(f"\n SAR Identifier      : {sealed_sar["sar_id"]}")
            print(f"\n Regulatory Status   : {sealed_sar["regulatory_status"]}")
            print(f"\n Evidence TxID       : {sealed_sar["primary_evidence_tx_id"]}")
            print(f"\n Merkle Proof Sealed : {sealed_sar["merkle_inclusion_proof"] is not None }")
            print("==================================================================")
  
        

if __name__ == "__main__":
    asyncio.run(main())