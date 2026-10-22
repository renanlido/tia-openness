# Guides for TIA Portal Openness

Practical answers to the questions that come up when you automate **TIA Portal V21** with Openness. Each guide shows
the plain Openness route in C# and the PLCWare route (HTTP API and MCP tools for an AI assistant), with the human
gates in place: a download to a real PLC always waits for a person's approval.

## The guides

- [Set up TIA Portal Openness on Windows](openness-setup-windows.md): the Siemens TIA Openness user group, the
  first-connection prompt, the V21 libraries and how a project opens.
- [Export a PLC block to SimaticML XML](export-plc-block-simaticml.md): one block or all of them, the export options and
  how to prove the project still matches the XML in git.
- [Import LAD, FBD and SCL blocks into TIA Portal from code](import-lad-fbd-scl-blocks.md): SimaticML import, SCL source
  files, overwrite rules and the stale-write guard.
- [Compile a PLC from code and read the compile messages](compile-plc-read-messages.md): what each object compiles, the
  message tree and the path from a clean compile to an approved download.
- [Create devices and hardware configuration](create-devices-hardware-network.md): the CPU, modules, subnet, IP address
  and IO system, and a whole project described in one spec.
- [Connect an AI assistant to TIA Portal through MCP](connect-ai-assistant-mcp.md): Claude Desktop, Claude Code and other
  MCP clients, read-only mode and what the assistant cannot do alone.

## More documentation

- [Installation manual](../INSTALL.md)
- [Getting started](../getting-started.md)
- [Support policy](../../SUPPORT.md)

## Start your free 30-day trial

PLCWare runs these steps for you, or for your AI assistant, against TIA Portal V21. The trial lasts 30 days, includes the
Pro scopes, needs no card and does not renew. You need TIA Portal V21 with a STEP 7 Professional license, bought
separately from Siemens.

**[Start the free 30-day trial](https://plcware.io/en/trial?utm_source=github&utm_medium=guide&utm_campaign=guides)**
· [Download the app](https://plcware.io/download)

*TIA Portal, SIMATIC and Siemens are trademarks of Siemens AG. PLCWare is an independent product for TIA Portal and
is not affiliated with or endorsed by Siemens.*
