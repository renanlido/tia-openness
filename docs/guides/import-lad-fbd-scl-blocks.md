# Import LAD, FBD and SCL blocks into TIA Portal from code

Openness can create blocks in a project from files: SimaticML XML for any language (LAD, FBD, GRAPH, SCL or STL) and
plain-text source files for SCL and STL. This guide shows both routes in C#, then the same work through PLCWare's HTTP
API and MCP tools. It applies to **TIA Portal V21**.

## Pick the route

| You have | Openness | PLCWare tool |
|---|---|---|
| LAD, FBD or GRAPH logic, or any block as XML | SimaticML import | `tia_import_xml` (`POST /plcs/{plc}/import`) |
| SCL as text | External source (`.scl`), then generate blocks | `tia_source_put` (`POST /plcs/{plc}/source`) |
| STL as text | External source (`.awl`), then generate blocks | Not `tia_source_put`, which writes SCL only: import the block as SimaticML with `tia_import_xml` |
| A user data type (UDT) | XML import of the type | `tia_types_import` (`POST /plcs/{plc}/types/import`) |

LAD, FBD and GRAPH have no text source, so PLCWare's tools do not draw new networks from nothing. The usual flow is
a template: someone draws the block once in TIA Portal, you export it
([Export a PLC block to SimaticML XML](export-plc-block-simaticml.md)), change names, tags and constants in the XML, and
import it as many times as you need. SCL is different: it is plain text, so it can be generated from start to finish.

## Before you start

- An Openness application connected to TIA Portal V21 with a project open
  ([Set up TIA Portal Openness on Windows](openness-setup-windows.md)).
- The PLC must **not be online**.
- Import UDTs **before** the blocks that use them.

## Import SimaticML with Openness (C#)

```csharp
using System.Collections.Generic;
using System.IO;
using Siemens.Engineering;
using Siemens.Engineering.SW;
using Siemens.Engineering.SW.Blocks;

static void ImportBlocks(PlcSoftware plcSoftware)
{
    IList<PlcBlock> blocks = plcSoftware.BlockGroup.Blocks.Import(
        new FileInfo(@"D:\Blocks\FB_Motor.xml"), ImportOptions.Override);
}
```

- `ImportOptions.None` imports without overwriting: if an object in the file already exists, the import is interrupted
  and an exception is thrown.
- `ImportOptions.Override` deletes the existing object before the import and recreates it. If the existing object and
  the new one are not in the same group, nothing is overwritten and the import is canceled with an exception.

What the import does, according to Siemens:

- The XML can hold less data than the block in the project, for example fewer parameters.
- Redundant information such as call information must be identical in the project and in the file, or an exception is
  thrown.
- The imported data may be inconsistent: compile afterwards.
- Attributes marked `ReadOnly=True` and `Informative=True` are not imported.
- Missing instance DBs are not created automatically.
- With no block number in the file, the number is assigned automatically. A new block with no version gets "0.1".
- All root objects in one file must be of the same kind. If one of them is invalid, nothing from the file is imported.
- The file must be well-formed XML. A syntax or structure error cancels the import and comes back in the exception.

## Import an SCL source file with Openness (C#)

```csharp
using System.Text;
using Siemens.Engineering.SW.ExternalSources;

static void ImportScl(PlcSoftware plcSoftware, string sclText)
{
    string path = @"D:\Sources\FB_Motor.scl";
    File.WriteAllText(path, sclText, new UTF8Encoding(true));

    PlcExternalSource source =
        plcSoftware.ExternalSourceGroup.ExternalSources.CreateFromFile("FB_Motor", path);
    source.GenerateBlocksFromSource();
}
```

- Source files must be `.awl` (STL), `.scl`, `.db` or `.udt`. Any other extension throws.
- Write the file as UTF-8 **with BOM** when it has special characters.
- Existing blocks with the same name are overwritten.
- If the generation fails, an exception carries the error messages and the project returns to its state before the
  call. `GenerateBlocksFromSource(GenerateBlockOptions.KeepOnError)` keeps what was generated and throws nothing: check
  each generated block by compiling it.

