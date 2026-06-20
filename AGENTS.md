# Raqim Synapse — Cross-Environment Development Rules

## Architecture: Split-Environment Monorepo

This project operates across **two environments**. Every agent, tool, and human working on this codebase MUST follow these rules strictly.

### Environment Map

| Layer | Canonical Location | Role |
|-------|-------------------|------|
| **UI Projects** (`raqim-cloud`, `raqim-console`) | `C:\Users\ASUS-PC\Desktop\Everything\feb-21\synapse\` | **READ + WRITE** — All UI development happens here. `npm install`, `npm run dev`, builds, and deployments run from Windows. |
| **Backend / Core** (`raqim-core`, `raqim-cli`, `raqim-mcp`, `raqim-agent-sdk`, `raqim-py`, `raqim-siege`, `raqim-tui`, `synapse-mcp`, `plugins`) | `\\wsl.localhost\Ubuntu-22.04\home\muhammad\projects\raqim\synapse\` | **READ ONLY** — Source of truth for all backend layers. Never write here from Windows. Never push git from here. |

### Hard Rules

1. **All UI code changes** (`raqim-cloud/`, `raqim-console/`) → write to the **Windows** path.
2. **All backend references** (daemon types, SDK interfaces, MCP schemas, core logic) → read from the **Linux WSL** path. The backend code in this Windows directory is **stale** and must NEVER be used as a reference.
3. **Never** run `npm install` from Windows into a WSL path or vice versa. Native binaries (lightningcss, etc.) are platform-specific.
4. **Never** modify backend files (`raqim-core/`, `raqim-cli/`, `raqim-mcp/`, etc.) in this Windows directory. They exist here only as git history; the real code lives in Linux.
5. **Git operations** (commit, push, pull) happen **only** from this Windows directory. The Linux environment has no `.git`.
6. When importing types or interfaces that originate from backend layers (e.g., `raqim-core` types), reference the **Linux WSL** versions to ensure accuracy, then implement the UI-side code in Windows.

### Quick Reference Paths

```
# Windows (UI — read + write)
C:\Users\ASUS-PC\Desktop\Everything\feb-21\synapse\raqim-cloud\
C:\Users\ASUS-PC\Desktop\Everything\feb-21\synapse\raqim-console\

# Linux WSL (Backend — read only)  
\\wsl.localhost\Ubuntu-22.04\home\muhammad\projects\raqim\synapse\raqim-core\
\\wsl.localhost\Ubuntu-22.04\home\muhammad\projects\raqim\synapse\raqim-cli\
\\wsl.localhost\Ubuntu-22.04\home\muhammad\projects\raqim\synapse\raqim-mcp\
\\wsl.localhost\Ubuntu-22.04\home\muhammad\projects\raqim\synapse\raqim-agent-sdk\
\\wsl.localhost\Ubuntu-22.04\home\muhammad\projects\raqim\synapse\raqim-py\
\\wsl.localhost\Ubuntu-22.04\home\muhammad\projects\raqim\synapse\synapse-mcp\
\\wsl.localhost\Ubuntu-22.04\home\muhammad\projects\raqim\synapse\raqim-siege\
\\wsl.localhost\Ubuntu-22.04\home\muhammad\projects\raqim\synapse\raqim-tui\
```
