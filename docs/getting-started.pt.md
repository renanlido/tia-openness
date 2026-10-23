# Primeiros passos

> Tradução em português. Original em inglês: [getting-started.md](getting-started.md).

Este guia leva você do download a um app PLCWare em execução e com licença, em poucos minutos. Tudo
o que está aqui pode ser feito pela **GUI de bandeja** — sem linha de comando. Os equivalentes em
CLI são mostrados para automação.

```
[ your AI editor / CLI ]  --(MCP)-->  [ tia MCP (npx) ]  --(HTTP)-->  [ serve (this app, Windows+TIA) ]
```

## 1. Pré-requisitos

Na máquina que tem o **TIA Portal V21**:

- **Windows 10/11 (x64)**.
- **.NET Framework 4.8** (o instalador verifica e avisa se estiver ausente).
- **TIA Portal V21 + o componente Openness** instalados. O app carrega os assemblies da Siemens da
  sua instalação local — eles **não** são redistribuídos.
- Seu usuário do Windows deve pertencer ao grupo local **`Siemens TIA Openness`** (o
  instalador/`setup` adiciona você).

> Na **primeira** conexão, o TIA Portal exibe uma única vez um diálogo de segurança/confiança que
> você deve confirmar manualmente. Isso é esperado.

## 2. Baixar e instalar

Na página [**Releases**](https://github.com/renanlido/tia-openness/releases/latest):

- **Um clique (recomendado):** baixe `TIAOpenness-Setup-<version>.exe` e execute. Ele copia o
  app, executa a configuração inicial (grupo, atalho, "Iniciar com o Windows" opcional) e abre a
  tela **Primeiros passos**.
- **Portátil:** baixe `TIAOpenness-app-<version>.zip`, descompacte e execute `TIAOpenness.exe setup`.

## 3. Verificar o ambiente

Abra o app de bandeja PLCWare (atalho **"TIA Openness API"**) → aba **API** → **Verificar ambiente**. Ele
verifica o grupo do Windows, se o processo é x64 e se o TIA Portal V21 + PublicAPI estão presentes.

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

Na GUI: aba **API** → **Iniciar API** (porta padrão **5000**).

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

Aponte o **MCP `tia`** para o seu `serve` em execução. Para o **Claude Code**:

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

Para um fluxo guiado, da especificação ao projeto verificado, instale o plugin
[**tia-harness**](https://github.com/renanlido/tia-harness) do Claude Code.

## Solução de problemas

| Sintoma | Causa provável |
|---|---|
| `403 license_required` em toda chamada | Não há licença válida no host — ative-a (passo 4). |
| `tia_ping` → `reachable:false` | `serve` não está em execução, IP/porta errados ou firewall bloqueando. |
| A API não inicia em `0.0.0.0` | O acesso remoto ainda não foi liberado — use **Permitir acesso remoto…** (passo 5). |
| "Verificar ambiente" falha no grupo | Você não está em `Siemens TIA Openness` — execute `setup` de novo e depois saia e entre na sessão. |
| O diálogo de confiança do TIA continua aparecendo | Confirme-o uma vez, manualmente, na máquina do TIA (esperado na primeira conexão). |

Mais ajuda: **[SUPPORT.pt.md](../SUPPORT.pt.md)**.
