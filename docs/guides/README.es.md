# Guías para TIA Portal Openness

> Traducción al español. Original en inglés: [README.md](README.md).

Respuestas prácticas a las dudas que surgen cuando automatizas **TIA Portal V21** con Openness. Cada guía muestra la ruta
de Openness puro en C# y la ruta de PLCWare (API HTTP y herramientas MCP para un asistente de IA), con las compuertas
humanas en su sitio: una descarga a un PLC real siempre espera la aprobación de una persona.

## Las guías

- [Configurar TIA Portal Openness en Windows](openness-setup-windows.es.md): el grupo de usuarios Siemens TIA Openness,
  el aviso de la primera conexión, las bibliotecas V21 y cómo se abre un proyecto.
- [Exportar un bloque de PLC a XML SimaticML](export-plc-block-simaticml.es.md): un bloque o todos, las opciones de
  exportación y cómo comprobar que el proyecto sigue coincidiendo con el XML de git.
- [Importar bloques LAD, FBD y SCL en TIA Portal desde código](import-lad-fbd-scl-blocks.es.md): importación SimaticML,
  archivos fuente SCL, reglas de sobrescritura y la protección contra escrituras sobre datos desactualizados.
- [Compilar un PLC desde código y leer los mensajes de compilación](compile-plc-read-messages.es.md): qué compila cada
  objeto, el árbol de mensajes y el camino de una compilación limpia a una descarga aprobada.
- [Crear dispositivos y configuración de hardware](create-devices-hardware-network.es.md): la CPU, módulos, subred,
  dirección IP y sistema IO, y un proyecto entero descrito en una sola especificación.
- [Conectar un asistente de IA a TIA Portal con MCP](connect-ai-assistant-mcp.es.md): Claude Desktop, Claude Code y otros
  clientes MCP, modo solo lectura y lo que el asistente no puede hacer solo.

## Más documentación

- [Manual de instalación](../INSTALL.es.md)
- [Primeros pasos](../getting-started.es.md)
- [Política de soporte](../../SUPPORT.es.md)

## Empieza la prueba gratuita de 30 días

PLCWare ejecuta estos pasos por ti, o por tu asistente de IA, sobre TIA Portal V21. La prueba dura 30 días, incluye los
permisos (scopes) de Pro, no pide tarjeta y no se renueva. Necesitas TIA Portal V21 con licencia STEP 7 Professional,
que se compra aparte a Siemens.

**[Empezar la prueba gratuita de 30 días](https://plcware.io/es/trial?utm_source=github&utm_medium=guide&utm_campaign=guides)**
· [Descargar la app](https://plcware.io/download)

*TIA Portal, SIMATIC y Siemens son marcas de Siemens AG. PLCWare es un producto independiente para TIA Portal y no
tiene vínculo con Siemens ni cuenta con su respaldo.*
