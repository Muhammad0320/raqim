use std::sync::Arc;

use iceoryx2::port::publisher::Publisher;
use iceoryx2::port::subscriber::Subscriber;
use iceoryx2::prelude::*;

use crate::OpLog;
use crate::axon::AxonGateKeeper;
use crate::state::SwarmState;

// #[repr(C)]
// #[derive(Debug, Default, Clone, Copy)]
// pub struct AgentThought {

//     pub agent_id: [u8; 16],
//     pub thought_id: u64,
//     pub payload_size: u32,

//     // The HFT flat buffer. Holds the entire zero-copy serialized Oplog.
//     pub serialized_oplog: [u8; 8192]
// }

// // Explicitely tells the compiler that this struct is safe for zero-copy transmission. // It has no heap pointer, only flat primitives
// unsafe impl ZeroCopySend for AgentThought {}

pub struct CortexDataPlane {
    service_name: ServiceName,
}

impl CortexDataPlane {
    pub fn new(topic: &str) -> Self {
        let service_name = ServiceName::new(topic).expect("Invalid topic name");

        Self { service_name }
    }

    // Notice we use [u8]  a dynamic byte slice instead of a fixed struct!

    pub fn create_publisher(
        &self,
    ) -> Result<Publisher<ipc::Service, [u8], ()>, Box<dyn std::error::Error>> {
        let node = NodeBuilder::new().create::<ipc::Service>()?;

        let service = node
            .service_builder(&self.service_name)
            .publish_subscribe::<[u8]>()
            .open_or_create()?;

        let publisher = service.publisher_builder().create()?;

        Ok(publisher)
    }

    pub fn create_subscriber(
        &self,
    ) -> Result<Subscriber<ipc::Service, [u8], ()>, Box<dyn std::error::Error>> {
        let node = NodeBuilder::new().create::<ipc::Service>()?;

        let service = node
            .service_builder(&self.service_name)
            .publish_subscribe::<[u8]>()
            .open_or_create()?;

        let subscriber = service.subscriber_builder().create()?;

        Ok(subscriber)
    }

    /// The uncomprormising local listener. Runs in a dedicated background thread.
    pub fn listen_for_local_thoughts(&self, brain: Arc<SwarmState>, axon: Arc<AxonGateKeeper>) {
        //  Subscriber is created on this specific thrad, so it doesn't cross boundaries.
        let subscriber = self
            .create_subscriber()
            .expect("Failed to create lcoal subscriber");

        println!("Cortx Data Plane: Listening for zero-copy local thoughts...");

        //  Read from shared physical RAM
        std::thread::spawn(move || {
            loop {
                if let Ok(Some(sample)) = subscriber.receive() {
                    let payload_bytes = sample.payload();

                    // Zero copy deserialization of the dynamic bytes
                    let archived_log = unsafe {
                        rkyv::access_unchecked::<<OpLog as rkyv::Archive>::Archived>(payload_bytes)
                    };

                    let log: OpLog = rkyv::deserialize::<OpLog, rkyv::rancor::Error>(archived_log)
                        .expect("Cortex deserialization failed");

                    // The Circuit Breaker
                    if axon.verify_foreign_thoughts(&log) {
                        brain.assimilate_foreign_thought(&log.delta);
                        println!("Cortex: Assimilated thought from Agent: {:?}", log.agent_id);
                    } else {
                        println!("CRITICAL ALERT: Local tampering detected. Dropping thoughts.")
                    }
                }

                std::thread::yield_now();
            }
        });
    }
}
