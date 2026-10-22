# Crear dispositivos y configuración de hardware con TIA Portal Openness

> Traducción al español. Original en inglés: [create-devices-hardware-network.md](create-devices-hardware-network.md).

Openness puede montar una configuración de hardware sin abrir el editor Dispositivos y redes: crear la estación y su
CPU, insertar módulos, crear una subred y dar a la CPU una dirección IP y un sistema IO. Esta guía lo hace en C# y
después con la API HTTP y las herramientas MCP de PLCWare. Todo lo que aparece aquí edita el proyecto offline; nada
llega a un PLC real. Es válida para **TIA Portal V21**.

## Antes de empezar

- Una aplicación Openness conectada a TIA Portal V21 con un proyecto abierto
  ([Configurar TIA Portal Openness en Windows](openness-setup-windows.es.md)).
- El dispositivo no debe estar online mientras insertas módulos.
- Trabaja en el orden de las dependencias: subredes, después dispositivos (primero las CPU), después módulos y, por
  último, las conexiones de red.

## Encuentra el identificador de tipo

Todo objeto de hardware se crea a partir de un identificador de tipo, `<tipo>:<identificador>`, donde el tipo es
`OrderNumber`, `GSD` o `System`. Para el hardware del catálogo es el número de artículo con la versión de firmware:

```
OrderNumber:6ES7 516-2GN00-0AB0/V2.9
```

La parte del firmware solo es opcional cuando el sistema tiene una única versión de ese módulo. No adivines el valor:
pregunta al catálogo de hardware.

```csharp
foreach (var entry in portal.HardwareCatalog.Find("1516"))
    Console.WriteLine($"{entry.TypeIdentifier}  {entry.TypeName}  {entry.Version}");
```

`Find` recibe una cadena de filtro. Una segunda sobrecarga, `Find(filter, typeIdentifier)`, devuelve solo los módulos
compatibles con la CPU que le pases.

## Crear la estación y la CPU

```csharp
Device station = project.Devices.CreateWithItem(
    "OrderNumber:6ES7 516-2GN00-0AB0/V2.9", "PLC_1", "Station_1");
```

Los argumentos son el identificador de tipo del elemento de dispositivo, el nombre del elemento de dispositivo (la CPU)
y el nombre del dispositivo (la estación). `Devices.Create(deviceTypeIdentifier, name)` crea solo el dispositivo.

## Insertar módulos

```csharp
DeviceItem rack = ...; // el rack de la estación
const string di = "OrderNumber:6ES7 521-1BL00-0AB0/V1.0";

if (rack.CanPlugNew(di, "DI_1", 2))
    rack.PlugNew(di, "DI_1", 2);
```

`CanPlugNew` indica si la inserción es posible, pero `PlugNew` aún puede fallar: la posición ya está ocupada, el
contenedor no ofrece esa posición, el nombre ya se usa en el contenedor, el módulo no encaja en el contenedor o el
dispositivo está online. Un `PlugNew` fallido lanza una excepción recuperable.

## Crear la subred, la dirección IP y el sistema IO

```csharp
using System.Linq;

Subnet subnet = project.Subnets.Create("System:Subnet.Ethernet", "PN_Line2");

DeviceItem cpuInterface = ...; // el elemento de la interfaz PROFINET de la CPU
NetworkInterface itf = cpuInterface.GetService<NetworkInterface>();
Node node = itf.Nodes.First();

node.ConnectToSubnet(subnet);
((IEngineeringObject)node).SetAttribute("Address", "192.168.0.1");

if ((itf.InterfaceOperatingMode & InterfaceOperatingModes.IoController) != 0)
{
    IoSystem ioSystem = itf.IoControllers.First().CreateIoSystem("PN/IE_1");
}
```

`CreateIoSystem` necesita una interfaz que ya esté conectada a una subred y que aún no tenga sistema IO. Los ajustes IP
de un nodo son atributos dinámicos: `Address`, `SubnetMask`, `RouterAddress`, `UseRouter`, `DhcpClientId` e
`IpProtocolSelection`.

Para llevar una CPU existente a otra versión de firmware sin recrearla, llama a `ChangeType`. El ejemplo de Siemens
inserta una CPU como `OrderNumber:6ES7 516-3AN01-0AB0/V2.8` y después llama a
`deviceItem.ChangeType("OrderNumber:6ES7 516-3AN01-0AB0/V2.9")`. Lanza una excepción si el identificador es desconocido,
el objeto es de solo lectura o el cambio no se admite (por ejemplo, a una familia de módulos completamente distinta).

## Crear la misma configuración con PLCWare

La app `serve` envuelve estas llamadas. Los nombres de las llamadas siguientes son los que tú diste: la estación en
`device`, la subred en `subnet`. Los identificadores son los de la documentación de Siemens; busca antes los que
necesites con `GET /catalog?filter=1516` (MCP: `tia_catalog`).

