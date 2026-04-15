use crossterm::{
    ExecutableCommand,
    event::{self, Event, KeyCode},
    terminal::{EnterAlternateScreen, LeaveAlternateScreen, disable_raw_mode, enable_raw_mode},
};
use ratatui::{
    prelude::*,
    widgets::{Block, Borders, List, ListItem, Paragraph},
};
use std::{
    io::{Result, stdout},
    time::Duration,
};
use raqim_core::{OpLog, SystemEvent, config::RaqimConfig};
use tokio::sync::mpsc::channel;

// 1. The State machine
enum AppMode {
    LiveLedger,
    TimeMachineReplay,
}

struct AppState {
    mode: AppMode,
    ledger_stream: Vec<String>,
    active_agents: Vec<String>,
    aegis_alert: Vec<String>,
    replay_input_text: String,
    replay_result: String,
}

impl AppState {
    fn new() -> Self {
        Self {
            mode: AppMode::LiveLedger,
            ledger_stream: vec!["[SYSTEM] Raqim OS Mission Control Initialized...".to_string()],
            active_agents: Vec::new(),
            aegis_alert: Vec::new(),
            replay_input_text: String::new(),
            replay_result: "Enter a TxID to query the WAL".to_string(),
        }
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    let config = RaqimConfig::load_or_bootstrap();

    // Extract ENV vars

    let wal_path = config.wal_path;

    // 2. Terminal Hijack (Raw mode)
    enable_raw_mode()?;
    stdout().execute(EnterAlternateScreen)?;
    let mut terminal = Terminal::new(CrosstermBackend::new(stdout()))?;

    let mut app = AppState::new();
    let (_, mut rx) = channel::<SystemEvent>(1000);

    // 3. The Infinite Render Loop
    loop {
        while let Ok(event) = rx.try_recv() {
            match event {
                SystemEvent::ThoughtCommited { agent_id, tx_id } => {
                    app.ledger_stream.push(format!(
                        "[TxID: {}] Agent {} commited.",
                        tx_id,
                        &agent_id[0..8]
                    ));
                    let short_id = format!("Agent {}", &agent_id[0..8]);
                    if !app.active_agents.contains(&short_id) {
                        app.active_agents.push(short_id);
                    }
                }

                SystemEvent::SecurityBreach {
                    agent_id,
                    reason,
                    culprit_text,
                } => {
                    app.aegis_alert.push(format!(
                        "[ALERT]: {}: {} :: The agent tried to say: {}",
                        &agent_id[0..8],
                        reason,
                        culprit_text
                    ));
                }

                SystemEvent::PluginLoaded { plugin_name } => {
                    app.ledger_stream
                        .push(format!("[SYSTEM] WASM Plugin Loaded: {} ", plugin_name));
                }

                SystemEvent::CompactionTriggered { archived_count } => {
                    app.ledger_stream.push(format!(
                        "[SYSTEM] LanceDB Archived: {} thoughts.",
                        archived_count
                    ));
                }
            }

            if app.ledger_stream.len() > 100 {
                app.ledger_stream.remove(0);
            }
        }

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
            let mode_str = match app.mode {
                AppMode::LiveLedger => "LIVE MONITOR",
                AppMode::TimeMachineReplay => "FORENSIC REPLAY MODE",
            };

            let header_text =
                Paragraph::new(format!(" raqim :: ZERO-COPY AGENT OS :: {} ", mode_str))
                    .style(
                        Style::default()
                            .fg(Color::Cyan)
                            .add_modifier(Modifier::BOLD),
                    )
                    .block(Block::default().borders(Borders::ALL));
            f.render_widget(header_text, main_chunks[0]);

            // Mode Switching Logic
            match app.mode {
                AppMode::LiveLedger => {
                    let ledger_items: Vec<ListItem> = app
                        .ledger_stream
                        .iter()
                        .map(|s| ListItem::new(s.as_str()))
                        .collect();
                    f.render_widget(
                        List::new(ledger_items)
                            .block(Block::default().title(" Ledger ").borders(Borders::ALL)),
                        body_chunk[0],
                    );

                    let roster_items: Vec<ListItem> = app
                        .active_agents
                        .iter()
                        .map(|s| ListItem::new(s.as_str()))
                        .collect();
                    f.render_widget(
                        List::new(roster_items).block(
                            Block::default()
                                .title(" Swarm Roster ")
                                .borders(Borders::ALL),
                        ),
                        sidebar_chunks[0],
                    );

                    let aegis_items: Vec<ListItem> = app
                        .aegis_alert
                        .iter()
                        .map(|s| ListItem::new(s.as_str()))
                        .collect();
                    f.render_widget(
                        List::new(aegis_items).block(
                            Block::default()
                                .title(" Aegis Monitor ")
                                .borders(Borders::ALL),
                        ),
                        sidebar_chunks[1],
                    );
                }

                AppMode::TimeMachineReplay => {
                    let replay_chunk = Layout::default()
                        .direction(Direction::Vertical)
                        .constraints([Constraint::Length(3), Constraint::Min(0)])
                        .split(main_chunks[1]);

                    let input = Paragraph::new(format!(" Query TxID: {}_ ", app.replay_input_text))
                        .block(
                            Block::default()
                                .title(" Time Machine ")
                                .borders(Borders::ALL)
                                .style(Style::default().fg(Color::Yellow)),
                        );
                    f.render_widget(input, replay_chunk[0]);

                    let result = Paragraph::new(app.replay_result.as_str()).block(
                        Block::default()
                            .title(" Cryptographic State Viewer ")
                            .borders(Borders::ALL),
                    );
                    f.render_widget(result, replay_chunk[1]);
                }
            }
        })?;

