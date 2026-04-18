use raqim_core::AgentState;

#[link(wasm_import_module = "raqim_env")]
extern "C" {

    fn host_emit_thought(ptr: *const u8, len: usize);
    fn host_register_capability(ptr: *const u8, len: usize);
    fn host_get_time() -> i64;
    fn host_request_entropy() -> u64;
    
    fn host_fetch_url(url_ptr: *const u8, url_len: usize, out_ptr: *mut u8, out_len: usize ) -> i32;
    
    fn host_ask_agent(
        cap_ptr: *const u8, cap_len: usize, 
        payload_ptr: *const u8, payload_len: usize,
    ) -> i32;

    fn host_pull_a2a_response(out_ptr: *mut u8);
    fn host_pull_http_response(out_ptr: *mut u8);

        // The A2A Listener Suite
        fn host_register_capability(cap_ptr: *const u8, cap_len: usize); 
        fn host_await_a2a_question((out_ptr: *const u8, max_len: i32)) -> 132;
        fn host_reply_a2a(ptr: *const u8, len: usize);
    
}

//  The Safe Rust Wrapper for Enterprise Developers
pub struct Raqim;

impl Raqim {

    /// Get deterministic time (safe for replay)
    pub fn time() -> i64 {
        unsafe {host_get_time()}
    }

    /// Sends an A2A RPC to another agent ( Zero-Trust, Ephemeral )
    pub fn ask_swarm(capability: &str, question: &[u8]) -> Result<Vec<u8>, String> {

        // PASS 1: Ask the required buffer size 
        let required_size = unsafe {
            host_ask_agent(capability.as_ptr(), capability.len(), question.as_ptr(), question.len())
        };

        if required_size < 0 {
            return Err("A2A Request Failed or Payload exceeds 2MB limit ".to_string());
        }

        if required_size == 0 {
            return Ok(Vec::new())
        }
        
        // PASS 2: Allocate exactly what is needed and fetch the data
        let mut exact_buffer = vec![0u8; required_size as usize];

        unsafe {
            host_pull_a2a_response(exact_buffer.as_mut_ptr())
        };
        
        Ok(exact_buffer)
    }

    /// Get deterministic randomness (Safe for replay)
    pub fn entropy() -> u64 {unsafe {host_request_entropy()}}

    /// Get the network response to a url
    pub fn fetch_url(url: &str) -> Result<String, String> {

        // First pass
        let required_size = unsafe {
            host_fetch_url(url.as_ptr(), url.len())
        };

        if required_size < 0 {
            return Err("Network request failed or payload exceeds 2MB limit ".to_string());
        }

        if required_size == 0 {
            return Ok("".to_string())
        }

        // Second pass
        let mut exact_buffer = vec![0u8; required_size as usize];
        unsafe {
            host_pull_http_response(exact_buffer.as_mut_ptr())
        };

        String::from_utf8(exact_buffer).map_err(|e| e.to_string())
    }

    /// Commits a fact to the permanent Loro CRDT
    pub fn emit_thought(state: &AgentState) {
        let bytes = rkyv::to_bytes::<rkyv::rancor::Error>(state);
        unsafe {
            host_emit_thought(bytes.as_ptr(), bytes.len());
        }
    }

    /// Exposes a capability to the global swarm. 
    /// This enters an infinite Zero-cpu listening loop
    pub fn server_capability<F>(capability: &str, mut handler: F)
    where f: FnMut(&[u8]) -> Vec<u8> {

        unsafe { host_register_capability(capability.as_ptr(), capability.len() ); }

        let mut question_buffer = vec![0u8; 2 * 1024 * 1024]; 

        // The eternal server loop 
        loop {

            // This function yields to the os. It consumes ZERO CPU while waiting.
            let bytes_read = unsafe { host_await_a2a_question((question_buffer.as_mut_ptr(), question_buffer.len() as i32 )) };

            if bytes_read > 0 {

                let question = &question_buffer[..bytes_read as usize];
                
                // Developer's AI logic executes here!
                let answer = handler(question);

                // Fire the answer back through the OS
                unsafe {host_reply_a2a(answer.as_ptr(), answer.len() ); }
            }

        };
    }

}
