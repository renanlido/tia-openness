# 安装并使用 `tia` MCP（任意客户端）

> 简体中文译文。英文原文：[INSTALL.md](INSTALL.md)。

> **单一来源。** 这是权威的安装指南。各 README 都指向这里——不要在其他地方重复这些步骤
> （避免内容漂移，即 _drift_）。**只在这里**更新。

**`tia` MCP**（`@renanlido/tia-openness-mcp`）是与 `serve` API（驱动 TIA Portal 的 Windows 应用）
通信的轻量级 HTTP 客户端。PLCWare 1.7.1 Windows 安装程序包含下列应用管理连接所需的运行时。
手动配置及其他基于 npm 的方式仍然可用。变量 **`TIA_API_BASE`** 将 MCP 指向你的 `serve`。

```
[ your AI editor/CLI ]  --(MCP/stdio)-->  [ tia MCP（应用内置或 npx） ]  --(HTTP)-->  [ serve (Windows+TIA) ]
```

## 前提（一次性，在装有 TIA 的主机上）

在装有 TIA Portal V21 的 Windows 机器上启动 `serve` API——通过 **PLCWare 托盘 GUI**
（快捷方式标签 "TIA Openness API" → "API" 选项卡 → "Start API"）**或**命令行：

```powershell
TIAOpenness.exe serve 5000              # local
TIAOpenness.exe serve 5000 --host 0.0.0.0   # accepts connections from another machine (e.g. Mac → VM)
```

- **与 AI 编辑器在同一台机器** → `TIA_API_BASE=http://localhost:5000`。
- **编辑器在另一台机器**（例如 Mac，`serve` 在 Windows 虚拟机中）→ `TIA_API_BASE=http://<vm-ip>:5000`，
  并使用 `--host 0.0.0.0` 启动 serve（同时在防火墙中放行该端口）。

> MCP **不发送任何密钥**——激活服务器的是主机上配置的**许可证**（GUI 的 "License" 选项卡）。
> serve 未激活时，MCP 只能诊断连通性（`tia_ping`）。

---

## Windows 应用内连接（从 PLCWare 1.7.1 起）

使用 `TIAOpenness-Setup-1.7.1.exe` 安装 **PLCWare 1.7.1**，然后通过托盘菜单的 **Connect AI agents…**
或入门窗口打开 **Connect your AI agents** 窗口。请先安装智能体本身，预览更改，再选择 **Connect**。
这些由安装程序管理的连接不需要系统 Node.js、npm/`npx`、Git，也无需访问 npm registry：

| 智能体 | 连接与技能 |
|---|---|
| Claude Code | 安装随附的本地插件市场和插件，包含技能、辅助智能体及内置 `tia` 启动器。已安装的插件会保留原配置。要切换旧的 `npx` 插件，如果是 PLCWare 安装的，请先 **Disconnect**；否则先在 Claude Code 中卸载。然后从 PLCWare **Connect**。 |
| Claude Desktop | 仅当 Windows 已为 `.mcpb` 关联处理程序时才打开随附的文件；请在 Desktop 中完成安装。否则将内置运行时写入检测到的版本的设置文件，包括 Store/MSIX。**在 Connect 写入设置前，必须从系统托盘完全退出 Desktop；仅关闭窗口不够。** 然后重新打开，并在 PLCWare 中用 **Refresh** 验证。 |
| Codex | 写入唯一的内置 `tia` 连接，安装本地技能插件并提供辅助智能体。使用可用的 CLI，包括桌面应用自带的 CLI；无需单独安装 CLI。如果没有可用 CLI，则准备个人插件市场：关闭并重新打开 Codex，在 **Plugins** 中按显示的说明安装 `tia-harness`。插件中重复的 MCP 被禁用。 |

**Claude Desktop 技能与 MCP 连接器是两个步骤。** 如果已安装用户级 PLCWare 插件，就没有技能安装步骤。
否则 Connect 会生成**一个插件 ZIP**，包含技能和智能体，但没有 MCP 连接器或 hooks。使用 **Open plugin folder**
选中 ZIP，然后在 Desktop 中通过 **Customize → Plugins → Add → Upload plugin** 上传。
无需逐个上传技能，也不需要 Git；智能体使用已有的 `tia` 连接。连接或断开 Desktop 不会安装或删除 Claude Code 插件。
如果 Desktop 复用用户级插件，请保留 PLCWare 的 `tia` 连接器，不要同时启用插件自带的连接器。

