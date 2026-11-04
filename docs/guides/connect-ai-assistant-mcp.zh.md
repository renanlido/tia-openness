# 通过 MCP 将 AI 助手连接到 TIA Portal（Claude Desktop、Claude Code 及其他客户端）

> 简体中文译文。英文原文：[connect-ai-assistant-mcp.md](connect-ai-assistant-mcp.md)。

AI 助手可以通过 MCP 读取和编辑 TIA Portal V21 项目。`tia` MCP 服务器与 PLCWare 的 `serve` 应用通信，而 `serve` 是负责实际
Openness 工作的 Windows 程序。MCP 随 Windows 安装程序提供，也可通过 `npx` 单独运行。助手负责准备工作，凡是会触及真实 PLC 的操作，
都由人来批准。本指南把两者连接起来。适用于 **TIA Portal V21**。

```
[ 你的 AI 客户端 ]  --(MCP/stdio)-->  [ tia MCP（内置或 npx）]  --(HTTP)-->  [ serve（Windows + TIA Portal V21）]
```

## 你需要什么

- 一台装有 **TIA Portal V21** 和 **PLCWare 应用**（`serve`）的 Windows 机器，且 `serve` 已在运行并已激活许可证。在托盘应用中，**License** 选项卡：粘贴你的密钥并保存；
  **API** 选项卡：**Start API**（默认端口 5000）。在命令行中：`TIAOpenness.exe serve 5000`。
- 只有下方 npm/`npx` 路线才需要在运行 AI 客户端的机器上安装 **Node.js**（20 或更高版本）。
  受支持的 Windows 安装程序路线不需要单独安装 Node.js 或 npm。
- 一项设置：`TIA_API_BASE`，即 `serve` 的地址。MCP **不发送任何密钥**：激活应用的是主机上的许可证。

## 使用引导安装连接智能体

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

## Windows：从 PLCWare 应用连接

如果客户端在同一台 Windows 机器上，请使用 `TIAOpenness-Setup-1.8.0.exe` 安装 **PLCWare 1.8.0**。
通过托盘菜单的 **Connect AI agents…** 或入门窗口打开 **Connect your AI agents**。

1. 先安装客户端：**Claude Code、Claude Desktop、Codex、Cursor 或 VS Code**。Cursor 和 VS Code 支持在 1.8.0 中加入；
   这两个客户端只获得 MCP 工具，不安装技能或辅助代理。
2. 选择客户端并预览拟进行的更改。**写入配置前请完全退出 Claude Desktop，再选择 Connect；仅关闭窗口不够。**
   然后选择 **Connect**。这些路线使用安装程序内置的 MCP 运行时（Desktop 也可使用随附的 `.mcpb`），不需要系统的 Node.js、npm 或 `npx`。
3. 之后重新打开 Desktop，完成提示中的手动步骤，再按下方说明检查连接。

应用更新后，PLCWare 会在下次正常启动时，为需要处理的已记录连接提供 **Update connections / Repair**。
请先审阅并批准更改；安装程序不会自动重写客户端配置。完成剩余手动步骤。
各客户端的具体说明、Desktop 的扩展包/配置文件路线及独立技能步骤、已有 `npx` 连接的迁移方法，见[安装手册](../INSTALL.zh.md)。

不要在应用管理的连接之上再添加下方的手动配置：每个客户端只保留一个 `tia` 连接。
这只免除了连接配置对 npm 的依赖，并不代表客户端安装、登录或 AI 服务本身不需要联网。

## 手动配置：npm/npx 路线

**Mac/Linux、远程客户端、手动配置**以及 **1.7.1 之前的应用版本**（**Cursor 和 VS Code 为 1.8.0 之前的版本**）仍使用下方的现有步骤。
**Gemini CLI 扩展**和**独立安装的 Codex CLI 公共插件**也仍使用 npm/`npx`；
Codex 公共插件不同于应用管理的本地插件。这些路线需要 Node.js 和 npm 包访问权限
（首次使用或包未缓存时需要访问 npm 软件包仓库）。具体格式和插件/扩展说明见[安装手册](../INSTALL.zh.md)。

