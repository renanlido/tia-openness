# Instalar e usar o MCP `tia` (qualquer cliente)

> Versão em português. Original em inglês: [INSTALL.md](INSTALL.md).

> **Fonte única.** Este é o guia canônico de instalação. Os READMEs apontam para cá — não duplique
> os passos em outro lugar (evita _drift_). Atualize **só aqui**.

O **MCP `tia`** (`@renanlido/tia-openness-mcp`) é um cliente HTTP fino para a API `serve`
(o app Windows que dirige o TIA Portal). O instalador Windows do PLCWare 1.7.1 inclui o runtime para as conexões
gerenciadas pelo app abaixo. As rotas manuais e outras rotas baseadas em npm continuam disponíveis.
A variável **`TIA_API_BASE`** aponta o MCP para o seu `serve`.

```
[ seu editor/CLI com IA ]  --(MCP/stdio)-->  [ tia MCP (incluído ou via npx) ]  --(HTTP)-->  [ serve (Windows+TIA) ]
```

## Pré-requisito (uma vez, no host com TIA)

Suba a API `serve` na máquina Windows que tem o TIA Portal V21 — pela **GUI de bandeja do PLCWare**
(atalho "TIA Openness API" → aba "API" → "Iniciar API") **ou** por linha de comando:

```powershell
TIAOpenness.exe serve 5000              # local
TIAOpenness.exe serve 5000 --host 0.0.0.0   # aceita conexões de outra máquina (ex.: Mac → VM)
```

- **Mesma máquina** que o editor de IA → `TIA_API_BASE=http://localhost:5000`.
- **Editor noutra máquina** (ex.: Mac, com o `serve` numa VM Windows) → `TIA_API_BASE=http://<ip-da-vm>:5000`
  e suba o serve com `--host 0.0.0.0` (e libere a porta no firewall).

> O MCP **não envia chave** — quem ativa o servidor é a **licença** configurada no host (aba "Licença" da
> GUI). Sem o serve ativado, o MCP só consegue diagnosticar conectividade (`tia_ping`).

---

## Rota gerenciada pelo app no Windows (a partir do PLCWare 1.7.1)

Instale o **PLCWare 1.7.1** com `TIAOpenness-Setup-1.7.1.exe` e abra a janela **Conectar seus agentes de IA** por
**Conectar agentes de IA…** na bandeja ou pelos primeiros passos. Instale o agente, confira e clique em **Conectar**.
Essas conexões gerenciadas pelo instalador não exigem Node.js, npm/`npx`, Git no sistema nem acesso ao registro npm:

| Agente | Conexão e habilidades |
|---|---|
| Claude Code | Instala o catálogo local de plugins e o plugin incluídos, com habilidades, auxiliares e o inicializador `tia` embutido. Um plugin já instalado mantém sua configuração. Para trocar um plugin `npx` antigo, use **Desconectar** se o PLCWare o instalou; caso contrário, desinstale-o primeiro no Claude Code. Depois, **Conectar** pelo PLCWare. |
| Claude Desktop | Abre o `.mcpb` incluído somente quando o Windows tem um aplicativo associado; conclua a instalação no Desktop. Caso contrário, grava o runtime embutido nas configurações da versão detectada, incluindo Store/MSIX. **Saia completamente do Desktop pela bandeja antes de Conectar gravar as configurações; fechar a janela não basta.** Reabra-o e use **Atualizar** no PLCWare para verificar. |
| Codex | Grava uma única conexão `tia` embutida e instala o plugin local de habilidades, além dos agentes auxiliares. Usa uma CLI disponível, inclusive a incluída no app desktop; não exige instalar uma CLI separada. Sem uma CLI utilizável, prepara um catálogo pessoal de plugins: feche/reabra o Codex e instale `tia-harness` em **Plugins** seguindo as instruções exibidas. O MCP duplicado do plugin fica desativado. |

