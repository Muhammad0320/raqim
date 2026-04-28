use std::sync::Arc;

use iceoryx2::port::publisher::Publisher;
use iceoryx2::port::subscriber::Subscriber;
use iceoryx2::prelude::*;
use tokio::sync::broadcast::Sender;

use crate::axon::AxonGateKeeper;
use crate::state::SwarmState;
use crate::{OpLog, SystemEvent};

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
}

/// The uncomprormising local listener. Runs in a dedicated background thread.
pub fn listen_for_local_thoughts(
    topic_name: String,
    brain: Arc<SwarmState>,
    axon: Arc<AxonGateKeeper>,
    tx: Sender<SystemEvent>,
) {
    //  Subscriber is created on this specific thrad, so it doesn't cross boundaries.
    std::thread::spawn(move || {
        //  Initialize inside the thread
        let cortex = CortexDataPlane::new(&topic_name);

        let subscriber = cortex
            .create_subscriber()
            .expect("Failed to create lcoal subscriber");

        println!("Cortx Data Plane: Listening for zero-copy local thoughts...");

        //  Read from shared physical RAM
        loop {
            if let Ok(Some(sample)) = subscriber.receive() {
                let payload_bytes = sample.payload();

                // Zero copy deserialization of the dynamic bytes
                let archived_log = unsafe {
                    rkyv::access_unchecked::<<OpLog as rkyv::Archive>::Archived>(payload_bytes)
                };

                // The Circuit Breaker
                if axon.verify_foreign_thoughts(&archived_log) {
                    brain
                        .assimilate_foreign_thought(&archived_log.delta.as_slice())
                        .expect("FATAL: failed to assimilate thought");
                    println!(
                        "Cortex: Assimilated thought from Agent: {:?}",
                        archived_log.agent_id.as_slice()
                    );
                } else {
                    println!("CRITICAL ALERT: Local tampering detected. Dropping thoughts.");
                    let _ = tx.send(SystemEvent::SecurityBreach {
                        agent_id: hex::encode(&archived_log.agent_id.as_slice()),
                        reason: "Local tampering detected - Markle Hash Mismatch ".to_string(),
                        culprit_text: archived_log.state.text.as_str().to_string(),
                    });
                }
            }

            std::thread::yield_now();
        }
    });
}
