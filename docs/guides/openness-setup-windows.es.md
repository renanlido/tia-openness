# Configurar TIA Portal Openness en Windows: grupo de usuarios, aviso de la primera conexión y V21

> Traducción al español. Original en inglés: [openness-setup-windows.md](openness-setup-windows.md).

Antes de que una aplicación Openness pueda tocar un proyecto, el PC de ingeniería necesita cuatro cosas: TIA Portal V21,
tu usuario de Windows en el grupo de Openness, las bibliotecas V21 localizables por tu programa y una aprobación única
del programa en el cortafuegos de Openness de TIA Portal. Esta guía recorre cada una y después muestra lo que PLCWare
hace por ti. Es válida para **TIA Portal V21**.

## La lista rápida

1. TIA Portal V21 está instalado en el PC. Openness viene con él.
2. Tu usuario de Windows es miembro del grupo local **Siemens TIA Openness**, y has cerrado sesión y vuelto a entrar.
3. Tu programa carga las bibliotecas Siemens.Engineering desde la instalación de TIA Portal.
4. Aprobaste el programa en el aviso del cortafuegos la primera vez que se conectó.
5. El proyecto es un proyecto V21, o lo abres con actualización.

## 1. TIA Portal V21 y sus bibliotecas

En V21, TIA Portal Openness ya no es una opción del setup: es una característica inherente de TIA Portal y se instala con
él. Según los productos y opciones instalados, vienen con él ensamblados Siemens.Engineering modulares adicionales.
Están en el directorio de instalación, en `PublicAPI\V21\net48\`, por ejemplo:

```
C:\Program Files\Siemens\Automation\Portal V21\PublicAPI\V21\net48\Siemens.Engineering.Base.dll
```

Además de `Siemens.Engineering.Base.dll`, un programa que trabaja con PLC también referencia
`Siemens.Engineering.Step7.dll`. Dos consecuencias:

- Las bibliotecas de V17, V18, V19 y V20 no forman parte de V21. Un programa hecho para una versión anterior debe
  adaptarse antes de ejecutarse contra V21.
- Un programa solo puede usar una versión de TIA Portal a la vez: acceder a versiones distintas en el mismo AppDomain no
  se admite.

## 2. Añade tu usuario al grupo "Siemens TIA Openness"

TIA Portal crea el grupo local de Windows **Siemens TIA Openness** durante el setup. Cada vez que tu programa intenta
alcanzar un proceso de TIA Portal, TIA Portal comprueba que perteneces al grupo, directamente o a través de otro grupo.
Si no, se lanza una `EngineeringSecurityException`. Ser miembro permite ejecutar cualquier aplicación Openness.

Un administrador añade al usuario:

1. Abre **Administración de equipos** como administrador.
2. Ve a **Usuarios y grupos locales > Grupos**.
3. Abre **Siemens TIA Openness**, haz clic en **Agregar...** y añade al usuario.
4. El usuario cierra sesión y vuelve a entrar por completo.

Desde un PowerShell elevado, lo mismo es:

```powershell
Add-LocalGroupMember -Group "Siemens TIA Openness" -Member "$env:USERDOMAIN\$env:USERNAME"
```

## 3. Haz que tu programa encuentre las bibliotecas

Pon **Copiar localmente** en **False** para toda referencia Siemens.Engineering y limpia el directorio de salida: copiar
las bibliotecas junto a tu programa no se admite. Siemens documenta dos formas de resolverlas en tiempo de ejecución y
recomienda las claves del registro junto con el evento `AssemblyResolve`.

El registro guarda la ruta por ti: bajo
`HKEY_LOCAL_MACHINE\SOFTWARE\Siemens\Automation\Openness\<xx.xx>\PublicAPI\<xx.xx.xx.xx>\net48` (una clave por cada
destino .NET admitido), el valor `Siemens.Engineering.Base` apunta a la ruta de instalación. Una ruta fija también
funciona:

```csharp
using System;
using System.IO;
using System.Reflection;

internal static class Program
{
    private const string OpennessFolder = @"C:\Program Files\Siemens\Automation\Portal V21\PublicAPI\V21\net48";

    static Program()
    {
        // Registra el resolvedor lo antes posible.
        AppDomain.CurrentDomain.AssemblyResolve += OnAssemblyResolve;
    }

    public static void Main() => new HelloOpennessApp().Run(); // los tipos de Openness viven en otra clase

