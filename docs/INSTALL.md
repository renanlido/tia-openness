# Install and use the `tia` MCP (any client)

> **Single source.** This is the canonical install guide. The READMEs point here — do not duplicate
> the steps anywhere else (avoids drift). Update **only here**.

The **`tia` MCP** (`@renanlido/tia-openness-mcp`) is a thin HTTP client for the `serve` API
(the Windows app that drives TIA Portal). The PLCWare 1.7.1 Windows installer includes the runtime for the
app-managed connections below. Manual and other npm-based routes remain available.
The **`TIA_API_BASE`** variable points the MCP at your `serve`.

```
[ your AI editor/CLI ]  --(MCP/stdio)-->  [ tia MCP (bundled or npx) ]  --(HTTP)-->  [ serve (Windows+TIA) ]
```

## Prerequisite (once, on the host with TIA)

Start the `serve` API on the Windows machine that has TIA Portal V21 — via the **PLCWare tray GUI**
("TIA Openness API" shortcut → "API" tab → "Start API") **or** from the command line:

```powershell
TIAOpenness.exe serve 5000              # local
TIAOpenness.exe serve 5000 --host 0.0.0.0   # accepts connections from another machine (e.g. Mac → VM)
```

- **Same machine** as the AI editor → `TIA_API_BASE=http://localhost:5000`.
- **Editor on another machine** (e.g. a Mac, with the `serve` on a Windows VM) → `TIA_API_BASE=http://<vm-ip>:5000`
  and start the serve with `--host 0.0.0.0` (and open the port in the firewall).

> The MCP **sends no key** — what activates the server is the **license** configured on the host (the GUI's
> "License" tab). Without an activated serve, the MCP can only diagnose connectivity (`tia_ping`).

---

## Windows app-managed route (from PLCWare 1.7.1)

Install **PLCWare 1.7.1** using `TIAOpenness-Setup-1.7.1.exe`, then open the **Connect your AI agents** window via the
tray menu's **Connect AI agents…** or the getting-started window. Install the agent first, preview, then choose **Connect**.
These installer-managed connections need no system Node.js, npm/`npx`, Git, or npm registry access:

| Agent | Connection and skills |
|---|---|
| Claude Code | Installs the shipped local plugin marketplace and plugin, with skills, helpers and the embedded `tia` launcher. An existing plugin keeps its configuration. To switch an old `npx` plugin, use **Disconnect** if PLCWare installed it; otherwise uninstall it in Claude Code first. Then **Connect** from PLCWare. |
| Claude Desktop | Opens the bundled `.mcpb` only when Windows has a handler for it; complete installation in Desktop. Otherwise it writes the embedded runtime into the detected build's settings, including Store/MSIX. **Fully quit Desktop from the system tray before Connect writes settings; closing its window is not enough.** Reopen it afterwards and use **Refresh** in PLCWare to verify. |
| Codex | Writes one embedded `tia` connection and installs the local plugin for skills, plus helper agents. Uses an available CLI, including the desktop app's bundled CLI; a separate CLI install is not required. If no usable CLI is available, it prepares a personal plugin marketplace: close/reopen Codex, then install `tia-harness` in **Plugins** using the displayed instructions. The plugin's duplicate MCP is disabled. |

**Claude Desktop skills are a separate step from the MCP connector.** If the PLCWare user plugin is already installed,
there is no skills step. Otherwise Connect prepares **one plugin ZIP**, containing skills and agents but no MCP connector
or hooks. Use **Open plugin folder** to select the ZIP, then upload it in Desktop:
**Customize → Plugins → Add → Upload plugin**. No per-skill uploads or Git are needed; the agents use the existing `tia`
connection. Connecting or disconnecting Desktop does not install or remove the Claude Code plugin.
If Desktop reuses the user plugin, keep the PLCWare `tia` connector; do not also enable the plugin's connector.

For a `.mcpb` connection, reconnect after updating PLCWare and complete the extension update in Desktop. If necessary,
uninstall the old extension in Desktop and reconnect. For the settings-file fallback, fully quit Desktop before
reconnecting, then reopen and verify. Follow any remaining manual steps; **Connect** alone does not verify them.

