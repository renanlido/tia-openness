# Conectar um assistente de IA ao TIA Portal por MCP (Claude Desktop, Claude Code e outros clientes)

> Tradução em português. Original em inglês: [connect-ai-assistant-mcp.md](connect-ai-assistant-mcp.md).

Um assistente de IA pode ler e editar um projeto do TIA Portal V21 por MCP. O servidor MCP `tia` é um pequeno pacote npm
que conversa com o app `serve` do PLCWare, o programa Windows que faz o trabalho com o Openness. O assistente prepara o
trabalho; uma pessoa aprova tudo o que chega a um CLP real. Este guia conecta os dois. Vale para o **TIA Portal V21**.

```
[ seu cliente de IA ]  --(MCP/stdio)-->  [ MCP tia (npx) ]  --(HTTP)-->  [ serve (Windows + TIA Portal V21) ]
```

## O que você precisa

- Uma máquina Windows com o **TIA Portal V21** e o **app PLCWare** (`serve`) rodando com uma licença ativada. No app de
  bandeja, aba **License**: cole a sua chave e salve; aba **API**: **Start API** (porta padrão 5000). Pela linha de
  comando: `TIAOpenness.exe serve 5000`.
- **Node.js** (versão 20 ou posterior) na máquina que roda o seu cliente de IA. O MCP roda por `npx`, então não há mais
  nada para instalar.
- Uma configuração, `TIA_API_BASE`, o endereço do `serve`. O MCP **não envia chave**: o que ativa o app é a licença do
  host.

## Claude Code

Um comando, no escopo de usuário (vale para todos os seus projetos):

```bash
claude mcp add tia --scope user -e TIA_API_BASE=http://localhost:5000 -- npx -y @renanlido/tia-openness-mcp
```

Coloque o nome do servidor (`tia`) primeiro. O `-e` aceita vários valores, e o Claude Code 2.1.238 recusou
`--env KEY=VALUE` escrito antes do nome. Confira com `claude mcp list`, que deve mostrar o `tia` como conectado, e com
`/mcp` dentro de uma sessão.

## Claude Desktop

Edite o `claude_desktop_config.json`. No Claude Desktop, **Settings > Developer > Edit Config** abre o arquivo:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

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

Reinicie o app. No Windows, comece com o `npx` simples, como acima. Se o cliente avisar que o servidor falhou ao
iniciar, use a forma com `cmd /c`, que só existe no Windows:

```json
"command": "cmd", "args": ["/c", "npx", "-y", "@renanlido/tia-openness-mcp"]
```

Mantenha uma única entrada `tia`: dois servidores falariam com o mesmo `serve`, que executa uma operação por vez.

## Outros clientes

Codex, Gemini CLI, Cursor, VS Code e Windsurf usam o mesmo comando, `npx -y @renanlido/tia-openness-mcp`, e a mesma
variável `TIA_API_BASE`; só muda o lugar onde cada cliente guarda a configuração. O formato exato de cada um está no
[Manual de instalação](../INSTALL.pt.md).

## Quando o seu cliente de IA está em outra máquina

Um arranjo comum é um editor num Mac e o `serve` numa VM Windows. No lado do Windows, permita o acesso remoto no app de
bandeja (aba **API**, **Allow remote access...**, que reserva a URL e abre a porta no firewall), defina o host como
`0.0.0.0` e inicie a API; pela linha de comando, `TIAOpenness.exe serve 5000 --host 0.0.0.0`. A licença precisa estar
ativada nessa máquina. No lado do cliente, aponte o MCP para a VM:

```bash
export TIA_API_BASE="http://<ip-da-vm>:5000"
```

A licença ativa o servidor; ela não identifica quem o chama. Controle o acesso com um firewall ou uma VPN.

## Confira a conexão

Peça ao assistente para chamar `tia_ping`. Ele responde `{ base, reachable, activated, latencyMs, hint }`:

- `reachable: false`: o endereço, a porta ou o firewall estão errados, ou o `serve` não está rodando.
- `activated: false`: a licença do host está ausente ou é inválida.
- Os dois `true`: o `serve` está acessível e ativado. Isso não é o mesmo que pronto: chame `tia_readiness` para conferir o
  grupo do Windows, o x64 e a instalação do TIA Portal
  ([Configurar o TIA Portal Openness no Windows](openness-setup-windows.pt.md)).

