# Primeros pasos

> Traducción al español. Original en inglés: [getting-started.md](getting-started.md).

Esta guía te lleva desde la descarga hasta la aplicación PLCWare Windows en marcha y activada mediante la GUI de bandeja.
Para conectar los agentes, ejecuta `npx plcware-setup` en un terminal de su equipo (paso 6).
Los equivalentes CLI y las rutas manuales avanzadas siguen disponibles.

```
[ your AI editor / CLI ]  --(MCP)-->  [ tia MCP (incluido o npx) ]  --(HTTP)-->  [ serve (this app, Windows+TIA) ]
```

## 1. Requisitos previos

En la máquina que tiene **TIA Portal V21**:

- **Windows 10/11 (x64)**.
- **.NET Framework 4.8** (el instalador se detiene si falta).
- **TIA Portal V21 + el componente Openness** instalados. La aplicación carga los assemblies de
  Siemens desde tu instalación local; **no** se redistribuyen.
- Tu usuario de Windows debe pertenecer al grupo local **`Siemens TIA Openness`** (el
  instalador o `setup` te agrega).

> Si TIA Portal muestra un diálogo de seguridad/confianza, confírmalo manualmente en esa máquina. Una instalación
> de confianza gestionada por el instalador puede evitarlo; las copias portables aún pueden requerirlo. Los detalles de
> preparación muestran el estado de la lista de permisos.

## 2. Descargar e instalar

Desde la página de [**Releases**](https://github.com/renanlido/tia-openness/releases/latest):

- **Instalador (recomendado):** descarga `TIAOpenness-Setup-1.7.1.exe` para PLCWare 1.7.1 estable.
  Copia la aplicación y los archivos de agentes incluidos y configura el entorno del usuario original de Windows.
  Si los permisos del grupo requieren un nuevo inicio de sesión, la página final ofrece **Restart now / Restart later**
  y **no** abre los primeros pasos inmediatamente. Guarda tu trabajo antes de reiniciar.
  Sin reinicio pendiente, **View the getting-started steps** está marcado en instalaciones nuevas y desmarcado en actualizaciones.
- **Portable:** descarga `TIAOpenness-app-v1.7.1.zip`, descomprímelo y ejecuta `TIAOpenness.exe setup`.
  La conexión sin Node del sistema requiere los archivos del instalador; el ZIP de la aplicación no es equivalente.

La ventana de primeros pasos comprueba el entorno e intenta iniciar la API automáticamente; la activación de licencia
y la conexión de agentes están en los pasos principales y los diagnósticos técnicos en **Details**. En el siguiente
inicio de sesión tras el reinicio solicitado, solo se abre si la configuración aún necesita atención; si está completa,
muestra una breve notificación de preparación. Los lanzamientos posteriores son silenciosos. Reabre la lista desde el
menú de la bandeja o el acceso directo **Next steps** del menú Inicio.

## 3. Comprobar el entorno

Para una comprobación manual, abre PLCWare en la bandeja (acceso directo **"TIA Openness API"**) → **API** →
**Check environment**. Verifica el grupo de Windows, el proceso x64 y la presencia de TIA Portal V21 + PublicAPI.
Si la cuenta ya pertenece a `Siemens TIA Openness` pero el token de sesión está desactualizado, cierra/inicia sesión
o reinicia; no repitas la adición del usuario. Si falta la pertenencia al grupo, ejecuta la configuración elevada.

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

La ventana de primeros pasos inicia la API automáticamente. Si no escucha, usa **API** → **Start API**
(puerto predeterminado **5000**) y revisa el error indicado.

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


En Windows gestionado por el instalador de PLCWare 1.7.1, abre **Connect your AI agents**, revisa y conecta Claude Code,
Claude Desktop o Codex sin Node.js/npm ni Git del sistema. Completa los pasos manuales pendientes: las habilidades de
Desktop pueden requerir subir un ZIP de plugin, y Codex solo con la aplicación desktop puede necesitar una instalación
en **Plugins**. Consulta **[docs/INSTALL.es.md](INSTALL.es.md)** para la ruta `.mcpb`/MSIX, la salida completa obligatoria,
las habilidades, los auxiliares y las rutas que aún usan npm/`npx`.

Como **alternativa manual solo del MCP**, no como adición al plugin gestionado por la aplicación, apunta `tia` al `serve` en marcha:

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

El plugin de Claude Code gestionado por la aplicación ya incluye el flujo de especificación a proyecto verificado de
[**tia-harness**](https://github.com/renanlido/tia-harness); no instales un segundo MCP.

## Solución de problemas

| Síntoma | Causa probable |
|---|---|
| `403 license_required` en cada llamada | No hay una licencia válida en el host: actívala (paso 4). |
| `tia_ping` → `reachable:false` | `serve` no está en ejecución, IP/puerto incorrectos o el firewall bloquea. |
| La API no inicia en `0.0.0.0` | El acceso remoto aún no está permitido: usa **Allow remote access…** (paso 5). |
| "Check environment" falla en el grupo | Sin pertenencia: ejecuta `setup` elevado. Ya añadido pero token desactualizado: cierra/inicia sesión o reinicia, sin repetir la adición. |
| Aparece el diálogo de confianza de TIA | Confirma manualmente en la máquina de TIA; si se repite, revisa los detalles de preparación de la lista de permisos. |

Más ayuda: **[SUPPORT.es.md](../SUPPORT.es.md)**.
