use clap::{Parser, Subcommand};
use memmap2::MmapOptions;
use rkyv::Archive;
use std::fs::File;
use std::path::PathBuf;
use raqim_core::OpLog;
use raqim_core::axon::AxonGateKeeper;
use raqim_core::state::SwarmState;

/// Raqim Control Plane: Time Travel & Forensic Audit API
#[derive(Parser)]
#[command(author, version, about, long_about=None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Replay an agent's history from a WAL file
    Replay {
        /// Path to the physical .wal file
        #[arg(short, long)]
        wal: PathBuf,

        /// The exact transaction ID to rewind to
        #[arg(short, long)]
        tx_id: Option<u64>,
    },
}

fn main() {
    let cli = Cli::parse();

    match &cli.command {
        Commands::Replay { wal, tx_id } => {
            execute_time_travel(wal, *tx_id);
        }
    }
}

fn execute_time_travel(wal_path: &PathBuf, target_tx_id: Option<u64>) {
    println!("Bismillah. Initializing Project Raqim Time Machine...");

    // 1. Initialize empty, clean layers
    let forensic_brain = SwarmState::new("hospital_triage");
    let auditor = AxonGateKeeper::new();

    // 2. True zero-copy: Memory map the physical file
    let file = File::open(wal_path).expect("Failed to open WAL file");
    let mmap = unsafe {
        MmapOptions::new()
            .map(&file)
            .expect("Failed to memory map the WAL")
    };

    // Let's simulate processing a verified Oplog we extracted from the bytes:
    println!("Scanning WAL for Markle DAG integrity...");

    let mut offset = 0;
    let mut valid_thoughts = 0;

    // 3. Frame-by-Frame Zero-Copy Deserialization
    while offset < mmap.len() {
        // Read the 4-bytes length prefix
        if offset + 4 > mmap.len() {
            break;
        }
        let mut len_bytes = [0u8; 4];
        len_bytes.copy_from_slice(&mmap[offset..offset + 4]);
        let entry_len = u32::from_le_bytes(len_bytes) as usize;
        offset += 4;

        // Cast the exact memory slide directly to the ArchivedOpLog using rkyv
        let entry_slice = &mmap[offset..offset + entry_len];

        // Instant 0(1) pointer casting. Zero parsing
        let archived_log =
            unsafe { rkyv::access_unchecked::<<OpLog as Archive>::Archived>(entry_slice) };

        // Convert archived to native strucut for axon verfication
        let log: OpLog = rkyv::deserialize::<OpLog, rkyv::rancor::Error>(archived_log)
            .expect("Failed to deserialize");

        // 4. Verfication: Did someone tamper with the past?
        if !auditor.verify_foreign_thoughts(&log) {
            eprintln!(
                "CRITICAL ALERT: Markle DAG broken at TXID: {}",
                log.state.transaction_id
            );
            std::process::exit(1)
        }

        // 5. Tim travel check: Stop After applying the target.
        if let Some(target) = target_tx_id {
            if log.state.transaction_id > target {
                println!("Reached Target Time (TxID: {}. Halting replay.", target);
                break;
            }
        }

        // 6. Push the verfied thought into crdt
        forensic_brain.assimilate_foreign_thought(&log.delta);

        valid_thoughts += 1;
        offset += entry_len;
    }

    println!(" ========================================");
    println!(
        " Time Travel Complete. Verified {} Thoughts. ",
        valid_thoughts
    );
    println!(" ========================================");
}
