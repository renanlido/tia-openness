# Primeiros passos

> Tradução em português. Original em inglês: [getting-started.md](getting-started.md).

Este guia leva você do download ao app PLCWare Windows em execução e ativado pela GUI de bandeja.
Para conectar os agentes, execute `npx plcware-setup` no terminal do computador deles (passo 6).
Os equivalentes em CLI e as rotas manuais avançadas continuam disponíveis.

```
[ your AI editor / CLI ]  --(MCP)-->  [ tia MCP (incluído ou npx) ]  --(HTTP)-->  [ serve (this app, Windows+TIA) ]
```

## 1. Pré-requisitos

Na máquina que tem o **TIA Portal V21**:

- **Windows 10/11 (x64)**.
- **.NET Framework 4.8** (o instalador interrompe se estiver ausente).
- **TIA Portal V21 + o componente Openness** instalados. O app carrega os assemblies da Siemens da
  sua instalação local — eles **não** são redistribuídos.
- Seu usuário do Windows deve pertencer ao grupo local **`Siemens TIA Openness`** (o
  instalador/`setup` adiciona você).

> Se o TIA Portal mostrar um diálogo de segurança/confiança, confirme manualmente nessa máquina. Uma instalação
> confiável pelo instalador pode evitá-lo; cópias portáteis ainda podem exigi-lo. Os detalhes de prontidão mostram a lista de permissões.

## 2. Baixar e instalar

