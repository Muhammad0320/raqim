use loro::{LoroDoc, LoroMap, ToJson};
use std::sync::Arc; 

// The shared hippocampus.
// ARC (Atomic Reference counting) becaue multiple (threads) agents will hold pointers to this document in memory
pub  struct SwarmState {
    doc: Arc<LoroDoc>
}

impl SwarmState {

    pub fn new() -> Self {

        let doc = LoroDoc::new();

        let _root_map = doc.get_map("hospital_triage");

        Self { doc: Arc::new(doc) }

    }

    /// Agent updates a specific key in the shared state
    pub fn update_patient_status(&self, patient_id: &str, status: &str ) {

        let map = self.doc.get_map("hospital_triage");

        // Insert the data. Loro tracks this exact ops mathematically
        map.insert(patient_id, status).expect("Failed to insert into CRDT");

        // commit the transaction. This generates a "Version Vector"; 
        self.doc.commit();
    }

    /// Extract the delta since the last sync. This is the payload we'll send to iceoryx2
    pub fn export_delta(&self) -> Vec<v8> {
        self.doc.export_from(&[])
    }

    /// Merges another agent's thought (action) into this agent's brain.
    /// Conflict resolution happens here autpmatically.
    pub fn merge_foreign_thought(&self, delta: &[u8]) {
        self.doc.import(delta).expect("Failed to merge CRDT delta");
    }

    /// Read the current unified truth
    pub fn get_current_truth(&self) -> String {
        self.doc.get_map("hospital_triage").get_value().to_json()
    }

}

#[cfg(test)]
mod tests {

    use super::*;

    #[test]
    fn test_crdt_split_brain_resolution() {

        println!("Bismillah. Testing Lock-Free Convergence...");

        // 1 Create two completely separate agent brains
        let agent_a = SwarmState::new();
        let agent_b = SwarmState::new();
        
     // 2. The Split-Brain Event happens simultaneouly
       agent_a.update_patient_status("patient_001", "STABLE");
       agent_b.update_patient_status("patient_001", "CRITICAL");
       agent_b.update_patient_status("patient_002", "DISCHARGED");

    // 3. They export thier microscopic thoughts (Deltas)
    let thought_a = agent_a.export_delta();
    let thought_b = agent_b.export_delta();

    // 4. They cross-pollinate (This happens via iceoryx2 in prod)
    agent_a.merge_foreign_thought(&thought_b);
    agent_b.merge_foreign_thought(&thought_a);

    // 5. The verification: 
    let truth_a = agent_a.get_current_truth();
    let truth_b = agent_b.get_current_truth();

    println!("Agent A Reality: {}", truth_a);
    println!("Agent B Reality: {}", truth_b);


    assert_eq!(truth_a, truth_b, "CRDT Convergence Failed!");
    println!("Allihamdullilah. Swarm minds successfully syncronized lock-free.")
    }
}
