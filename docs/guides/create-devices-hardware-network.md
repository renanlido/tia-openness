# Create devices and hardware configuration with TIA Portal Openness

Openness can build a hardware configuration without opening the Devices & Networks editor: create the station and its
CPU, plug modules, create a subnet, give the CPU an IP address and an IO system. This guide does it in C#, then through
PLCWare's HTTP API and MCP tools. Everything here edits the offline project; nothing reaches a real PLC. It applies to
**TIA Portal V21**.

## Before you start

- An Openness application connected to TIA Portal V21 with a project open
  ([Set up TIA Portal Openness on Windows](openness-setup-windows.md)).
- The device must not be online while you plug modules.
- Do the work in dependency order: subnets, then devices (CPUs first), then modules, then the network connections.

## Find the type identifier

Every hardware object is created from a type identifier, `<type>:<identifier>`, where the type is `OrderNumber`, `GSD`
or `System`. For hardware from the catalog it is the article number with the firmware version:

```
OrderNumber:6ES7 516-2GN00-0AB0/V2.9
```

The firmware part is optional only when the system has a single version of that module. Do not guess the value: ask the
hardware catalog.

```csharp
foreach (var entry in portal.HardwareCatalog.Find("1516"))
    Console.WriteLine($"{entry.TypeIdentifier}  {entry.TypeName}  {entry.Version}");
```

`Find` takes a filter string. A second overload, `Find(filter, typeIdentifier)`, returns only the modules compatible
with the CPU you pass.

## Create the station and the CPU

```csharp
Device station = project.Devices.CreateWithItem(
    "OrderNumber:6ES7 516-2GN00-0AB0/V2.9", "PLC_1", "Station_1");
```

The arguments are the type identifier of the device item, the name of the device item (the CPU) and the name of the
device (the station). `Devices.Create(deviceTypeIdentifier, name)` creates only the device.

## Plug modules

```csharp
DeviceItem rack = ...; // the rack of the station
const string di = "OrderNumber:6ES7 521-1BL00-0AB0/V1.0";

if (rack.CanPlugNew(di, "DI_1", 2))
    rack.PlugNew(di, "DI_1", 2);
```

`CanPlugNew` says whether plugging is possible, but `PlugNew` can still fail: the position is already taken, the
container does not offer that position, the name is already used in the container, the module does not fit the
container, or the device is online. A failed `PlugNew` throws a recoverable exception.

## Create the subnet, the IP address and the IO system

```csharp
using System.Linq;

Subnet subnet = project.Subnets.Create("System:Subnet.Ethernet", "PN_Line2");

DeviceItem cpuInterface = ...; // the CPU's PROFINET interface item
NetworkInterface itf = cpuInterface.GetService<NetworkInterface>();
Node node = itf.Nodes.First();

node.ConnectToSubnet(subnet);
((IEngineeringObject)node).SetAttribute("Address", "192.168.0.1");

if ((itf.InterfaceOperatingMode & InterfaceOperatingModes.IoController) != 0)
{
    IoSystem ioSystem = itf.IoControllers.First().CreateIoSystem("PN/IE_1");
}
```

`CreateIoSystem` needs an interface that is already connected to a subnet and has no IO system yet. A node's IP settings
are dynamic attributes: `Address`, `SubnetMask`, `RouterAddress`, `UseRouter`, `DhcpClientId` and
`IpProtocolSelection`.

To move an existing CPU to another firmware version without recreating it, call `ChangeType`. Siemens' example plugs a CPU
as `OrderNumber:6ES7 516-3AN01-0AB0/V2.8` and then calls `deviceItem.ChangeType("OrderNumber:6ES7 516-3AN01-0AB0/V2.9")`.
It throws if the identifier is unknown, the object is read-only, or the change is not supported (for example to a
completely different module family).

## Create the same configuration with PLCWare

The `serve` app wraps these calls. Names in the calls below are the names you gave: the station for `device`, the subnet
for `subnet`. The identifiers are the ones from the Siemens documentation; look up the ones you need first with
`GET /catalog?filter=1516` (MCP: `tia_catalog`).

