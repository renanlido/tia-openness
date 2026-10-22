# Connect an AI assistant to TIA Portal through MCP (Claude Desktop, Claude Code and other clients)

An AI assistant can read and edit a TIA Portal V21 project through MCP. The `tia` MCP server is a small npm package
that talks to PLCWare's `serve` app, the Windows program that does the Openness work. The assistant prepares the
work; a person approves anything that reaches a real PLC. This guide connects the two. It applies to
**TIA Portal V21**.

```
[ your AI client ]  --(MCP/stdio)-->  [ tia MCP (npx) ]  --(HTTP)-->  [ serve (Windows + TIA Portal V21) ]
```

## What you need

- A Windows machine with **TIA Portal V21** and the **PLCWare app** (`serve`) running with an activated license. In the
  tray app, **License** tab: paste your key and save; **API** tab: **Start API** (default port 5000). From a command line:
  `TIAOpenness.exe serve 5000`.
- **Node.js** (version 20 or later) on the machine that runs your AI client. The MCP runs through `npx`, so there is
  nothing else to install.
- One setting, `TIA_API_BASE`, the address of `serve`. The MCP sends **no key**: what activates the app is the license on
  the host.

## Claude Code

One command, at user scope (it applies to all your projects):

```bash
claude mcp add tia --scope user -e TIA_API_BASE=http://localhost:5000 -- npx -y @renanlido/tia-openness-mcp
```

Put the server name (`tia`) first. `-e` takes several values, and Claude Code 2.1.238 rejected `--env KEY=VALUE` written
before the name. Check with `claude mcp list`, which should show `tia` as connected, and with `/mcp` inside a session.

## Claude Desktop

Edit `claude_desktop_config.json`. In Claude Desktop, **Settings > Developer > Edit Config** opens it:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

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

Restart the app. On Windows, start with plain `npx` as above. If the client reports that the server failed to start,
use the `cmd /c` form, which exists only on Windows:

```json
"command": "cmd", "args": ["/c", "npx", "-y", "@renanlido/tia-openness-mcp"]
```

Keep a single `tia` entry: two servers would both talk to the same `serve`, which runs one operation at a time.

## Other clients

Codex, Gemini CLI, Cursor, VS Code and Windsurf use the same command, `npx -y @renanlido/tia-openness-mcp`, and the same
`TIA_API_BASE` variable; only the place where each client keeps its configuration differs. The exact format for each is in
the [Installation manual](../INSTALL.md).

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
authority. An MCP release that predates the mode ignores the variable and registers every tool, so check
`npx -y @renanlido/tia-openness-mcp --version` (the flag exists from 1.9.2) and confirm in your client that a write tool
such as `tia_compile` is missing.

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
