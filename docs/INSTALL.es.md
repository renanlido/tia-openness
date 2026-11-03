# Instalar y usar el MCP `tia` (cualquier cliente)

> Traducción al español. Original en inglés: [INSTALL.md](INSTALL.md).

> **Fuente única.** Esta es la guía de instalación canónica. Los README apuntan aquí: no dupliques
> los pasos en otro lugar (evita el _drift_). Actualiza **solo aquí**.

El **MCP `tia`** (`@renanlido/tia-openness-mcp`) es un cliente HTTP ligero para la API `serve`
(la aplicación de Windows que controla TIA Portal). El instalador Windows de PLCWare 1.7.1 incluye el runtime para las
conexiones gestionadas por la aplicación que se describen abajo. Las rutas manuales y otras basadas en npm siguen disponibles.
La variable **`TIA_API_BASE`** apunta el MCP a tu `serve`.

```
[ your AI editor/CLI ]  --(MCP/stdio)-->  [ tia MCP (incluido o con npx) ]  --(HTTP)-->  [ serve (Windows+TIA) ]
```

## Requisito previo (una vez, en el host con TIA)

Inicia la API `serve` en la máquina Windows que tiene TIA Portal V21, mediante la **GUI de la bandeja de PLCWare**
(acceso directo "TIA Openness API" → pestaña "API" → "Start API") **o** desde la línea de comandos:

```powershell
TIAOpenness.exe serve 5000              # local
TIAOpenness.exe serve 5000 --host 0.0.0.0   # accepts connections from another machine (e.g. Mac → VM)
```

- **La misma máquina** que el editor de IA → `TIA_API_BASE=http://localhost:5000`.
- **Editor en otra máquina** (p. ej., un Mac, con el `serve` en una VM con Windows) → `TIA_API_BASE=http://<vm-ip>:5000`
  e inicia el serve con `--host 0.0.0.0` (y abre el puerto en el firewall).

> El MCP **no envía ninguna clave**: lo que activa el servidor es la **licencia** configurada en el host
> (pestaña "License" de la GUI). Sin un serve activado, el MCP solo puede diagnosticar la conectividad
> (`tia_ping`).

---

## Ruta de la aplicación en Windows (desde PLCWare 1.7.1)

Instala **PLCWare 1.7.1** con `TIAOpenness-Setup-1.7.1.exe` y abre **Connect your AI agents** desde el menú de la
bandeja o la ventana de primeros pasos. Instala primero el agente, revisa los cambios y elige **Connect**.
Estas conexiones gestionadas por el instalador no necesitan Node.js, npm/`npx`, Git del sistema ni acceso al registro npm:

| Agente | Conexión y habilidades |
|---|---|
| Claude Code | Instala el catálogo local de plugins y el plugin incluidos, con habilidades, auxiliares y el lanzador `tia` integrado. Un plugin ya instalado conserva su configuración; para cambiar una conexión `npx` anterior a 1.7.1, usa **Disconnect** y después **Connect**. |
| Claude Desktop | Abre el `.mcpb` incluido solo si Windows tiene una aplicación asociada; completa la instalación en Desktop. Si no, escribe el runtime integrado en la configuración de la versión detectada, incluida Store/MSIX. **Sal completamente de Desktop desde la bandeja antes de que Connect escriba la configuración; cerrar la ventana no basta.** Vuelve a abrirlo y usa **Refresh** en PLCWare para verificar. |
| Codex | Escribe una sola conexión `tia` integrada e instala el plugin local de habilidades, además de los agentes auxiliares. Usa una CLI disponible, incluida la del propio desktop; no requiere instalar una CLI aparte. Si no hay una CLI utilizable, prepara un catálogo personal de plugins: cierra/reabre Codex e instala `tia-harness` en **Plugins** siguiendo las instrucciones mostradas. El MCP duplicado del plugin queda desactivado. |

**Las habilidades de Claude Desktop son un paso separado del conector MCP.** Si el plugin de PLCWare de ámbito de usuario
ya está instalado, no hay paso de habilidades. De lo contrario, Connect prepara **un único ZIP de plugin**, con
habilidades y agentes pero sin conector MCP ni hooks. Usa **Open plugin folder** para seleccionar el ZIP y súbelo en
Desktop: **Customize → Plugins → Add → Upload plugin**. No requiere subir cada habilidad ni Git;
los agentes usan la conexión `tia` existente. Conectar o desconectar Desktop no instala ni elimina el plugin de Claude Code.
Si Desktop reutiliza el plugin de usuario, conserva el conector `tia` de PLCWare; no actives también el conector del plugin.