对于 `.mcpb` 连接，升级 PLCWare 后重新连接，并在 Desktop 中完成扩展更新。必要时在 Desktop 中卸载旧扩展后重新连接。
对于设置文件方式，重新连接前必须完全退出 Desktop，然后重新打开并验证。请完成剩余手动步骤；
仅点击 **Connect** 并不能验证这些步骤。

**仍使用 npm/`npx` 的方式：** 独立安装的公共 Codex CLI 插件（不是应用管理的本地插件）、Gemini CLI 扩展、
下方的手动示例、较早版本的应用，以及 Mac/Linux 或未安装 Windows 安装程序所附文件的远程主机上的 MCP 客户端。
这些方式需要 Node.js 和 npm 包访问权限（首次使用或未缓存包时需要访问 registry）。
Windows 内置方式并不保证智能体安装、登录或 AI 服务能离线运行。

## Windows 手动配置或旧版本：使用 `cmd /c npx`

对于 Windows 命令行/手动配置以及 PLCWare 1.7.1 之前的版本，许多客户端会**不经过 shell** 启动进程，而
`npx`（实际是 `npx.cmd`）可能会因此失败并报错 `spawn npx ENOENT`。出现这种情况时，将：

```jsonc
"command": "npx", "args": ["-y", "@renanlido/tia-openness-mcp"]
```

替换为：

```jsonc
"command": "cmd", "args": ["/c", "npx", "-y", "@renanlido/tia-openness-mcp"]
```

在 **macOS/Linux** 上使用简单形式（直接用 `npx`）——**不要**加 `cmd /c`。

---

以下客户端示例是**仅配置 MCP 的手动方式**，不是上述应用管理的插件安装方式。
请勿在已有插件或扩展连接上再添加第二个 `tia` 条目。

## Claude Code

**一条命令**（用户范围——对所有项目生效）：

```bash
claude mcp add --scope user --env TIA_API_BASE=http://localhost:5000 tia -- npx -y @renanlido/tia-openness-mcp
```

或者在项目根目录使用 **`.mcp.json`**（项目范围，可纳入版本控制）：

```json
{
  "mcpServers": {
    "tia": {
      "command": "npx",
      "args": ["-y", "@renanlido/tia-openness-mcp"],
      "env": { "TIA_API_BASE": "http://localhost:5000" }
    }
  }
}
```

验证：`claude mcp list`（应列出 `tia`）· 在会话中执行 `/mcp`。

## Claude Desktop

手动配置时，通过 Settings → Developer → **Edit Config** 打开 `claude_desktop_config.json`，
然后**完全退出 Desktop 后再编辑**：

- **macOS：** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows（.exe）：** `%APPDATA%\Claude\claude_desktop_config.json`
- **Windows（Store/MSIX）：** `%LOCALAPPDATA%\Packages\Claude_*\LocalCache\Roaming\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "tia": {
      "command": "npx",
      "args": ["-y", "@renanlido/tia-openness-mcp"],
      "env": { "TIA_API_BASE": "http://localhost:5000" }
    }
  }
}
```

在 **Windows** 上手动配置 JSON 时，使用上面的 `cmd /c` 形式。保存后重新打开 Desktop 并验证连接。
由安装程序管理的方式见上文。

## Codex（CLI + IDE 扩展）

配置位于 `~/.codex/config.toml`（IDE 扩展共用同一个文件）。注意：**env 放在子块**
`[mcp_servers.tia.env]` 中。

```toml
[mcp_servers.tia]
command = "npx"
args = ["-y", "@renanlido/tia-openness-mcp"]

[mcp_servers.tia.env]
TIA_API_BASE = "http://localhost:5000"
```

或者通过 CLI：

```bash
codex mcp add tia --env TIA_API_BASE=http://localhost:5000 -- npx -y @renanlido/tia-openness-mcp
```

在会话中用 `/mcp` 验证。在 Windows 上，使用 `command = "cmd"` 和
`args = ["/c", "npx", "-y", "@renanlido/tia-openness-mcp"]`。

## Gemini CLI

配置位于 `~/.gemini/settings.json`（用户）或 `<project>/.gemini/settings.json`（项目）：

```json
{
  "mcpServers": {
    "tia": {
      "command": "npx",
      "args": ["-y", "@renanlido/tia-openness-mcp"],
      "env": { "TIA_API_BASE": "http://localhost:5000" }
    }
  }
}
```

或者通过 CLI（`-s user` = 全局；默认是项目范围）：

```bash
gemini mcp add -s user -e TIA_API_BASE=http://localhost:5000 tia npx -y @renanlido/tia-openness-mcp
```

## Cursor

`.cursor/mcp.json`（项目）或 `~/.cursor/mcp.json`（全局）——与 Claude 的格式相同（`mcpServers`）：

