# Support

Thanks for using the **TIA Openness API**. Here's how to get help.

## Before you open an issue

1. **Check the [Getting started guide](docs/getting-started.md)** and the
   **[MCP / client setup (docs/INSTALL.md)](docs/INSTALL.md)** — most setup problems are covered there.
2. **Run the built-in diagnostics:**
   - In the tray GUI: **API** tab → **Check environment** (verifies the Windows group, x64 process,
     TIA Portal V21 + PublicAPI).
   - From an AI client: call **`tia_ping`** — `reachable:false` means IP/port/firewall/`serve` is
     down; `activated:false` means the license is missing/invalid on the host; both `true` means
     you're ready.
3. **Check the [CHANGELOG](CHANGELOG.md)** — your issue may already be fixed in a newer release.

## Channels

| Need | Where |
|---|---|
| 🐛 **Bug report** | [New issue → Bug report](https://github.com/renanlido/tia-openness/issues/new/choose) |
| 💡 **Feature request** | [New issue → Feature request](https://github.com/renanlido/tia-openness/issues/new/choose) |
| 💬 **Question / license request** | [New issue → Question](https://github.com/renanlido/tia-openness/issues/new/choose) |
| 🔒 **Security disclosure** | **Do not** open a public issue — see below. |

**Priority support** (email, with response targets per tier) is included with a paid license and the
contact is delivered with your Activation License.

## What to include in a bug report

It helps us a lot if you include:

- App version (the `app-v*` tag, shown in the GUI / installer).
- TIA Portal version and the target CPU (e.g. S7-1200 1214C, firmware version).
- What you did, what you expected, and what happened (with the exact error text / envelope).
- Whether you were driving the API directly, via the MCP, or via the harness plugin.
- Output of **Check environment** / **`tia_ping`** if relevant.

## Security disclosures

If you believe you've found a security vulnerability, please report it **privately** — open a
[GitHub security advisory](https://github.com/renanlido/tia-openness/security/advisories/new) instead
of a public issue, so it can be fixed before disclosure.

## Scope

This repository tracks the **app / API** (the licensed product). For the open client layers:

- **`tia` MCP** — issues at [the MCP repository](https://www.npmjs.com/package/@renanlido/tia-openness-mcp).
- **`tia-harness` plugin** — issues at [renanlido/tia-harness](https://github.com/renanlido/tia-harness/issues).
