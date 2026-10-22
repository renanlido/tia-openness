# Compilar un PLC desde código y leer los mensajes de compilación

> Traducción al español. Original en inglés: [compile-plc-read-messages.md](compile-plc-read-messages.md).

Compilar es la comprobación que te dice si la lógica generada o importada es buena. Con TIA Portal Openness compilas
desde tu programa y lees el resultado como objetos, en lugar de mirar la ventana Inspector. Esta guía lo hace en C#,
después con la API HTTP y las herramientas MCP de PLCWare, y termina con cómo una compilación limpia lleva a una
descarga. Es válida para **TIA Portal V21**.

## Antes de empezar

- Una aplicación Openness conectada a TIA Portal V21 con un proyecto abierto
  ([Configurar TIA Portal Openness en Windows](openness-setup-windows.es.md)).
- Todos los dispositivos deben estar **offline** mientras compilas.
- Si una contraseña protege el programa de seguridad, debes iniciar sesión en el programa de seguridad para compilar los
  cambios de software. Si no, la compilación se cancela y se lanza una excepción.

## Compilar con Openness (C#)

La compilación pasa por el servicio `ICompilable`. Lo que se compila depende del objeto que pidas:

| Objeto | Qué compila |
|---|---|
| `Device` (la estación) | Hardware y software |
| `DeviceItem` (la CPU) | Solo el hardware |
| `PlcSoftware` | Solo el programa del PLC |
| `CodeBlock`, `DataBlock`, `PlcType` | Ese objeto |
| `HmiTarget` | El software de la HMI |

```csharp
using System;
using Siemens.Engineering.Compiler;
using Siemens.Engineering.SW;

static bool Compile(PlcSoftware plcSoftware)
{
    ICompilable compiler = plcSoftware.GetService<ICompilable>();
    CompilerResult result = compiler.Compile();

    Console.WriteLine($"State: {result.State}, {result.ErrorCount} errors, {result.WarningCount} warnings");
    Print(result.Messages, "");
    return result.State != CompilerResultState.Error;
}

static void Print(CompilerResultMessageComposition messages, string indent)
{
    foreach (CompilerResultMessage message in messages)
    {
        Console.WriteLine($"{indent}{message.State} {message.Path}: {message.Description}");
        Print(message.Messages, indent + "  ");
    }
}
```

Cada mensaje trae `Path`, `DateTime` (siempre en UTC; usa `ToLocalTime()` para mostrar la hora local), `State`,
`Description`, `WarningCount`, `ErrorCount` y sus propios `Messages` hijos, así que el resultado es un árbol, no una
lista plana.

Compilar solo el `DeviceItem` de la CPU comprueba el hardware y puede parecer limpio aunque el programa tenga errores
reales. Para cubrir ambos, compila el `Device` (o el `DeviceItem` y el `PlcSoftware`).

## Compilar con PLCWare

```powershell
$r = Invoke-RestMethod -Method Post "http://localhost:5000/plcs/PLC_1/compile" `
  -ContentType "application/json" -Body '{}'
"{0}: {1} errors, {2} warnings" -f $r.state, $r.errors, $r.warnings
```

PLCWare compila hardware y software y agrega el resultado. Una respuesta abreviada:

```json
{
  "state": "Error", "errors": 1, "warnings": 0,
  "messages": [
    { "state": "Error", "path": "PLC_1/FB_Motor/Network 3", "dateTime": "2026-09-25T12:00:00Z",
      "description": "...", "children": [] }
  ],
  "sections": [ { "target": "hardware" }, { "target": "software" } ],
  "blockChanges": [ { "name": "FB_Motor_Instance", "detail": "InstanceDB#8", "change": "modified", "parts": ["Interface"] } ]
}
```

- `state` es el peor estado encontrado (`Error`, luego `Warning`, `Information` y `Success`). `errors` y `warnings` son
  totales, y `messages` es el árbol completo, cada mensaje con su `path` y su `dateTime`.
- `sections` detalla el hardware y el software por separado.
- `blockChanges` lista los bloques que la compilación cambió. Una DB de instancia `modified` significa que la
  compilación la regeneró después de que cambiara la interfaz de su FB: expórtala y versiónala para que lo que versionas
  coincida con el proyecto.
- Solo `Error` bloquea una descarga. Las advertencias no.

La herramienta MCP es `tia_compile`, con `{ "plc": "PLC_1" }`. Aplana el árbol de mensajes y añade un resumen
`verification` (`compiled`, `errors`, `warnings`) y `nextHints`. `tia_block_compile` compila un solo bloque (app PLCWare
1.7.0 o posterior); una compilación limpia de un bloque no es la comprobación previa a una descarga, así que para eso
compila el PLC completo.

Compilar puede tardar en un proyecto grande. Cuando la respuesta es `status: "running"` con un `jobId`, la compilación
sigue en curso: llama a `tia_job_status` con ese `jobId` hasta que llegue el resultado, y no repitas la llamada
original.

## Cuando la compilación tiene errores

- Empieza por los primeros errores: los demás suelen ser consecuencias. Usa el `path` de cada mensaje para encontrar el
  bloque y la red.
- Cambiar la interfaz de un FB deja inconsistente su DB de instancia hasta que una compilación la regenera. Compila de
  nuevo antes de empezar a borrar nada.
- Una CPU creada con Openness puede fallar en su primera compilación con errores de protección hasta que se definan sus
  ajustes de protección; consulta [Crear dispositivos y hardware](create-devices-hardware-network.es.md).
- Algunos errores son ajustes que Openness no puede cambiar, como la licencia de runtime de OPC UA. Son trabajo de una
  persona en la ventana de TIA Portal. En el MCP, `tia_guide` con `{ "topic": "gui-gates" }` los lista con los pasos
  exactos.

## De una compilación limpia a una descarga

Una compilación con cero errores es la condición previa para cargar en un PLC real, y la descarga sigue siendo una
decisión humana. `tia_download` funciona en dos pasos: primero con `dryRun: true`, que pide a la app `serve` un plan
verificado (compilación limpia, interfaz PG/PC encontrada, huella del software) y devuelve un `planHash` de un solo uso;
después, cuando una persona ha leído y aprobado ese plan, otra vez con `approved: true` y el mismo `planHash`. Si el
software cambió después del plan, la descarga se rechaza con `409 plan_stale`. Planificar una descarga requiere el scope
Pro, que incluye la prueba; Basic puede leer, editar y compilar, pero no puede planificar una.

## Guías relacionadas

- [Importar bloques LAD, FBD y SCL en TIA Portal desde código](import-lad-fbd-scl-blocks.es.md)
- [Crear dispositivos y hardware con TIA Portal Openness](create-devices-hardware-network.es.md)
- [Conectar un asistente de IA a TIA Portal con MCP](connect-ai-assistant-mcp.es.md)
- [Todas las guías](README.es.md)

## Empieza la prueba gratuita de 30 días

PLCWare ejecuta estos pasos por ti, o por tu asistente de IA, sobre TIA Portal V21. La prueba dura 30 días, incluye los
permisos (scopes) de Pro, no pide tarjeta y no se renueva. Necesitas TIA Portal V21 con licencia STEP 7 Professional,
que se compra aparte a Siemens.

**[Empezar la prueba gratuita de 30 días](https://plcware.io/es/trial?utm_source=github&utm_medium=guide&utm_campaign=compile-plc-read-messages)**
· [Descargar la app](https://plcware.io/download)

*TIA Portal, SIMATIC y Siemens son marcas de Siemens AG. PLCWare es un producto independiente para TIA Portal y no
tiene vínculo con Siemens ni cuenta con su respaldo.*