```powershell
function Post($path, $body) {
  Invoke-RestMethod -Method Post "http://localhost:5000$path" -ContentType "application/json" -Body ($body | ConvertTo-Json)
}

Post "/subnets" @{ typeIdentifier = "System:Subnet.Ethernet"; name = "PN_Line2" }
Post "/devices" @{ typeIdentifier = "OrderNumber:6ES7 516-2GN00-0AB0/V2.9"; deviceItemName = "PLC_1"; deviceName = "Station_1" }
Post "/devices/Station_1/plug" @{ typeIdentifier = "OrderNumber:6ES7 521-1BL00-0AB0/V1.0"; name = "DI_1"; position = 2 }
Post "/network/connect" @{ device = "Station_1"; subnet = "PN_Line2"; ip = "192.168.0.1"; createIoSystem = $true }
```

Las herramientas MCP son `tia_subnet_create`, `tia_device_create`, `tia_device_plug` y `tia_network_connect`. La parte de
versión de un identificador se escribe con barra, `/V2.9`, nunca `:V2.9`; PLCWare rechaza la segunda forma. La CPU y sus
dispositivos IO deben estar en la misma subred, y exactamente un `createIoSystem` crea cada sistema IO. La respuesta de
`tia_network_connect` trae un `postcheck`: el serve vuelve a leer la conexión después de escribirla, y
`409 postcheck_failed` significa que la escritura no surtió el efecto pedido, así que vuelve a leer la interfaz con
`tia_device_network` (app PLCWare 1.7.0 o posterior) antes de reintentar.

Todas estas herramientas aceptan `dryRun: true`, que comprueba las protecciones y devuelve el plan sin cambiar el
proyecto. Openness no tiene rollback, así que comprueba que un nombre todavía no existe antes de crearlo: repetir la
ejecución no converge.

TIA Portal da al software del PLC de una CPU el nombre del elemento de dispositivo de la CPU (`PLC_1` arriba), no el de
la estación. Todo lo que es de ámbito PLC después, como tags, bloques y compilación, usa ese nombre; `tia_plcs` lo lista.

### O describe el proyecto entero en un documento

`tia_spec_validate`, `tia_spec_plan` y `tia_spec_apply` reciben una especificación de proyecto en JSON, la validan, la
convierten en la lista ordenada de operaciones y las ejecutan en el orden de las dependencias: subredes, dispositivos,
módulos, red, tablas de tags, tags, FB vacíos y la compilación. Una especificación mínima:

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

`tia_spec_validate` y `tia_spec_plan` no necesitan un TIA Portal en ejecución. `tia_spec_apply` se detiene en el primer
paso que falla, nunca carga nada en el PLC y no importa UDT ni escribe lógica de bloques; eso queda para
`tia_types_import`, `tia_source_put` y `tia_import_xml`.

## Lo que suele fallar

- Una CPU creada con Openness puede no compilar limpia al principio: sus ajustes de protección no están definidos.
  PLCWare documenta una receta para ello (`tia_guide` con `{ "topic": "recipes" }`), y la contraseña que necesita
  siempre la aporta una persona. Nada la genera.
- La versión de firmware del proyecto no debe ser mayor que la de la CPU física. `tia_device_change_version` la cambia
  en el sitio y conserva el programa, pero restablece ajustes que solo puede definir la ventana de TIA Portal
  (activación del servidor OPC UA y licencia de runtime), así que archiva antes el proyecto con `tia_project_archive` y
  recompila después.
- Cargar el hardware en un PLC real no forma parte de esta guía. Es una compuerta que aprueba una persona.

## Guías relacionadas

- [Compilar un PLC desde código y leer los mensajes](compile-plc-read-messages.es.md)
- [Configurar TIA Portal Openness en Windows](openness-setup-windows.es.md)
- [Conectar un asistente de IA a TIA Portal con MCP](connect-ai-assistant-mcp.es.md)
- [Todas las guías](README.es.md)

## Empieza la prueba gratuita de 30 días

PLCWare ejecuta estos pasos por ti, o por tu asistente de IA, sobre TIA Portal V21. La prueba dura 30 días, incluye los
permisos (scopes) de Pro, no pide tarjeta y no se renueva. Necesitas TIA Portal V21 con licencia STEP 7 Professional,
que se compra aparte a Siemens.

**[Empezar la prueba gratuita de 30 días](https://plcware.io/es/trial?utm_source=github&utm_medium=guide&utm_campaign=create-devices-hardware-network)**
· [Descargar la app](https://plcware.io/download)

*TIA Portal, SIMATIC y Siemens son marcas de Siemens AG. PLCWare es un producto independiente para TIA Portal y no
tiene vínculo con Siemens ni cuenta con su respaldo.*
