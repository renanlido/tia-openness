# 快速入门

> 简体中文译文。英文原文：[getting-started.md](getting-started.md)。

本指南带你在几分钟内完成从**下载**到**运行中且已授权的 API**的全部步骤。这里的所有操作都可以通过
**系统托盘 GUI** 完成，无需命令行。文中同时给出对应的 CLI 命令，便于自动化。

```
[ your AI editor / CLI ]  --(MCP)-->  [ tia MCP (npx) ]  --(HTTP)-->  [ serve (this app, Windows+TIA) ]
```

## 1. 前提条件

在已安装 **TIA Portal V21** 的机器上：

- **Windows 10/11（x64）**。
- **.NET Framework 4.8**（安装程序会检查，缺失时给出提示）。
- 已安装 **TIA Portal V21 及 Openness 组件**。应用从你本机的安装目录加载 Siemens 程序集，
  **不会**重新分发这些程序集。
- 你的 Windows 用户必须属于本地组 **`Siemens TIA Openness`**（安装程序或 `setup` 会将你加入该组）。

> **首次**连接时，TIA Portal 会弹出一次性的安全/信任对话框，你必须手动确认。这是正常现象。

## 2. 下载与安装

在 [**Releases**](https://github.com/renanlido/tia-openness/releases/latest) 页面：

- **一键安装（推荐）：** 下载 `TIAOpenness-Setup-<version>.exe` 并运行。它会复制应用，执行首次设置
  （用户组、快捷方式、可选的 "start with Windows"），并打开 **Getting started** 界面。
- **便携版：** 下载 `TIAOpenness-app-<version>.zip`，解压后运行 `TIAOpenness.exe setup`。

## 3. 检查环境

打开托盘应用（快捷方式 **"TIA Openness API"**）→ **API** 选项卡 → **Check environment**。它会检查
Windows 用户组、进程是否为 x64，以及 TIA Portal V21 + PublicAPI 是否存在。

等效 CLI 命令：

```powershell
TIAOpenness.exe check
```

## 4. 激活许可证

该应用**可免费下载，但运行需要许可证**：没有许可证时，除 `GET /health` 外的所有端点都会返回
`403 license_required`。

在 GUI 中：**License** 选项卡 → 粘贴你的激活许可证（Activation License）密钥 → **Save**（密钥使用
Windows DPAPI 加密存储）。还没有许可证？请通过
[Question / license request](https://github.com/renanlido/tia-openness/issues/new/choose)
issue 模板**申请试用（trial）或许可证**。

## 5. 启动 API

在 GUI 中：**API** 选项卡 → **Start API**（默认端口 **5000**）。

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

将 **`tia` MCP** 指向正在运行的 `serve`。以 **Claude Code** 为例：

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

如需从规格说明到已验证项目的引导式工作流，请安装 Claude Code 插件
[**tia-harness**](https://github.com/renanlido/tia-harness)。

## 故障排查

| 现象 | 可能原因 |
|---|---|
| 每次调用都返回 `403 license_required` | 主机上没有有效许可证，请先激活（步骤 4）。 |
| `tia_ping` → `reachable:false` | `serve` 未运行、IP/端口错误，或被防火墙拦截。 |
| API 无法在 `0.0.0.0` 上启动 | 尚未允许远程访问，请使用 **Allow remote access…**（步骤 5）。 |
| "Check environment" 在用户组检查处失败 | 你不在 `Siemens TIA Openness` 组中：重新运行 `setup`，然后注销并重新登录。 |
| TIA 信任对话框反复出现 | 在 TIA 所在的机器上手动确认一次（首次连接时属正常现象）。 |

更多帮助：**[SUPPORT.zh.md](../SUPPORT.zh.md)**。