## Claude Code

一条命令，用户级别（对你所有的项目生效）：

```bash
claude mcp add tia --scope user -e TIA_API_BASE=http://localhost:5000 -- npx -y @renanlido/tia-openness-mcp
```

请把服务器名称（`tia`）放在前面。`-e` 可以接受多个值，而 Claude Code 2.1.238 会拒绝写在名称之前的 `--env KEY=VALUE`。用 `claude mcp list` 检查，应当看到 `tia`
处于已连接状态；也可以在会话中用 `/mcp` 检查。

## Claude Desktop

手动配置时，通过 **Settings > Developer > Edit Config** 打开 `claude_desktop_config.json`，然后**完全退出 Desktop 后再编辑**：

- macOS：`~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows（.exe）：`%APPDATA%\Claude\claude_desktop_config.json`
- Windows（Store/MSIX）：`%LOCALAPPDATA%\Packages\Claude_*\LocalCache\Roaming\Claude\claude_desktop_config.json`

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

保存后重新打开应用。在 Windows 上手动配置时，如果直接使用 `npx` 无法启动，请改用 `cmd /c` 形式（仅限 Windows）：

```json
"command": "cmd", "args": ["/c", "npx", "-y", "@renanlido/tia-openness-mcp"]
```

只保留一个 `tia` 条目：两个服务器会同时与同一个 `serve` 通信，而 `serve` 一次只执行一个操作。

## 其他客户端

手动配置时，Codex、Gemini CLI、Cursor、VS Code 和 Windsurf 使用同样的命令 `npx -y @renanlido/tia-openness-mcp`
和同样的 `TIA_API_BASE` 变量；不同之处在于配置格式。详见[安装手册](../INSTALL.zh.md)。
在 Windows 上使用应用管理的 Codex、Cursor 和 VS Code 连接时，请改用上方的安装程序路线。

## 当你的 AI 客户端在另一台机器上

一种常见的部署是：编辑器在 Mac 上，`serve` 在 Windows 虚拟机里。在 Windows 一侧，请在托盘应用中允许远程访问（**API** 选项卡，**Allow remote access...**，它会保留 URL 并打开防火墙端口），
把主机设为 `0.0.0.0` 并启动 API；在命令行中则是 `TIAOpenness.exe serve 5000 --host 0.0.0.0`。该机器上的许可证必须已激活。在客户端一侧，把虚拟机的地址直接写进 MCP 条目本身，替换
`http://localhost:5000`。MCP 读取的是条目里的 `TIA_API_BASE`：在你的 shell 中导出的变量不会替换它。

对于 Claude Code，用虚拟机的地址重新添加该服务器（如果 `tia` 已经注册，请先用 `claude mcp remove tia` 删除）：

```bash
claude mcp add tia --scope user -e TIA_API_BASE=http://<虚拟机IP>:5000 -- npx -y @renanlido/tia-openness-mcp
```

对于 Claude Desktop 以及其他使用 JSON 配置的客户端，请修改文件中的值：

```json
"env": { "TIA_API_BASE": "http://<虚拟机IP>:5000" }
```

然后开启新会话或重启应用，让 MCP 以新地址启动。

许可证只负责激活服务器，并不识别调用者是谁。请用防火墙或 VPN 控制访问。

## 检查连接

让助手调用 `tia_ping`。它返回 `{ base, reachable, activated, latencyMs, hint }`：

- `reachable: false`：地址、端口或防火墙有问题，或者 `serve` 没有运行。
- `activated: false`：主机上的许可证缺失或无效。
- 两者均为 `true`：`serve` 可访问且已激活。但这不等于已就绪：请调用 `tia_readiness` 检查 Windows 用户组、x64 以及 TIA Portal 的安装情况
  （[在 Windows 上配置 TIA Portal Openness](openness-setup-windows.zh.md)）。

之后，`tia_status` 和 `tia_connect` 会打开项目或附加到项目。一个 `serve` 进程的首次连接，可能会在 Windows 机器上的 TIA Portal 里弹出安全提示，只有人才能回答它。

