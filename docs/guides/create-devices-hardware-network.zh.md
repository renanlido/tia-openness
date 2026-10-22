# 用 TIA Portal Openness 创建设备和硬件组态

> 简体中文译文。英文原文：[create-devices-hardware-network.md](create-devices-hardware-network.md)。

Openness 可以在不打开“设备和网络”编辑器的情况下搭建硬件组态：创建站及其 CPU、插入模块、创建子网，并为 CPU 设置 IP 地址和 IO 系统。
本指南先用 C# 实现，再用 PLCWare 的 HTTP API 和 MCP 工具实现。这里的所有操作都只修改离线项目，不会触及真实的 PLC。适用于
**TIA Portal V21**。

## 开始之前

- 一个已连接到 TIA Portal V21、并且已打开项目的 Openness 应用
  （[在 Windows 上配置 TIA Portal Openness](openness-setup-windows.zh.md)）。
- 插入模块时，设备不能处于在线状态。
- 按依赖顺序工作：先子网，再设备（先 CPU），然后是模块，最后是网络连接。

## 查找类型标识符

每个硬件对象都由类型标识符创建，格式为 `<类型>:<标识符>`，其中类型为 `OrderNumber`、`GSD` 或 `System`。目录中的硬件使用“订货号 + 固件版本”：

```
OrderNumber:6ES7 516-2GN00-0AB0/V2.9
```

只有当系统中该模块只有一个版本时，固件部分才是可选的。不要凭猜测取值：请查询硬件目录。

```csharp
foreach (var entry in portal.HardwareCatalog.Find("1516"))
    Console.WriteLine($"{entry.TypeIdentifier}  {entry.TypeName}  {entry.Version}");
```

`Find` 接受一个过滤字符串。第二个重载 `Find(filter, typeIdentifier)` 只返回与你传入的 CPU 兼容的模块。

## 创建站和 CPU

```csharp
Device station = project.Devices.CreateWithItem(
    "OrderNumber:6ES7 516-2GN00-0AB0/V2.9", "PLC_1", "Station_1");
```

参数依次是设备项的类型标识符、设备项（即 CPU）的名称，以及设备（即站）的名称。`Devices.Create(deviceTypeIdentifier, name)` 只创建设备本身。

## 插入模块

```csharp
DeviceItem rack = ...; // 该站的机架
const string di = "OrderNumber:6ES7 521-1BL00-0AB0/V1.0";

if (rack.CanPlugNew(di, "DI_1", 2))
    rack.PlugNew(di, "DI_1", 2);
```

`CanPlugNew` 会告诉你能否插入，但 `PlugNew` 仍然可能失败：该位置已被占用、容器不提供该位置、容器中已使用该名称、模块与容器不匹配，或者设备处于在线状态。
`PlugNew` 失败时会抛出可恢复的异常。

## 创建子网、IP 地址和 IO 系统

```csharp
using System.Linq;

Subnet subnet = project.Subnets.Create("System:Subnet.Ethernet", "PN_Line2");

DeviceItem cpuInterface = ...; // CPU 的 PROFINET 接口项
NetworkInterface itf = cpuInterface.GetService<NetworkInterface>();
Node node = itf.Nodes.First();

node.ConnectToSubnet(subnet);
((IEngineeringObject)node).SetAttribute("Address", "192.168.0.1");

if ((itf.InterfaceOperatingMode & InterfaceOperatingModes.IoController) != 0)
{
    IoSystem ioSystem = itf.IoControllers.First().CreateIoSystem("PN/IE_1");
}
```

`CreateIoSystem` 要求接口已经连接到某个子网，且尚未拥有 IO 系统。节点的 IP 设置是动态属性：`Address`、`SubnetMask`、`RouterAddress`、`UseRouter`、
`DhcpClientId` 和 `IpProtocolSelection`。

要在不重新创建的情况下把现有 CPU 切换到另一个固件版本，请调用 `ChangeType`。西门子的示例先把 CPU 作为 `OrderNumber:6ES7 516-3AN01-0AB0/V2.8` 插入，然后调用
`deviceItem.ChangeType("OrderNumber:6ES7 516-3AN01-0AB0/V2.9")`。如果标识符未知、对象是只读的，或者不支持这种更改（例如换成完全不同的模块系列），它会抛出异常。

## 用 PLCWare 创建同样的组态

`serve` 应用封装了这些调用。下面调用中的名称就是你自己起的名称：`device` 是站，`subnet` 是子网。其中的标识符来自西门子文档；请先用
`GET /catalog?filter=1516`（MCP：`tia_catalog`）查出你需要的标识符。

```powershell
function Post($path, $body) {
  Invoke-RestMethod -Method Post "http://localhost:5000$path" -ContentType "application/json" -Body ($body | ConvertTo-Json)
}

Post "/subnets" @{ typeIdentifier = "System:Subnet.Ethernet"; name = "PN_Line2" }
Post "/devices" @{ typeIdentifier = "OrderNumber:6ES7 516-2GN00-0AB0/V2.9"; deviceItemName = "PLC_1"; deviceName = "Station_1" }
Post "/devices/Station_1/plug" @{ typeIdentifier = "OrderNumber:6ES7 521-1BL00-0AB0/V1.0"; name = "DI_1"; position = 2 }
Post "/network/connect" @{ device = "Station_1"; subnet = "PN_Line2"; ip = "192.168.0.1"; createIoSystem = $true }
```

