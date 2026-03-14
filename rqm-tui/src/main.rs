use crossterm::{
    ExecutableCommand,
    event::{self, Event, KeyCode, KeyModifiers},
    terminal::{EnterAlternateScreen, LeaveAlternateScreen, disable_raw_mode, enable_raw_mode},
};
use ratatui::{
    prelude::*,
    widgets::{Block, Borders, Clear, List, ListItem, Paragraph},
};
use std::io::{Result, stdout};
use std::time::Duration;

// 1. The State machine
enum AppMode {
    LiveLedger,
    TimeMachineReplay,
}

struct AppState {
    mode: AppMode,
    live_logs: Vec<String>,
    active_agents: Vec<String>,
    search_input: String,
}

impl AppState {
    fn new() -> Self {
        Self {
            mode: AppMode::LiveLedger,
            live_logs: vec!["[SYSTEM] Raqim OS TUI Initialized...".to_string()],
            active_agents: vec![],

            search_input: String::new(),
        }
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    // 2. Terminal Hijack (Raw mode)
    enable_raw_mode()?;
    stdout().execute(EnterAlternateScreen)?;
    let mut terminal = Terminal::new(CrosstermBackend::new(stdout()))?;

    let mut app = AppState::new();

    // 3. The Infinite Render Loop
    loop {
        //  --- THE RENDERER ---
        terminal.draw(|frame| {
            let area = frame.size();
        })
    }
}