```json
{
  "mcpServers": {
    "tia": {
      "command": "npx",
      "args": ["-y", "@renanlido/tia-openness-mcp"],
      "env": { "TIA_API_BASE": "http://localhost:5000" }
    }
  }
}
```

## VS Code（Copilot / agent mode）

⚠️ **与其他客户端不同：** 根键是 **`servers`**（不是 `mcpServers`），并且要使用 **`"type": "stdio"`**。
文件为 `.vscode/mcp.json`（workspace）——或 Command Palette → `MCP: Open User Configuration`：

```json
{
  "servers": {
    "tia": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@renanlido/tia-openness-mcp"],
      "env": { "TIA_API_BASE": "http://localhost:5000" }
    }
  }
}
```

工具只会在 Copilot 的 **Agent mode** 中出现。CLI 替代方式：`code --add-mcp "{...}"`。

## Windsurf

文件 `~/.codeium/windsurf/mcp_config.json`（没有项目范围），格式为 `mcpServers`：

```json
{
  "mcpServers": {
    "tia": {
      "command": "npx",
      "args": ["-y", "@renanlido/tia-openness-mcp"],
      "env": { "TIA_API_BASE": "http://localhost:5000" }
    }
  }
}
```

---

## 差异汇总（容易踩坑之处）

| 客户端 | 文件 | 根键 | `type:"stdio"`？ | 添加用的 CLI |
|---|---|---|---|---|
| Claude Code | `.mcp.json`（项目）/ `~/.claude.json`（用户，通过 CLI） | `mcpServers` | 可选 | `claude mcp add … -- npx …` |
| Claude Desktop | `claude_desktop_config.json`（通过 **Edit Config** 获取上述检测版本的路径） | `mcpServers` | 可选 | —（完全退出后编辑 JSON） |
| Codex | `~/.codex/config.toml` | `[mcp_servers.tia]`（TOML） | — | `codex mcp add …` |
| Gemini CLI | `~/.gemini/settings.json` | `mcpServers` | — | `gemini mcp add …` |
| Cursor | `.cursor/mcp.json` / `~/.cursor/mcp.json` | `mcpServers` | — | —（JSON/UI） |
| **VS Code** | `.vscode/mcp.json` | **`servers`** | **是** | `code --add-mcp "{…}"` |
| Windsurf | `~/.codeium/windsurf/mcp_config.json` | `mcpServers` | — | —（JSON/UI） |

**手动 npm 方式的规则：** (1) 在 **Windows** 上使用 `cmd /c npx`；(2) 在 **VS Code** 中，根键用 `servers` + `type:"stdio"`；
(3) 设置 **`TIA_API_BASE`** 指向 `serve`；(4) 编辑文件后重启客户端。

## 远程访问（另一台机器 → serve 所在主机）

默认情况下，serve 仅监听 **localhost**（安全，不对外暴露）。要从**另一台机器**访问它
（例如你的 **Mac** 上的 MCP → **Windows 虚拟机**中的 serve），Windows 需要一条 **HTTP.sys 保留项**
（`urlacl`）+ **在防火墙中放行端口**——否则绑定到 `0.0.0.0`/`+` 会失败，提示*拒绝访问*。

**通过 GUI（一键，推荐）：** **"API"** 选项卡 → **"Allow remote access…"** 按钮 → 确认
**UAC** 提示（管理员），还可以选择**限制为来源 IP**（例如你 Mac 的 IP）。然后将
**Host 设为 `0.0.0.0`** 并点击 **"Start API"**。*（如果在未先放行的情况下使用远程 Host 启动，
应用会检测到该错误，并当场提供放行选项。）*

**通过命令行**（以**管理员身份**运行 PowerShell）：

```powershell
TIAOpenness.exe setup-remote 5000 --allow 192.168.68.230   # allow ONLY that source IP (recommended)
TIAOpenness.exe setup-remote 5000                          # allow the whole LAN
TIAOpenness.exe setup-remote 5000 --remove                 # undo (back to localhost-only)
```

> **安全：** 允许远程访问会把 serve 暴露到网络中。serve 仍然要求**有效的许可证**，但**不会对单个客户端进行
> 身份验证**——谁能连接由**防火墙/VPN** 控制。优先**限制为来源 IP**；仅在可信网络中才放行整个
> LAN。在 Mac 上，设置 `TIA_API_BASE=http://<vm-ip>:5000`。

## 诊断

首先应调用的工具是 **`tia_ping`**：`reachable:false` → IP/端口/防火墙/serve 未运行；
`activated:false` → 主机上的许可证缺失或无效；两者均为 `true` → 可以使用。
