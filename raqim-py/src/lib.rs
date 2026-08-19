use ::raqim_core::{AgentState, AgentStatus, IngressEnvelope, generate_uuidv7_txid};
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

    #[pyo3(get)]
    capability_cert_bytes: Vec<u8>,
}

#[pymethods]
impl RaqimCryptoCore {
    #[new]
    fn new(pem_path: &str, cert_path: Option<&str>) -> PyResult<Self> {
        // PyO3 automatically translate std::io::Error from fs::read into python IOError!
        let key_bytes = std::fs::read(pem_path)?;
        let key_array: [u8; 32] = key_bytes
            .as_slice()
            .try_into()
            .map_err(|_| pyo3::exceptions::PyValueError::new_err("Private Key must be 32 bytes"))?;
        let signing_key = SigningKey::from_bytes(&key_array);

        let pub_key_bytes = signing_key.verifying_key().to_bytes();

        // 2. Load Capability Certificate
        let capability_cert = if let Some(path) = cert_path {
            std::fs::read(path).unwrap_or_default()
        } else {
            Vec::new()
        };

        Ok(Self {
            signing_key,
            pub_key_bytes,
            capability_cert_bytes: capability_cert,
        })
    }

    /// Signs any raw byte array and returns the 64-byte signature
    fn sign_payload<'py>(&self, py: Python<'py>, payload: &[u8]) -> PyResult<Bound<'py, PyBytes>> {
        let signature = self.signing_key.sign(payload).to_bytes();
        Ok(PyBytes::new(py, &signature))
    }

    /// Converts Python strings directly into zero-copy TCP payload
    fn generate_tcp_payload<'py>(
        &self,
        py: Python<'py>,
        agent_hex: &str,
        intent_path: &str,
        text: &str,
    ) -> PyResult<Bound<'py, PyBytes>> {
        let agent_id_bytes = hex::decode(agent_hex)
            .map_err(|e| pyo3::exceptions::PyValueError::new_err(e.to_string()));

        let agent_id_array: [u8; 16] = agent_id_bytes.try_into().map_err(|_| {
            pyo3::exceptions::PyValueError::new_err("Agent hex must be exactly 16-bytes")
        })?;

        let state = AgentState {
            agent_id: Some(agent_id_array),
            namespace: intent_path.to_string(),
            transaction_id: generate_uuidv7_txid(),
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
            capability_cert: self.capability_cert_bytes.clone(),
        };

        let serialized_envelope = rkyv::to_bytes::<rkyv::rancor::Error>(&envelope).unwrap();
        let mut final_payload = Vec::new();
        final_payload.extend_from_slice(&(serialized_envelope.len() as u32).to_le_bytes());
        final_payload.extend_from_slice(&serialized_envelope);

        Ok(PyBytes::new(py, &final_payload))
    }

    /// Computes Blake3 32-byte call signature hash over string parameters
    fn hash_call_signatures<'py>(
        &self,
        py: Python<'py>,
        call_inputs: &str,
    ) -> PyResult<Bound<'py, PyBytes>> {
        let mut hasher = blake3::Hasher::new_derive_key("raqim.effect.v1.signature");
        hasher.update(call_inputs.as_bytes());
        let hash_bytes = hasher.finalize();

        Ok(PyBytes::new(py, hash_bytes.as_bytes()))
    }
}

#[pymodule]
fn raqim_core(m: &Bound<'_, PyModule>) -> PyResult<()> {
    m.add_class::<RaqimCryptoCore>()?;
    Ok(())
}