    private static Assembly OnAssemblyResolve(object sender, ResolveEventArgs args)
    {
        var requested = new AssemblyName(args.Name);
        string file = Path.Combine(OpennessFolder, requested.Name + ".dll");
        if (!requested.Name.StartsWith("Siemens.Engineering.") || !File.Exists(file)) return null;
        return Assembly.LoadFrom(file);
    }
}
```

No toques ningún tipo de Openness (en el cuerpo de un método, en una propiedad, en un parámetro o en un valor de
retorno) antes de que el resolvedor esté registrado; deja ese código en una clase aparte que solo se use después de la
suscripción.

## 4. La primera conexión: el aviso del cortafuegos de Openness

Cuando tu programa se conecta a una instancia de TIA Portal en ejecución, lo que incluye iniciar una nueva, TIA Portal
pregunta si acepta la conexión.

| Botón | Qué hace |
|---|---|
| **Sí** | Deja que este programa alcance esta instancia en ejecución, una vez. El aviso vuelve la próxima vez. |
| **Sí a todo** | Un administrador permite que este programa alcance todas las instancias, de forma permanente. Windows pide la aprobación de UAC y escribe una entrada en el registro. |

La entrada está en `HKEY_LOCAL_MACHINE\SOFTWARE\Siemens\Automation\Openness\AllowList` (en V21 es la misma clave para
todas las versiones de TIA Portal) y registra la ruta del programa, su fecha de modificación y el hash de su archivo. Si
cambia cualquiera de los tres, lo que incluye recompilar tu programa, TIA Portal ve un programa distinto y vuelve a
preguntar. Un administrador también puede distribuir la entrada como archivo `.reg` en lugar de esperar al aviso.

## 5. Conectar y abrir un proyecto

```csharp
using (TiaPortal portal = new TiaPortal(TiaPortalMode.WithUserInterface))   // o WithoutUserInterface
{
    Project project = portal.Projects.Open(new FileInfo(@"C:\Projects\Line2\Line2.ap21"));
}
```

- `TiaPortal.GetProcesses()` lista las instancias en ejecución a las que puedes conectarte.
- `Projects.Open` abre solo proyectos creados con la versión actual, o actualizados a ella; un proyecto de una versión
  anterior lanza una excepción. `OpenWithUpgrade` crea a partir de él un proyecto nuevo y actualizado, y lo abre.
- Un proyecto no puede estar abierto en dos instancias de TIA Portal a la vez.
- Con las bibliotecas de V21, el SimaticML exportado es V21, y se pueden importar archivos de las versiones V18 a V21.

## Lo que PLCWare hace por ti

La app `serve` de PLCWare es el programa Openness, así que no escribes nada de lo anterior. Carga los ensamblados de
Siemens desde tu instalación local de TIA Portal (no se redistribuyen), los resuelve por ti y ejecuta cada llamada de
Openness en un único worker serie. Lo que sigue de tu lado:

- **El grupo.** El setup de primera ejecución del instalador añade tu usuario de Windows a **Siemens TIA Openness**.
  Después, cierra sesión y vuelve a entrar. Si la comprobación del entorno se queja del grupo más tarde, ejecuta el
  setup de nuevo y cierra sesión y vuelve a entrar.
- **La comprobación.** En la app de la bandeja, pestaña **API**, **Check environment**, o por línea de comandos:

  ```powershell
  TIAOpenness.exe check
  ```

  Verifica el grupo de Windows, que el proceso sea x64 y que TIA Portal V21 y su PublicAPI estén presentes. En el MCP,
  `tia_readiness` hace el mismo tipo de comprobación en la máquina donde corre `serve` (x64, grupo, PublicAPI, clave del
  registro e instancias de TIA), y `tia_ping` indica si `serve` es alcanzable y está activado.
- **La primera conexión.** El aviso del cortafuegos aparece en la máquina que ejecuta `serve`, y una persona debe
  responderlo: PLCWare no puede hacer clic por ti, a propósito. El setup del instalador registra el ejecutable instalado
  en la lista de permitidos de Openness cuando puede, para que el aviso no haga falta. Cuando hace falta, el flujo en el
  MCP es `tia_start`, luego `tia_show_ui` (vuelve a lanzar TIA Portal en modo visible para que aparezca el aviso), una
  persona hace clic en **Sí a todo** y después `tia_connect`. Un `tia_connect` que se topa con el aviso responde
  `requires_human_action` tras unos 180 segundos, en lugar de reintentar.

PLCWare funciona solo con TIA Portal V21.

## Cuando falla

| Síntoma | Causa probable |
|---|---|
| `EngineeringSecurityException` en cuanto el programa inicia TIA Portal | El usuario no está en **Siemens TIA Openness**, o no ha cerrado sesión y vuelto a entrar desde que se añadió |
| `Could not load file or assembly Siemens.Engineering...` | El resolvedor se registró demasiado tarde, **Copiar localmente** está activado o la ruta apunta a otra versión |
| El aviso vuelve en cada ejecución | Pulsaste **Sí** en lugar de **Sí a todo**, o el archivo del programa cambió |
| Abrir el proyecto lanza una excepción | Se creó con una versión anterior de TIA Portal: usa `OpenWithUpgrade` |
| El proyecto no se abre | Ya está abierto en otra instancia de TIA Portal |

## Guías relacionadas

- [Crear dispositivos y hardware con TIA Portal Openness](create-devices-hardware-network.es.md)
- [Conectar un asistente de IA a TIA Portal con MCP](connect-ai-assistant-mcp.es.md)
- [Manual de instalación](../INSTALL.es.md)
- [Todas las guías](README.es.md)

## Empieza la prueba gratuita de 30 días

PLCWare ejecuta estos pasos por ti, o por tu asistente de IA, sobre TIA Portal V21. La prueba dura 30 días, incluye los
permisos (scopes) de Pro, no pide tarjeta y no se renueva. Necesitas TIA Portal V21 con licencia STEP 7 Professional,
que se compra aparte a Siemens.

**[Empezar la prueba gratuita de 30 días](https://plcware.io/es/trial?utm_source=github&utm_medium=guide&utm_campaign=openness-setup-windows)**
· [Descargar la app](https://plcware.io/download)

*TIA Portal, SIMATIC y Siemens son marcas de Siemens AG. PLCWare es un producto independiente para TIA Portal y no
tiene vínculo con Siemens ni cuenta con su respaldo.*
