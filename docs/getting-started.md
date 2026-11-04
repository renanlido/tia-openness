# Getting started

This guide takes you from download to a running, licensed PLCWare Windows app through the tray GUI.
To connect your agents, run `npx plcware-setup` in a terminal on their computer (step 6).
CLI equivalents and advanced manual connection routes remain available.

```
[ your AI editor / CLI ]  --(MCP)-->  [ tia MCP (bundled or npx) ]  --(HTTP)-->  [ serve (this app, Windows+TIA) ]
```

## 1. Prerequisites

On the machine that has **TIA Portal V21**:

- **Windows 10/11 (x64)**.
- **.NET Framework 4.8** (the installer stops if missing).
- **TIA Portal V21 + the Openness component** installed. The app loads the Siemens assemblies from
  your local install — they are **not** redistributed.
- Your Windows user must belong to the **`Siemens TIA Openness`** local group (the installer/`setup`
  adds you).

> If TIA Portal shows a security/trust dialog, confirm it manually on that machine. A trusted installer-managed
> installation can avoid it; portable copies may still require it. The readiness details report the allow-list state.

## 2. Download & install

From the [**Releases**](https://github.com/renanlido/tia-openness/releases/latest) page:

- **Installer (recommended):** download `TIAOpenness-Setup-1.7.1.exe` for PLCWare 1.7.1 stable.
  It copies the app and bundled agent assets and configures the original Windows user's environment.
  If group permissions require a new sign-in, the final page offers **Restart now / Restart later** and does **not**
  launch getting started immediately. Save your work before restarting.
  Without a pending restart, **View the getting-started steps** is preselected on fresh installs and unchecked on upgrades.
- **Portable:** download `TIAOpenness-app-v1.7.1.zip`, unzip, then run `TIAOpenness.exe setup`.
  The no-system-Node connection path requires the installer payload; the app ZIP is not equivalent.

The getting-started window checks the environment and attempts to start the API automatically, with license activation
and agent connection in the main steps and technical checks under **Details**. At the next sign-in after a requested
restart, it opens only if setup still needs attention; a completed setup gets a short ready notification instead.
Later launches stay quiet. Reopen the checklist from the tray menu or the Start-menu **Next steps** shortcut.

## 3. Check the environment

For a manual recheck, open the PLCWare tray app (shortcut **"TIA Openness API"**) → **API** tab → **Check environment**.
It verifies the Windows group, that the process is x64, and that TIA Portal V21 + PublicAPI are present.
If the account is already in `Siemens TIA Openness` but its current sign-in token is stale, sign out/in or restart;
do not repeat the add-user step. Missing membership needs elevated setup instead.

CLI equivalent:

```powershell
TIAOpenness.exe check
```

## 4. Activate your license

The app is **free to download but requires a license to run** — without one, every endpoint except
`GET /health` returns `403 license_required`.

In the GUI: **License** tab → paste your Activation License key → **Save** (it's stored encrypted
with Windows DPAPI). Don't have one yet? **[Start the free 30-day trial](https://plcware.io/en/trial?utm_source=github&utm_medium=docs&utm_campaign=getting-started)**:
it is self-serve, includes the Pro scopes and needs no card.

## 5. Start the API

The getting-started window starts the API automatically. If it is not listening, use **API** → **Start API**
(default port **5000**) and inspect any reported error.

CLI equivalent:

```powershell
TIAOpenness.exe serve 5000
```

Verify it's up (this endpoint needs no activation):

```powershell
Invoke-RestMethod http://localhost:5000/health
```

### Remote access (optional)

By default the API listens on **localhost** only (nothing exposed). To reach it from another machine
(e.g. an AI client on a **Mac** → the `serve` on a **Windows VM**), use **API** tab → **Allow remote
access…** (UAC; you can restrict it to a source IP), then set **Host = `0.0.0.0`** and start.

CLI equivalent (run as administrator):

```powershell
TIAOpenness.exe setup-remote 5000 --allow 192.168.x.y   # allow only that source IP (recommended)
```

> Allowing remote access exposes the API to the network. The `serve` still requires an active
> license, but it does **not** authenticate individual clients — control access with firewall / VPN.

## 6. Connect an AI assistant (optional)

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


On installer-managed Windows with PLCWare 1.7.1, open **Connect your AI agents**, preview and connect Claude Code,
Claude Desktop or Codex without system Node.js/npm or Git. Follow the remaining manual steps: Desktop skills may need
one plugin ZIP upload, and desktop-only Codex may need one **Plugins** installation.
See **[docs/INSTALL.md](INSTALL.md)** for the `.mcpb`/MSIX fallback, full-quit requirement, skills and helper setup,
and the routes that still use npm/`npx`.

For a **manual MCP-only alternative**, not an addition to the app-managed plugin, point `tia` at your running `serve`:

```bash
claude mcp add --transport stdio --env TIA_API_BASE=http://localhost:5000 --scope user tia -- npx -y @renanlido/tia-openness-mcp
```

Use the VM/host IP for `TIA_API_BASE` if the `serve` runs elsewhere. Other clients (Claude Desktop,
Codex, Gemini CLI, Cursor, VS Code, Windsurf) and the Windows `cmd /c npx` gotcha are in
**[docs/INSTALL.md](INSTALL.md)**.

The first tool to call is **`tia_ping`**:

- `reachable:false` → IP / port / firewall / `serve` is down.
- `activated:false` → license missing or invalid on the host.
- both `true` → you're ready.

The app-managed Claude Code plugin already includes the
[**tia-harness**](https://github.com/renanlido/tia-harness) spec-to-verified-project workflow; do not install a second MCP.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `403 license_required` on every call | No valid license on the host — activate it (step 4). |
| `tia_ping` → `reachable:false` | `serve` not running, wrong IP/port, or firewall blocking. |
| API won't start on `0.0.0.0` | Remote access not allowed yet — use **Allow remote access…** (step 5). |
| "Check environment" fails on the group | Missing membership: run elevated `setup`. Already added but token stale: sign out/in or restart, not another add-user command. |
| TIA trust dialog appears | Confirm manually on the TIA machine; inspect allow-list readiness details if it recurs. |

More help: **[SUPPORT.md](../SUPPORT.md)**.