## Import with PLCWare

### SCL

```powershell
$body = @{ name = "MyLogic"; code = (Get-Content .\FB_Motor.scl -Raw); compile = $true } | ConvertTo-Json
Invoke-RestMethod -Method Post "http://localhost:5000/plcs/PLC_1/source" `
  -ContentType "application/json" -Body $body
```

The answer lists `generatedOrUpdated` (every block the source created or regenerated), `sourceChanges`, `blocks` and,
with `compile: true`, the compile result. TIA Portal regenerates a block even when the text is identical, so a block that
comes back in `generatedOrUpdated` needs a compile. The MCP tool is `tia_source_put` with
`{ "plc": "PLC_1", "name": "MyLogic", "code": "...", "compile": true }`. An SCL syntax error shows up here, when the
blocks are generated.

### LAD, FBD, GRAPH and any other block as XML

```powershell
$body = @{ xml = (Get-Content .\FB_Motor.xml -Raw); override = $true } | ConvertTo-Json
Invoke-RestMethod -Method Post "http://localhost:5000/plcs/PLC_1/import" `
  -ContentType "application/json" -Body $body
```

Send the content as `xml`. Use `path` only for a file that is already on the machine where `serve` runs. The answer lists
`imported` and, for each block, its `type`, `number`, `created`, `interfaceChanged` and `affectedInstanceDbs`. Imported
blocks come back inconsistent, and when an FB's interface changed the next compile regenerates its instance DBs. The MCP
tool is `tia_import_xml`; its sibling for UDTs is `tia_types_import`.

### The order that works

1. Import the UDTs (`tia_types_import`).
2. Import or generate the blocks (`tia_import_xml`, `tia_source_put`).
3. Compile ([Compile a PLC from code and read the messages](compile-plc-read-messages.md)).

Importing needs the `author` scope, which Basic, Pro and the trial all include. Downloading to a PLC is a different
matter: it needs Pro and a human's approval.

## Do not overwrite a newer change

Openness has no undo, so a script that reads a block, edits it and writes it back can silently overwrite a change made in
TIA Portal in between. PLCWare's guard prevents that: read the block with `tia_export_block`, keep its `contentHash`, and
pass it as `expectedContentHash` to `tia_import_xml` or `tia_source_put`. If the block changed in the meantime, the write
is refused with `409 state_changed` and nothing is written; read again, merge your edit and retry. The guard needs
PLCWare app 1.7.0 or later.

## Things that trip people up

- Regenerating an FB's interface leaves its instance DB inconsistent. Compile first; the compile usually regenerates the
  instance DB. If it still reports inconsistent, delete it (`tia_block_delete`), recreate it (`tia_instancedb_create`)
  and compile again.
- SCL variable names cannot be S7 reserved words such as `Counter` or `Timer`, and local variables in the body take a
  `#` prefix (`#MyVar`).
- Use SimaticML exported from V21: PLCWare's import expects V21 files.
- Safety (F) logic is never authored or deployed autonomously by the AI. Importing it is a decision for a person.

## Related guides

- [Export a PLC block to SimaticML XML](export-plc-block-simaticml.md)
- [Compile a PLC from code and read the messages](compile-plc-read-messages.md)
- [All guides](README.md)

## Start your free 30-day trial

PLCWare runs these steps for you, or for your AI assistant, against TIA Portal V21. The trial lasts 30 days, includes the
Pro scopes, needs no card and does not renew. You need TIA Portal V21 with a STEP 7 Professional license, bought
separately from Siemens.

**[Start the free 30-day trial](https://plcware.io/en/trial?utm_source=github&utm_medium=guide&utm_campaign=import-lad-fbd-scl-blocks)**
· [Download the app](https://plcware.io/download)

*TIA Portal, SIMATIC and Siemens are trademarks of Siemens AG. PLCWare is an independent product for TIA Portal and
is not affiliated with or endorsed by Siemens.*
