# Soporte

> Traducción al español. Original en inglés: [SUPPORT.md](SUPPORT.md).

Gracias por usar **PLCWare**, la API de automatización para Siemens TIA Portal V21. Así puedes obtener ayuda.

## Antes de contactar con el equipo de soporte

1. **Consulta la [guía Primeros pasos](docs/getting-started.es.md)** y la
   **[configuración del MCP / clientes (docs/INSTALL.es.md)](docs/INSTALL.es.md)**: la mayoría de los
   problemas de configuración están cubiertos allí.
2. **Ejecuta los diagnósticos integrados:**
   - En la GUI de la bandeja del sistema: pestaña **API** → **Check environment** (verifica el grupo de
     Windows, el proceso x64, TIA Portal V21 + PublicAPI).
   - Desde un cliente de IA: llama a **`tia_ping`**. `reachable:false` significa que IP/puerto/firewall/`serve`
     no está disponible; `activated:false` significa que la licencia falta o no es válida en el host;
     ambos `true` significa que todo está listo.
3. **Revisa el [CHANGELOG](CHANGELOG.md)** (en inglés): tu problema puede estar ya corregido en una
   versión más reciente.

## Canales

| Necesidad | Dónde |
|---|---|
| 🐛 **Informe de error** | [Enviar informe de error público](https://github.com/renanlido/tia-openness/issues/new/choose) |
| 💡 **Solicitud de funcionalidad** | [Enviar solicitud pública de funcionalidad](https://github.com/renanlido/tia-openness/issues/new/choose) |
| 💬 **Pregunta / solicitud de licencia** | [Abre un ticket privado de soporte](https://plcware.io/es/support) o escribe a [support@plcware.io](mailto:support@plcware.io) |
| 🔒 **Divulgación de vulnerabilidades** | **No** la divulgues públicamente; envía el informe **de forma privada** a [support@plcware.io](mailto:support@plcware.io). |

El **soporte prioritario** (por correo electrónico, con objetivos de tiempo de respuesta según el nivel)
está incluido en una licencia de pago, y el contacto se entrega junto con tu Activation License.

## Qué incluir en un informe de error

Nos ayuda mucho que incluyas:

- Versión de la aplicación (la etiqueta `app-v*`, que se muestra en la GUI / el instalador).
- Versión de TIA Portal y la CPU de destino (p. ej., S7-1200 1214C, versión de firmware).
- Qué hiciste, qué esperabas y qué ocurrió (con el texto exacto del error / envelope).
- Si usabas la API directamente, mediante el MCP o mediante el plugin harness.
- La salida de **Check environment** / **`tia_ping`**, si es relevante.

## Divulgación de vulnerabilidades

Si crees haber encontrado una vulnerabilidad de seguridad, no la divulgues públicamente: infórmala
**de forma privada** por correo a [support@plcware.io](mailto:support@plcware.io).

## Alcance

Este repositorio da seguimiento a la **aplicación / API de PLCWare** (el producto con licencia).
Para las capas de cliente abiertas:

- **MCP `tia`**: issues en [el repositorio del MCP](https://www.npmjs.com/package/@renanlido/tia-openness-mcp).
- **Plugin `tia-harness`**: issues en [renanlido/tia-harness](https://github.com/renanlido/tia-harness/issues).
