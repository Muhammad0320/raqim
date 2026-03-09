use arrow_array::{types::Float32Type};
use lancedb::arrow::arrow_schema::{DataType, Field, Schema};
use lancedb::connection::Connection;
use lancedb::connect;
use std::sync::Arc;
use crate::OpLog;

pub struct LanceEngine {
    db: Connection,
    table_name: String,
    // The Size of LLM's embedding vector (e.g., 384 or 1536)
    dims: i32
}

impl LanceEngine {

    pub async fn new(storage_path: &str, table_name: &str, vector_dim: i32) -> Self {

            println!("Bismillah. Booting LanceEngine...");
            let db = connect(storage_path).execute().await.expect("Failed to connect to lanceDB");

            Self {
                db, 
                table_name: table_name.to_string(),
                dims: vector_dims,
            }
    }

}
