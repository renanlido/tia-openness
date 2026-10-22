# Importar bloques LAD, FBD y SCL en TIA Portal desde código

> Traducción al español. Original en inglés: [import-lad-fbd-scl-blocks.md](import-lad-fbd-scl-blocks.md).

Openness puede crear bloques en un proyecto a partir de archivos: XML SimaticML para cualquier lenguaje (LAD, FBD,
GRAPH, SCL o STL) y archivos fuente de texto para SCL y STL. Esta guía muestra las dos rutas en C# y después el mismo
trabajo con la API HTTP y las herramientas MCP de PLCWare. Es válida para **TIA Portal V21**.

## Elige la ruta

| Tienes | Openness | Herramienta de PLCWare |
|---|---|---|
| Lógica LAD, FBD o GRAPH, o cualquier bloque en XML | Importación SimaticML | `tia_import_xml` (`POST /plcs/{plc}/import`) |
| SCL como texto | Fuente externa (`.scl`) y después generar los bloques | `tia_source_put` (`POST /plcs/{plc}/source`) |
| STL como texto | Fuente externa (`.awl`) y después generar los bloques | No `tia_source_put`, que solo escribe SCL: importa el bloque como SimaticML con `tia_import_xml` |
| Un tipo de datos de usuario (UDT) | Importación XML del tipo | `tia_types_import` (`POST /plcs/{plc}/types/import`) |

LAD, FBD y GRAPH no tienen fuente de texto, así que las herramientas de PLCWare no dibujan redes nuevas desde cero. El
flujo habitual es una plantilla: alguien dibuja el bloque una vez en TIA Portal, tú lo exportas
([Exportar un bloque de PLC a XML SimaticML](export-plc-block-simaticml.es.md)), cambias nombres, tags y constantes en el
XML y lo importas las veces que haga falta. Con SCL es distinto: es texto plano, así que se puede generar de principio a
fin.

## Antes de empezar

- Una aplicación Openness conectada a TIA Portal V21 con un proyecto abierto
  ([Configurar TIA Portal Openness en Windows](openness-setup-windows.es.md)).
- El PLC **no debe estar online**.
- Importa los UDT **antes** que los bloques que los usan.

## Importar SimaticML con Openness (C#)

```csharp
using System.Collections.Generic;
using System.IO;
using Siemens.Engineering;
using Siemens.Engineering.SW;
using Siemens.Engineering.SW.Blocks;

static void ImportBlocks(PlcSoftware plcSoftware)
{
    IList<PlcBlock> blocks = plcSoftware.BlockGroup.Blocks.Import(
        new FileInfo(@"D:\Blocks\FB_Motor.xml"), ImportOptions.Override);
}
```

- `ImportOptions.None` importa sin sobrescribir: si un objeto del archivo ya existe, la importación se interrumpe y se
  lanza una excepción.
- `ImportOptions.Override` elimina el objeto existente antes de importar y lo vuelve a crear. Si el objeto existente y el
  nuevo no están en el mismo grupo, no se sobrescribe nada y la importación se cancela con una excepción.

Qué hace la importación, según Siemens:

- El XML puede contener menos datos que el bloque del proyecto, por ejemplo menos parámetros.
- La información redundante, como la de llamada, debe ser idéntica en el proyecto y en el archivo; si no, se lanza una
  excepción.
- Los datos importados pueden quedar inconsistentes: compila después.
- Los atributos marcados con `ReadOnly=True` e `Informative=True` no se importan.
- Las DB de instancia que faltan no se crean automáticamente.
- Si el archivo no trae número de bloque, el número se asigna automáticamente. Un bloque nuevo sin versión recibe "0.1".
- Todos los objetos raíz de un archivo deben ser del mismo tipo. Si uno de ellos no es válido, no se importa nada del
  archivo.
- El archivo debe ser XML bien formado. Un error de sintaxis o de estructura cancela la importación y vuelve en la
  excepción.

## Importar un archivo fuente SCL con Openness (C#)

```csharp
using System.Text;
using Siemens.Engineering.SW.ExternalSources;

static void ImportScl(PlcSoftware plcSoftware, string sclText)
{
    string path = @"D:\Sources\FB_Motor.scl";
    File.WriteAllText(path, sclText, new UTF8Encoding(true));

    PlcExternalSource source =
        plcSoftware.ExternalSourceGroup.ExternalSources.CreateFromFile("FB_Motor", path);
    source.GenerateBlocksFromSource();
}
```

- Los archivos fuente deben ser `.awl` (STL), `.scl`, `.db` o `.udt`. Cualquier otra extensión lanza una excepción.
- Guarda el archivo en UTF-8 **con BOM** cuando tenga caracteres especiales.
- Los bloques existentes con el mismo nombre se sobrescriben.
- Si la generación falla, una excepción trae los mensajes de error y el proyecto vuelve al estado anterior a la llamada.
  `GenerateBlocksFromSource(GenerateBlockOptions.KeepOnError)` conserva lo generado y no lanza nada: comprueba cada
  bloque generado compilándolo.

