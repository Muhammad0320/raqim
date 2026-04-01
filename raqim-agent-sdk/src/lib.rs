

#[link(wasm_import_module = "synapse_env")]
extern "C" {

    host_emit_thought(ptr: *const u8, len: usize);
    fn host_get_time() -> i64;
    fn host_ask_agent(
        cap_ptr: *const u8, cap_len: usize, 
        payload_ptr: *const u8, payload_len: usize,
        out_ptr: *mut u8, max_len: usize
    ) -> 132;
    fn host_register_capability(ptr: *const u8, len: usize);

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
            host_ask_agent(capability.as_ptr(), capability.len(), question.as_ptr(), question.len(), std::ptr::null_mut(), 0 )
        };

        if required_size < 0 {
            return Err("A2A Request Failed".to_string());
        }

        if required_size == 0 {
            return Ok(Vec::new())
        }

        
        
        // PASS 2: Allocate exactly what is needed and fetch the data
        let mut res_buffer = vec![0u8; required_size as usize];

        let bytes_written = unsafe {
            host_ask_agent(
                capability.as_ptr(), capability.len(), 
                question.as_ptr(), question.len(), 
                res_buffer.as_mut_ptr(), res_buffer.len()
            )
        };

        if bytes_written != required_size {
            return Err("Memory mismatch during 2-pass allocation".to_string());
        }


        Ok(res_buffer)
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
