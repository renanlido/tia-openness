# 在 Windows 上配置 TIA Portal Openness：用户组、首次连接提示与 V21

> 简体中文译文。英文原文：[openness-setup-windows.md](openness-setup-windows.md)。

Openness 应用要接触项目之前，工程师站需要四样东西：TIA Portal V21、位于 Openness 用户组中的 Windows 用户、能被你的程序找到的 V21 库，以及在
TIA Portal 的 Openness 防火墙中对该程序的一次性批准。本指南依次说明这几项，然后介绍 PLCWare 替你做了什么。适用于 **TIA Portal V21**。

## 快速清单

1. PC 上已安装 TIA Portal V21，Openness 随之一起安装。
2. 你的 Windows 用户是本地组 **Siemens TIA Openness** 的成员，并且已经注销后重新登录。
3. 你的程序从 TIA Portal 的安装目录加载 Siemens.Engineering 库。
4. 程序第一次连接时，你已在防火墙提示中批准了它。
5. 项目是 V21 项目，或者你用升级方式打开它。

## 1. TIA Portal V21 及其库

在 V21 中，TIA Portal Openness 不再是安装选项，而是 TIA Portal 的固有功能，随它一起安装。根据所装的产品和选项，还会随之安装额外的模块化
Siemens.Engineering 程序集。它们位于安装目录下的 `PublicAPI\V21\net48\`，例如：

```
C:\Program Files\Siemens\Automation\Portal V21\PublicAPI\V21\net48\Siemens.Engineering.Base.dll
```

除 `Siemens.Engineering.Base.dll` 之外，处理 PLC 的程序还会引用 `Siemens.Engineering.Step7.dll`。由此带来两点后果：

- V17、V18、V19 和 V20 的库不包含在 V21 中。为旧版本构建的程序必须先做调整，才能针对 V21 运行。
- 一个程序同一时间只能使用一个 TIA Portal 版本：不支持在同一个 AppDomain 中访问不同版本。

## 2. 将你的用户加入 “Siemens TIA Openness” 组

TIA Portal 在安装时会创建本地 Windows 组 **Siemens TIA Openness**。每当你的程序尝试访问某个 TIA Portal 进程时，TIA Portal 都会检查你是否属于该组
（直接属于或通过其他组间接属于）。如果不是，就会抛出 `EngineeringSecurityException`。成为该组成员，即允许你运行任何 Openness 应用。

由管理员添加用户：

1. 以管理员身份打开**计算机管理**。
2. 进入**本地用户和组 > 组**。
3. 打开 **Siemens TIA Openness**，点击**添加…**，添加该用户。
4. 该用户完全注销后重新登录。

在提升权限的 PowerShell 中，同样的操作是：

```powershell
Add-LocalGroupMember -Group "Siemens TIA Openness" -Member "$env:USERDOMAIN\$env:USERNAME"
```

## 3. 让你的程序找到这些库

对每一个 Siemens.Engineering 引用，把 **Copy Local** 设为 **False**，并清理输出目录：不支持把这些库复制到你的程序旁边。西门子给出了在运行时解析它们的两种方式，
并推荐把注册表项与 `AssemblyResolve` 事件配合使用。

注册表会替你保存路径：在
`HKEY_LOCAL_MACHINE\SOFTWARE\Siemens\Automation\Openness\<xx.xx>\PublicAPI\<xx.xx.xx.xx>\net48`（每个受支持的 .NET 目标一个键）下，
`Siemens.Engineering.Base` 值指向安装路径。使用固定路径同样可行：

```csharp
using System;
using System.IO;
using System.Reflection;

internal static class Program
{
    private const string OpennessFolder = @"C:\Program Files\Siemens\Automation\Portal V21\PublicAPI\V21\net48";

    static Program()
    {
        // 尽可能早地注册解析器。
        AppDomain.CurrentDomain.AssemblyResolve += OnAssemblyResolve;
    }

    public static void Main() => new HelloOpennessApp().Run(); // Openness 类型放在另一个类中

