# 用 TIA Portal Openness 将 PLC 块导出为 SimaticML XML

> 简体中文译文。英文原文：[export-plc-block-simaticml.md](export-plc-block-simaticml.md)。

SimaticML 是 TIA Portal Openness 用来把 PLC 块导入、导出项目的 XML 格式。本指南把一个块（或全部块）导出为 XML：先用
C# 编写的原生 Openness，再用 PLCWare 的 HTTP API 和 MCP 工具。适用于 **TIA Portal V21**。

## 开始之前

- 一个已连接到 TIA Portal V21、并且已打开项目的 Openness 应用。如果还没有配置，请参阅
  [在 Windows 上配置 TIA Portal Openness](openness-setup-windows.zh.md)。
- PLC **不能处于在线状态**。
- 只有**一致**的块才能导出。如果块在上次编译之后有改动，请先编译
  （[用代码编译 PLC](compile-plc-read-messages.zh.md)）。
- 支持的块类型：FB、FC、OB 和全局 DB。支持的语言：STL、FBD、LAD、GRAPH 和 SCL。

## 用 Openness（C#）导出一个块

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

`ExportOptions` 决定文件里包含多少内容：

| 选项 | 文件包含的内容 |
|---|---|
| `ExportOptions.None` | 只含被修改过或与默认值不同的数据，以及导入所必需的内容 |
| `ExportOptions.WithDefaults` | 同时包含默认值 |
| `ExportOptions.WithReadOnly` | 同时包含写保护的值 |

后两个选项可以组合：`ExportOptions.WithDefaults | ExportOptions.WithReadOnly`。文件内容为英文，项目中的文本会按项目已有的
全部语言导出。

TIA Portal V21 的 Openness 库写出的是工程版本 V21 的 SimaticML，并且可以读取 V18 到 V21 的文件。

## 导出全部块（包括用户组）

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

带有专有技术保护（know-how protection）的块只会导出其公共接口，除非你先用 `PlcBlockProtectionProvider` 解除保护。

## 用 PLCWare 导出

PLCWare 的 `serve` 应用把同样的 Openness 调用封装成本地 HTTP/JSON API（默认 `http://localhost:5000`），`tia` MCP 服务器再把
它们作为工具提供给 AI 助手。导出只读取项目，因此所有套餐（包括 Basic）都可以使用。

### 一个块，直接在响应中返回

```powershell
$r = Invoke-RestMethod "http://localhost:5000/plcs/PLC_1/blocks/FB_Motor/xml"
$r.xml | Out-File FB_Motor.xml -Encoding utf8
$r.contentHash
```

响应为 `{ name, options, contentHash, contentHashError, xml }`。加上 `?options=WithDefaults`（或 `None`、`WithReadOnly`，
多个值用 `,` 连接）即可选择导出选项。对应的 MCP 工具是 `tia_export_block`，参数为
`{ "plc": "PLC_1", "block": "FB_Motor" }`。

### 全部块和类型，导出到一个文件夹

```powershell
Invoke-RestMethod -Method Post "http://localhost:5000/plcs/PLC_1/export" `
  -ContentType "application/json" -Body '{"directory":"C:\\export"}'
```

块会写入该目录下的 `Blocks\`，类型写入 `Types\`，路径位于**运行 `serve` 的那台机器**上，响应会列出每个文件及其 SHA-256 和大小。
对应的 MCP 工具是 `tia_export_xml`；当项目太大、无法在一次工具结果中返回时，请使用它。

## 证明项目仍与 git 中的 XML 一致

不要比较两次原始导出的哈希：同一个块的两次导出在 `<Created>` 和 UId 上就会不同。应当把已提交的 XML 交给 `tia_block_compare`。
它会先对项目中的块和你的文件做规范化（忽略格式、BOM、`<Created>` 和 UId），再比较，并返回 `verdict: "equal"` 或
`"different"`。

其他值得了解的细节：

- 导出不一致的块时会先编译它，这可能会重新生成其背景 DB（instance DB）。请一并导出并提交背景 DB。
- `contentHash` 是“防止覆盖过期内容”的保护在导入覆盖块之前检查的哈希（参见
  [导入 LAD、FBD 和 SCL 块](import-lad-fbd-scl-blocks.zh.md)）。该保护需要 PLCWare 应用 1.7.0 或更高版本。
- `tia_block_render` 可以把 SimaticML 导出文件逐网络渲染成可读的伪 SCL，不需要运行 TIA Portal。用它在 pull request
  中审阅 LAD 和 FBD 块很方便。
- 一致的 F 块可以导出并重新导入，但安全系统自带的 F 系统块无法导出。

## 相关指南

- [通过代码将 LAD、FBD 和 SCL 块导入 TIA Portal](import-lad-fbd-scl-blocks.zh.md)
- [用代码编译 PLC 并读取消息](compile-plc-read-messages.zh.md)
- [全部指南](README.zh.md)

## 开始 30 天免费试用

PLCWare 会针对 TIA Portal V21，替你或你的 AI 助手完成这些步骤。试用期为 30 天，包含 Pro 权限范围，无需信用卡，且不会续期。你需要自行向西门子
另购带 STEP 7 Professional 许可证的 TIA Portal V21。

**[开始 30 天免费试用](https://plcware.io/zh/trial?utm_source=github&utm_medium=guide&utm_campaign=export-plc-block-simaticml)**
· [下载应用](https://plcware.io/download)

*TIA Portal、SIMATIC 和 Siemens 是西门子公司（Siemens AG）的商标。PLCWare 是面向 TIA Portal 的独立产品，与西门子无关联，也未获
其认可。*