        // 3. Event Handling
        if event::poll(Duration::from_millis(50))? {
            if let Event::Key(key) = event::read()? {
                match app.mode {
                    AppMode::LiveLedger => {
                        if key.code == KeyCode::Char('q') {
                            break;
                        }
                        if key.code == KeyCode::Tab {
                            app.mode = AppMode::TimeMachineReplay
                        }
                    }

                    AppMode::TimeMachineReplay => {
                        match key.code {
                            KeyCode::Esc | KeyCode::Tab => app.mode = AppMode::LiveLedger,
                            KeyCode::Char(c) => app.replay_input_text.push(c),
                            KeyCode::Backspace => {
                                app.replay_input_text.pop();
                            }
                            KeyCode::Enter => {
                                app.replay_result = format!(
                                    "Scanning WAL for TxID {} ... ( Integration Pending ) ",
                                    app.replay_input_text
                                );

                                // Directly Open the WAL file from the TUI
                                if let Ok(mut file) = std::fs::File::open(&wal_path) {
                                    use std::io::Read;
                                    let mut buffer = Vec::new();
                                    if file.read_to_end(&mut buffer).is_ok() {
                                        let mut offset = 0;
                                        let mut found = false;

                                        while offset < buffer.len() {
                                            if offset + 4 > buffer.len() {
                                                break;
                                            }
                                            let mut len_bytes = [0u8; 4];
                                            len_bytes.copy_from_slice(&buffer[offset..offset + 4]);

                                            let entry_len = u32::from_le_bytes(len_bytes) as usize;
                                            offset += 4;

                                            let entry_bytes = &buffer[offset..offset + entry_len];
                                            let archived_log = unsafe {
                                                rkyv::access_unchecked::<
                                                    <OpLog as rkyv::Archive>::Archived,
                                                >(
                                                    entry_bytes
                                                )
                                            };

                                            if let Ok(log) =
                                                rkyv::deserialize::<OpLog, rkyv::rancor::Error>(
                                                    archived_log,
                                                )
                                            {
                                                // Check if the TxID matches the user's search!

                                                if log.state.transaction_id.to_string()
                                                    == app.replay_input_text
                                                {
                                                    app.replay_input_text = format!(
                                                        "FOUND TX: {}\nStatus: {:?}\n Time: {}\nText: {}\n Prev Hash: {}\n Curr Hash: {}",
                                                        log.state.transaction_id,
                                                        hex::encode(log.agent_id),
                                                        log.state.timestamp,
                                                        log.state.text,
                                                        hex::encode(log.previous_hash),
                                                        hex::encode(log.current_hash)
                                                    );

                                                    found = true;
                                                    break;
                                                }
                                            }
                                            offset += entry_len;

                                            if !found {
                                                app.replay_result = "ERROR: TxID not found in WAL or Compactor moved it to LanceDB.".to_string();
                                            }
                                        }
                                    } else {
                                        app.replay_result = "ERROR: Could not open production.wal. Is the Daemon running?".to_string()
                                    }

                                    app.replay_input_text.clear();
                                }
                            }
                            _ => {}
                        }
                    }
                }
            }
        }
    }
    // 6. CLEANUP ( Returning the terminal to normal )
    disable_raw_mode()?;
    stdout().execute(LeaveAlternateScreen)?;
    Ok(())
}
