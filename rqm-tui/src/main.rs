use crossterm::{
    event::{self, KeyCode},
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
    ExecutableCommand,
};
use ratatui::{
    prelude::*,
    widgets::{Block, Borders, Paragraph},
};
use std::io::{stdout, Result};

#[tokio::main]
async fn main() -> Result<()> {

    println!("Bismillah. Booting RQM Mission Control...");

    // Setup Terminal for TUI
    stdout().execute(EnterAlternateScreen)?;
    enable_raw_mode()?;
    let mut terminal = Terminal::new(CrosstermBackend::new(stdout()))?;

    // Main UI loop 

}

fn ui(f: &mut Frame) {

    // 1. Split the screen horizontally into right and left column
    

}