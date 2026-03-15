use crossterm::{
    ExecutableCommand,
    event::{self, Event, KeyCode, KeyModifiers},
    execute,
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
        terminal.draw(|f| {
            let size = f.size();

            // ---- The hierarchical layout engine ----

            // Split 1: Header ( 3 lines tall ) vs Body ( the rest )
            let main_chunks = Layout::default()
                .direction(Direction::Vertical)
                .constraints([Constraint::Length(3), Constraint::Min(0)])
                .split(size);

            // Split 2: The Body -> Ledger (65% width) Vs. Sidebar (35%)
            let body_chunk = Layout::default()
                .direction(Direction::Horizontal)
                .constraints([Constraint::Percentage(65), Constraint::Percentage(35)])
                .split(main_chunks[1]);

            // Split 3: The Sidebar -> Roster (50% height) Aegis (50% height)
            let sidebar_chunks = Layout::default()
                .direction(Direction::Vertical)
                .constraints([Constraint::Percentage(50), Constraint::Percentage(50)])
                .split(body_chunk[1]);

            // ---------- Painting the Widgets -----------------
            // The header
            let header_text = Paragraph::new(" RQM :: ZERO-COPY AGENT OS :: MISSION CONTROL ")
                .style(
                    Style::default()
                        .fg(Color::Cyan)
                        .add_modifier(Modifier::BOLD),
                )
                .block(Block::default().borders(Borders::ALL));
            f.render_widget(header_text, main_chunks[0]);

            // The Ledger ( Primary Focus )
        })
    }

    // 6. CLEANUP ( Returning the terminal to normal )
    disable_raw_mode()?;
    stdout().execute(LeaveAlternateScreen)?;
    Ok(())
}
