use iceoryx2::port::publisher::Publisher;
use iceoryx2::port::subscriber::Subscriber;
use iceoryx2::prelude::*;

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
