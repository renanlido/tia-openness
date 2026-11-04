# 快速入门

> 简体中文译文。英文原文：[getting-started.md](getting-started.md)。

本指南通过托盘 GUI 完成 PLCWare Windows 应用的下载、启动和许可证激活。
连接智能体时，请在其运行电脑的终端中执行 `npx plcware-setup`（步骤 6）。CLI 对应命令及高级手动连接方式仍然可用。

```
[ your AI editor / CLI ]  --(MCP)-->  [ tia MCP（应用内置或 npx） ]  --(HTTP)-->  [ serve (this app, Windows+TIA) ]
```

## 1. 前提条件

在已安装 **TIA Portal V21** 的机器上：

- **Windows 10/11（x64）**。
- **.NET Framework 4.8**（缺失时安装程序会停止）。
- 已安装 **TIA Portal V21 及 Openness 组件**。应用从你本机的安装目录加载 Siemens 程序集，
  **不会**重新分发这些程序集。
- 你的 Windows 用户必须属于本地组 **`Siemens TIA Openness`**（安装程序或 `setup` 会将你加入该组）。

> 如果 TIA Portal 显示安全/信任对话框，请在该机器上手动确认。受信任的安装程序管理安装可以避免此对话框；
> 便携副本仍可能需要确认。就绪检查的详细信息会显示允许列表状态。

## 2. 下载与安装

