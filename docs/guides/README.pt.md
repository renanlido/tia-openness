# Guias para o TIA Portal Openness

> Tradução em português. Original em inglês: [README.md](README.md).

Respostas práticas para as dúvidas que aparecem quando você automatiza o **TIA Portal V21** com o Openness. Cada guia
mostra a rota do Openness puro em C# e a rota do PLCWare (API HTTP e ferramentas MCP para um assistente de IA), com as
travas humanas no lugar: um download para um CLP real sempre espera a aprovação de uma pessoa.

## Os guias

- [Configurar o TIA Portal Openness no Windows](openness-setup-windows.pt.md): o grupo de usuários Siemens TIA Openness,
  o aviso da primeira conexão, as bibliotecas V21 e como um projeto é aberto.
- [Exportar um bloco do CLP para XML SimaticML](export-plc-block-simaticml.pt.md): um bloco ou todos, as opções de
  exportação e como provar que o projeto ainda confere com o XML do git.
- [Importar blocos LAD, FBD e SCL no TIA Portal por código](import-lad-fbd-scl-blocks.pt.md): importação SimaticML,
  arquivos-fonte SCL, regras de sobrescrita e a trava contra escrita desatualizada.
- [Compilar um CLP por código e ler as mensagens de compilação](compile-plc-read-messages.pt.md): o que cada objeto
  compila, a árvore de mensagens e o caminho de uma compilação limpa até um download aprovado.
- [Criar dispositivos e configuração de hardware](create-devices-hardware-network.pt.md): a CPU, módulos, sub-rede,
  endereço IP e sistema IO, e um projeto inteiro descrito numa única especificação.
- [Conectar um assistente de IA ao TIA Portal por MCP](connect-ai-assistant-mcp.pt.md): Claude Desktop, Claude Code e
  outros clientes MCP, modo somente leitura e o que o assistente não faz sozinho.

## Mais documentação

- [Manual de instalação](../INSTALL.pt.md)
- [Primeiros passos](../getting-started.pt.md)
- [Política de suporte](../../SUPPORT.pt.md)

## Comece o teste grátis de 30 dias

O PLCWare executa esses passos para você, ou para o seu assistente de IA, no TIA Portal V21. O teste dura 30 dias, inclui
os escopos do Pro, não pede cartão e não se renova. Você precisa do TIA Portal V21 com licença STEP 7 Professional,
comprada à parte da Siemens.

**[Começar o teste grátis de 30 dias](https://plcware.io/pt/trial?utm_source=github&utm_medium=guide&utm_campaign=guides)**
· [Baixar o app](https://plcware.io/download)

*TIA Portal, SIMATIC e Siemens são marcas da Siemens AG. O PLCWare é um produto independente para o TIA Portal e não
tem vínculo com a Siemens nem é endossado por ela.*
