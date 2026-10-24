# 支持

> 简体中文译文。英文原文：[SUPPORT.md](SUPPORT.md)。

感谢你使用 **PLCWare**，这是一款适用于 Siemens TIA Portal V21 的自动化 API。以下是获取帮助的方式。

## 联系支持之前

1. **查看[快速入门指南](docs/getting-started.zh.md)**以及
   **[MCP / 客户端配置（docs/INSTALL.zh.md）](docs/INSTALL.zh.md)**——大多数配置问题都能在其中找到答案。
2. **运行内置诊断：**
   - 在托盘 GUI 中：**API** 选项卡 → **Check environment**（检查 Windows 用户组、x64 进程、
     TIA Portal V21 + PublicAPI）。
   - 在 AI 客户端中：调用 **`tia_ping`**——`reachable:false` 表示 IP/端口/防火墙/`serve` 不可用；
     `activated:false` 表示主机上的许可证缺失或无效；两者均为 `true` 表示一切就绪。
3. **查看 [CHANGELOG](CHANGELOG.md)**（英文）——你遇到的问题可能已在较新的版本中修复。

## 渠道

| 需求 | 渠道 |
|---|---|
| 🐛 **缺陷报告** | [提交公开缺陷报告](https://github.com/renanlido/tia-openness/issues/new/choose) |
| 💡 **功能请求** | [提交公开功能请求](https://github.com/renanlido/tia-openness/issues/new/choose) |
| 💬 **问题咨询 / 许可证申请** | [提交私密支持工单](https://plcware.io/zh/support)或发送邮件至 [support@plcware.io](mailto:support@plcware.io) |
| 🔒 **安全漏洞披露** | **请勿**公开发布；请通过 [support@plcware.io](mailto:support@plcware.io) 私下报告。 |

**优先支持**（通过电子邮件，并按等级提供响应时间目标）包含在付费许可证中，联系方式会随你的
Activation License 一并提供。

## 缺陷报告中应包含的内容

提供以下信息会对我们很有帮助：

- 应用版本（`app-v*` 标签，显示在 GUI / 安装程序中）。
- TIA Portal 版本和目标 CPU（例如 S7-1200 1214C，固件版本）。
- 你做了什么、预期结果是什么、实际发生了什么（附上确切的错误文本 / envelope）。
- 你是直接调用 API、通过 MCP，还是通过 harness 插件。
- 如相关，请附上 **Check environment** / **`tia_ping`** 的输出。

## 安全漏洞披露

如果你认为发现了安全漏洞，请勿公开披露——请通过 [support@plcware.io](mailto:support@plcware.io)
私下报告。

## 范围

本仓库跟踪 **PLCWare 应用 / API**（授权产品）。对于开源客户端层：

- **`tia` MCP**——issue 请提交到 [MCP 仓库](https://www.npmjs.com/package/@renanlido/tia-openness-mcp)。
- **`tia-harness` 插件**——issue 请提交到 [renanlido/tia-harness](https://github.com/renanlido/tia-harness/issues)。
