# 通过代码将 LAD、FBD 和 SCL 块导入 TIA Portal

> 简体中文译文。英文原文：[import-lad-fbd-scl-blocks.md](import-lad-fbd-scl-blocks.md)。

Openness 可以从文件在项目中创建块：任何语言（LAD、FBD、GRAPH、SCL 或 STL）都可以用 SimaticML XML，SCL 和 STL 还可以用纯文本源文件。
本指南先用 C# 演示这两条路线，再演示通过 PLCWare 的 HTTP API 和 MCP 工具完成同样的工作。适用于 **TIA Portal V21**。

## 选择路线

| 你有 | Openness | PLCWare 工具 |
|---|---|---|
| LAD、FBD 或 GRAPH 逻辑，或任何以 XML 表示的块 | SimaticML 导入 | `tia_import_xml`（`POST /plcs/{plc}/import`） |
| 文本形式的 SCL | 外部源文件（`.scl`），然后生成块 | `tia_source_put`（`POST /plcs/{plc}/source`） |
| 文本形式的 STL | 外部源文件（`.awl`），然后生成块 | 不要用 `tia_source_put`，它只写入 SCL：请用 `tia_import_xml` 以 SimaticML 导入该块 |
| 用户数据类型（UDT） | 以 XML 导入该类型 | `tia_types_import`（`POST /plcs/{plc}/types/import`） |

LAD、FBD 和 GRAPH 没有文本源，所以 PLCWare 的工具不会凭空绘制新的网络。常见做法是使用模板：有人在 TIA Portal 中画好一次块，
你把它导出（[将 PLC 块导出为 SimaticML XML](export-plc-block-simaticml.zh.md)），在 XML 里修改名称、变量和常量，然后按需导入任意多次。
SCL 则不同：它就是纯文本，可以从头到尾生成。

## 开始之前

- 一个已连接到 TIA Portal V21、并且已打开项目的 Openness 应用
  （[在 Windows 上配置 TIA Portal Openness](openness-setup-windows.zh.md)）。
- PLC **不能处于在线状态**。
- 先导入 UDT，再导入使用它们的块。

## 用 Openness（C#）导入 SimaticML

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

- `ImportOptions.None` 不覆盖已有内容：文件中的对象如果已经存在，导入会中断并抛出异常。
- `ImportOptions.Override` 会在导入前删除已有对象并重新创建。如果已有对象与新对象不在同一个组中，则不会覆盖，导入会被取消并抛出异常。

按西门子文档，导入的行为如下：

- XML 中的数据可以比项目中的块少，例如参数更少。
- 调用信息之类的冗余信息在项目和文件中必须一致，否则会抛出异常。
- 导入的数据可能是“不一致”的：导入之后请编译。
- 标记为 `ReadOnly=True` 和 `Informative=True` 的属性不会被导入。
- 缺失的背景 DB 不会自动创建。
- 文件中没有块编号时，编号会自动分配。没有版本信息的新块会得到“0.1”。
- 一个文件中的所有根对象必须是同一类。只要其中一个无效，文件中的内容就一个都不会导入。
- 文件必须是格式良好的 XML。语法或结构错误会取消导入，并在异常中返回。

## 用 Openness（C#）导入 SCL 源文件

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

- 源文件必须是 `.awl`（STL）、`.scl`、`.db` 或 `.udt`。其他扩展名会抛出异常。
- 如果文件含有特殊字符，请保存为 **带 BOM 的** UTF-8。
- 同名的已有块会被覆盖。
- 如果生成失败，异常中会带有错误消息，项目会回到调用之前的状态。`GenerateBlocksFromSource(GenerateBlockOptions.KeepOnError)`
  会保留已生成的内容且不抛出异常：请通过逐个编译所生成的块来检查结果。

## 用 PLCWare 导入

### SCL

```powershell
$body = @{ name = "MyLogic"; code = (Get-Content .\FB_Motor.scl -Raw); compile = $true } | ConvertTo-Json
Invoke-RestMethod -Method Post "http://localhost:5000/plcs/PLC_1/source" `
  -ContentType "application/json" -Body $body
