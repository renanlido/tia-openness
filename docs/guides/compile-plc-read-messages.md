# Compile a PLC from code and read the compile messages

Compiling is the check that tells you whether generated or imported logic is good. With TIA Portal Openness you
compile from your program and read the result as objects instead of looking at the Inspector window. This guide does
it in C#, then through PLCWare's HTTP API and MCP tools, and ends with how a clean compile leads to a download. It
applies to **TIA Portal V21**.

## Before you start

- An Openness application connected to TIA Portal V21 with a project open
  ([Set up TIA Portal Openness on Windows](openness-setup-windows.md)).
- All devices must be **offline** while you compile.
- If a password protects the safety program, you must log on to the safety program to compile software changes.
  Otherwise the compile is canceled and an exception is thrown.

## Compile with Openness (C#)

Compiling goes through the `ICompilable` service. What gets compiled depends on the object you ask:

| Object | What it compiles |
|---|---|
| `Device` (the station) | Hardware and software |
| `DeviceItem` (the CPU) | Hardware only |
| `PlcSoftware` | The PLC program only |
| `CodeBlock`, `DataBlock`, `PlcType` | That one object |
| `HmiTarget` | The HMI software |

```csharp
using System;
using Siemens.Engineering.Compiler;
using Siemens.Engineering.SW;

static bool Compile(PlcSoftware plcSoftware)
{
    ICompilable compiler = plcSoftware.GetService<ICompilable>();
    CompilerResult result = compiler.Compile();

    Console.WriteLine($"State: {result.State}, {result.ErrorCount} errors, {result.WarningCount} warnings");
    Print(result.Messages, "");
    return result.State != CompilerResultState.Error;
}

static void Print(CompilerResultMessageComposition messages, string indent)
{
    foreach (CompilerResultMessage message in messages)
    {
        Console.WriteLine($"{indent}{message.State} {message.Path}: {message.Description}");
        Print(message.Messages, indent + "  ");
    }
}
```

Every message carries `Path`, `DateTime` (always UTC; use `ToLocalTime()` to show local time), `State`,
`Description`, `WarningCount`, `ErrorCount` and its own child `Messages`, so the result is a tree, not a flat list.

Compiling only the CPU's `DeviceItem` checks the hardware and can look clean while the program has real errors. To
cover both, compile the `Device` (or the `DeviceItem` and the `PlcSoftware`).

## Compile with PLCWare

```powershell
$r = Invoke-RestMethod -Method Post "http://localhost:5000/plcs/PLC_1/compile" `
  -ContentType "application/json" -Body '{}'
"{0}: {1} errors, {2} warnings" -f $r.state, $r.errors, $r.warnings
```

PLCWare compiles hardware and software and aggregates the result. An abbreviated answer:

```json
{
  "state": "Error", "errors": 1, "warnings": 0,
  "messages": [
    { "state": "Error", "path": "PLC_1/FB_Motor/Network 3", "dateTime": "2026-09-25T12:00:00Z",
      "description": "...", "children": [] }
  ],
  "sections": [ { "target": "hardware" }, { "target": "software" } ],
  "blockChanges": [ { "name": "FB_Motor_Instance", "detail": "InstanceDB#8", "change": "modified", "parts": ["Interface"] } ]
}
```

- `state` is the worst state found (`Error`, then `Warning`, `Information`, `Success`). `errors` and `warnings` are
  totals, and `messages` is the whole tree, each message with its `path` and `dateTime`.
- `sections` details the hardware and the software separately.
- `blockChanges` lists the blocks the compile changed. A `modified` instance DB means the compile regenerated it after
  its FB's interface changed: export it and commit it so what you version matches the project.
- Only `Error` blocks a download. Warnings do not.

The MCP tool is `tia_compile` with `{ "plc": "PLC_1" }`. It flattens the message tree and adds a `verification` summary
(`compiled`, `errors`, `warnings`) and `nextHints`. `tia_block_compile` compiles a single block (PLCWare app 1.7.0 or
later); a clean block compile is not the check that comes before a download, so compile the whole PLC for that.

Compiling can take a while on a large project. When the answer is `status: "running"` with a `jobId`, the compile is
still running: call `tia_job_status` with that `jobId` until the result arrives, and do not repeat the original call.

## When the compile has errors

- Read the first errors first: the rest are often consequences. Use each message's `path` to find the block and the
  network.
- Changing an FB's interface leaves its instance DB inconsistent until a compile regenerates it. Compile again before
  you start deleting anything.
- A CPU created through Openness can fail its first compile with protection errors until its protection settings are
  set; see [Create devices and hardware](create-devices-hardware-network.md).
- Some errors are settings Openness cannot change, such as the OPC UA runtime license. They are a person's job in the
  TIA Portal window. In the MCP, `tia_guide` with `{ "topic": "gui-gates" }` lists them with the exact steps.

## From a clean compile to a download

A compile with zero errors is the precondition for downloading to a real PLC, and the download stays a human decision.
`tia_download` works in two steps: first with `dryRun: true`, which asks the `serve` app for a verified plan (a clean
compile, a PG/PC interface found, a fingerprint of the software) and returns a single-use `planHash`; then, after a
person has read and approved that plan, again with `approved: true` and the same `planHash`. If the software changed
after the plan, the download is refused with `409 plan_stale`. Planning a download needs the Pro scope, which the trial
includes; Basic can read, author and compile but cannot plan one.

## Related guides

- [Import LAD, FBD and SCL blocks into TIA Portal from code](import-lad-fbd-scl-blocks.md)
- [Create devices and hardware with TIA Portal Openness](create-devices-hardware-network.md)
- [Connect an AI assistant to TIA Portal through MCP](connect-ai-assistant-mcp.md)
- [All guides](README.md)

## Start your free 30-day trial

PLCWare runs these steps for you, or for your AI assistant, against TIA Portal V21. The trial lasts 30 days, includes the
Pro scopes, needs no card and does not renew. You need TIA Portal V21 with a STEP 7 Professional license, bought
separately from Siemens.

**[Start the free 30-day trial](https://plcware.io/en/trial?utm_source=github&utm_medium=guide&utm_campaign=compile-plc-read-messages)**
· [Download the app](https://plcware.io/download)

*TIA Portal, SIMATIC and Siemens are trademarks of Siemens AG. PLCWare is an independent product for TIA Portal and
is not affiliated with or endorsed by Siemens.*
