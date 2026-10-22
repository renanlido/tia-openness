# Exportar un bloque de PLC a XML SimaticML con TIA Portal Openness

> Traducción al español. Original en inglés: [export-plc-block-simaticml.md](export-plc-block-simaticml.md).

SimaticML es el formato XML que TIA Portal Openness usa para llevar bloques de PLC hacia dentro y fuera de un
proyecto. Esta guía exporta un bloque, o todos los bloques, a XML: primero con Openness puro en C# y después con la
API HTTP y las herramientas MCP de PLCWare. Es válida para **TIA Portal V21**.

## Antes de empezar

- Una aplicación Openness conectada a TIA Portal V21 con un proyecto abierto. Si aún no lo has configurado, consulta
  [Configurar TIA Portal Openness en Windows](openness-setup-windows.es.md).
- El PLC **no debe estar online**.
- Solo se exportan bloques **consistentes**. Si el bloque cambió desde la última compilación, compílalo antes
  ([Compilar un PLC desde código](compile-plc-read-messages.es.md)).
- Tipos de bloque admitidos: FB, FC, OB y DB global. Lenguajes admitidos: STL, FBD, LAD, GRAPH y SCL.

## Exportar un bloque con Openness (C#)

```csharp
using System.IO;
using Siemens.Engineering;
using Siemens.Engineering.SW;
using Siemens.Engineering.SW.Blocks;

static void ExportBlock(PlcSoftware plcSoftware)
{
    PlcBlock block = plcSoftware.BlockGroup.Blocks.Find("FB_Motor");
    block.Export(new FileInfo(@"D:\Export\FB_Motor.xml"), ExportOptions.WithDefaults);
}
```

`ExportOptions` decide cuánto va al archivo:

| Opción | Qué contiene el archivo |
|---|---|
| `ExportOptions.None` | Solo los datos modificados o distintos del valor por defecto, más lo que la importación necesita |
| `ExportOptions.WithDefaults` | También los valores por defecto |
| `ExportOptions.WithReadOnly` | También los valores protegidos contra escritura |

Combina las dos últimas con `ExportOptions.WithDefaults | ExportOptions.WithReadOnly`. El archivo se escribe en
inglés, y los textos del proyecto se exportan en todos los idiomas que tenga el proyecto.

Las bibliotecas Openness de TIA Portal V21 escriben SimaticML de la versión de ingeniería V21 y leen archivos de las
versiones V18 a V21.

## Exportar todos los bloques, grupos de usuario incluidos

```csharp
static void ExportAll(PlcSoftware plc, string folder)
{
    Directory.CreateDirectory(folder);
    ExportBlocks(plc.BlockGroup.Blocks, folder);
    foreach (PlcBlockUserGroup group in plc.BlockGroup.Groups)
        ExportGroup(group, Path.Combine(folder, group.Name));
}

static void ExportGroup(PlcBlockUserGroup group, string folder)
{
    Directory.CreateDirectory(folder);
    ExportBlocks(group.Blocks, folder);
    foreach (PlcBlockUserGroup sub in group.Groups)
        ExportGroup(sub, Path.Combine(folder, sub.Name));
}

static void ExportBlocks(PlcBlockComposition blocks, string folder)
{
    foreach (PlcBlock block in blocks)
        block.Export(new FileInfo(Path.Combine(folder, block.Name + ".xml")), ExportOptions.WithDefaults);
}
```

Un bloque con protección de know-how exporta solo su interfaz pública, salvo que lo desbloquees antes con
`PlcBlockProtectionProvider`.

## Exportar con PLCWare

La aplicación `serve` de PLCWare envuelve las mismas llamadas de Openness en una API HTTP/JSON local (por defecto
`http://localhost:5000`), y el servidor MCP `tia` las expone como herramientas para un asistente de IA. Exportar solo
lee el proyecto, así que funciona en todos los planes, incluido Basic.

### Un bloque, devuelto en la respuesta

```powershell
$r = Invoke-RestMethod "http://localhost:5000/plcs/PLC_1/blocks/FB_Motor/xml"
$r.xml | Out-File FB_Motor.xml -Encoding utf8
$r.contentHash
```

La respuesta es `{ name, options, contentHash, contentHashError, xml }`. Añade `?options=WithDefaults` (o `None`,
`WithReadOnly`, combinados con `,`) para elegir las opciones de exportación. La herramienta MCP es
`tia_export_block`, con `{ "plc": "PLC_1", "block": "FB_Motor" }`.

### Todos los bloques y tipos, en una carpeta

```powershell
Invoke-RestMethod -Method Post "http://localhost:5000/plcs/PLC_1/export" `
  -ContentType "application/json" -Body '{"directory":"C:\\export"}'
```

Los bloques van a `Blocks\` y los tipos a `Types\`, dentro de ese directorio, **en la máquina donde corre `serve`**, y
la respuesta lista cada archivo con su SHA-256 y su tamaño. La herramienta MCP es `tia_export_xml`; úsala cuando el
proyecto sea demasiado grande para volver en un solo resultado de herramienta.

## Comprueba que el proyecto sigue coincidiendo con el XML de git

No compares hashes de dos exportaciones en bruto: dos exportaciones del mismo bloque difieren en `<Created>` y en los
UIds. En su lugar, pasa el XML versionado a `tia_block_compare`. Compara el bloque del proyecto con tu archivo después
de normalizar ambos (ignora el formato, el BOM, `<Created>` y los UIds) y responde `verdict: "equal"` o
`"different"`.

Otros detalles que conviene conocer:

- Exportar un bloque inconsistente lo compila antes, lo que puede regenerar su DB de instancia. Exporta y versiona
  también la DB de instancia.
- `contentHash` es el hash que comprueba la protección contra escrituras sobre datos desactualizados antes de que una
  importación sobrescriba un bloque (consulta [Importar bloques LAD, FBD y SCL](import-lad-fbd-scl-blocks.es.md)).
  La protección requiere la app PLCWare 1.7.0 o posterior.
- `tia_block_render` convierte una exportación SimaticML en pseudo-SCL legible, red por red, sin un TIA Portal en
  ejecución. Es útil para revisar bloques LAD y FBD en un pull request.
- Los bloques F consistentes se pueden exportar e importar de nuevo, pero los bloques de sistema F del propio sistema
  de seguridad no se pueden exportar.

## Guías relacionadas

- [Importar bloques LAD, FBD y SCL en TIA Portal desde código](import-lad-fbd-scl-blocks.es.md)
- [Compilar un PLC desde código y leer los mensajes](compile-plc-read-messages.es.md)
- [Todas las guías](README.es.md)

## Empieza la prueba gratuita de 30 días

PLCWare ejecuta estos pasos por ti, o por tu asistente de IA, sobre TIA Portal V21. La prueba dura 30 días, incluye
los permisos (scopes) de Pro, no pide tarjeta y no se renueva. Necesitas TIA Portal V21 con licencia STEP 7 Professional, que se compra aparte a
Siemens.

**[Empezar la prueba gratuita de 30 días](https://plcware.io/es/trial?utm_source=github&utm_medium=guide&utm_campaign=export-plc-block-simaticml)**
· [Descargar la app](https://plcware.io/download)

*TIA Portal, SIMATIC y Siemens son marcas de Siemens AG. PLCWare es un producto independiente para TIA Portal y no
tiene vínculo con Siemens ni cuenta con su respaldo.*