**Routes that still use npm/`npx`:** the independently installed public Codex CLI plugin (not the app-managed local
plugin), the Gemini CLI extension, the manual examples below, earlier app versions, and MCP clients on Mac/Linux or a
remote host without the Windows installer payload. These require Node.js and npm package access (registry access on
first use or when a package is not cached). The Windows embedded route is not a general offline guarantee for the
agent's own installation, sign-in or AI service.

## Manual or earlier-version Windows setup: use `cmd /c npx`

For command-line/manual setup and PLCWare versions before 1.7.1, several Windows clients launch processes without a shell,
so `npx` (which is `npx.cmd`) can fail with `spawn npx ENOENT`. Wherever that happens, replace:

```jsonc
"command": "npx", "args": ["-y", "@renanlido/tia-openness-mcp"]
```

with:

```jsonc
"command": "cmd", "args": ["/c", "npx", "-y", "@renanlido/tia-openness-mcp"]
```

On **macOS/Linux** use the simple form (`npx` directly) — do **not** put `cmd /c` there.

---

The following client examples are **manual MCP-only setup**, not the app-managed plugin installation above.
Do not add a second `tia` entry over an existing plugin or extension connection.

## Claude Code

**One command** (user scope — applies to all projects):

```bash
claude mcp add --scope user --env TIA_API_BASE=http://localhost:5000 tia -- npx -y @renanlido/tia-openness-mcp
```

Or via **`.mcp.json`** at the project root (project scope, versionable):

```json
{
  "mcpServers": {
    "tia": {
      "command": "npx",
      "args": ["-y", "@renanlido/tia-openness-mcp"],
      "env": { "TIA_API_BASE": "http://localhost:5000" }
    }
  }
}
```

Check: `claude mcp list` (should list `tia`) · in a session, `/mcp`.

## Claude Desktop

For manual setup, open `claude_desktop_config.json` with Settings → Developer → **Edit Config**,
then **fully quit Desktop before editing**:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows (.exe):** `%APPDATA%\Claude\claude_desktop_config.json`
- **Windows (Store/MSIX):** `%LOCALAPPDATA%\Packages\Claude_*\LocalCache\Roaming\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "tia": {
      "command": "npx",
      "args": ["-y", "@renanlido/tia-openness-mcp"],
      "env": { "TIA_API_BASE": "http://localhost:5000" }
    }
  }
}
```

For manual JSON setup on **Windows**, use the `cmd /c` form above. Reopen Desktop after saving and verify the connection.
The installer-managed route is described above.

## Codex (CLI + IDE extension)

Config in `~/.codex/config.toml` (the IDE extension shares the same file). Note: **env in a
sub-block** `[mcp_servers.tia.env]`.

```toml
[mcp_servers.tia]
command = "npx"
args = ["-y", "@renanlido/tia-openness-mcp"]

[mcp_servers.tia.env]
TIA_API_BASE = "http://localhost:5000"
```

Or via the CLI:

```bash
codex mcp add tia --env TIA_API_BASE=http://localhost:5000 -- npx -y @renanlido/tia-openness-mcp
```

Check in a session with `/mcp`. On Windows, use `command = "cmd"` and
`args = ["/c", "npx", "-y", "@renanlido/tia-openness-mcp"]`.

## Gemini CLI

Config in `~/.gemini/settings.json` (user) or `<project>/.gemini/settings.json` (project):

```json
{
  "mcpServers": {
    "tia": {
      "command": "npx",
      "args": ["-y", "@renanlido/tia-openness-mcp"],
      "env": { "TIA_API_BASE": "http://localhost:5000" }
    }
  }
}
```

Or via the CLI (`-s user` = global; default is project):

```bash
gemini mcp add -s user -e TIA_API_BASE=http://localhost:5000 tia npx -y @renanlido/tia-openness-mcp
```

## Cursor

`.cursor/mcp.json` (project) or `~/.cursor/mcp.json` (global) — same format as Claude (`mcpServers`):