```powershell
function Post($path, $body) {
  Invoke-RestMethod -Method Post "http://localhost:5000$path" -ContentType "application/json" -Body ($body | ConvertTo-Json)
}

Post "/subnets" @{ typeIdentifier = "System:Subnet.Ethernet"; name = "PN_Line2" }
Post "/devices" @{ typeIdentifier = "OrderNumber:6ES7 516-2GN00-0AB0/V2.9"; deviceItemName = "PLC_1"; deviceName = "Station_1" }
Post "/devices/Station_1/plug" @{ typeIdentifier = "OrderNumber:6ES7 521-1BL00-0AB0/V1.0"; name = "DI_1"; position = 2 }
Post "/network/connect" @{ device = "Station_1"; subnet = "PN_Line2"; ip = "192.168.0.1"; createIoSystem = $true }
```

The MCP tools are `tia_subnet_create`, `tia_device_create`, `tia_device_plug` and `tia_network_connect`. The version part
of an identifier is written with a slash, `/V2.9`, never `:V2.9`; PLCWare rejects the second form. The CPU and
its IO devices must be on the same subnet, and exactly one `createIoSystem` creates each IO system. From PLCWare
app 1.7.0 (currently in beta), the answer of `tia_network_connect` carries a `postcheck`: the serve re-reads the
connection after writing it, and `409 postcheck_failed` means the write did not take effect as asked, so read the
interface again with `tia_device_network` before you retry. The stable app, 1.6.3, does not verify the write: check the
configuration yourself afterwards, in TIA Portal's network view or by reading it back with `tia_devices` and
`tia_subnets`.

Every one of these tools takes `dryRun: true`, which checks the guards and returns the plan without changing the
project. There is no rollback in Openness, so check that a name does not exist yet before creating it: a repeated run
does not converge.

TIA Portal names the PLC software of a CPU after the CPU's device item (`PLC_1` above), not after the station. Everything
that is PLC-scoped afterwards, such as tags, blocks and compile, takes that name; `tia_plcs` lists it.

### Or describe the whole project in one document

`tia_spec_validate`, `tia_spec_plan` and `tia_spec_apply` take a project spec in JSON, check it, turn it into the ordered
list of operations and run them in dependency order: subnets, devices, modules, network, tag tables, tags, empty FBs
and the compile. A minimal spec:

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

`tia_spec_validate` and `tia_spec_plan` need no running TIA Portal. `tia_spec_apply` stops at the first step that fails,
never downloads, and does not import UDTs or write block logic; those stay with `tia_types_import`, `tia_source_put` and
`tia_import_xml`.

## Things that trip people up

- A CPU created through Openness may not compile clean at first: its protection settings are not set. PLCWare documents
  a recipe for it (`tia_guide` with `{ "topic": "recipes" }`), and the password it needs always comes from a person.
  Nothing generates one.
- The project's firmware version must not be higher than the physical CPU's. `tia_device_change_version` changes it in
  place and keeps the program, but it resets settings that only the TIA Portal window can set (OPC UA server activation
  and runtime license), so archive the project first with `tia_project_archive` and recompile afterwards.
- Downloading the hardware to a real PLC is not part of this guide. It is a gate that a person approves.

## Related guides

- [Compile a PLC from code and read the messages](compile-plc-read-messages.md)
- [Set up TIA Portal Openness on Windows](openness-setup-windows.md)
- [Connect an AI assistant to TIA Portal through MCP](connect-ai-assistant-mcp.md)
- [All guides](README.md)

## Start your free 30-day trial

PLCWare runs these steps for you, or for your AI assistant, against TIA Portal V21. The trial lasts 30 days, includes the
Pro scopes, needs no card and does not renew. You need TIA Portal V21 with a STEP 7 Professional license, bought
separately from Siemens.

**[Start the free 30-day trial](https://plcware.io/en/trial?utm_source=github&utm_medium=guide&utm_campaign=create-devices-hardware-network)**
· [Download the app](https://plcware.io/download)

*TIA Portal, SIMATIC and Siemens are trademarks of Siemens AG. PLCWare is an independent product for TIA Portal and
is not affiliated with or endorsed by Siemens.*