Para una conexión `.mcpb`, reconecta tras actualizar PLCWare y completa la actualización de la extensión en Desktop.
Si hace falta, desinstala la extensión antigua en Desktop y reconecta. En la ruta de archivo de configuración, sal
completamente de Desktop antes de reconectar; luego ábrelo y verifica. Completa los pasos manuales pendientes;
**Connect** por sí solo no los verifica.

**Rutas que aún usan npm/`npx`:** el plugin público de Codex CLI instalado de forma independiente (no el plugin local
gestionado por la aplicación), la extensión de Gemini CLI, los ejemplos manuales de abajo, versiones anteriores de la
aplicación y clientes MCP en Mac/Linux o un host remoto sin los archivos del instalador Windows. Requieren Node.js
y acceso al paquete npm (acceso al registro en el primer uso o si el paquete no está en caché). La ruta Windows
integrada no garantiza que la instalación del agente, el inicio de sesión o el servicio de IA funcionen sin conexión.

## Configuración manual o versiones anteriores de Windows: usa `cmd /c npx`

En la configuración por línea de comandos/manual y en las versiones de PLCWare anteriores a 1.7.1, varios clientes
de Windows inician el proceso **sin shell**, y `npx` (que es `npx.cmd`) puede fallar con `spawn npx ENOENT`.
Cuando ocurra, reemplaza:

```jsonc
"command": "npx", "args": ["-y", "@renanlido/tia-openness-mcp"]
```

por:

```jsonc
"command": "cmd", "args": ["/c", "npx", "-y", "@renanlido/tia-openness-mcp"]
```

En **macOS/Linux** usa la forma simple (`npx` directamente): **no** pongas `cmd /c` allí.

---

Los ejemplos por cliente de abajo son de **configuración manual solo del MCP**, no de la instalación de plugins desde
la aplicación descrita arriba. No añadas otra entrada `tia` sobre una conexión existente por plugin o extensión.

## Claude Code

**Un comando** (ámbito de usuario: se aplica a todos los proyectos):

```bash
claude mcp add --scope user --env TIA_API_BASE=http://localhost:5000 tia -- npx -y @renanlido/tia-openness-mcp
```

O mediante **`.mcp.json`** en la raíz del proyecto (ámbito de proyecto, versionable):

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

Comprueba: `claude mcp list` (debe listar `tia`) · en una sesión, `/mcp`.

## Claude Desktop

Para la configuración manual, abre `claude_desktop_config.json` desde Settings → Developer → **Edit Config**,
después **sal completamente de Desktop antes de editar**:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows (.exe):** `%APPDATA%\Claude\claude_desktop_config.json`
- **Windows (Store/MSIX):** `%LOCALAPPDATA%\Packages\Claude_*\LocalCache\Roaming\Claude\claude_desktop_config.json`

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

Para la configuración manual por JSON en **Windows**, usa la forma `cmd /c` de arriba. Reabre Desktop después de guardar
y verifica la conexión. La ruta gestionada por el instalador se describe arriba.

## Codex (CLI + extensión de IDE)

Configuración en `~/.codex/config.toml` (la extensión de IDE comparte el mismo archivo). Ten en cuenta: **env en un
subbloque** `[mcp_servers.tia.env]`.

```toml
[mcp_servers.tia]
command = "npx"
args = ["-y", "@renanlido/tia-openness-mcp"]

[mcp_servers.tia.env]
TIA_API_BASE = "http://localhost:5000"
```

O mediante la CLI:

```bash
codex mcp add tia --env TIA_API_BASE=http://localhost:5000 -- npx -y @renanlido/tia-openness-mcp
```

Comprueba en una sesión con `/mcp`. En Windows, usa `command = "cmd"` y
`args = ["/c", "npx", "-y", "@renanlido/tia-openness-mcp"]`.

## Gemini CLI

Configuración en `~/.gemini/settings.json` (usuario) o `<project>/.gemini/settings.json` (proyecto):

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

O mediante la CLI (`-s user` = global; el valor predeterminado es proyecto):

```bash
gemini mcp add -s user -e TIA_API_BASE=http://localhost:5000 tia npx -y @renanlido/tia-openness-mcp
```

