# TIA Portal Openness 指南

> 简体中文译文。英文原文：[README.md](README.md)。

这是你用 Openness 自动化 **TIA Portal V21** 时常遇到的问题的实用解答。每篇指南都会展示用 C# 编写的原生 Openness 路线，以及 PLCWare 路线（HTTP API 和供 AI 助手使用的 MCP 工具），
并保留人工关卡：下载到真实 PLC 始终要等人来批准。

## 指南列表

- [在 Windows 上配置 TIA Portal Openness](openness-setup-windows.zh.md)：Siemens TIA Openness 用户组、首次连接提示、V21 库，以及项目如何打开。
- [将 PLC 块导出为 SimaticML XML](export-plc-block-simaticml.zh.md)：导出一个块或全部块、导出选项，以及如何证明项目仍与 git 中的 XML 一致。
- [通过代码将 LAD、FBD 和 SCL 块导入 TIA Portal](import-lad-fbd-scl-blocks.zh.md)：SimaticML 导入、SCL 源文件、覆盖规则，以及防止覆盖过期内容的保护。
- [用代码编译 PLC 并读取编译消息](compile-plc-read-messages.zh.md)：每种对象编译什么、消息树，以及从干净的编译到获批下载的路径。
- [创建设备和硬件组态](create-devices-hardware-network.zh.md)：CPU、模块、子网、IP 地址和 IO 系统，以及用一份规格描述整个项目。
- [通过 MCP 将 AI 助手连接到 TIA Portal](connect-ai-assistant-mcp.zh.md)：Claude Desktop、Claude Code 及其他 MCP 客户端、只读模式，以及助手不能单独完成的事。

## 更多文档

- [安装手册](../INSTALL.zh.md)
- [快速入门](../getting-started.zh.md)
- [支持政策](../../SUPPORT.zh.md)

## 开始 30 天免费试用

PLCWare 会针对 TIA Portal V21，替你或你的 AI 助手完成这些步骤。试用期为 30 天，包含 Pro 权限范围，无需信用卡，且不会续期。你需要自行向西门子
另购带 STEP 7 Professional 许可证的 TIA Portal V21。

**[开始 30 天免费试用](https://plcware.io/zh/trial?utm_source=github&utm_medium=guide&utm_campaign=guides)**
· [下载应用](https://plcware.io/download)

*TIA Portal、SIMATIC 和 Siemens 是西门子公司（Siemens AG）的商标。PLCWare 是面向 TIA Portal 的独立产品，与西门子无关联，也未获
其认可。*