**As habilidades do Claude Desktop são uma etapa separada do conector MCP.** Se o plugin do PLCWare no escopo de usuário
já estiver instalado, não há etapa de habilidades. Caso contrário, Conectar prepara **um único ZIP de plugin**, com
habilidades e agentes, mas sem conector MCP nem hooks. Use **Abrir pasta do plugin** para selecionar o ZIP e envie-o no
Desktop: **Personalização → Plugins → Adicionar → Fazer upload de plugin**. Não exige envios por habilidade nem Git;
os agentes usam a conexão `tia` existente. Conectar ou desconectar o Desktop não instala nem remove o plugin do Claude Code.
Se o Desktop reutilizar o plugin de usuário, mantenha o conector `tia` do PLCWare; não ative também o conector do plugin.

Para uma conexão `.mcpb`, reconecte depois de atualizar o PLCWare e conclua a atualização da extensão no Desktop.
Se necessário, desinstale a extensão antiga no Desktop e reconecte. Na rota por arquivo de configurações, saia
completamente do Desktop antes de reconectar, reabra e verifique. Cumpra as etapas manuais restantes;
**Conectar** sozinho não as verifica.

**Rotas que ainda usam npm/`npx`:** o plugin público do Codex CLI instalado de forma independente (não o plugin local
gerenciado pelo app), a extensão do Gemini CLI, os exemplos manuais abaixo, versões anteriores do app e clientes MCP
em Mac/Linux ou num host remoto sem os arquivos do instalador Windows. Exigem Node.js e acesso ao pacote npm
(acesso ao registro no primeiro uso ou quando o pacote não está em cache). A rota Windows embutida não garante
funcionamento offline para a instalação do agente, login ou serviço de IA.

## Configuração manual ou versões anteriores no Windows: use `cmd /c npx`

Em configurações pela linha de comando/manual e em versões do PLCWare anteriores à 1.7.1, vários clientes no Windows
iniciam processos **sem shell**, e o `npx` (que é `npx.cmd`) pode falhar com `spawn npx ENOENT`. Onde isso acontecer,
troque:

```jsonc
"command": "npx", "args": ["-y", "@renanlido/tia-openness-mcp"]
```

por:

```jsonc
"command": "cmd", "args": ["/c", "npx", "-y", "@renanlido/tia-openness-mcp"]
```

No **macOS/Linux** use a forma simples (`npx` direto) — **não** ponha `cmd /c` lá.

---

Os exemplos por cliente abaixo são de **configuração manual só do MCP**, não da instalação de plugin pelo app acima.
Não adicione uma segunda entrada `tia` por cima de uma conexão existente por plugin ou extensão.

## Claude Code

**Um comando** (escopo de usuário — vale pra todos os projetos):

```bash
claude mcp add --scope user --env TIA_API_BASE=http://localhost:5000 tia -- npx -y @renanlido/tia-openness-mcp
```

Ou por **`.mcp.json`** na raiz do projeto (escopo de projeto, versionável):

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

Confira: `claude mcp list` (deve listar `tia`) · numa sessão, `/mcp`.

## Claude Desktop

Para configuração manual, abra `claude_desktop_config.json` por Settings → Developer → **Edit Config**,
depois **saia completamente do Desktop antes de editar**:

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

Na configuração manual por JSON no **Windows**, use a forma `cmd /c` acima. Reabra o Desktop depois de salvar e verifique
a conexão. A rota gerenciada pelo instalador está descrita acima.

## Codex (CLI + extensão de IDE)

Config em `~/.codex/config.toml` (a extensão de IDE compartilha o mesmo arquivo). Note: **env num
sub-bloco** `[mcp_servers.tia.env]`.

```toml
[mcp_servers.tia]
command = "npx"
args = ["-y", "@renanlido/tia-openness-mcp"]

[mcp_servers.tia.env]
TIA_API_BASE = "http://localhost:5000"
```

Ou pela CLI:

```bash
codex mcp add tia --env TIA_API_BASE=http://localhost:5000 -- npx -y @renanlido/tia-openness-mcp
```

Confira numa sessão com `/mcp`. No Windows, use `command = "cmd"` e
`args = ["/c", "npx", "-y", "@renanlido/tia-openness-mcp"]`.

## Gemini CLI

Config em `~/.gemini/settings.json` (usuário) ou `<projeto>/.gemini/settings.json` (projeto):

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

Ou pela CLI (`-s user` = global; default é projeto):

