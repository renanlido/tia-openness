# Connect an AI assistant to TIA Portal through MCP (Claude Desktop, Claude Code and other clients)

An AI assistant can read and edit a TIA Portal V21 project through MCP. The `tia` MCP server talks to PLCWare's `serve`
app, the Windows program that does the Openness work. It comes with the Windows installer or runs separately through
`npx`. The assistant prepares the work; a person approves anything that reaches a real PLC. This guide connects the two.
It applies to **TIA Portal V21**.

```
[ your AI client ]  --(MCP/stdio)-->  [ tia MCP (bundled or npx) ]  --(HTTP)-->  [ serve (Windows + TIA Portal V21) ]
```

## What you need

- A Windows machine with **TIA Portal V21** and the **PLCWare app** (`serve`) running with an activated license. In the
  tray app, **License** tab: paste your key and save; **API** tab: **Start API** (default port 5000). From a command line:
  `TIAOpenness.exe serve 5000`.
- **Node.js** (`^20.12.0 || >=21.7.0` for guided setup) for the npm/`npx` routes below, on the machine that runs your AI client.
  The supported Windows installer route needs no separately installed Node.js or npm.
- One setting, `TIA_API_BASE`, the address of `serve`. The MCP sends **no key**: what activates the app is the license on
  the host.

## Connect agents with guided setup

Install **PLCWare (Windows app)** on the TIA Portal host, activate it and start its API. On the computer running your
agents (Windows, macOS or Linux), install Node.js `^20.12.0 || >=21.7.0` (current LTS recommended), then run:

```sh
npx plcware-setup
```

No arguments are needed. In a terminal, choose detected agents, each agent's supported components, and the skills to
install. Plugin hosts (Claude Code, Codex and Gemini CLI) receive the official **renanlido/tia-harness** plugin/extension;
other agents receive only their selected supported MCP, skills and subagents. This is one harness, not a second copy.
When MCP is selected, enter the API address (`http://localhost:5000` is prefilled; use the Windows host/VM address for
remote clients) and full/read-only mode. Review the preview and confirm once. Skills-only selections skip API questions.
The setup never asks for a PLCWare activation key; activate the Windows app instead. Native source trust remains yours.

Without a terminal or in CI, the bare command prints help. Restart the agent, inspect its MCP connection and ask it to
call `tia_ping`. `npx plcware-setup plan` previews without writing; `npx plcware-setup uninstall --yes` removes only
recorded owned changes. Existing independently installed plugins stay untouched. Keep one installation owner per agent.

## Advanced: manual and app-managed connections

The per-agent routes below remain available for advanced configuration; do not add a duplicate `tia` connection.

## Windows: connect from the PLCWare app 

For clients on the same Windows machine, install **PLCWare 1.8.0** with `TIAOpenness-Setup-1.8.0.exe`. Open
**Connect your AI agents** from the tray menu's **Connect AI agents…** or the getting-started window.

1. Install your client first: **Claude Code, Claude Desktop, Codex, Cursor or VS Code**. Cursor and VS Code support
   was added in 1.8.0; these two receive MCP tools only, not skills or helpers.
2. Select the client and review the proposed changes. **Fully quit Claude Desktop before choosing Connect if settings
   will be written; closing its window is not enough.** Then choose **Connect**. These routes use the MCP runtime
   embedded in the installer (or the bundled `.mcpb` for Desktop), without system Node.js, npm or `npx`.
3. Reopen Desktop afterwards, complete any manual steps shown, then check the connection below.

After app updates, PLCWare offers **Update connections / Repair** on the next normal launch for recorded connections
that need attention. Review and approve the changes; the installer does not rewrite client settings automatically.
Follow any remaining manual steps. See the [Installation manual](../INSTALL.md) for client-specific details, Desktop's
bundle/settings and separate skills steps, and migration from an existing `npx` connection.

Do not add the manual configuration below over an app-managed connection: keep only one `tia` connection per client.
This is not an offline guarantee for the client's own installation, sign-in or AI service.

## Manual setup: npm/npx routes

Use the existing steps below for **Mac/Linux, remote clients or manual setup**, and for app versions **before 1.7.1**
(**before 1.8.0 for Cursor and VS Code**).
The **Gemini CLI extension** and the **independently installed public Codex CLI plugin** also still use npm/`npx`;
the public Codex plugin is not the app-managed local plugin. These routes need Node.js and npm package access
(registry access on first use or when the package is not cached). Formats and plugin/extension details are in the
[Installation manual](../INSTALL.md).

## Claude Code

One command, at user scope (it applies to all your projects):

```bash
claude mcp add tia --scope user -e TIA_API_BASE=http://localhost:5000 -- npx -y @renanlido/tia-openness-mcp
```

Put the server name (`tia`) first. `-e` takes several values, and Claude Code 2.1.238 rejected `--env KEY=VALUE` written
before the name. Check with `claude mcp list`, which should show `tia` as connected, and with `/mcp` inside a session.

## Claude Desktop

For manual setup, open `claude_desktop_config.json` through **Settings > Developer > Edit Config**, then
**fully quit Desktop before editing**:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows (.exe): `%APPDATA%\Claude\claude_desktop_config.json`
- Windows (Store/MSIX): `%LOCALAPPDATA%\Packages\Claude_*\LocalCache\Roaming\Claude\claude_desktop_config.json`

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

Reopen the app after saving. For manual setup on Windows, use the `cmd /c` form (Windows only) if plain `npx`
fails to start:

```json
"command": "cmd", "args": ["/c", "npx", "-y", "@renanlido/tia-openness-mcp"]
```

Keep a single `tia` entry: two servers would both talk to the same `serve`, which runs one operation at a time.

