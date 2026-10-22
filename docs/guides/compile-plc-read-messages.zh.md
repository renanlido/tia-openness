# 用代码编译 PLC 并读取编译消息

> 简体中文译文。英文原文：[compile-plc-read-messages.md](compile-plc-read-messages.md)。

编译是检验生成或导入的逻辑是否正确的手段。借助 TIA Portal Openness，你可以在自己的程序中发起编译，并以对象的形式读取结果，而不必盯着
“检查器”窗口。本指南先用 C# 实现，再用 PLCWare 的 HTTP API 和 MCP 工具实现，最后说明一次干净的编译如何通向下载。适用于
**TIA Portal V21**。

## 开始之前

- 一个已连接到 TIA Portal V21、并且已打开项目的 Openness 应用
  （[在 Windows 上配置 TIA Portal Openness](openness-setup-windows.zh.md)）。
- 编译期间，所有设备都必须处于**离线**状态。
- 如果安全程序设置了密码，你必须先登录安全程序才能编译软件更改，否则编译会被取消并抛出异常。

## 用 Openness（C#）编译

编译通过 `ICompilable` 服务进行。编译的范围取决于你传入的对象：

| 对象 | 编译内容 |
|---|---|
| `Device`（站） | 硬件和软件 |
| `DeviceItem`（CPU） | 仅硬件 |
| `PlcSoftware` | 仅 PLC 程序 |
| `CodeBlock`、`DataBlock`、`PlcType` | 该对象本身 |
| `HmiTarget` | HMI 软件 |

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

每条消息都带有 `Path`、`DateTime`（始终为 UTC；要显示本地时间请用 `ToLocalTime()`）、`State`、`Description`、`WarningCount`、
`ErrorCount`，以及它自己的子消息 `Messages`，所以结果是一棵树，而不是平铺的列表。

只编译 CPU 的 `DeviceItem` 只会检查硬件，即使程序里有真正的错误，结果也可能显示为干净。要同时覆盖两者，请编译 `Device`（或者同时编译
`DeviceItem` 和 `PlcSoftware`）。

## 用 PLCWare 编译

```powershell
$r = Invoke-RestMethod -Method Post "http://localhost:5000/plcs/PLC_1/compile" `
  -ContentType "application/json" -Body '{}'
"{0}: {1} errors, {2} warnings" -f $r.state, $r.errors, $r.warnings
```

PLCWare 会编译硬件和软件，并汇总结果。下面是一个精简后的响应：

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

- `state` 是发现的最严重状态（依次为 `Error`、`Warning`、`Information`、`Success`）。`errors` 和 `warnings` 是总数，`messages` 是完整的消息树，
  每条消息都有自己的 `path` 和 `dateTime`。
- `sections` 分别给出硬件和软件的详细结果。
- `blockChanges` 列出编译改动过的块。若某个背景 DB 显示为 `modified`，说明它在 FB 接口变化之后被编译重新生成了：请导出并提交它，使你纳入版本管理的内容
  与项目一致。
- 只有 `Error` 会阻止下载，警告不会。

对应的 MCP 工具是 `tia_compile`，参数为 `{ "plc": "PLC_1" }`。它会把消息树展平，并附加 `verification` 摘要（`compiled`、`errors`、`warnings`）和
`nextHints`。`tia_block_compile` 只编译单个块（需要 PLCWare 应用 1.7.0 或更高版本）；单个块编译干净并不是下载之前要做的那次检查，所以请对整个 PLC 编译。

大型项目的编译可能需要一些时间。如果响应是带有 `jobId` 的 `status: "running"`，说明编译仍在进行：请用该 `jobId` 调用 `tia_job_status`，直到拿到结果，
不要重复发起原来的调用。

## 编译出现错误时

- 先看最前面的错误：后面的往往是连带产生的。用每条消息的 `path` 找到对应的块和网络。
- 修改 FB 的接口会让它的背景 DB 处于不一致状态，直到一次编译把它重新生成。在开始删除任何东西之前，先再编译一次。
- 通过 Openness 创建的 CPU，在设置保护选项之前，首次编译可能因保护方面的错误而失败；参见
  [创建设备和硬件](create-devices-hardware-network.zh.md)。
- 有些错误对应的是 Openness 无法修改的设置，例如 OPC UA 运行时许可证。这需要人在 TIA Portal 窗口中完成。在 MCP 中，用 `{ "topic": "gui-gates" }`
  调用 `tia_guide` 可以看到这些情况以及具体步骤。

## 从干净的编译到下载

零错误的编译是下载到真实 PLC 的前提，而下载本身仍由人来决定。`tia_download` 分两步：先用 `dryRun: true`，让 `serve` 应用给出经过验证的计划（编译干净、找到 PG/PC
接口、软件指纹），并返回一次性的 `planHash`；待有人阅读并批准该计划后，再用 `approved: true` 和同一个 `planHash` 调用一次。如果计划之后软件发生了变化，下载会被拒绝并返回
`409 plan_stale`。规划下载需要 Pro 权限范围，试用包含该范围；Basic 可以读取、编写和编译，但不能规划下载。

## 相关指南

- [通过代码将 LAD、FBD 和 SCL 块导入 TIA Portal](import-lad-fbd-scl-blocks.zh.md)
- [用 TIA Portal Openness 创建设备和硬件](create-devices-hardware-network.zh.md)
- [通过 MCP 将 AI 助手连接到 TIA Portal](connect-ai-assistant-mcp.zh.md)
- [全部指南](README.zh.md)

## 开始 30 天免费试用

PLCWare 会针对 TIA Portal V21，替你或你的 AI 助手完成这些步骤。试用期为 30 天，包含 Pro 权限范围，无需信用卡，且不会续期。你需要自行向西门子
另购带 STEP 7 Professional 许可证的 TIA Portal V21。

**[开始 30 天免费试用](https://plcware.io/zh/trial?utm_source=github&utm_medium=guide&utm_campaign=compile-plc-read-messages)**
· [下载应用](https://plcware.io/download)

*TIA Portal、SIMATIC 和 Siemens 是西门子公司（Siemens AG）的商标。PLCWare 是面向 TIA Portal 的独立产品，与西门子无关联，也未获
其认可。*