```bash
gemini mcp add -s user -e TIA_API_BASE=http://localhost:5000 tia npx -y @renanlido/tia-openness-mcp
```

## Cursor

`.cursor/mcp.json` (projeto) ou `~/.cursor/mcp.json` (global) — mesmo formato do Claude (`mcpServers`):

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

⚠️ **Diferente dos outros:** a chave raiz é **`servers`** (não `mcpServers`) e use **`"type": "stdio"`**.
Arquivo `.vscode/mcp.json` (workspace) — ou Command Palette → `MCP: Open User Configuration`:

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

As tools só aparecem no Copilot em **Agent mode**. CLI alternativa: `code --add-mcp "{...}"`.

## Windsurf

Arquivo `~/.codeium/windsurf/mcp_config.json` (sem escopo de projeto), formato `mcpServers`:

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

## Resumo das diferenças (o que pega)

| Cliente | Arquivo | Chave raiz | `type:"stdio"`? | CLI p/ adicionar |
|---|---|---|---|---|
| Claude Code | `.mcp.json` (projeto) / `~/.claude.json` (user, via CLI) | `mcpServers` | opcional | `claude mcp add … -- npx …` |
| Claude Desktop | `claude_desktop_config.json` (use **Edit Config** para o caminho da versão detectada acima) | `mcpServers` | opcional | — (edite JSON após sair completamente) |
| Codex | `~/.codex/config.toml` | `[mcp_servers.tia]` (TOML) | — | `codex mcp add …` |
| Gemini CLI | `~/.gemini/settings.json` | `mcpServers` | — | `gemini mcp add …` |
| Cursor | `.cursor/mcp.json` / `~/.cursor/mcp.json` | `mcpServers` | — | — (JSON/UI) |
| **VS Code** | `.vscode/mcp.json` | **`servers`** | **sim** | `code --add-mcp "{…}"` |
| Windsurf | `~/.codeium/windsurf/mcp_config.json` | `mcpServers` | — | — (JSON/UI) |

**Regras da rota npm manual:** (1) no **Windows**, `cmd /c npx`; (2) no **VS Code**, chave `servers` + `type:"stdio"`;
(3) defina **`TIA_API_BASE`** apontando pro `serve`; (4) reinicie o cliente após editar o arquivo.

## Acesso remoto (outra máquina → o host do serve)

Por padrão o serve escuta só em **localhost** (seguro, nada exposto). Para alcançá-lo de **outra máquina**
(ex.: o MCP no seu **Mac** → o serve numa **VM Windows**), o Windows precisa de uma **reserva HTTP.sys**
(`urlacl`) + a **porta liberada no firewall** — senão o bind em `0.0.0.0`/`+` falha com *Acesso negado*.

**Pela GUI (1 clique — recomendado):** aba **"API"** → botão **"Permitir acesso remoto…"** → confirme o
**UAC** (admin) e, opcionalmente, **restrinja ao IP de origem** (ex.: o IP do seu Mac). Depois ponha
**Host = `0.0.0.0`** e **"Iniciar API"**. *(Se você tentar iniciar com Host remoto sem liberar, o app
detecta o erro e já oferece liberar.)*

**Por linha de comando** (PowerShell **como administrador**):

```powershell
TIAOpenness.exe setup-remote 5000 --allow 192.168.68.230   # libera SÓ p/ esse IP de origem (recomendado)
TIAOpenness.exe setup-remote 5000                          # libera p/ a LAN toda
TIAOpenness.exe setup-remote 5000 --remove                 # desfaz (volta a só-localhost)
```

> **Segurança:** liberar acesso remoto expõe o serve à rede. O serve continua exigindo **licença ativa**,
> mas **não autentica clientes individuais** — quem pode conectar é controlado por **firewall/VPN**. Prefira
> **restringir ao IP** de origem; só libere a LAN toda em rede confiável. No Mac, aponte
> `TIA_API_BASE=http://<ip-da-vm>:5000`.

## Diagnóstico

A primeira tool a chamar é **`tia_ping`**: `reachable:false` → IP/porta/firewall/serve desligado;
`activated:false` → licença ausente/inválida no host; ambos `true` → pronto pra usar.