    private static Assembly OnAssemblyResolve(object sender, ResolveEventArgs args)
    {
        var requested = new AssemblyName(args.Name);
        string file = Path.Combine(OpennessFolder, requested.Name + ".dll");
        if (!requested.Name.StartsWith("Siemens.Engineering.") || !File.Exists(file)) return null;
        return Assembly.LoadFrom(file);
    }
}
```

在解析器注册之前，不要接触任何 Openness 类型（无论是在方法体、属性、参数还是返回值中）；请把这类代码放在单独的类里，只在订阅事件之后才使用。

## 4. 第一次连接：Openness 防火墙提示

当你的程序连接到正在运行的 TIA Portal 实例（包括启动一个新实例）时，TIA Portal 会询问是否接受该连接。

| 按钮 | 作用 |
|---|---|
| **是** | 允许此程序访问这个正在运行的实例，仅此一次。下次还会再次提示。 |
| **全部是** | 管理员永久允许此程序访问所有实例。Windows 会请求 UAC 批准，并向注册表写入一个条目。 |

该条目位于 `HKEY_LOCAL_MACHINE\SOFTWARE\Siemens\Automation\Openness\AllowList`（在 V21 中，所有 TIA Portal 版本共用同一个键），记录程序的路径、修改日期和文件哈希。
这三项中任何一项发生变化（包括重新编译你的程序），TIA Portal 都会把它当作另一个程序，再次询问。管理员也可以把该条目做成 `.reg` 文件统一下发，而不必等待提示。

## 5. 连接并打开项目

```csharp
using (TiaPortal portal = new TiaPortal(TiaPortalMode.WithUserInterface))   // 或 WithoutUserInterface
{
    Project project = portal.Projects.Open(new FileInfo(@"C:\Projects\Line2\Line2.ap21"));
}
```

- `TiaPortal.GetProcesses()` 列出你可以附加的正在运行的实例。
- `Projects.Open` 只打开用当前版本创建或已升级到当前版本的项目；更早版本的项目会抛出异常。`OpenWithUpgrade` 会基于它创建一个新的、已升级的项目并打开它。
- 一个项目不能同时在两个 TIA Portal 实例中打开。
- 使用 V21 的库时，导出的 SimaticML 是 V21 版本，并且可以导入 V18 到 V21 的文件。

## PLCWare 替你做了什么

PLCWare 的 `serve` 应用本身就是 Openness 程序，所以上面这些你都不用自己写。它从你本机的 TIA Portal 安装目录加载西门子程序集（这些程序集不会被再分发），替你解析它们，
并把每一次 Openness 调用放在同一个串行 worker 上执行。仍由你负责的有：

- **用户组。**安装程序的首次设置会把你的 Windows 用户加入 **Siemens TIA Openness**。之后请注销并重新登录。如果之后环境检查对用户组报错，请再次运行设置，然后注销并重新登录。
- **检查。**在托盘应用中打开 **API** 选项卡，点击 **Check environment**，或在命令行运行：

  ```powershell
  TIAOpenness.exe check
  ```

  它会检查 Windows 用户组、进程是否为 x64，以及 TIA Portal V21 及其 PublicAPI 是否存在。在 MCP 中，`tia_readiness` 在运行 `serve` 的那台机器上做同类检查
  （x64、用户组、PublicAPI、注册表项和 TIA 实例），`tia_ping` 则告诉你 `serve` 是否可访问、是否已激活。
- **第一次连接。**防火墙提示会出现在运行 `serve` 的那台机器上，必须由人来回答：PLCWare 特意不替你点击。安装程序的设置会在可行时把已安装的可执行文件登记到 Openness 允许列表中，
  这样就不需要这个提示。需要时，MCP 的流程是 `tia_start`，然后 `tia_show_ui`（以可见方式重新启动 TIA Portal，让提示能够显示出来），由人点击**全部是**，再执行 `tia_connect`。
  `tia_connect` 遇到提示时，约 180 秒后会返回 `requires_human_action`，而不是反复重试。

PLCWare 仅适用于 TIA Portal V21。

## 失败时怎么办

| 现象 | 可能的原因 |
|---|---|
| 程序一启动 TIA Portal 就出现 `EngineeringSecurityException` | 用户不在 **Siemens TIA Openness** 组中，或加入后没有注销再登录 |
| `Could not load file or assembly Siemens.Engineering...` | 解析器注册得太晚、**Copy Local** 被打开，或路径指向了另一个版本 |
| 每次运行都会再次提示 | 你点的是**是**而不是**全部是**，或程序文件发生了变化 |
| 打开项目时抛出异常 | 项目是用更早版本的 TIA Portal 创建的：请使用 `OpenWithUpgrade` |
| 项目打不开 | 它已在另一个 TIA Portal 实例中打开 |

## 相关指南

- [用 TIA Portal Openness 创建设备和硬件](create-devices-hardware-network.zh.md)
- [通过 MCP 将 AI 助手连接到 TIA Portal](connect-ai-assistant-mcp.zh.md)
- [安装手册](../INSTALL.zh.md)
- [全部指南](README.zh.md)

## 开始 30 天免费试用

PLCWare 会针对 TIA Portal V21，替你或你的 AI 助手完成这些步骤。试用期为 30 天，包含 Pro 权限范围，无需信用卡，且不会续期。你需要自行向西门子
另购带 STEP 7 Professional 许可证的 TIA Portal V21。

**[开始 30 天免费试用](https://plcware.io/zh/trial?utm_source=github&utm_medium=guide&utm_campaign=openness-setup-windows)**
· [下载应用](https://plcware.io/download)

*TIA Portal、SIMATIC 和 Siemens 是西门子公司（Siemens AG）的商标。PLCWare 是面向 TIA Portal 的独立产品，与西门子无关联，也未获
其认可。*
