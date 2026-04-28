use ::raqim_core::{AgentState, AgentStatus, IngressEnvelope};
use ed25519_dalek::{Signer, SigningKey};
use pyo3::prelude::*;
use pyo3::types::PyBytes;

use std::time::{SystemTime, UNIX_EPOCH};

/// The Python Class wrapping the Rust Cryptography
#[pyclass]
struct RaqimCryptoCore {
    signing_key: SigningKey,

    #[pyo3(get)]
    pub_key_bytes: [u8; 32],
}

#[pymethods]
impl RaqimCryptoCore {
    #[new]
    fn new(pem_path: &str) -> PyResult<Self> {
        // PyO3 automatically translate std::io::Error from fs::read into python IOError!
        let key_bytes = std::fs::read(pem_path)?;
        let signing_key = SigningKey::from_bytes(key_bytes.as_slice().try_into().unwrap());

        let pub_key_bytes = signing_key.verifying_key().to_bytes();

        Ok(Self {
            signing_key,
            pub_key_bytes,
        })
    }

    /// Mathematically signs any raw byte array and returns the 64-byte signature
    fn sign_payload<'py>(&self, py: Python<'py>, payload: &[u8]) -> PyResult<Bound<'py, PyBytes>> {
        let signature = self.signing_key.sign(payload).to_bytes();
        Ok(PyBytes::new(py, &signature))
    }

    /// Converts Python strings directly into zero-copy TCP payload!
    fn generate_tcp_payload<'py>(
        &self,
        py: Python<'py>,
        agent_hex: &str,
        intent_path: &str,
        text: &str,
    ) -> PyResult<Bound<'py, PyBytes>> {
        let agent_id_bytes = hex::decode(agent_hex).unwrap();

        let agent_id_array: [u8; 16] = agent_id_bytes
            .try_into()
            .expect("Agent hex must be exactly 16-bytes");

        let state = AgentState {
            agent_id: Some(agent_id_array),
            namespace: intent_path.to_string(),
            transaction_id: 0,
            timestamp: SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs() as i64,
            status: AgentStatus::Idle,
            text: text.to_string(),
        };

        // rkyv Serialization & Ed25519 Signing happening natively in Rust C-Extension!
        let state_bytes = rkyv::to_bytes::<rkyv::rancor::Error>(&state).unwrap();
        let signature = self.signing_key.sign(&state_bytes).to_bytes();

        let envelope = IngressEnvelope {
            intent_path: intent_path.to_string(),
            public_key: self.pub_key_bytes,
            signature,
            state_bytes: state_bytes.into_vec(),
        };

        let serialized_envelope = rkyv::to_bytes::<rkyv::rancor::Error>(&envelope).unwrap();
        let mut final_payload = Vec::new();
        final_payload.extend_from_slice(&(serialized_envelope.len() as u32).to_le_bytes());
        final_payload.extend_from_slice(&serialized_envelope);

        Ok(PyBytes::new(py, &final_payload))
    }
}

#[pymodule]
fn raqim_core(m: &Bound<'_, PyModule>) -> PyResult<()> {
    m.add_class::<RaqimCryptoCore>()?;
    Ok(())
}
