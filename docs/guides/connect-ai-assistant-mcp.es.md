# Conectar un asistente de IA a TIA Portal con MCP (Claude Desktop, Claude Code y otros clientes)

> Traducción al español. Original en inglés: [connect-ai-assistant-mcp.md](connect-ai-assistant-mcp.md).

Un asistente de IA puede leer y editar un proyecto de TIA Portal V21 mediante MCP. El servidor MCP `tia` es un pequeño
paquete npm que habla con la app `serve` de PLCWare, el programa de Windows que hace el trabajo con Openness. El asistente
prepara el trabajo; una persona aprueba todo lo que llega a un PLC real. Esta guía conecta ambos. Es válida para
**TIA Portal V21**.

```
[ tu cliente de IA ]  --(MCP/stdio)-->  [ MCP tia (npx) ]  --(HTTP)-->  [ serve (Windows + TIA Portal V21) ]
```

## Qué necesitas

- Una máquina Windows con **TIA Portal V21** y la **app PLCWare** (`serve`) en ejecución con una licencia activada. En
  la app de la bandeja, pestaña **License**: pega tu clave y guarda; pestaña **API**: **Start API** (puerto por defecto
  5000). Desde la línea de comandos: `TIAOpenness.exe serve 5000`.
- **Node.js** (versión 20 o posterior) en la máquina que ejecuta tu cliente de IA. El MCP se ejecuta con `npx`, así que no
  hay nada más que instalar.
- Un ajuste, `TIA_API_BASE`, la dirección de `serve`. El MCP **no envía ninguna clave**: lo que activa la app es la
  licencia del host.

## Claude Code

Un comando, a nivel de usuario (vale para todos tus proyectos):

```bash
claude mcp add tia --scope user -e TIA_API_BASE=http://localhost:5000 -- npx -y @renanlido/tia-openness-mcp
```

Pon primero el nombre del servidor (`tia`). `-e` acepta varios valores, y Claude Code 2.1.238 rechazó `--env KEY=VALUE`
escrito antes del nombre. Comprueba con `claude mcp list`, que debe mostrar `tia` como conectado, y con `/mcp` dentro de
una sesión.

## Claude Desktop

Edita `claude_desktop_config.json`. En Claude Desktop, **Settings > Developer > Edit Config** lo abre:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

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

Reinicia la app. En Windows, empieza con `npx` simple, como arriba. Si el cliente avisa de que el servidor no pudo
iniciarse, usa la forma con `cmd /c`, que solo existe en Windows:

```json
"command": "cmd", "args": ["/c", "npx", "-y", "@renanlido/tia-openness-mcp"]
```

Mantén una sola entrada `tia`: dos servidores hablarían con el mismo `serve`, que ejecuta una operación a la vez.

## Otros clientes

Codex, Gemini CLI, Cursor, VS Code y Windsurf usan el mismo comando, `npx -y @renanlido/tia-openness-mcp`, y la misma
variable `TIA_API_BASE`; solo cambia el lugar donde cada cliente guarda su configuración. El formato exacto de cada uno
está en el [Manual de instalación](../INSTALL.es.md).

## Cuando tu cliente de IA está en otra máquina

Una disposición habitual es un editor en un Mac y `serve` en una VM Windows. En el lado de Windows, permite el acceso
remoto en la app de la bandeja (pestaña **API**, **Allow remote access...**, que reserva la URL y abre el puerto en el
cortafuegos), define el host como `0.0.0.0` e inicia la API; desde la línea de comandos,
`TIAOpenness.exe serve 5000 --host 0.0.0.0`. La licencia debe estar activada en esa máquina. En el lado del cliente,
apunta el MCP a la VM:

```bash
export TIA_API_BASE="http://<ip-de-la-vm>:5000"
```

La licencia activa el servidor; no identifica a quien lo llama. Controla el acceso con un cortafuegos o una VPN.

## Comprueba la conexión

Pide al asistente que llame a `tia_ping`. Responde `{ base, reachable, activated, latencyMs, hint }`:

- `reachable: false`: la dirección, el puerto o el cortafuegos están mal, o `serve` no está en ejecución.
- `activated: false`: la licencia del host falta o no es válida.
- Ambos `true`: `serve` es alcanzable y está activado. Eso no es lo mismo que listo: llama a `tia_readiness` para
  comprobar el grupo de Windows, x64 y la instalación de TIA Portal
  ([Configurar TIA Portal Openness en Windows](openness-setup-windows.es.md)).

