

#[link(wasm_import_module = "synapse_env")]
extern "C" {

    host_emit_thought(ptr: *const u8, len: usize);
    fn host_register_capability(ptr: *const u8, len: usize);
    fn host_get_time() -> i64;
    fn host_request_entropy() -> u64;
    
    fn host_fetch_url(url_ptr: *const u8, url_len: usize, out_ptr: *mut u8, out_len: usize ) -> i32;
    
    fn host_ask_agent(
        cap_ptr: *const u8, cap_len: usize, 
        payload_ptr: *const u8, payload_len: usize,
    ) -> i32;

    fn host_pull_a2a_response(out_ptr: *mut u8)
    fn host_pull_http_response(out_ptr: *mut u8)
}


//  The Safe Rust Wrapper for Enterprise Developers
pub struct Raqim;

impl Raqim {

    pub fn get_time() -> i64 {
        unsafe {host_get_time()}
    }

    pub fn ask_swarm(capability: &str, question: &[u8]) -> Result<Vec<u8>, String> {

        // TODO: Hard cap to 1mb.
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


    pub fn fetch_url(url: &str) -> Result<String, String> {

        // First pass
        let required_size = unsafe {
            host_fetch_url(url.as_ptr(), url.len())
        }

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

    pub fn emit_thought(state: &AgentState) {
        let bytes = rkyv::to_bytes::<rkyv::rancor::Error>(state);
        unsafe {
            host_emit_thought(bytes.as_ptr(), bytes.len());
        }
    }

    pub fn register_capability(path: &str) {

        let bytes = path.as_bytes();

        unsafe {
            host_register_capability(bytes.as_ptr(), bytes.len())
        }

    }



}
