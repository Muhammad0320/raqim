use async_trait::async_trait;
use serde_json::json;
use std::sync::{Arc, Mutex};

#[cfg(feature = "native-embedding")]
use fastembed::{EmbeddingModel, InitOptions, TextEmbedding};

/// The Enterprise Interface. Allows swapping local FastEmbed for remote OpenAI/Voyage API calls

#[async_trait]
pub trait EmbeddingProvider: Send + Sync {
    async fn embed(&self, text: &str) -> Result<Vec<f32>, anyhow::Error>;
    fn dimension(&self) -> i32;
}

// ================================
// PATH A: NATIVE EMBEDDING ENGINE
// ================================

/// The Open-Core Default: BGE-Base-EN-v1.5 (768 dims)
#[cfg(feature = "native-embedding")]
pub struct LocalBgeProvider {
    model: Mutex<TextEmbedding>,
}

#[cfg(feature = "native-embedding")]
impl LocalBgeProvider {
    pub fn new() -> Self {
        println!("[SYSTEM] initializing BGE-Base-EN-v1.5 Semantic Engine... ");

        // BGE is the current SOTA for local, small-footprint dense retreival
        let model = TextEmbedding::try_new(InitOptions::new(EmbeddingModel::BGEBaseENV15))
            .expect("FATAL: Failed to load BGE weights.");

        Self {
            model: Mutex::new(model),
        }
    }
}

#[cfg(feature = "native-embedding")]
#[async_trait]
impl EmbeddingProvider for LocalBgeProvider {
    async fn embed(&self, text: &str) -> Result<Vec<f32>, anyhow::Error> {
        // Run CPU-bound fastembed inside tokio::task::spawn_blocking to prevent async starvation
        let text_clone = text.to_string();
        let model_arc = Arc::new(Mutex::new(
            TextEmbedding::try_new(InitOptions::new(EmbeddingModel::BGEBaseENV15)).unwrap(),
        ));

        let res = tokio::task::spawn_blocking(move || {
            let mut model = model_arc.lock().unwrap();
            model.embed(vec![text_clone], None)
        })
        .await??;

        Ok(res[0].clone())
    }

    fn dimension(&self) -> i32 {
        768 // Bge-Base dimension size
    }
}

// ========================================
// PATH B: HIGH-THROUGHTPUT BENCHMARK MOCK
// ========================================
#[cfg(feature = "mock-embedding")]
pub struct LocalBgeProvider;

#[cfg(feature = "mock-embedding")]
impl LocalBgeProvider {
    pub fn new() -> Self {
        print!("[BENCHMARK PROFILE] Spawning Zero-Overhead Mock Semantic Engine... ");
        Self
    }
}

#[cfg(feature = "mock-embedding")]
#[async_trait]
impl EmbeddingProvider for LocalBgeProvider {
    async fn embed(&self, _text: &str) -> Result<Vec<f32>, anyhow::Error> {
        Ok(vec![0.0f32; 768])
    }

    fn dimension(&self) -> i32 {
        768
    }
}

// ---- OPENAI SOTA PROVIDER -----
pub struct OpenAIProvider {
    api_key: String,
    client: reqwest::Client,
}

impl OpenAIProvider {
    pub fn new(api_key: String) -> Self {
        println!("[SYSTEM] Booting Remote OpenAI text-embedding-3-large Engine... ");

        Self {
            api_key,
            client: reqwest::Client::new(),
        }
    }
}

#[async_trait]
impl EmbeddingProvider for OpenAIProvider {
    async fn embed(&self, text: &str) -> Result<Vec<f32>, anyhow::Error> {
        let res = self
            .client
            .post("https://api.openai.com/v1/embeddings")
            .bearer_auth(&self.api_key)
            .json(&json!({ "input": text, "model": "text-embedding-3-large" }))
            .send()
            .await?
            .json::<serde_json::Value>()
            .await?;

        let embedding_array = res["data"][0]["embedding"]
            .as_array()
            .ok_or_else(|| anyhow::anyhow!("Invalid OpenAI Response"))?;
        let floats: Vec<f32> = embedding_array
            .iter()
            .map(|v: &serde_json::Value| v.as_f64().unwrap() as f32)
            .collect();

        Ok(floats)
    }

    fn dimension(&self) -> i32 {
        3072
    }
}
