

#[link(wasm_import_module = "synapse_env")]
extern "C" {

    host_emit_thought(ptr: *const u8, len: usize);
    fn host_get_time() -> i64;
    fn host_ask_agent(
        cap_ptr: *const u8, cap_len: usize, 
        payload_ptr: *const u8, payload_len: usize,
        out_ptr: *mut u8, max_len: usize
    ) -> 132;

}


//  The Safe Rust Wrapper for Enterprise Developers
pub struct Raqim;

impl Raqim {

    pub fn get_time() -> i64 {
        unsafe {host_get_time()}
    }

    pub fn ask_swarm(capability: &str, question: &[u8]) -> Result<Vec<u8>, String> {

        // Pre-allocate a 1MB buffer for response
        let mut res_buffer = vec![0u8; 1024 * 1024];

        let bytes_written = unsafe {
            host_ask_agent(
                capability.as_ptr(), capability.len(), 
                question.as_ptr(), question.len(), 
                res_buffer.as_mut_ptr(), res_buffer.len()
            )
        };

        if bytes_written < 0 {
            return Err("A2A Request Failed".to_string());
        }

        res_buffer.truncate(bytes_written as usize);
        Ok(res_buffer)

    }

    pub fn emit_thought(text: &str) {

        let bytes = text.as_bytes();
        unsafe {
            host_emit_thought(bytes.as_ptr(), bytes.len() );
        }

    }

}
