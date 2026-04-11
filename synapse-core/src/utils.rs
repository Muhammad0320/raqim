pub fn parse_agent_id(hex_str: &str) -> Result<[u8; 16], anyhow::Error> {
    // Stip any accidental whitespace or '0x' the admin might have typed
    let clean_hex = hex_str.trim().trim_start_matches("0x");

    // Mathematically verify if it's eactly 32 hex characters (16 bytes)
    if clean_hex.len() != 32 {
        return Err(anyhow::anyhow!(
            "Agent ID must be exactly 32 hex characters"
        ));
    }

    // Decode the hex string into raw bytes
    let decoded = hex::decode(clean_hex)?;

    // Safely convert the dynamic  Vec<u8> into a fixed-size [u8; 16] array
    let mut array = [0u8; 16];
    array.copy_from_slice(&decoded);

    Ok(array)
}