Depois, `tia_status` e `tia_connect` abrem ou anexam um projeto. A primeira conexão de um processo `serve` pode levantar
um aviso de segurança no TIA Portal da máquina Windows, e só uma pessoa pode respondê-lo.

## O que pedir

- "Liste os blocos do PLC_1 e diga quais não estão consistentes." (`tia_plc_blocks`)
- "Exporte o FB_Motor e confira se ele bate com o arquivo no git." (`tia_export_block`, `tia_block_compare`)
- "Escreva um bloco de função SCL que faça X, coloque-o no projeto e compile." (`tia_source_put`, `tia_compile`)
- "Compile o PLC_1 e resuma os erros." (`tia_compile`)

As ferramentas se agrupam pelo que podem alterar: leituras (classe R) não alteram nada; alterações offline (classe M-off)
editam o projeto mas nunca tocam num CLP; algumas ferramentas com trava alcançam o mundo físico.

## O que o assistente não faz sozinho

- **Baixar num CLP.** `tia_download` primeiro devolve um plano e um `planHash` de uso único para uma pessoa revisar; só
  depois que a pessoa aprova ele roda de novo com `approved: true` e o mesmo `planHash`. Se o software mudou nesse
  intervalo, o `serve` recusa com `409 plan_stale`. O assistente nunca aprova.
- **Ficar online, fazer upload de uma estação, varrer a rede.** Cada um é uma trava que exige uma pessoa.
- **Segredos.** Um segredo mestre, uma senha de know-how, uma senha de certificado ou a política de senhas sempre vêm de
  uma pessoa. O assistente nunca inventa uma.
- **Lógica de segurança (F).** Nunca é criada, alterada nem baixada de forma autônoma.
- **Duas coisas ao mesmo tempo.** O `serve` tem um único worker serial. Operações longas (conectar, compilar,
  baixar...) podem responder `status: "running"` com um `jobId`; o assistente então espera com `tia_job_status` em vez de
  repetir a chamada.

## Modo somente leitura

Para experimentar o MCP sem risco de escrita, defina `TIA_MCP_MODE` como `read-only` no `env` do servidor:

```json
"env": { "TIA_API_BASE": "http://localhost:5000", "TIA_MCP_MODE": "read-only" }
```

O MCP então registra só as ferramentas de leitura: nenhuma ferramenta que altere o projeto ou toque num controlador
chega a ser listada. Como `tia_start` e `tia_connect` não são ferramentas de leitura, o assistente não consegue abrir um
projeto nesse modo: o projeto já precisa estar aberto no `serve`.

Isso protege contra o assistente, não contra uma pessoa: vive no MCP, e os escopos da licença no `serve` continuam sendo a
autoridade. Uma versão do MCP anterior ao modo ignora a variável e registra todas as ferramentas, então confira
`npx -y @renanlido/tia-openness-mcp --version` (a opção existe desde a 1.9.2) e confirme no seu cliente que uma
ferramenta de escrita, como `tia_compile`, não aparece.

## Qual plano faz o quê

O Basic lê o projeto, autora offline (blocos, tags, hardware) e compila. O Pro acrescenta baixar num CLP real e ficar
online, sempre atrás das travas humanas acima. O teste de 30 dias inclui os escopos do Pro.

Para um fluxo guiado, de uma especificação até um projeto verificado, o plugin de código aberto
[`tia-harness`](https://github.com/renanlido/tia-harness) para o Claude Code acrescenta skills e subagentes sobre o mesmo
MCP.

## Guias relacionados

- [Configurar o TIA Portal Openness no Windows](openness-setup-windows.pt.md)
- [Compilar um CLP por código e ler as mensagens](compile-plc-read-messages.pt.md)
- [Manual de instalação](../INSTALL.pt.md)
- [Todos os guias](README.pt.md)

## Comece o teste grátis de 30 dias

O PLCWare executa esses passos para você, ou para o seu assistente de IA, no TIA Portal V21. O teste dura 30 dias, inclui
os escopos do Pro, não pede cartão e não se renova. Você precisa do TIA Portal V21 com licença STEP 7 Professional,
comprada à parte da Siemens.

**[Começar o teste grátis de 30 dias](https://plcware.io/pt/trial?utm_source=github&utm_medium=guide&utm_campaign=connect-ai-assistant-mcp)**
· [Baixar o app](https://plcware.io/download)

*TIA Portal, SIMATIC e Siemens são marcas da Siemens AG. O PLCWare é um produto independente para o TIA Portal e não
tem vínculo com a Siemens nem é endossado por ela.*