对应的 MCP 工具是 `tia_subnet_create`、`tia_device_create`、`tia_device_plug` 和 `tia_network_connect`。标识符中的版本部分用斜杠书写，即 `/V2.9`，
绝不能写成 `:V2.9`；PLCWare 会拒绝后一种写法。CPU 及其 IO 设备必须在同一个子网上，并且每个 IO 系统只由一个 `createIoSystem` 创建。
从 PLCWare 应用 1.7.0（目前处于 beta 阶段）起，`tia_network_connect` 的响应带有 `postcheck`：serve 在写入后会重新读取该连接；若出现
`409 postcheck_failed`，说明写入没有达到预期效果，请先用 `tia_device_network` 重新读取接口，再重试。稳定版应用 1.6.3 不会校验写入结果：请事后自行检查配置，
可以在 TIA Portal 的网络视图中查看，或用 `tia_devices` 和 `tia_subnets` 重新读取。

这些工具都支持 `dryRun: true`，它会检查各项保护并返回计划，而不修改项目。Openness 没有回滚功能，所以创建之前请先确认该名称尚不存在：重复运行不会收敛到同一结果。

TIA Portal 会用 CPU 的设备项名称（上面的 `PLC_1`）而不是站的名称来命名该 CPU 的 PLC 软件。之后所有属于 PLC 范围的操作（如变量、块和编译）都使用这个名称；
`tia_plcs` 会列出它。

### 或者用一个文档描述整个项目

`tia_spec_validate`、`tia_spec_plan` 和 `tia_spec_apply` 接受 JSON 格式的项目规格：先校验，再转换成有序的操作列表，并按依赖顺序执行：子网、设备、模块、网络、变量表、
变量、空的 FB，以及编译。一个最小的规格如下：

```json
{
  "project": { "name": "Line2", "directory": "C:\\TIA\\Line2" },
  "conventions": {
    "namingScheme": "plcopen",
    "optimizedAccess": true,
    "symbolicOnly": true,
    "defaultLanguages": { "interlocks": "LAD", "algorithms": "SCL", "sequencers": "GRAPH" }
  },
  "devices": [
    {
      "name": "Line2_CPU",
      "typeIdentifier": "OrderNumber:6ES7 511-1AK02-0AB0/V2.9",
      "role": "cpu",
      "family": "S7-1500"
    }
  ],
  "network": {
    "subnet": { "type": "System:Subnet.Ethernet", "name": "PN_Line2", "cidr": "192.168.0.0/24" },
    "nodes": [{ "device": "Line2_CPU", "ip": "192.168.0.1", "createIoSystem": true }]
  },
  "tagTables": [{ "name": "IO", "purpose": "IO" }],
  "tags": [{ "table": "IO", "name": "Conv01_Run", "dataType": "Bool", "address": "%Q0.0" }]
}
```

`tia_spec_validate` 和 `tia_spec_plan` 不需要运行中的 TIA Portal。`tia_spec_apply` 遇到第一个失败的步骤就会停止，绝不会下载到 PLC，也不会导入 UDT 或编写块逻辑；
这些仍由 `tia_types_import`、`tia_source_put` 和 `tia_import_xml` 负责。

## 常见的坑

- 通过 Openness 创建的 CPU 起初可能无法干净地编译：它的保护设置尚未配置。PLCWare 提供了对应的操作步骤（用 `{ "topic": "recipes" }` 调用 `tia_guide`），
  所需的密码始终由人提供，没有任何东西会自动生成密码。
- 项目的固件版本不能高于实体 CPU 的固件版本。`tia_device_change_version` 会原地更改并保留程序，但会重置只能在 TIA Portal 窗口中设置的内容
  （OPC UA 服务器激活和运行时许可证），因此请先用 `tia_project_archive` 归档项目，之后再重新编译。
- 把硬件下载到真实 PLC 不在本指南范围内。那是一道需要由人批准的关卡。

## 相关指南

- [用代码编译 PLC 并读取消息](compile-plc-read-messages.zh.md)
- [在 Windows 上配置 TIA Portal Openness](openness-setup-windows.zh.md)
- [通过 MCP 将 AI 助手连接到 TIA Portal](connect-ai-assistant-mcp.zh.md)
- [全部指南](README.zh.md)

## 开始 30 天免费试用

PLCWare 会针对 TIA Portal V21，替你或你的 AI 助手完成这些步骤。试用期为 30 天，包含 Pro 权限范围，无需信用卡，且不会续期。你需要自行向西门子
另购带 STEP 7 Professional 许可证的 TIA Portal V21。

**[开始 30 天免费试用](https://plcware.io/zh/trial?utm_source=github&utm_medium=guide&utm_campaign=create-devices-hardware-network)**
· [下载应用](https://plcware.io/download)

*TIA Portal、SIMATIC 和 Siemens 是西门子公司（Siemens AG）的商标。PLCWare 是面向 TIA Portal 的独立产品，与西门子无关联，也未获
其认可。*
