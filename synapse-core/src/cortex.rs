use std::sync::Arc;

use iceoryx2::prelude::*;
use iceoryx2::port::publisher::Publisher;
use iceoryx2::port::subscriber::Subscriber;

use crate::axon::AxonGateKeeper;
use crate::state::SwarmState;

#[repr(C)]
#[derive(Debug, Default, Clone, Copy)]
pub struct AgentThought {

    pub agent_id: [u8; 16],
    pub thought_id: u64,
    pub payload_size: u32,

}

// Explicitely tells the compiler that this struct is safe for zero-copy transmission. // It has no heap pointer, only flat primitives 
unsafe impl ZeroCopySend for AgentThought {}

pub  struct CortexDataPlane  {
  
    service_name: ServiceName

}

impl CortexDataPlane {

    pub fn new(topic:  &str) -> Self {

        let service_name = ServiceName::new(topic).expect("Invalid topic name");

        Self { service_name }
    }

    // Creates a publisher that writes zero-copy data
    pub fn create_publisher(&self) -> Result<Publisher<ipc::Service, AgentThought, ()>, Box<dyn std::error::Error>> {

        let node = NodeBuilder::new().create::<ipc::Service>()?; 

        let service = node.service_builder(&self.service_name)
                    .publish_subscribe::<AgentThought>()
                    .open_or_create()?;
                    

        let publisher = service.publisher_builder().create()?; 

        Ok(publisher)
    }

    pub fn create_subscriber(&self) -> Result<Subscriber<ipc::Service, AgentThought, ()>, Box<dyn std::error::Error>> {

        let node = NodeBuilder::new().create::<ipc::Service>()?;

        let service = node.service_builder(&self.service_name)
        .publish_subscribe::<AgentThought>()
        .open_or_create()?;

        let subscriber = service.subscriber_builder().create()?; 

        Ok(subscriber)
    }

    /// The uncomprormising local listener. Runs in a dedicated background thread.
    pub fn listen_for_local_thoughts(&self, brain: Arc<SwarmState>, axon: Arc<AxonGateKeeper>) {

    //  Subscriber is created on this specific thrad, so it doesn't cross boundaries.
        let subscriber = self.create_subscriber().expect("Failed to create lcoal subscriber");

        println!("Cortx Data Plane: Listening for zero-copy local thoughts...");

        // std::thread::spawn(move || {

        //     loop {

        //         if let Ok(Some(sample)) = subscriber.receive() {



        //         }
        //         std::thread::yield_now(); // Prevent CPU pinning
        //     }

        // });

    }

} 