Después, `tia_status` y `tia_connect` abren o se acoplan a un proyecto. La primera conexión de un proceso `serve` puede
mostrar un aviso de seguridad en TIA Portal en la máquina Windows, y solo una persona puede responderlo.

## Qué pedir

- "Lista los bloques de PLC_1 y dime cuáles no son consistentes." (`tia_plc_blocks`)
- "Exporta FB_Motor y comprueba que coincide con el archivo de git." (`tia_export_block`, `tia_block_compare`)
- "Escribe un bloque de función SCL que haga X, ponlo en el proyecto y compila." (`tia_source_put`, `tia_compile`)
- "Compila PLC_1 y resume los errores." (`tia_compile`)

Las herramientas se agrupan por lo que pueden cambiar: las lecturas (clase R) no cambian nada; los cambios offline (clase
M-off) editan el proyecto pero nunca tocan un PLC; unas pocas herramientas con compuerta llegan al mundo físico.

## Lo que el asistente no puede hacer solo

- **Cargar en un PLC.** `tia_download` primero devuelve un plan y un `planHash` de un solo uso para que una persona lo
  revise; solo cuando la persona aprueba vuelve a ejecutarse con `approved: true` y el mismo `planHash`. Si el software
  cambió entretanto, `serve` rechaza con `409 plan_stale`. El asistente nunca aprueba.
- **Ponerse online, subir una estación, escanear la red.** Cada uno es una compuerta que requiere a una persona.
- **Secretos.** Un secreto maestro, una contraseña de know-how, una contraseña de certificado o la política de
  contraseñas siempre las aporta una persona. El asistente nunca inventa una.
- **Lógica de seguridad (F).** Nunca se crea, cambia ni carga de forma autónoma.
- **Dos cosas a la vez.** `serve` tiene un único worker serie. Las operaciones largas (conectar, compilar, cargar...)
  pueden responder `status: "running"` con un `jobId`; el asistente espera entonces con `tia_job_status` en lugar de
  repetir la llamada.

## Modo solo lectura

Para probar el MCP sin riesgo de escritura, pon `TIA_MCP_MODE` en `read-only` en el `env` del servidor:

```json
"env": { "TIA_API_BASE": "http://localhost:5000", "TIA_MCP_MODE": "read-only" }
```

El MCP registra entonces solo las herramientas de lectura: ni siquiera se lista una herramienta que cambie el proyecto o
toque un controlador. Como `tia_start` y `tia_connect` no son herramientas de lectura, el asistente no puede abrir un
proyecto en este modo: el proyecto ya debe estar abierto en `serve`.

Esto protege frente al asistente, no frente a una persona: vive en el MCP, y los scopes de la licencia en `serve` siguen
siendo la autoridad. Una versión del MCP anterior al modo ignora la variable y registra todas las herramientas, así que
comprueba `npx -y @renanlido/tia-openness-mcp --version` (la opción existe desde la 1.9.2) y confirma en tu cliente que
una herramienta de escritura, como `tia_compile`, no aparece.

## Qué plan hace qué

Basic lee el proyecto, edita offline (bloques, tags, hardware) y compila. Pro añade cargar en un PLC real y ponerse
online, siempre tras las compuertas humanas de arriba. La prueba de 30 días incluye los permisos (scopes) de Pro.

Para un flujo guiado, desde una especificación hasta un proyecto verificado, el plugin de código abierto
[`tia-harness`](https://github.com/renanlido/tia-harness) para Claude Code añade skills y subagentes sobre el mismo MCP.

## Guías relacionadas

- [Configurar TIA Portal Openness en Windows](openness-setup-windows.es.md)
- [Compilar un PLC desde código y leer los mensajes](compile-plc-read-messages.es.md)
- [Manual de instalación](../INSTALL.es.md)
- [Todas las guías](README.es.md)

## Empieza la prueba gratuita de 30 días

PLCWare ejecuta estos pasos por ti, o por tu asistente de IA, sobre TIA Portal V21. La prueba dura 30 días, incluye los
permisos (scopes) de Pro, no pide tarjeta y no se renueva. Necesitas TIA Portal V21 con licencia STEP 7 Professional,
que se compra aparte a Siemens.

**[Empezar la prueba gratuita de 30 días](https://plcware.io/es/trial?utm_source=github&utm_medium=guide&utm_campaign=connect-ai-assistant-mcp)**
· [Descargar la app](https://plcware.io/download)

*TIA Portal, SIMATIC y Siemens son marcas de Siemens AG. PLCWare es un producto independiente para TIA Portal y no
tiene vínculo con Siemens ni cuenta con su respaldo.*