在 [**Releases**](https://github.com/renanlido/tia-openness/releases/latest) 页面：

- **安装程序（推荐）：** 下载 PLCWare 1.7.1 稳定版的 `TIAOpenness-Setup-1.7.1.exe`。
  它会复制应用及随附的智能体文件，并配置原始 Windows 用户的环境。
  如果用户组权限需要重新登录，最后一页会提供 **Restart now / Restart later**，**不会**立即打开入门窗口。
  请先保存工作再重新启动。无需重启时，**View the getting-started steps** 在全新安装中默认选中，升级时默认不选中。
- **便携版：** 下载 `TIAOpenness-app-v1.7.1.zip`，解压后运行 `TIAOpenness.exe setup`。
  不需要系统 Node 的连接方式依赖安装程序所附文件；应用 ZIP 并不等价。

入门窗口会检查环境并尝试自动启动 API；主要步骤包含许可证激活和智能体连接，技术诊断位于 **Details**。
在要求重启后的下次登录时，仅当设置仍需处理才打开窗口；已完成设置则只显示简短的就绪通知。
以后启动保持安静。可从托盘菜单或开始菜单的 **Next steps** 快捷方式重新打开检查清单。

## 3. 检查环境

如需手动复查，打开 PLCWare 托盘应用（快捷方式标签 **"TIA Openness API"**）→ **API** → **Check environment**。
它会检查 Windows 用户组、x64 进程以及 TIA Portal V21 + PublicAPI。
如果账户已属于 `Siemens TIA Openness`，但当前登录令牌尚未更新，请注销并重新登录或重启；不要重复添加用户。
如果尚未加入用户组，则需要以管理员权限进行设置。

等效 CLI 命令：

```powershell
TIAOpenness.exe check
```

## 4. 激活许可证

该应用**可免费下载，但运行需要许可证**：没有许可证时，除 `GET /health` 外的所有端点都会返回
`403 license_required`。

在 GUI 中：**License** 选项卡 → 粘贴你的激活许可证（Activation License）密钥 → **Save**（密钥使用
Windows DPAPI 加密存储）。还没有许可证？请**[开始 30 天免费试用](https://plcware.io/zh/trial?utm_source=github&utm_medium=docs&utm_campaign=getting-started)**：
自助申请，包含 Pro 权限范围，无需信用卡。

## 5. 启动 API

入门窗口会自动启动 API。如果尚未监听，请使用 **API** → **Start API**（默认端口 **5000**），并查看报告的错误。

等效 CLI 命令：

```powershell
TIAOpenness.exe serve 5000
```

验证服务已启动（此端点无需激活）：

```powershell
Invoke-RestMethod http://localhost:5000/health
```

### 远程访问（可选）

默认情况下，API 仅监听 **localhost**（不对外暴露）。若要从另一台机器访问（例如 **Mac** 上的 AI 客户端
→ **Windows 虚拟机**上的 `serve`），请使用 **API** 选项卡 → **Allow remote access…**（需要 UAC；可以
限制为某个来源 IP），然后将 **Host** 设为 **`0.0.0.0`** 并启动。

等效 CLI 命令（以管理员身份运行）：

```powershell
TIAOpenness.exe setup-remote 5000 --allow 192.168.x.y   # allow only that source IP (recommended)
```

> 允许远程访问会把 API 暴露到网络中。`serve` 仍然要求有效的许可证，但**不会**对单个客户端进行身份验证，
> 请通过防火墙 / VPN 控制访问。

## 6. 连接 AI 助手（可选）

在安装了 TIA Portal 的主机上安装 **PLCWare（Windows 应用）**，激活许可证并启动 API。在运行智能体的电脑
（Windows、macOS 或 Linux）上安装 Node.js `^20.12.0 || >=21.7.0`（建议使用当前 LTS），然后运行：

```sh
npx plcware-setup
```

无需参数。在终端中选择检测到的智能体、每个智能体支持的组件及要安装的技能。Claude Code、Codex 和 Gemini CLI
通过各自的原生 CLI 安装官方 **renanlido/tia-harness** 插件/扩展；其他智能体仅安装所选且受支持的 MCP、技能和子智能体。
这是同一套 harness，不是第二份独立实现。选择 MCP 时，填写 API 地址（预填 `http://localhost:5000`；远程客户端请填写
Windows 主机/虚拟机地址），再选择完整或只读模式。审阅预览后确认一次。仅安装技能时会跳过 API 问题。
安装工具不会索取 PLCWare 激活密钥；请在 Windows 应用中激活。原生来源信任仍必须由你决定。

没有终端或在 CI 中，无参数命令只显示帮助。重启智能体，检查 MCP 连接，并让它调用 `tia_ping`。
`npx plcware-setup plan` 仅预览、不写入；`npx plcware-setup uninstall --yes` 仅撤销记录为自己所有的更改。
通过其他方式安装的插件保持不变。每个智能体只使用一个安装管理来源。

## 高级：手动及应用管理连接

下方按智能体列出的方式仍可用于高级配置；请勿重复添加 `tia` 连接。


在由 PLCWare 1.7.1 安装程序管理的 Windows 上，打开 **Connect your AI agents**，预览并连接 Claude Code、
Claude Desktop 或 Codex，无需系统 Node.js/npm 或 Git。请完成剩余手动步骤：Desktop 技能可能需要上传一个插件 ZIP，
仅安装桌面应用的 Codex 可能需要在 **Plugins** 中安装一次。`.mcpb`/MSIX 备用方式、完全退出要求、
技能、辅助智能体及仍使用 npm/`npx` 的方式，见 **[docs/INSTALL.zh.md](INSTALL.zh.md)**。

以下是**仅配置 MCP 的手动替代方式**，不是应用管理插件的附加步骤；将 `tia` 指向正在运行的 `serve`：

```bash
claude mcp add --transport stdio --env TIA_API_BASE=http://localhost:5000 --scope user tia -- npx -y @renanlido/tia-openness-mcp
```

如果 `serve` 运行在其他位置，请在 `TIA_API_BASE` 中使用虚拟机/主机的 IP。其他客户端（Claude Desktop、
Codex、Gemini CLI、Cursor、VS Code、Windsurf）以及 Windows 上 `cmd /c npx` 的已知问题，见
**[docs/INSTALL.zh.md](INSTALL.zh.md)**。

首先应调用的工具是 **`tia_ping`**：

- `reachable:false` → IP / 端口 / 防火墙 / `serve` 未运行。
- `activated:false` → 主机上的许可证缺失或无效。
- 两者均为 `true` → 一切就绪。

应用管理的 Claude Code 插件已包含 [**tia-harness**](https://github.com/renanlido/tia-harness)
从规格说明到已验证项目的工作流；请勿再安装第二个 MCP。

## 故障排查

| 现象 | 可能原因 |
|---|---|
| 每次调用都返回 `403 license_required` | 主机上没有有效许可证，请先激活（步骤 4）。 |
| `tia_ping` → `reachable:false` | `serve` 未运行、IP/端口错误，或被防火墙拦截。 |
| API 无法在 `0.0.0.0` 上启动 | 尚未允许远程访问，请使用 **Allow remote access…**（步骤 5）。 |
| "Check environment" 在用户组检查处失败 | 未加入：以管理员权限运行 `setup`。已加入但令牌未更新：注销并重新登录或重启，不要重复添加用户。 |
| 出现 TIA 信任对话框 | 在 TIA 机器上手动确认；如果重复出现，请查看允许列表的就绪检查详情。 |

更多帮助：**[SUPPORT.zh.md](../SUPPORT.zh.md)**。
