# TIA Openness API — for Siemens TIA Portal V21

[![Download](https://img.shields.io/github/v/release/renanlido/tia-openness?label=download&filter=app-v*&color=2ea44f)](https://github.com/renanlido/tia-openness/releases/latest)
[![MCP npm](https://img.shields.io/npm/v/%40renanlido%2Ftia-openness-mcp?label=tia%20MCP&color=blue)](https://www.npmjs.com/package/@renanlido/tia-openness-mcp)
[![License](https://img.shields.io/badge/license-Proprietary-red)](EULA.md)

Automate **Siemens TIA Portal V21** through the **TIA Openness API**, exposed as a local
**HTTP/JSON API** on the engineering machine. Create devices and networks, generate and import
SCL/SimaticML, manage blocks/types/tags, and run **compile → download → online** — all behind a
clean HTTP surface that any application, script, or **AI assistant** can drive.

It carries every bit of complexity the Openness API forces (net48/AMD64 assemblies, runtime
assembly resolution, a single serial worker that owns the `TiaPortal`) and hides it behind HTTP,
with a **system-tray GUI** (start/stop/monitor the API) and a **CLI** for headless use.

> **This is the product hub** — downloads, documentation, and the public issue tracker. The
> application is proprietary; its source lives in a separate private repository.

---

## How it fits together

Three pieces, split by what runs where:

| Piece | What it is | License | Where |
|---|---|---|---|
| **TIA Openness `serve` / app** | The **engine** — a Windows app that drives TIA Portal V21 and exposes the HTTP/JSON API. **This product.** | Proprietary (activation license) | [Releases](https://github.com/renanlido/tia-openness/releases) |
| **`@renanlido/tia-openness-mcp`** | The **bridge** — a thin MCP→HTTP client so AI tools (Claude, Codex, Gemini, Cursor…) can drive the API. | MIT (open) | [npm](https://www.npmjs.com/package/@renanlido/tia-openness-mcp) |
| **`tia-harness`** | The **client harness** — a Claude Code plugin (skills + subagents) that turns an engineering spec into a verified TIA project. | MIT (open) | [renanlido/tia-harness](https://github.com/renanlido/tia-harness) |

The MCP and the harness are **open and free**. The `serve` app is what actually talks to TIA
Portal, and it's the licensed product.

---

## Download

**Free to download.** Grab the latest installer from the
[**Releases**](https://github.com/renanlido/tia-openness/releases/latest) page:

- `TIAOpenness-Setup-<version>.exe` — **one-click installer** (recommended): copies the app and
  runs first-time setup (adds you to the `Siemens TIA Openness` group, creates a shortcut, optional
  autostart), then opens the **Getting started** screen.
- `TIAOpenness-app-<version>.zip` — portable build; unzip and run `TIAOpenness.exe setup`.

**Prerequisites:** Windows 10/11 (x64), **.NET Framework 4.8** (the installer checks), and
**TIA Portal V21 + the Openness component** installed (the app loads the Siemens assemblies from
your local install — they are **not** redistributed).

See the **[Getting started guide](docs/getting-started.md)** for the full walkthrough.

---

## Languages

The app ships **bilingual — English / Portuguese**:

- The **desktop app** (GUI, CLI, setup and diagnostics) auto-detects your **Windows language**
  (English everywhere outside Brazil). You can also pick explicitly: in the installer wizard, in the
  app's **Language** selector, or with `--lang en|pt` on the command line.
- The **docs** and the **`tia` MCP server** (tool descriptions, remediation hints, messages) are
  **English**.
- The **HTTP API** speaks English; a few human-readable status texts (environment checks, license
  status) follow the app's configured language.

---

## Try it — free download, license to use

The app follows the **"download free, activate with a license"** model (like JetBrains / Sublime):

- The **download is public and free** — anyone can install it.
- **A valid activation license unlocks use.** Without one, every API endpoint except
  `GET /health` answers `403 license_required`, so the binary does nothing until activated.
- The activation license is a cryptographically signed token, **validated offline** — no phone-home
  required to run.

**Want to evaluate it?** Trial licenses are available on request — open an issue with the
[💬 Question / license request](https://github.com/renanlido/tia-openness/issues/new/choose)
template.

---

## Buy / get a license

Looking to license it for your team or integration business? **Open a
[license request](https://github.com/renanlido/tia-openness/issues/new/choose)** and we'll get you
a trial or a quote. Licensing covers per-seat use, with tiers from inspection/scaffolding up to full
**create → compile → deploy** and hardware control.

Pricing and self-serve checkout are rolling out — for now, requests are handled directly.

---

## Drive it from AI (MCP)

The app is **non-opinionated** (endpoints pass parameters straight through to Openness), which makes
it ideal to drive from an AI assistant. The **`tia` MCP server** is a thin HTTP client published on
npm — point it at your running `serve` and you're done:

```bash
npx -y @renanlido/tia-openness-mcp
```

For **Claude Code** (one line, user scope):

```bash
claude mcp add --transport stdio --env TIA_API_BASE=http://localhost:5000 --scope user tia -- npx -y @renanlido/tia-openness-mcp
```

Other clients (Claude Desktop, Codex, Gemini CLI, Cursor, VS Code, Windsurf) and the Windows
`cmd /c npx` gotcha are covered in **[docs/INSTALL.md](docs/INSTALL.md)**.

> The MCP **never sends a key** — activation is the **host's** responsibility (the license configured
> on the `serve` machine). Without a licensed `serve` to point at, the MCP can only diagnose
> connectivity (`tia_ping`).

For an end-to-end harness that turns a structured spec into a verified TIA project, install the
[**tia-harness**](https://github.com/renanlido/tia-harness) Claude Code plugin.

---

## Documentation

- **[Getting started](docs/getting-started.md)** — download → install → activate → start the API.
- **[MCP / client setup (docs/INSTALL.md)](docs/INSTALL.md)** — wire the `tia` MCP into any AI client.
- **[CHANGELOG](CHANGELOG.md)** — release history of the app.
- **[Support](SUPPORT.md)** — how to get help, report bugs, request features.
- **[EULA](EULA.md)** — end-user license agreement for the app.

---

## Support & issues

- 🐛 **Bug?** Open a [Bug report](https://github.com/renanlido/tia-openness/issues/new/choose).
- 💡 **Idea?** Open a [Feature request](https://github.com/renanlido/tia-openness/issues/new/choose).
- 💬 **Question or license request?** Use the [Question template](https://github.com/renanlido/tia-openness/issues/new/choose).

See **[SUPPORT.md](SUPPORT.md)** for channels and response expectations.

---

## License

The TIA Openness API app is **proprietary software** — all rights reserved. Use requires a valid
activation license; see the **[EULA](EULA.md)**. The open **MCP** and **harness** client layers are
MIT-licensed in their own repositories.

> *TIA Portal*, *TIA*, *SIMATIC*, *STEP 7*, and *Siemens* are trademarks of Siemens AG. This is an
> independent product **for** TIA Portal and is not affiliated with or endorsed by Siemens.