## Cursor

`.cursor/mcp.json` (proyecto) o `~/.cursor/mcp.json` (global), mismo formato que Claude (`mcpServers`):

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

## VS Code (Copilot / agent mode)

⚠️ **Distinto de los demás:** la clave raíz es **`servers`** (no `mcpServers`) y usa **`"type": "stdio"`**.
Archivo `.vscode/mcp.json` (workspace), o Command Palette → `MCP: Open User Configuration`:

```json
{
  "servers": {
    "tia": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@renanlido/tia-openness-mcp"],
      "env": { "TIA_API_BASE": "http://localhost:5000" }
    }
  }
}
```

Las tools solo aparecen en Copilot en **Agent mode**. Alternativa por CLI: `code --add-mcp "{...}"`.

## Windsurf

Archivo `~/.codeium/windsurf/mcp_config.json` (sin ámbito de proyecto), formato `mcpServers`:

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

---

## Resumen de diferencias (lo que suele fallar)

| Cliente | Archivo | Clave raíz | ¿`type:"stdio"`? | CLI para añadir |
|---|---|---|---|---|
| Claude Code | `.mcp.json` (proyecto) / `~/.claude.json` (usuario, mediante la CLI) | `mcpServers` | opcional | `claude mcp add … -- npx …` |
| Claude Desktop | `claude_desktop_config.json` (usa **Edit Config** para la ruta de la versión detectada arriba) | `mcpServers` | opcional | — (editar JSON tras salir completamente) |
| Codex | `~/.codex/config.toml` | `[mcp_servers.tia]` (TOML) | — | `codex mcp add …` |
| Gemini CLI | `~/.gemini/settings.json` | `mcpServers` | — | `gemini mcp add …` |
| Cursor | `.cursor/mcp.json` / `~/.cursor/mcp.json` | `mcpServers` | — | — (JSON/UI) |
| **VS Code** | `.vscode/mcp.json` | **`servers`** | **sí** | `code --add-mcp "{…}"` |
| Windsurf | `~/.codeium/windsurf/mcp_config.json` | `mcpServers` | — | — (JSON/UI) |

**Reglas de la ruta npm manual:** (1) en **Windows**, `cmd /c npx`; (2) en **VS Code**, clave raíz `servers` + `type:"stdio"`;
(3) define **`TIA_API_BASE`** apuntando al `serve`; (4) reinicia el cliente después de editar el archivo.

## Acceso remoto (otra máquina → el host del serve)

De forma predeterminada, el serve escucha solo en **localhost** (seguro, no se expone nada). Para alcanzarlo desde **otra máquina**
(p. ej., el MCP en tu **Mac** → el serve en una **VM con Windows**), Windows necesita una **reserva de HTTP.sys**
(`urlacl`) + el **puerto abierto en el firewall**; de lo contrario, el enlace a `0.0.0.0`/`+` falla con *Acceso denegado*.

**Mediante la GUI (1 clic, recomendado):** pestaña **"API"** → botón **"Allow remote access…"** → confirma el
aviso de **UAC** (administrador) y, opcionalmente, **restringe a la IP de origen** (p. ej., la IP de tu Mac). Luego establece
**Host = `0.0.0.0`** y **"Start API"**. *(Si intentas iniciar con un Host remoto sin permitirlo antes,
la aplicación detecta el error y te ofrece permitirlo en ese mismo momento.)*

**Desde la línea de comandos** (PowerShell **como administrador**):

```powershell
TIAOpenness.exe setup-remote 5000 --allow 192.168.68.230   # allow ONLY that source IP (recommended)
TIAOpenness.exe setup-remote 5000                          # allow the whole LAN
TIAOpenness.exe setup-remote 5000 --remove                 # undo (back to localhost-only)
```

> **Seguridad:** permitir el acceso remoto expone el serve a la red. El serve sigue exigiendo una **licencia
> activa**, pero **no autentica a clientes individuales**: quién puede conectarse lo controlan el
> **firewall/VPN**. Prefiere **restringir a la IP de origen**; abre toda la LAN solo en una red de confianza. En
> el Mac, apunta `TIA_API_BASE=http://<vm-ip>:5000`.

## Diagnóstico

La primera tool que debes llamar es **`tia_ping`**: `reachable:false` → IP/puerto/firewall/serve detenido;
`activated:false` → licencia ausente o no válida en el host; ambos `true` → listo para usar.
