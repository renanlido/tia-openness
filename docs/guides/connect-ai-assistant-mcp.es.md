# Conectar un asistente de IA a TIA Portal con MCP (Claude Desktop, Claude Code y otros clientes)

> Traducción al español. Original en inglés: [connect-ai-assistant-mcp.md](connect-ai-assistant-mcp.md).

Un asistente de IA puede leer y editar un proyecto de TIA Portal V21 mediante MCP. El servidor MCP `tia` habla con la
app `serve` de PLCWare, el programa de Windows que hace el trabajo con Openness. Viene con el instalador de Windows o se
ejecuta por separado mediante `npx`. El asistente prepara el trabajo; una persona aprueba todo lo que llega a un PLC real.
Esta guía conecta ambos. Es válida para **TIA Portal V21**.

```
[ tu cliente de IA ]  --(MCP/stdio)-->  [ MCP tia (incluido o npx) ]  --(HTTP)-->  [ serve (Windows + TIA Portal V21) ]
```

## Qué necesitas

- Una máquina Windows con **TIA Portal V21** y la **app PLCWare** (`serve`) en ejecución con una licencia activada. En
  la app de la bandeja, pestaña **License**: pega tu clave y guarda; pestaña **API**: **Start API** (puerto por defecto
  5000). Desde la línea de comandos: `TIAOpenness.exe serve 5000`.
- **Node.js** (versión 20 o posterior) solo para las rutas npm/`npx` de abajo, en la máquina que ejecuta tu cliente de IA.
  La ruta compatible del instalador de Windows no necesita Node.js ni npm instalados por separado.
- Un ajuste, `TIA_API_BASE`, la dirección de `serve`. El MCP **no envía ninguna clave**: lo que activa la app es la
  licencia del host.

## Conectar agentes con la instalación guiada

Instala **PLCWare (aplicación Windows)** en el host con TIA Portal, actívalo e inicia la API. En el equipo de tus agentes
(Windows, macOS o Linux), instala Node.js `^20.12.0 || >=21.7.0` (se recomienda el LTS actual) y ejecuta:

```sh
npx plcware-setup
```

Sin argumentos, en un terminal, selecciona los agentes detectados, los componentes compatibles de cada uno y las habilidades.
Claude Code, Codex y Gemini CLI reciben el plugin/extensión oficial **renanlido/tia-harness**; los demás reciben solo
los componentes MCP, habilidades y subagentes seleccionados y compatibles. Es un único harness, no una segunda copia.
Si seleccionas MCP, indica la dirección de la API (`http://localhost:5000` viene rellenado; usa la dirección del host/VM
Windows para clientes remotos) y el modo completo/solo lectura. Revisa la vista previa y confirma una vez. Instalar solo
habilidades omite las preguntas de la API. El setup no pide una clave de activación: activa la app Windows.
La confianza en la fuente sigue siendo una decisión humana.

Sin terminal o en CI, el comando sin argumentos muestra la ayuda. Reinicia el agente, revisa MCP y pide `tia_ping`.
`npx plcware-setup plan` muestra la vista previa sin escribir; `npx plcware-setup uninstall --yes` elimina solo los
cambios propios registrados. Los plugins instalados por otra vía quedan intactos. Usa una fuente de instalación por agente.

## Avanzado: conexiones manuales y gestionadas por la aplicación

Las rutas por agente de abajo siguen disponibles para configuración avanzada; no dupliques la conexión `tia`.

## Windows: conecta  desde la app PLCWare

Para clientes en la misma máquina Windows, instala **PLCWare 1.8.0** con `TIAOpenness-Setup-1.8.0.exe`. Abre
**Connect your AI agents** desde **Connect AI agents…** en la bandeja o desde la ventana de primeros pasos.

1. Instala primero tu cliente: **Claude Code, Claude Desktop, Codex, Cursor o VS Code**. La compatibilidad con Cursor y
   VS Code llegó en la 1.8.0; estos dos reciben solo herramientas MCP, no habilidades ni ayudantes.
2. Selecciona el cliente y revisa los cambios propuestos. **Sal completamente de Claude Desktop antes de elegir
   Connect si se va a escribir la configuración; cerrar la ventana no basta.** Después elige **Connect**.
   Estas rutas usan el runtime MCP incluido en el instalador (o el `.mcpb` incluido para Desktop), sin Node.js, npm ni `npx` del sistema.
3. Vuelve a abrir Desktop después, completa los pasos manuales indicados y comprueba la conexión abajo.

Tras actualizar la app, PLCWare ofrece **Update connections / Repair** en el siguiente inicio normal para las conexiones
registradas que necesitan atención. Revisa y aprueba los cambios; el instalador no reescribe la configuración de los
clientes automáticamente. Sigue los pasos manuales pendientes. Consulta el [Manual de instalación](../INSTALL.es.md)
para los detalles por cliente, las rutas de paquete/configuración y las habilidades separadas de Desktop, y la migración desde una conexión `npx` existente.

