# Getting started

This guide takes you from **download** to a **running, licensed API** in a few minutes. Everything
here is doable from the **tray GUI** — no command line required. The CLI equivalents are shown for
automation.

```
[ your AI editor / CLI ]  --(MCP)-->  [ tia MCP (npx) ]  --(HTTP)-->  [ serve (this app, Windows+TIA) ]
```

## 1. Prerequisites

On the machine that has **TIA Portal V21**:

- **Windows 10/11 (x64)**.
- **.NET Framework 4.8** (the installer checks and warns if missing).
- **TIA Portal V21 + the Openness component** installed. The app loads the Siemens assemblies from
  your local install — they are **not** redistributed.
- Your Windows user must belong to the **`Siemens TIA Openness`** local group (the installer/`setup`
  adds you).

> On the **first** connection, TIA Portal shows a one-time security/trust dialog you must confirm
> manually. This is expected.

## 2. Download & install

From the [**Releases**](https://github.com/renanlido/tia-openness/releases/latest) page:

- **One-click (recommended):** download `TIAOpenness-Setup-<version>.exe` and run it. It copies the
  app, runs first-time setup (group, shortcut, optional "start with Windows"), and opens the
  **Getting started** screen.
- **Portable:** download `TIAOpenness-app-<version>.zip`, unzip, then run `TIAOpenness.exe setup`.

## 3. Check the environment

Open the tray app (shortcut **"TIA Openness API"**) → **API** tab → **Check environment**. It
verifies the Windows group, that the process is x64, and that TIA Portal V21 + PublicAPI are present.

CLI equivalent:

```powershell
TIAOpenness.exe check
```

## 4. Activate your license

The app is **free to download but requires a license to run** — without one, every endpoint except
`GET /health` returns `403 license_required`.

In the GUI: **License** tab → paste your Activation License key → **Save** (it's stored encrypted
with Windows DPAPI). Don't have one yet? **Request a trial or a license** via the
[Question / license request](https://github.com/renanlido/tia-openness/issues/new/choose) issue
template.

## 5. Start the API

In the GUI: **API** tab → **Start API** (default port **5000**).

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

Point the **`tia` MCP** at your running `serve`. For **Claude Code**:

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

For a guided, spec-to-verified-project workflow, install the
[**tia-harness**](https://github.com/renanlido/tia-harness) Claude Code plugin.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `403 license_required` on every call | No valid license on the host — activate it (step 4). |
| `tia_ping` → `reachable:false` | `serve` not running, wrong IP/port, or firewall blocking. |
| API won't start on `0.0.0.0` | Remote access not allowed yet — use **Allow remote access…** (step 5). |
| "Check environment" fails on the group | You're not in `Siemens TIA Openness` — re-run `setup`, then sign out/in. |
| TIA trust dialog keeps appearing | Confirm it once manually on the TIA machine (expected on first connect). |

More help: **[SUPPORT.md](../SUPPORT.md)**.
