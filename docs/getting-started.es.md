# Primeros pasos

> Traducción al español. Original en inglés: [getting-started.md](getting-started.md).

Esta guía te lleva desde la **descarga** hasta una **API en ejecución y con licencia** en pocos
minutos. Todo lo que aparece aquí se puede hacer desde la **GUI de la bandeja del sistema**, sin
línea de comandos. Los equivalentes en CLI se muestran para automatización.

```
[ your AI editor / CLI ]  --(MCP)-->  [ tia MCP (npx) ]  --(HTTP)-->  [ serve (this app, Windows+TIA) ]
```

## 1. Requisitos previos

En la máquina que tiene **TIA Portal V21**:

- **Windows 10/11 (x64)**.
- **.NET Framework 4.8** (el instalador lo comprueba y avisa si falta).
- **TIA Portal V21 + el componente Openness** instalados. La aplicación carga los assemblies de
  Siemens desde tu instalación local; **no** se redistribuyen.
- Tu usuario de Windows debe pertenecer al grupo local **`Siemens TIA Openness`** (el
  instalador o `setup` te agrega).

> En la **primera** conexión, TIA Portal muestra una única vez un cuadro de diálogo de
> seguridad/confianza que debes confirmar manualmente. Es el comportamiento esperado.

## 2. Descargar e instalar

Desde la página de [**Releases**](https://github.com/renanlido/tia-openness/releases/latest):

- **Un clic (recomendado):** descarga `TIAOpenness-Setup-<version>.exe` y ejecútalo. Copia la
  aplicación, ejecuta la configuración inicial (grupo, acceso directo, "start with Windows"
  opcional) y abre la pantalla **Getting started**.
- **Portable:** descarga `TIAOpenness-app-<version>.zip`, descomprímelo y ejecuta
  `TIAOpenness.exe setup`.

## 3. Comprobar el entorno

Abre la aplicación de la bandeja (acceso directo **"TIA Openness API"**) → pestaña **API** →
**Check environment**. Verifica el grupo de Windows, que el proceso sea x64 y que TIA Portal V21 +
PublicAPI estén presentes.

Equivalente en CLI:

```powershell
TIAOpenness.exe check
```

## 4. Activar tu licencia

La aplicación es **gratuita de descargar, pero requiere una licencia para ejecutarse**: sin ella,
todos los endpoints excepto `GET /health` devuelven `403 license_required`.

En la GUI: pestaña **License** → pega tu clave de la licencia de activación (Activation License) →
**Save** (se almacena cifrada con Windows DPAPI). ¿Aún no tienes una? **[Empieza la prueba gratuita de 30 días](https://plcware.io/es/trial?utm_source=github&utm_medium=docs&utm_campaign=getting-started)**:
es de autoservicio, incluye los permisos (scopes) de Pro y no pide tarjeta.

## 5. Iniciar la API

En la GUI: pestaña **API** → **Start API** (puerto predeterminado **5000**).

Equivalente en CLI:

```powershell
TIAOpenness.exe serve 5000
```

Comprueba que está en marcha (este endpoint no necesita activación):

```powershell
Invoke-RestMethod http://localhost:5000/health
```

### Acceso remoto (opcional)

De forma predeterminada, la API escucha solo en **localhost** (no se expone nada). Para acceder
desde otra máquina (por ejemplo, un cliente de IA en un **Mac** → el `serve` en una **VM con
Windows**), usa la pestaña **API** → **Allow remote access…** (UAC; puedes restringirlo a una IP
de origen), luego establece **Host = `0.0.0.0`** e inicia.

Equivalente en CLI (ejecuta como administrador):

```powershell
TIAOpenness.exe setup-remote 5000 --allow 192.168.x.y   # allow only that source IP (recommended)
```

> Permitir el acceso remoto expone la API a la red. El `serve` sigue exigiendo una licencia activa,
> pero **no** autentica a clientes individuales: controla el acceso con firewall / VPN.

## 6. Conectar un asistente de IA (opcional)

Apunta el **MCP `tia`** a tu `serve` en ejecución. Para **Claude Code**:

```bash
claude mcp add --transport stdio --env TIA_API_BASE=http://localhost:5000 --scope user tia -- npx -y @renanlido/tia-openness-mcp
```

Usa la IP de la VM o del host en `TIA_API_BASE` si el `serve` se ejecuta en otro lugar. Los demás
clientes (Claude Desktop, Codex, Gemini CLI, Cursor, VS Code, Windsurf) y el problema conocido de
`cmd /c npx` en Windows están en **[docs/INSTALL.es.md](INSTALL.es.md)**.

La primera tool que debes llamar es **`tia_ping`**:

- `reachable:false` → IP / puerto / firewall / `serve` detenido.
- `activated:false` → licencia ausente o no válida en el host.
- ambos `true` → todo listo.

Para un flujo guiado, de la especificación al proyecto verificado, instala el plugin
[**tia-harness**](https://github.com/renanlido/tia-harness) de Claude Code.

## Solución de problemas

| Síntoma | Causa probable |
|---|---|
| `403 license_required` en cada llamada | No hay una licencia válida en el host: actívala (paso 4). |
| `tia_ping` → `reachable:false` | `serve` no está en ejecución, IP/puerto incorrectos o el firewall bloquea. |
| La API no inicia en `0.0.0.0` | El acceso remoto aún no está permitido: usa **Allow remote access…** (paso 5). |
| "Check environment" falla en el grupo | No perteneces a `Siemens TIA Openness`: vuelve a ejecutar `setup` y luego cierra e inicia sesión. |
| El diálogo de confianza de TIA sigue apareciendo | Confírmalo una vez, manualmente, en la máquina de TIA (es lo esperado en la primera conexión). |

Más ayuda: **[SUPPORT.es.md](../SUPPORT.es.md)**.