```json
{
  "mcpServers": {
    "tia": {
      "command": "npx",
      "args": ["-y", "@renanlido/tia-openness-mcp"],
      "env": { "TIA_API_BASE": "http://localhost:5000" }
    }
  }
}
```

## VS Code (Copilot / agent mode)

⚠️ **Different from the others:** the root key is **`servers`** (not `mcpServers`) and use **`"type": "stdio"`**.
File `.vscode/mcp.json` (workspace) — or Command Palette → `MCP: Open User Configuration`:

```json
{
  "servers": {
    "tia": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@renanlido/tia-openness-mcp"],
      "env": { "TIA_API_BASE": "http://localhost:5000" }
    }
  }
}
```

Tools only show up in Copilot in **Agent mode**. CLI alternative: `code --add-mcp "{...}"`.

## Windsurf

File `~/.codeium/windsurf/mcp_config.json` (no project scope), `mcpServers` format:

```json
{
  "mcpServers": {
    "tia": {
      "command": "npx",
      "args": ["-y", "@renanlido/tia-openness-mcp"],
      "env": { "TIA_API_BASE": "http://localhost:5000" }
    }
  }
}
```

---

## Differences summary (what bites)

| Client | File | Root key | `type:"stdio"`? | CLI to add |
|---|---|---|---|---|
| Claude Code | `.mcp.json` (project) / `~/.claude.json` (user, via CLI) | `mcpServers` | optional | `claude mcp add … -- npx …` |
| Claude Desktop | `claude_desktop_config.json` (use **Edit Config** for the detected build's path above) | `mcpServers` | optional | — (edit JSON after fully quitting) |
| Codex | `~/.codex/config.toml` | `[mcp_servers.tia]` (TOML) | — | `codex mcp add …` |
| Gemini CLI | `~/.gemini/settings.json` | `mcpServers` | — | `gemini mcp add …` |
| Cursor | `.cursor/mcp.json` / `~/.cursor/mcp.json` | `mcpServers` | — | — (JSON/UI) |
| **VS Code** | `.vscode/mcp.json` | **`servers`** | **yes** | `code --add-mcp "{…}"` |
| Windsurf | `~/.codeium/windsurf/mcp_config.json` | `mcpServers` | — | — (JSON/UI) |

**Manual npm-route rules:** (1) on **Windows**, `cmd /c npx`; (2) in **VS Code**, root key `servers` + `type:"stdio"`;
(3) set **`TIA_API_BASE`** pointing at the `serve`; (4) restart the client after editing the file.

## Remote access (another machine → the serve host)

By default the serve listens only on **localhost** (safe, nothing exposed). To reach it from **another machine**
(e.g. the MCP on your **Mac** → the serve on a **Windows VM**), Windows needs an **HTTP.sys reservation**
(`urlacl`) + the **port opened in the firewall** — otherwise binding to `0.0.0.0`/`+` fails with *Access denied*.

**Via the GUI (1 click — recommended):** **"API"** tab → **"Allow remote access…"** button → confirm the
**UAC** prompt (admin) and, optionally, **restrict to the source IP** (e.g. your Mac's IP). Then set
**Host = `0.0.0.0`** and **"Start API"**. *(If you try to start with a remote Host without allowing it first,
the app detects the error and offers to allow it right there.)*

**From the command line** (PowerShell **as administrator**):

```powershell
TIAOpenness.exe setup-remote 5000 --allow 192.168.68.230   # allow ONLY that source IP (recommended)
TIAOpenness.exe setup-remote 5000                          # allow the whole LAN
TIAOpenness.exe setup-remote 5000 --remove                 # undo (back to localhost-only)
```

> **Security:** allowing remote access exposes the serve to the network. The serve still requires an **active
> license**, but it does **not authenticate individual clients** — who can connect is controlled by
> **firewall/VPN**. Prefer **restricting to the source IP**; only open the whole LAN on a trusted network. On
> the Mac, point `TIA_API_BASE=http://<vm-ip>:5000`.

## Diagnostics

The first tool to call is **`tia_ping`**: `reachable:false` → IP/port/firewall/serve down;
`activated:false` → license missing/invalid on the host; both `true` → ready to use.