## Other clients

For manual setup, Codex, Gemini CLI, Cursor, VS Code and Windsurf use the same command,
`npx -y @renanlido/tia-openness-mcp`, and the same `TIA_API_BASE` variable; only the configuration format differs.
See the [Installation manual](../INSTALL.md). For app-managed Codex, Cursor and VS Code on Windows, use the installer route above instead.

## When your AI client is on another machine

A common setup is an editor on a Mac and `serve` in a Windows VM. On the Windows side, allow remote access in the tray app
(**API** tab, **Allow remote access...**, which reserves the URL and opens the firewall port), set the host to `0.0.0.0`
and start the API; from a command line, `TIAOpenness.exe serve 5000 --host 0.0.0.0`. The license must be activated on that
machine. On the client side, put the VM's address in the MCP entry
itself, in place of `http://localhost:5000`. The entry's `TIA_API_BASE` is what the MCP reads: a variable exported in your
shell does not replace it.

For Claude Code, add the server again with the VM's address (if `tia` is already registered, remove it first with
`claude mcp remove tia`):

```bash
claude mcp add tia --scope user -e TIA_API_BASE=http://<vm-ip>:5000 -- npx -y @renanlido/tia-openness-mcp
```

For Claude Desktop and the other clients that keep a JSON configuration, change the value in the file:

```json
"env": { "TIA_API_BASE": "http://<vm-ip>:5000" }
```

Then start a new session, or restart the app, so that the MCP starts with the new address.

The license activates the server; it does not identify who calls it. Control access with a firewall or VPN.

## Check the connection

Ask the assistant to call `tia_ping`. It answers `{ base, reachable, activated, latencyMs, hint }`:

- `reachable: false`: the address, the port or the firewall is wrong, or `serve` is not running.
- `activated: false`: the license on the host is missing or invalid.
- Both `true`: `serve` is reachable and activated. That is not the same as ready: call `tia_readiness` to check the
  Windows group, x64 and the TIA Portal installation ([Set up TIA Portal Openness on Windows](openness-setup-windows.md)).

Then `tia_status` and `tia_connect` open or attach to a project. The first connection of a `serve` process can raise a
security prompt in TIA Portal on the Windows machine, and only a person can answer it.

## What to ask

- "List the blocks of PLC_1 and tell me which ones are not consistent." (`tia_plc_blocks`)
- "Export FB_Motor and check that it matches the file in git." (`tia_export_block`, `tia_block_compare`)
- "Write an SCL function block that does X, put it in the project and compile." (`tia_source_put`, `tia_compile`)
- "Compile PLC_1 and summarize the errors." (`tia_compile`)

The tools are grouped by what they can change: reads (class R) change nothing; offline changes (class M-off) edit the
project but never touch a PLC; a few gated tools reach the physical world.

## What the assistant cannot do alone

- **Download to a PLC.** `tia_download` first returns a plan and a single-use `planHash` for a person to review; only
  after the person approves does it run again with `approved: true` and the same `planHash`. If the software changed in
  between, `serve` refuses with `409 plan_stale`. The assistant never approves.
- **Go online, upload a station, scan the network.** Each is a gate that needs a person.
- **Secrets.** A master secret, a know-how password, a certificate password or the password policy always come from a
  person. The assistant never invents one.
- **Safety (F) logic.** Never authored, changed or downloaded autonomously.
- **Two things at once.** `serve` has one serial worker. Long operations (connect, compile, download...) may answer
  `status: "running"` with a `jobId`; the assistant then waits with `tia_job_status` instead of repeating the call.

## Read-only mode

To try the MCP with no write risk, set `TIA_MCP_MODE` to `read-only` in the server's `env`:

```json
"env": { "TIA_API_BASE": "http://localhost:5000", "TIA_MCP_MODE": "read-only" }
```

The MCP then registers only the read tools: no tool that changes the project or touches a controller is even listed.
Because `tia_start` and `tia_connect` are not read tools, the assistant cannot open a project in this mode: the project
must already be open in `serve`.

This guards against the assistant, not against a person: it lives in the MCP, and the license scopes on `serve` stay the
authority. An MCP release that predates the mode ignores the variable and registers every tool. For the manual `npx`
route, check `npx -y @renanlido/tia-openness-mcp --version` (the flag exists from 1.9.2). In all cases, confirm in your
client that a write tool such as `tia_compile` is missing.

## Which plan does what

Basic reads the project, authors offline (blocks, tags, hardware) and compiles. Pro adds downloading to a real PLC and
going online, always behind the human gates above. The 30-day trial includes the Pro scopes.

For a guided flow from a specification to a verified project, the open-source
[`tia-harness`](https://github.com/renanlido/tia-harness) plugin for Claude Code adds skills and subagents on top of the
same MCP.

## Related guides

- [Set up TIA Portal Openness on Windows](openness-setup-windows.md)
- [Compile a PLC from code and read the messages](compile-plc-read-messages.md)
- [Installation manual](../INSTALL.md)
- [All guides](README.md)

## Start your free 30-day trial

PLCWare runs these steps for you, or for your AI assistant, against TIA Portal V21. The trial lasts 30 days, includes the
Pro scopes, needs no card and does not renew. You need TIA Portal V21 with a STEP 7 Professional license, bought
separately from Siemens.

**[Start the free 30-day trial](https://plcware.io/en/trial?utm_source=github&utm_medium=guide&utm_campaign=connect-ai-assistant-mcp)**
· [Download the app](https://plcware.io/download)

*TIA Portal, SIMATIC and Siemens are trademarks of Siemens AG. PLCWare is an independent product for TIA Portal and
is not affiliated with or endorsed by Siemens.*
