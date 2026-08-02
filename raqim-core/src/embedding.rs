use async_trait::async_trait;
use serde_json::json;
use std::sync::{Arc, Mutex};

#[cfg(feature = "native-embedding")]
use fastembed::{EmbeddingModel, InitOptions, TextEmbedding};

/// The Enterprise Interface. Allows swapping local FastEmbed for remote OpenAI/Voyage API calls
// Supporting single and high-throughtput batch vectorization
#[async_trait]
pub trait EmbeddingProvider: Send + Sync {
    async fn embed(&self, text: &str) -> Result<Vec<f32>, anyhow::Error>;
    async fn embed_batch(&self, text: &[String]) -> Result<Vec<Vec<f32>>, anyhow::Error>;
    fn dimension(&self) -> i32;
}

// ================================
// PATH A: NATIVE EMBEDDING ENGINE
// ================================

/// The Open-Core Default: BGE-Base-EN-v1.5 (768 dims)
#[cfg(feature = "native-embedding")]
pub struct LocalBgeProvider {
    model: Arc<Mutex<TextEmbedding>>,
}

#[cfg(feature = "native-embedding")]
impl LocalBgeProvider {
    pub fn new() -> Self {
        println!("[SYSTEM] initializing BGE-Base-EN-v1.5 Semantic Engine... ");

        // BGE is the current SOTA for local, small-footprint dense retreival
        let model = TextEmbedding::try_new(InitOptions::new(EmbeddingModel::BGEBaseENV15))
            .expect("FATAL: Failed to load BGE weights.");

        Self {
            model: Arc::new(Mutex::new(model)),
        }
    }
}

#[cfg(feature = "native-embedding")]
#[async_trait]
impl EmbeddingProvider for LocalBgeProvider {
    async fn embed(&self, text: &str) -> Result<Vec<f32>, anyhow::Error> {
        let res = self.embed_batch(&[text.to_string()]).await?;

        Ok(res[0].clone())
    }

    async fn embed_batch(&self, texts: &[String]) -> Result<Vec<Vec<f32>>, anyhow::Error> {
        let texts_clone = texts.to_vec();
        let model_clone = self.model.clone();

        // Offload CPU/SIMD matrix multiplication to Tokio blocking thread pool
        let res = tokio::task::spawn_blocking(move || {
            let mut model = model_clone
                .lock()
                .map_err(|e| anyhow::anyhow!("Mutex lock error: {}", e))?;
            model.embed(texts_clone, None)
        })
        .await??;

        Ok(res)
    }

    fn dimension(&self) -> i32 {
        768 // Bge-Base dimension size
    }
}

// ========================================
// PATH B: HIGH-THROUGHPUT BENCHMARK MOCK
// ========================================
#[cfg(all(feature = "mock-embedding", not(feature = "native-embedding")))]
#[derive(Debug, Clone)]
pub struct LocalBgeProvider;

#[cfg(all(feature = "mock-embedding", not(feature = "native-embedding")))]
impl LocalBgeProvider {
    pub fn new() -> Self {
        print!("[BENCHMARK PROFILE] Spawning Zero-Overhead Mock Semantic Engine... ");
        Self {}
    }
}

#[cfg(all(feature = "mock-embedding", not(feature = "native-embedding")))]
#[async_trait]
impl EmbeddingProvider for LocalBgeProvider {
    async fn embed(&self, _text: &str) -> Result<Vec<f32>, anyhow::Error> {
        Ok(vec![0.0f32; 768])
    }

    async fn embed_batch(&self, texts: &[String]) -> Result<Vec<Vec<f32>>, anyhow::Error> {
        Ok(vec![vec![0.0f32; 768]; texts.len()])
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
    async fn embed_batch(&self, text: &[String]) -> Result<Vec<Vec<f32>>, anyhow::Error> {
        let res = self
            .client
            .post("https://api.openai.com/v1/embeddings")
            .bearer_auth(&self.api_key)
            .json(&json!({ "input": text, "model": "text-embedding-3-large" }))
            .send()
            .await?
            .json::<serde_json::Value>()
            .await?;

        let data_array = res["data"]
            .as_array()
            .ok_or_else(|| anyhow::anyhow!("Invalid OpenAI response payload"))?;

        let mut results = Vec::with_capacity(data_array.len());
        for items in data_array {
            let embedding = items["embedding"]
                .as_array()
                .ok_or_else(|| anyhow::anyhow!("Malformed embedding vector"))?
                .iter()
                .map(|v| v.as_f64().unwrap() as f32)
                .collect();

            results.push(embedding);
        }

        Ok(results)
    }

    async fn embed(&self, text: &str) -> Result<Vec<f32>, anyhow::Error> {
        let res = self.embed_batch(&[text.to_string()]).await?;
        Ok(res[0].clone())
    }

    fn dimension(&self) -> i32 {
        3072
    }
}