## Importar con PLCWare

### SCL

```powershell
$body = @{ name = "MyLogic"; code = (Get-Content .\FB_Motor.scl -Raw); compile = $true } | ConvertTo-Json
Invoke-RestMethod -Method Post "http://localhost:5000/plcs/PLC_1/source" `
  -ContentType "application/json" -Body $body
```

La respuesta incluye `generatedOrUpdated` (todo bloque que la fuente creó o regeneró), `sourceChanges`, `blocks` y, con
`compile: true`, el resultado de la compilación. TIA Portal regenera un bloque incluso cuando el texto es idéntico, así
que un bloque que vuelve en `generatedOrUpdated` necesita compilarse. La herramienta MCP es `tia_source_put`, con
`{ "plc": "PLC_1", "name": "MyLogic", "code": "...", "compile": true }`. Un error de sintaxis SCL aparece aquí, al
generar los bloques.

### LAD, FBD, GRAPH y cualquier otro bloque en XML

```powershell
$body = @{ xml = (Get-Content .\FB_Motor.xml -Raw); override = $true } | ConvertTo-Json
Invoke-RestMethod -Method Post "http://localhost:5000/plcs/PLC_1/import" `
  -ContentType "application/json" -Body $body
```

Envía el contenido en `xml`. Usa `path` solo para un archivo que ya esté en la máquina donde corre `serve`. La respuesta
incluye `imported` y, para cada bloque, `type`, `number`, `created`, `interfaceChanged` y `affectedInstanceDbs`. Los
bloques importados vuelven inconsistentes, y cuando cambió la interfaz de un FB, la siguiente compilación regenera sus
DB de instancia. La herramienta MCP es `tia_import_xml`; su hermana para UDT es `tia_types_import`.

### El orden que funciona

1. Importa los UDT (`tia_types_import`).
2. Importa o genera los bloques (`tia_import_xml`, `tia_source_put`).
3. Compila ([Compilar un PLC desde código y leer los mensajes](compile-plc-read-messages.es.md)).

Importar requiere el scope `author`, que incluyen Basic, Pro y la prueba. Cargar en un PLC es otra cosa: requiere Pro y
la aprobación de una persona.

## No sobrescribas un cambio más reciente

Openness no tiene deshacer, así que un script que lee un bloque, lo edita y lo vuelve a escribir puede sobrescribir en
silencio un cambio hecho en TIA Portal entretanto. La protección de PLCWare lo evita: lee el bloque con
`tia_export_block`, guarda su `contentHash` y pásalo como `expectedContentHash` a `tia_import_xml` o `tia_source_put`.
Si el bloque cambió entretanto, la escritura se rechaza con `409 state_changed` y no se escribe nada; vuelve a leer,
combina tu edición y reintenta. La protección requiere la app PLCWare 1.7.0 o posterior.

## Lo que suele fallar

- Regenerar la interfaz de un FB deja inconsistente su DB de instancia. Compila primero; la compilación suele
  regenerar la DB de instancia. Si sigue inconsistente, elimínala (`tia_block_delete`), vuelve a crearla
  (`tia_instancedb_create`) y compila otra vez.
- Los nombres de variables SCL no pueden ser palabras reservadas de S7, como `Counter` o `Timer`, y las variables
  locales en el cuerpo llevan el prefijo `#` (`#MiVar`).
- Usa SimaticML exportado desde V21: la importación de PLCWare espera archivos V21.
- La lógica de seguridad (F) nunca la crea ni la carga la IA de forma autónoma. Importarla es una decisión de una
  persona.

## Guías relacionadas

- [Exportar un bloque de PLC a XML SimaticML](export-plc-block-simaticml.es.md)
- [Compilar un PLC desde código y leer los mensajes](compile-plc-read-messages.es.md)
- [Todas las guías](README.es.md)

## Empieza la prueba gratuita de 30 días

PLCWare ejecuta estos pasos por ti, o por tu asistente de IA, sobre TIA Portal V21. La prueba dura 30 días, incluye los
permisos (scopes) de Pro, no pide tarjeta y no se renueva. Necesitas TIA Portal V21 con licencia STEP 7 Professional,
que se compra aparte a Siemens.

**[Empezar la prueba gratuita de 30 días](https://plcware.io/es/trial?utm_source=github&utm_medium=guide&utm_campaign=import-lad-fbd-scl-blocks)**
· [Descargar la app](https://plcware.io/download)

*TIA Portal, SIMATIC y Siemens son marcas de Siemens AG. PLCWare es un producto independiente para TIA Portal y no
tiene vínculo con Siemens ni cuenta con su respaldo.*