Na página [**Releases**](https://github.com/renanlido/tia-openness/releases/latest):

- **Instalador (recomendado):** baixe `TIAOpenness-Setup-1.7.1.exe` para o PLCWare 1.7.1 stable.
  Ele copia o app e os arquivos de agentes incluídos e configura o ambiente do usuário original do Windows.
  Se as permissões do grupo exigirem um novo login, a página final oferece **Reiniciar agora / Reiniciar depois** e
  **não** abre os primeiros passos imediatamente. Salve seu trabalho antes de reiniciar.
  Sem reinício pendente, **Ver os primeiros passos** vem marcado em instalações novas e desmarcado nas atualizações.
- **Portátil:** baixe `TIAOpenness-app-v1.7.1.zip`, descompacte e execute `TIAOpenness.exe setup`.
  A conexão sem Node no sistema exige os arquivos do instalador; o ZIP do app não é equivalente.

A janela de primeiros passos verifica o ambiente e tenta iniciar a API automaticamente, com ativação de licença e
conexão de agentes nas etapas principais e verificações técnicas em **Detalhes**. No próximo login após o reinício
solicitado, só abre se a configuração ainda precisar de atenção; se estiver completa, mostra uma notificação curta de
prontidão. As próximas inicializações ficam silenciosas. Reabra a lista pelo menu da bandeja ou pelo atalho
**Próximos passos** do menu Iniciar.

## 3. Verificar o ambiente

Para verificar manualmente, abra o app de bandeja PLCWare (atalho **"TIA Openness API"**) → aba **API** →
**Verificar ambiente**. Ele verifica o grupo do Windows, se o processo é x64 e se TIA Portal V21 + PublicAPI estão presentes.
Se a conta já pertence a `Siemens TIA Openness`, mas o token do login atual está desatualizado, saia/entre na sessão ou
reinicie; não repita a adição do usuário. A ausência de associação ao grupo exige configuração elevada.

Equivalente em CLI:

```powershell
TIAOpenness.exe check
```

## 4. Ativar sua licença

O app é **gratuito para baixar, mas exige uma licença para executar** — sem ela, todo endpoint,
exceto `GET /health`, retorna `403 license_required`.

Na GUI: aba **Licença** → cole sua chave da licença de ativação (Activation License) → **Salvar**
(ela é armazenada criptografada com o DPAPI do Windows). Ainda não tem uma? **[Comece o teste grátis de 30 dias](https://plcware.io/pt/trial?utm_source=github&utm_medium=docs&utm_campaign=getting-started)**:
é autoatendimento, inclui os escopos do Pro e não pede cartão.

## 5. Iniciar a API

A janela de primeiros passos inicia a API automaticamente. Se não estiver escutando, use **API** → **Iniciar API**
(porta padrão **5000**) e confira o erro informado.

Equivalente em CLI:

```powershell
TIAOpenness.exe serve 5000
```

Verifique se está no ar (este endpoint não exige ativação):

```powershell
Invoke-RestMethod http://localhost:5000/health
```

### Acesso remoto (opcional)

Por padrão, a API escuta apenas em **localhost** (nada é exposto). Para acessá-la de outra máquina
(por exemplo, um cliente de IA num **Mac** → o `serve` numa **VM Windows**), use a aba **API** →
**Permitir acesso remoto…** (UAC; é possível restringir a um IP de origem), depois defina
**Host = `0.0.0.0`** e inicie.

Equivalente em CLI (execute como administrador):

```powershell
TIAOpenness.exe setup-remote 5000 --allow 192.168.x.y   # allow only that source IP (recommended)
```

> Liberar o acesso remoto expõe a API à rede. O `serve` continua exigindo uma licença ativa, mas
> **não** autentica clientes individuais — controle o acesso com firewall / VPN.

## 6. Conectar um assistente de IA (opcional)

Instale o **PLCWare (app Windows)** na máquina com TIA Portal, ative-o e inicie a API. No computador dos agentes
(Windows, macOS ou Linux), instale Node.js `^20.12.0 || >=21.7.0` (LTS atual recomendado) e execute:

```sh
npx plcware-setup
```

Sem argumentos, no terminal, selecione os agentes detectados, os componentes compatíveis de cada agente e as habilidades.
Claude Code, Codex e Gemini CLI recebem o plugin/extensão oficial **renanlido/tia-harness**; os demais recebem somente
os componentes MCP, habilidades e subagentes selecionados e compatíveis. É um único harness, não uma segunda cópia.
Ao selecionar MCP, informe o endereço da API (`http://localhost:5000` já vem preenchido; use o endereço do host/VM Windows
para clientes remotos) e o modo completo/somente leitura. Confira a prévia e confirme uma vez. Instalar só habilidades
não exige perguntas da API. O setup não pede chave de ativação: ative o app Windows. A confiança na fonte continua sendo sua decisão.

Sem terminal ou em CI, o comando sem argumentos mostra a ajuda. Reinicie o agente, confira o MCP e peça `tia_ping`.
`npx plcware-setup plan` mostra a prévia sem gravar; `npx plcware-setup uninstall --yes` remove somente alterações
registradas como próprias. Plugins instalados por outra origem ficam intactos. Use uma origem de instalação por agente.

## Avançado: conexões manuais e gerenciadas pelo app

As rotas por agente abaixo continuam disponíveis para configuração avançada; não duplique a conexão `tia`.


No Windows gerenciado pelo instalador do PLCWare 1.7.1, abra **Conectar seus agentes de IA**, confira e conecte Claude Code,
Claude Desktop ou Codex sem Node.js/npm nem Git no sistema. Cumpra as etapas manuais restantes: habilidades do Desktop
podem exigir o envio de um ZIP de plugin, e Codex só com o app desktop pode exigir uma instalação em **Plugins**.
Veja **[docs/INSTALL.pt.md](INSTALL.pt.md)** para a rota `.mcpb`/MSIX, a exigência de sair completamente, habilidades,
auxiliares e as rotas que ainda usam npm/`npx`.

Como **alternativa manual só do MCP**, não como adição ao plugin gerenciado pelo app, aponte `tia` para o `serve` em execução:

```bash
claude mcp add --transport stdio --env TIA_API_BASE=http://localhost:5000 --scope user tia -- npx -y @renanlido/tia-openness-mcp
```

Use o IP da VM/host em `TIA_API_BASE` se o `serve` rodar em outro lugar. Os demais clientes (Claude
Desktop, Codex, Gemini CLI, Cursor, VS Code, Windsurf) e a pegadinha do `cmd /c npx` no Windows
estão em **[docs/INSTALL.pt.md](INSTALL.pt.md)**.

A primeira tool a chamar é **`tia_ping`**:

- `reachable:false` → IP / porta / firewall / `serve` desligado.
- `activated:false` → licença ausente ou inválida no host.
- ambos `true` → você está pronto.

O plugin do Claude Code gerenciado pelo app já inclui o fluxo da especificação ao projeto verificado do
[**tia-harness**](https://github.com/renanlido/tia-harness); não instale um segundo MCP.

## Solução de problemas

| Sintoma | Causa provável |
|---|---|
| `403 license_required` em toda chamada | Não há licença válida no host — ative-a (passo 4). |
| `tia_ping` → `reachable:false` | `serve` não está em execução, IP/porta errados ou firewall bloqueando. |
| A API não inicia em `0.0.0.0` | O acesso remoto ainda não foi liberado — use **Permitir acesso remoto…** (passo 5). |
| "Verificar ambiente" falha no grupo | Sem associação: execute `setup` elevado. Já adicionado, mas token desatualizado: saia/entre na sessão ou reinicie, sem repetir a adição. |
| O diálogo de confiança do TIA aparece | Confirme manualmente na máquina do TIA; se repetir, confira os detalhes de prontidão da lista de permissões. |

Mais ajuda: **[SUPPORT.pt.md](../SUPPORT.pt.md)**.
