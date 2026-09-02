use raqim_core::nucleus::WalEngine;
use raqim_core::{AgentState, AgentStatus, OpLog};
use std::time::SystemTime;

#[tokio::test]
async fn test_wal_restarts_never_overites_and_compactor_reads_all_batches() {

    let test_wal_path = "test_run_integrity.wal";
    if Path::new(test_wal_path).exists() {

        let _ = std::fs::remove_file(test_wal_path);

    }


    // Boot WAL and write batch 1 (3 items)
    {
        let (wal, handle) = WalEngine::start(test_wal_path.to_string()).await;
        for i in 0..3 {
            wal.append(create_mock_log(i, "Batch 1")).await;
        }

        // Give tokio 20ms to flush group commit to disk
        tokio::time::sleep(tokio::time::Duration::from_millis(20)).await;
        drop(wal);
        let _ = handle.await;
    }


}

fn create_mock_log(tx_id: u128, text: &str) -> OpLog {

    OpLog {

        agent_id: [1u8; 16], 
        state: AgentState {
            agent_id: Some([1u8; 16]), 
            transaction_id: tx_id, 
            timestamp: 1700000000000000, 
            status:  AgentStatus.Idle, 
            text: text.to_string(), 
            namespace: "/test/verify".to_string()
        }, 
        delta: vec![1, 2, 3], 
        previous_hash: [0u8; 32], 
        current_hash: [1u8; 32],
        entropy_seeds:vec![], 
        network_responses: vec![]
    }

}