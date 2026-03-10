use lancedb::arrow::array::{
    BinaryArray, FixedSizeListArray, Int64Array, RecordBatch, StringArray,
};
use lancedb::arrow::datatypes::{DataType, Field, Float32Type, Schema};
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
                dims: vector_dim,
            }
    }

    /// The exact Apache Arrow Schema mapping for our OpLog
    fn schema(&self) -> Arc<Schema> {

        Arc::new(Schema::new(vec![
            Field::new("tx_id", DataType::Int64, false),
            Field::new("agent_id", DataType::Utf8, false),
            // We store the raw binary delta i.e the AgentState and delta 

            Field::new("payload", DataType::Binary, false),
            Field::new("vector", DataType::FixedSizeList(Arc::new(Field::new("item", DataType::Float32, false)), self.dims), false),
            
        ]))

    }

    /// Takes a batch of OpLogs and their corresponding calculated vectors
    /// and performs Row-to-Columnar transformation before saving.
    pub async fn archive_batch(&self, logs: &[OpLog], vectors: &[Vec<f32>]) {

        if logs.is_empty() || logs.len() != vectors.len() {return;}

        // 1. Columnar transformation (Tearing struct apart)
         let tx_ids: Vec<i64> = logs.iter().map(|l| l.state.transaction_id as i64 ).collect();
         let agent_ids: Vec<String> = logs.iter().map(|l| hex::encode(l.agent_id)).collect();
         let payloads: Vec<&[u8]> = logs.iter().map(|l| l.delta.as_slice()).collect();

        // 2. Build the Zero-Copy Arrow Arrays
        let tx_id_array = Arc::new(Int64Array::from(tx_ids));
        let agent_id_array = Arc::new(StringArray::from(agent_ids));
        let payload_array = Arc::new(BinaryArray::from(payloads));

        let vector_array = Arc::new(
          FixedSizeListArray::from_iter_primitive(vectors.iter().map(|v| Some(v.iter().map(|&f| Some(f)).collect::<Vec<_>>()))
            , self.dims) 
        ); 

        // 3. Assemble the RecordBatch 
        let batch = RecordBatch::try_new(self.schema(), vec![
            tx_id_array as Arc<dyn arrow_array::Array>,
            agent_id_array as Arc<dyn arrow_array::Array>,
            payload_array as Arc<dyn arrow_array::Array>,
            vector_array as Arc<dyn arrow_array::Array>
        ]).expect("Failed to build Arrow RecordBatch");

        // 4. Commit to the DB
        let table_names = self.db.table_names().execute().await.unwrap();
        if table_names.contains(&self.table_name) {

            let table = self.db.open_table(&self.table_name).execute().await.unwrap();
            table.add(vac![batch]).execute().await.unwrap()

        } else {
            let batches = RecordBatchIterator::new(vec![Ok(batch)], self.schema());
            self.db.create_table(&self.table_name, batches).execute().await.unwrap();
        }

    }

}
