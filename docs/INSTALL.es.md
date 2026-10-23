# Instalar y usar el MCP `tia` (cualquier cliente)

> Traducción al español. Original en inglés: [INSTALL.md](INSTALL.md).

> **Fuente única.** Esta es la guía de instalación canónica. Los README apuntan aquí: no dupliques
> los pasos en otro lugar (evita el _drift_). Actualiza **solo aquí**.

El **MCP `tia`** es un paquete **npm** (`@renanlido/tia-openness-mcp`): un **cliente HTTP ligero** que habla
con la **API `serve`** (la aplicación de Windows que controla TIA Portal). **No instalas nada**: el cliente
ejecuta el paquete mediante `npx`. Solo hay **una** cosa que configurar: la variable **`TIA_API_BASE`**, que
apunta al `serve`.

```
[ your AI editor/CLI ]  --(MCP/stdio)-->  [ tia MCP (npx) ]  --(HTTP)-->  [ serve (Windows+TIA) ]
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

## ⚠️ Windows: usa `cmd /c npx`

En **Windows**, varios clientes lanzan el proceso **sin shell**, y `npx` (que es `npx.cmd`) falla con
`spawn npx ENOENT`. Donde ocurra, reemplaza:

```jsonc
"command": "npx", "args": ["-y", "@renanlido/tia-openness-mcp"]
```

por:

```jsonc
"command": "cmd", "args": ["/c", "npx", "-y", "@renanlido/tia-openness-mcp"]
```

En **macOS/Linux** usa la forma simple (`npx` directamente): **no** pongas `cmd /c` allí.

---

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

Edita `claude_desktop_config.json` (Settings → Developer → **Edit Config** abre el archivo):

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

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

En **Windows** usa la forma `cmd /c` (arriba): es la causa n.º 1 de "el servidor no inicia". Reinicia la aplicación.

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

Comprueba en una sesión con `/mcp`. (En Windows, reemplaza `npx` por `cmd /c npx` en `args`.)

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
| Claude Desktop | `claude_desktop_config.json` (mac `~/Library/Application Support/Claude/`, win `%APPDATA%\Claude\`) | `mcpServers` | opcional | — (editar el JSON) |
| Codex | `~/.codex/config.toml` | `[mcp_servers.tia]` (TOML) | — | `codex mcp add …` |
| Gemini CLI | `~/.gemini/settings.json` | `mcpServers` | — | `gemini mcp add …` |
| Cursor | `.cursor/mcp.json` / `~/.cursor/mcp.json` | `mcpServers` | — | — (JSON/UI) |
| **VS Code** | `.vscode/mcp.json` | **`servers`** | **sí** | `code --add-mcp "{…}"` |
| Windsurf | `~/.codeium/windsurf/mcp_config.json` | `mcpServers` | — | — (JSON/UI) |

**Reglas de oro:** (1) en **Windows**, `cmd /c npx`; (2) en **VS Code**, clave raíz `servers` + `type:"stdio"`;
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
