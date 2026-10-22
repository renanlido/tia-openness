# Export a PLC block to SimaticML XML with TIA Portal Openness

SimaticML is the XML format TIA Portal Openness uses to move PLC blocks in and out of a project. This guide
exports one block, or every block, to XML: first with plain Openness in C#, then with PLCWare's HTTP API and MCP
tools. It applies to **TIA Portal V21**.

## Before you start

- An Openness application connected to TIA Portal V21 with a project open. If you have not set that up yet, see
  [Set up TIA Portal Openness on Windows](openness-setup-windows.md).
- The PLC must **not be online**.
- Only **consistent** blocks export. If the block changed since the last compile, compile it first
  ([Compile a PLC from code](compile-plc-read-messages.md)).
- Supported block types: FB, FC, OB and global DB. Supported languages: STL, FBD, LAD, GRAPH and SCL.

## Export one block with Openness (C#)

```csharp
using System.IO;
using Siemens.Engineering;
using Siemens.Engineering.SW;
using Siemens.Engineering.SW.Blocks;

static void ExportBlock(PlcSoftware plcSoftware)
{
    PlcBlock block = plcSoftware.BlockGroup.Blocks.Find("FB_Motor");
    block.Export(new FileInfo(@"D:\Export\FB_Motor.xml"), ExportOptions.WithDefaults);
}
```

`ExportOptions` decides how much goes into the file:

| Option | What the file contains |
|---|---|
| `ExportOptions.None` | Only data that was modified or differs from the default, plus what the import needs |
| `ExportOptions.WithDefaults` | The default values too |
| `ExportOptions.WithReadOnly` | The write-protected values too |

Combine the last two with `ExportOptions.WithDefaults | ExportOptions.WithReadOnly`. The file is written in
English, and project texts are exported in every language the project has.

TIA Portal V21's Openness libraries write SimaticML of engineering version V21 and can read files from V18 to V21.

## Export every block, user groups included

```csharp
static void ExportAll(PlcSoftware plc, string folder)
{
    Directory.CreateDirectory(folder);
    ExportBlocks(plc.BlockGroup.Blocks, folder);
    foreach (PlcBlockUserGroup group in plc.BlockGroup.Groups)
        ExportGroup(group, Path.Combine(folder, group.Name));
}

static void ExportGroup(PlcBlockUserGroup group, string folder)
{
    Directory.CreateDirectory(folder);
    ExportBlocks(group.Blocks, folder);
    foreach (PlcBlockUserGroup sub in group.Groups)
        ExportGroup(sub, Path.Combine(folder, sub.Name));
}

static void ExportBlocks(PlcBlockComposition blocks, string folder)
{
    foreach (PlcBlock block in blocks)
        block.Export(new FileInfo(Path.Combine(folder, block.Name + ".xml")), ExportOptions.WithDefaults);
}
```

A know-how protected block exports only its public interface unless you unlock it first with
`PlcBlockProtectionProvider`.

## Export with PLCWare

PLCWare's `serve` app wraps the same Openness calls behind a local HTTP/JSON API (default
`http://localhost:5000`), and the `tia` MCP server exposes them as tools for an AI assistant. Exporting only reads
the project, so it works on every plan, Basic included.

### One block, returned inline

```powershell
$r = Invoke-RestMethod "http://localhost:5000/plcs/PLC_1/blocks/FB_Motor/xml"
$r.xml | Out-File FB_Motor.xml -Encoding utf8
$r.contentHash
```

The answer is `{ name, options, contentHash, contentHashError, xml }`. Add `?options=WithDefaults` (or `None`,
`WithReadOnly`, combined with `,`) to choose the export options. The MCP tool is `tia_export_block` with
`{ "plc": "PLC_1", "block": "FB_Motor" }`.

### Every block and type, into a folder

```powershell
Invoke-RestMethod -Method Post "http://localhost:5000/plcs/PLC_1/export" `
  -ContentType "application/json" -Body '{"directory":"C:\\export"}'
```

The blocks go to `Blocks\` and the types to `Types\` under that directory, **on the machine where `serve` runs**, and
the answer lists each file with its SHA-256 and size. The MCP tool is `tia_export_xml`; use it when a project is too
big to come back in one tool result.

## Prove the project still matches the XML in git

Do not compare hashes of two raw exports: two exports of the same block differ in `<Created>` and in the UIds. Pass
the committed XML to `tia_block_compare` instead. It compares the block in the project with your file after
normalizing both (it ignores formatting, the BOM, `<Created>` and UIds) and answers `verdict: "equal"` or
`"different"`.

Other details worth knowing:

- Exporting an inconsistent block compiles it first, which can regenerate its instance DB. Export and commit the
  instance DB too.
- `contentHash` is the hash the stale-write guard checks before an import overwrites a block (see
  [Import LAD, FBD and SCL blocks](import-lad-fbd-scl-blocks.md)). The guard needs PLCWare app 1.7.0 or later.
- `tia_block_render` turns a SimaticML export into readable pseudo-SCL, network by network, without a running
  TIA Portal. It is handy for reviewing LAD and FBD blocks in a pull request.
- Consistent F-blocks can be exported and imported again, but the safety system's own F-system blocks cannot be
  exported.

## Related guides

- [Import LAD, FBD and SCL blocks into TIA Portal from code](import-lad-fbd-scl-blocks.md)
- [Compile a PLC from code and read the messages](compile-plc-read-messages.md)
- [All guides](README.md)

## Start your free 30-day trial

PLCWare runs these steps for you, or for your AI assistant, against TIA Portal V21. The trial lasts 30 days, includes
the Pro scopes, needs no card and does not renew. You need TIA Portal V21 with a STEP 7 Professional license, bought separately from
Siemens.

**[Start the free 30-day trial](https://plcware.io/en/trial?utm_source=github&utm_medium=guide&utm_campaign=export-plc-block-simaticml)**
· [Download the app](https://plcware.io/download)

*TIA Portal, SIMATIC and Siemens are trademarks of Siemens AG. PLCWare is an independent product for TIA Portal and
is not affiliated with or endorsed by Siemens.*
