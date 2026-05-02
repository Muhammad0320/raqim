use std::sync::Mutex;

use anyhow::Ok;
use fastembed::{EmbeddingModel, InitOptions, TextEmbedding};

/// The Enterprise Interface. Allows swapping local FastEmbed for remote OpenAI/Voyage API calls
pub trait EmbeddingProvider: Send + Sync {
    fn embed(&self, text: &str) -> Result<Vec<f32>, anyhow::Error>;
    fn dimension(&self) -> i32;
}

/// The Open-Core Default: BGE-Base-EN-v1.5 (768 dims)
pub struct LocalBgeProvider {
    model: Mutex<TextEmbedding>,
}

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

impl EmbeddingProvider for LocalBgeProvider {
    fn embed(&self, text: &str) -> Result<Vec<f32>, anyhow::Error> {
        let mut model = self.model.lock().unwrap();

        // FastEmbed process batches, we just need the first item.
        let embeddings = model.embed(vec![text], None)?;
        Ok(embeddings[0].clone())
    }

    fn dimension(&self) -> i32 {
        768 // BGe-Base dimension size
    }
}
