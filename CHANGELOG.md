# Changelog

All notable changes to the **TIA Openness API** app are documented here. Releases are published on
the [Releases](https://github.com/renanlido/tia-openness/releases) page under the `app-v*` tag. The
app is **net48 / x64**, obfuscated for distribution. Installers update **in-place** over previous
`app-v1.x` versions (same AppId).

## app-v1.3.1

- **Fix:** the API failed to start when bound to host `0.0.0.0` (`HttpListener` rejects `0.0.0.0` as
  a prefix). `serve` now normalizes `0.0.0.0` / `::` / `*` / empty to `+`, the valid wildcard that
  matches the remote-access URL reservation. "Allow remote access…" + Host `0.0.0.0` now works
  end-to-end.

## app-v1.3.0

- **One-click remote access** (opt-in; default stays **localhost**, nothing exposed): the **API** tab
  gains an **"Allow remote access…"** button that reserves the HTTP URL ACL and opens the firewall
  port (via UAC), with a security warning and the option to **restrict to a source IP**. Starting
  with a remote host without allowing it first is detected, and the app offers to allow it.
- New CLI verb: `TIAOpenness.exe setup-remote [port] [--allow <ip>] [--remove]` (admin).
- New "Remote access" section in the install docs.

## app-v1.2.0

- **"Getting started" screen** — a proper product window (numbered steps, a **Copy** button for the
  MCP command, and an embedded **"Check environment"** diagnostic) replaces the old plain-text
  next-steps file. Shown on first run, from the tray menu, and post-install.
- **App icon** — a multi-size icon used across the executable, windows, tray, and the installer.

## app-v1.1.0

- **New endpoint** `POST /plcs/{plc}/device/changeversion` — bumps the CPU firmware **in-place**
  while preserving the program (blocks/DBs). Exposed as the MCP tool `tia_device_change_version`.
  Runtime-validated against an S7-1200 1214C.
- ⚠️ **Note:** changing the device version resets GUI-gated CPU communication settings — it disables
  the **OPC UA server** and clears the **OPC UA runtime-license** selection (the custom server
  interface and PUT/GET survive). Archive the project first on CPUs with hand-configured
  OPC UA / PUT-GET, then re-verify and recompile.

## app-v1.0.2

- **Compile now aggregates hardware + software.** `serve` / MCP / CLI compile the CPU device item
  **and** the PLC software and report the worst state, with per-target sections. This fixes the
  "false-clean" case (success/0 errors even when software blocks had errors). Compiling at software
  scope also regenerates inconsistent instance DBs after an FB interface change (verified on an
  S7-1200).
- Automatic block numbering is forced when the requested number is ≤ 0, avoiding an invalid
  "block 0" that broke compilation.

## app-v1.0.1

- **Download delegate auto-confirms all Openness download configs** (`ResetModule`,
  `ConsistentBlocksDownload`, `AlarmTextLibrariesDownload`, in addition to
  `StopModules` / `OverwriteSystemData` / `StartModules`). This unblocks replacing a different
  project on the PLC. Validated on real hardware (S7-1200 1214C, download via the MCP).

## app-v1.0.0

- First release. Windows app + HTTP/JSON API over TIA Openness V21, system-tray GUI, CLI
  (`check` / `serve` / `list` / `open` / `export` / `compile`), one-click installer, and offline
  activation-license gating (`403 license_required` without a valid license).