No añadas la configuración manual de abajo sobre una conexión gestionada por la app: mantén solo una conexión `tia` por
cliente. Esto no garantiza el funcionamiento sin conexión de la instalación del cliente, el inicio de sesión o su servicio de IA.

## Configuración manual: rutas npm/npx

Usa los pasos existentes de abajo para **Mac/Linux, clientes remotos o configuración manual**, y para versiones de la app
**anteriores a la 1.7.1** (**anteriores a la 1.8.0 para Cursor y VS Code**).
La **extensión de Gemini CLI** y el **plugin público de Codex CLI instalado por separado** también siguen usando npm/`npx`;
el plugin público de Codex no es el plugin local gestionado por la app. Estas rutas necesitan Node.js y acceso a paquetes
npm (acceso al registro en el primer uso o cuando el paquete no está en caché). Los formatos y detalles de plugins/extensiones
están en el [Manual de instalación](../INSTALL.es.md).

## Claude Code

Un comando, a nivel de usuario (vale para todos tus proyectos):

```bash
claude mcp add tia --scope user -e TIA_API_BASE=http://localhost:5000 -- npx -y @renanlido/tia-openness-mcp
```

Pon primero el nombre del servidor (`tia`). `-e` acepta varios valores, y Claude Code 2.1.238 rechazó `--env KEY=VALUE`
escrito antes del nombre. Comprueba con `claude mcp list`, que debe mostrar `tia` como conectado, y con `/mcp` dentro de
una sesión.

## Claude Desktop

Para la configuración manual, abre `claude_desktop_config.json` desde **Settings > Developer > Edit Config** y después
**sal completamente de Desktop antes de editar**:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows (.exe): `%APPDATA%\Claude\claude_desktop_config.json`
- Windows (Store/MSIX): `%LOCALAPPDATA%\Packages\Claude_*\LocalCache\Roaming\Claude\claude_desktop_config.json`

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

Vuelve a abrir la app después de guardar. Para la configuración manual en Windows, usa la forma con `cmd /c` (solo
Windows) si `npx` simple no arranca:

```json
"command": "cmd", "args": ["/c", "npx", "-y", "@renanlido/tia-openness-mcp"]
```

Mantén una sola entrada `tia`: dos servidores hablarían con el mismo `serve`, que ejecuta una operación a la vez.

## Otros clientes

Para la configuración manual, Codex, Gemini CLI, Cursor, VS Code y Windsurf usan el mismo comando,
`npx -y @renanlido/tia-openness-mcp`, y la misma variable `TIA_API_BASE`; solo cambia el formato de configuración.
Consulta el [Manual de instalación](../INSTALL.es.md). Para Codex, Cursor y VS Code gestionados por la app en Windows, usa la ruta del instalador de arriba.

## Cuando tu cliente de IA está en otra máquina

Una disposición habitual es un editor en un Mac y `serve` en una VM Windows. En el lado de Windows, permite el acceso
remoto en la app de la bandeja (pestaña **API**, **Allow remote access...**, que reserva la URL y abre el puerto en el
cortafuegos), define el host como `0.0.0.0` e inicia la API; desde la línea de comandos,
`TIAOpenness.exe serve 5000 --host 0.0.0.0`. La licencia debe estar activada en esa máquina. En el lado del cliente,
pon la dirección de la VM en la propia entrada del MCP, en lugar de `http://localhost:5000`. El `TIA_API_BASE` de la
entrada es lo que lee el MCP: una variable exportada en tu shell no lo sustituye.

En Claude Code, añade el servidor de nuevo con la dirección de la VM (si `tia` ya está registrado, elimínalo antes con
`claude mcp remove tia`):

```bash
claude mcp add tia --scope user -e TIA_API_BASE=http://<ip-de-la-vm>:5000 -- npx -y @renanlido/tia-openness-mcp
```

En Claude Desktop y en los demás clientes que guardan una configuración en JSON, cambia el valor en el archivo:

```json
"env": { "TIA_API_BASE": "http://<ip-de-la-vm>:5000" }
```

Después, abre una sesión nueva, o reinicia la app, para que el MCP arranque con la nueva dirección.

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
siendo la autoridad. Una versión del MCP anterior al modo ignora la variable y registra todas las herramientas. Para la
ruta manual con `npx`, comprueba `npx -y @renanlido/tia-openness-mcp --version` (la opción existe desde la 1.9.2). En todos
los casos, confirma en tu cliente que una herramienta de escritura, como `tia_compile`, no aparece.

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