```

响应中包含 `generatedOrUpdated`（源文件创建或重新生成的每个块）、`sourceChanges`、`blocks`，设置 `compile: true` 时还有编译结果。
即使文本完全相同，TIA Portal 也会重新生成块，所以出现在 `generatedOrUpdated` 里的块都需要编译。对应的 MCP 工具是 `tia_source_put`，
参数为 `{ "plc": "PLC_1", "name": "MyLogic", "code": "...", "compile": true }`。SCL 语法错误会在这里、也就是生成块的时候暴露出来。

### LAD、FBD、GRAPH 以及其他以 XML 表示的块

```powershell
$body = @{ xml = (Get-Content .\FB_Motor.xml -Raw); override = $true } | ConvertTo-Json
Invoke-RestMethod -Method Post "http://localhost:5000/plcs/PLC_1/import" `
  -ContentType "application/json" -Body $body
```

内容请放在 `xml` 中发送。只有当文件已经位于运行 `serve` 的那台机器上时，才使用 `path`。响应中包含 `imported`，以及每个块的 `type`、
`number`、`created`、`interfaceChanged` 和 `affectedInstanceDbs`。导入的块会处于不一致状态；如果某个 FB 的接口变了，下一次编译会重新生成它的
背景 DB。对应的 MCP 工具是 `tia_import_xml`，用于 UDT 的是 `tia_types_import`。

### 行之有效的顺序

1. 导入 UDT（`tia_types_import`）。
2. 导入或生成块（`tia_import_xml`、`tia_source_put`）。
3. 编译（[用代码编译 PLC 并读取消息](compile-plc-read-messages.zh.md)）。

导入需要 `author` 权限范围，Basic、Pro 和试用都包含它。下载到 PLC 则是另一回事：它需要 Pro，并且需要有人批准。

## 不要覆盖更新的改动

Openness 没有撤销功能，所以一个“读取块、修改、写回”的脚本可能会悄悄覆盖这期间在 TIA Portal 里做的改动。PLCWare 的保护机制可以防止这种情况：
用 `tia_export_block` 读取块，保存它的 `contentHash`，再把它作为 `expectedContentHash` 传给 `tia_import_xml` 或 `tia_source_put`。如果块在此期间
发生了变化，写入会被拒绝并返回 `409 state_changed`，什么都不会写入；请重新读取、合并你的修改后再试。该保护需要 PLCWare 应用 1.7.0 或更高版本。

## 常见的坑

- 重新生成 FB 的接口会让它的背景 DB 变得不一致。先编译；编译通常会重新生成背景 DB。如果它仍然显示不一致，就删除它（`tia_block_delete`）、
  重新创建（`tia_instancedb_create`），再编译一次。
- SCL 变量名不能是 S7 的保留字，例如 `Counter` 或 `Timer`；块体中的局部变量要加 `#` 前缀（`#MyVar`）。
- 请使用从 V21 导出的 SimaticML：PLCWare 的导入期望 V21 文件。
- 安全（F）逻辑绝不会由 AI 自主编写或下载。导入它必须由人来决定。

## 相关指南

- [将 PLC 块导出为 SimaticML XML](export-plc-block-simaticml.zh.md)
- [用代码编译 PLC 并读取消息](compile-plc-read-messages.zh.md)
- [全部指南](README.zh.md)

## 开始 30 天免费试用

PLCWare 会针对 TIA Portal V21，替你或你的 AI 助手完成这些步骤。试用期为 30 天，包含 Pro 权限范围，无需信用卡，且不会续期。你需要自行向西门子
另购带 STEP 7 Professional 许可证的 TIA Portal V21。

**[开始 30 天免费试用](https://plcware.io/zh/trial?utm_source=github&utm_medium=guide&utm_campaign=import-lad-fbd-scl-blocks)**
· [下载应用](https://plcware.io/download)

*TIA Portal、SIMATIC 和 Siemens 是西门子公司（Siemens AG）的商标。PLCWare 是面向 TIA Portal 的独立产品，与西门子无关联，也未获
其认可。*
