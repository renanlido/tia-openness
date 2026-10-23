# Suporte

> Tradução em português. Original em inglês: [SUPPORT.md](SUPPORT.md).

Obrigado por usar o **PLCWare**, a API de automação para Siemens TIA Portal V21. Veja como obter ajuda.

## Antes de falar com o suporte

1. **Consulte o [guia Primeiros passos](docs/getting-started.pt.md)** e a
   **[configuração do MCP / clientes (docs/INSTALL.pt.md)](docs/INSTALL.pt.md)** — a maioria dos
   problemas de configuração está coberta ali.
2. **Execute os diagnósticos integrados:**
   - Na GUI de bandeja: aba **API** → **Verificar ambiente** (verifica o grupo do Windows, o processo
     x64, o TIA Portal V21 + PublicAPI).
   - A partir de um cliente de IA: chame **`tia_ping`** — `reachable:false` significa que
     IP/porta/firewall/`serve` está fora do ar; `activated:false` significa que a licença está
     ausente/inválida no host; ambos `true` significa que você está pronto.
3. **Consulte o [CHANGELOG](CHANGELOG.md)** (em inglês) — seu problema pode já ter sido corrigido
   numa versão mais recente.

## Canais

| Necessidade | Onde |
|---|---|
| 🐛 **Relato de bug** | [Enviar relato público de bug](https://github.com/renanlido/tia-openness/issues/new/choose) |
| 💡 **Solicitação de funcionalidade** | [Enviar solicitação pública de funcionalidade](https://github.com/renanlido/tia-openness/issues/new/choose) |
| 💬 **Pergunta / solicitação de licença** | [Abra um chamado privado de suporte](https://plcware.io/pt/support) ou escreva para [support@plcware.io](mailto:support@plcware.io) |
| 🔒 **Divulgação de vulnerabilidade** | **Não** publique; envie o relato **em particular** para [support@plcware.io](mailto:support@plcware.io). |

O **suporte prioritário** (por e-mail, com metas de tempo de resposta por nível) está incluído em uma
licença paga, e o contato é entregue junto com a sua Activation License.

## O que incluir em um relato de bug

Ajuda muito se você incluir:

- Versão do app (a tag `app-v*`, exibida na GUI / no instalador).
- Versão do TIA Portal e a CPU de destino (ex.: S7-1200 1214C, versão de firmware).
- O que você fez, o que esperava e o que aconteceu (com o texto exato do erro / envelope).
- Se você estava usando a API diretamente, via MCP ou via o plugin harness.
- A saída de **Verificar ambiente** / **`tia_ping`**, se for relevante.

## Divulgação de vulnerabilidades

Se você acredita ter encontrado uma vulnerabilidade de segurança, não a divulgue publicamente — relate-a
**em particular** por e-mail para [support@plcware.io](mailto:support@plcware.io).

## Escopo

Este repositório acompanha o **app / API PLCWare** (o produto licenciado). Para as camadas de cliente abertas:

- **MCP `tia`** — issues em [o repositório do MCP](https://www.npmjs.com/package/@renanlido/tia-openness-mcp).
- **Plugin `tia-harness`** — issues em [renanlido/tia-harness](https://github.com/renanlido/tia-harness/issues).