## 可以让它做什么

- “列出 PLC_1 的块，告诉我哪些不一致。”（`tia_plc_blocks`）
- “导出 FB_Motor，并检查它是否与 git 中的文件一致。”（`tia_export_block`、`tia_block_compare`）
- “编写一个实现 X 的 SCL 功能块，放进项目并编译。”（`tia_source_put`、`tia_compile`）
- “编译 PLC_1 并总结错误。”（`tia_compile`）

这些工具按它们能改动的内容分组：读取类（R 类）不改变任何东西；离线修改类（M-off 类）会编辑项目，但绝不触及 PLC；少数带关卡的工具会触及物理世界。

## 助手不能单独完成的事

- **下载到 PLC。**`tia_download` 先返回一份计划和一次性的 `planHash`，交给人审阅；只有人批准之后，它才会带着 `approved: true` 和同一个 `planHash` 再次运行。
  如果其间软件发生了变化，`serve` 会拒绝并返回 `409 plan_stale`。助手从不批准。
- **转到在线、上传站、扫描网络。**每一项都是需要人参与的关卡。
- **机密信息。**主密钥、专有技术保护密码、证书密码或密码策略，始终由人提供。助手绝不会编造。
- **安全（F）逻辑。**绝不会自主地创建、修改或下载。
- **同时做两件事。**`serve` 只有一个串行 worker。耗时较长的操作（连接、编译、下载……）可能会返回带 `jobId` 的 `status: "running"`；助手此时用 `tia_job_status` 等待，而不是重复发起调用。

## 只读模式

想在没有写入风险的情况下试用 MCP，请在服务器的 `env` 中把 `TIA_MCP_MODE` 设为 `read-only`：

```json
"env": { "TIA_API_BASE": "http://localhost:5000", "TIA_MCP_MODE": "read-only" }
```

这样 MCP 只会注册读取类工具：任何会修改项目或触及控制器的工具都不会被列出。由于 `tia_start` 和 `tia_connect` 不是读取类工具，助手在此模式下无法打开项目：项目必须已经在
`serve` 中打开。

它防范的是助手，而不是人：它存在于 MCP 中，真正起决定作用的仍是 `serve` 上的许可证权限范围。早于该模式的 MCP 版本会忽略这个变量并注册所有工具。
对于手动 `npx` 路线，请检查 `npx -y @renanlido/tia-openness-mcp --version`（该选项从 1.9.2 开始提供）。
无论使用哪条路线，都请在客户端里确认 `tia_compile` 之类的写入类工具没有出现。

## 哪个套餐能做什么

Basic 可以读取项目、离线编写（块、变量、硬件）并编译。Pro 在此之上增加下载到真实 PLC 和转到在线，并且始终处于上述人工关卡之后。30 天试用包含 Pro 权限范围。

如果想要从规格到经过验证的项目的引导式流程，开源的 Claude Code 插件 [`tia-harness`](https://github.com/renanlido/tia-harness) 会在同一个 MCP 之上增加 skills 和子代理。

## 相关指南

- [在 Windows 上配置 TIA Portal Openness](openness-setup-windows.zh.md)
- [用代码编译 PLC 并读取消息](compile-plc-read-messages.zh.md)
- [安装手册](../INSTALL.zh.md)
- [全部指南](README.zh.md)

## 开始 30 天免费试用

PLCWare 会针对 TIA Portal V21，替你或你的 AI 助手完成这些步骤。试用期为 30 天，包含 Pro 权限范围，无需信用卡，且不会续期。你需要自行向西门子
另购带 STEP 7 Professional 许可证的 TIA Portal V21。

**[开始 30 天免费试用](https://plcware.io/zh/trial?utm_source=github&utm_medium=guide&utm_campaign=connect-ai-assistant-mcp)**
· [下载应用](https://plcware.io/download)

*TIA Portal、SIMATIC 和 Siemens 是西门子公司（Siemens AG）的商标。PLCWare 是面向 TIA Portal 的独立产品，与西门子无关联，也未获
其认可。*
