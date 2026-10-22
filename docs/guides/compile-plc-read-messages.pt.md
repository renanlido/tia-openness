# Compilar um CLP por código e ler as mensagens de compilação

> Tradução em português. Original em inglês: [compile-plc-read-messages.md](compile-plc-read-messages.md).

Compilar é a verificação que diz se a lógica gerada ou importada está boa. Com o TIA Portal Openness você compila a
partir do seu programa e lê o resultado como objetos, em vez de olhar a janela Inspetor. Este guia faz isso em C#, depois
pela API HTTP e pelas ferramentas MCP do PLCWare, e termina mostrando como uma compilação limpa leva ao download. Vale
para o **TIA Portal V21**.

## Antes de começar

- Um aplicativo Openness conectado ao TIA Portal V21, com um projeto aberto
  ([Configurar o TIA Portal Openness no Windows](openness-setup-windows.pt.md)).
- Todos os dispositivos precisam estar **offline** durante a compilação.
- Se uma senha protege o programa de segurança, você precisa fazer logon no programa de segurança para compilar as
  alterações de software. Caso contrário, a compilação é cancelada e uma exceção é lançada.

## Compilar com o Openness (C#)

A compilação passa pelo serviço `ICompilable`. O que é compilado depende do objeto que você pede:

| Objeto | O que compila |
|---|---|
| `Device` (a estação) | Hardware e software |
| `DeviceItem` (a CPU) | Só o hardware |
| `PlcSoftware` | Só o programa do CLP |
| `CodeBlock`, `DataBlock`, `PlcType` | Aquele objeto |
| `HmiTarget` | O software da IHM |

```csharp
using System;
using Siemens.Engineering.Compiler;
using Siemens.Engineering.SW;

static bool Compile(PlcSoftware plcSoftware)
{
    ICompilable compiler = plcSoftware.GetService<ICompilable>();
    CompilerResult result = compiler.Compile();

    Console.WriteLine($"State: {result.State}, {result.ErrorCount} errors, {result.WarningCount} warnings");
    Print(result.Messages, "");
    return result.State != CompilerResultState.Error;
}

static void Print(CompilerResultMessageComposition messages, string indent)
{
    foreach (CompilerResultMessage message in messages)
    {
        Console.WriteLine($"{indent}{message.State} {message.Path}: {message.Description}");
        Print(message.Messages, indent + "  ");
    }
}
```

Cada mensagem traz `Path`, `DateTime` (sempre em UTC; use `ToLocalTime()` para mostrar a hora local), `State`,
`Description`, `WarningCount`, `ErrorCount` e suas próprias `Messages` filhas, então o resultado é uma árvore, não uma
lista plana.

Compilar só o `DeviceItem` da CPU confere o hardware e pode parecer limpo mesmo com erros reais no programa. Para cobrir
os dois, compile o `Device` (ou o `DeviceItem` e o `PlcSoftware`).

## Compilar com o PLCWare

```powershell
$r = Invoke-RestMethod -Method Post "http://localhost:5000/plcs/PLC_1/compile" `
  -ContentType "application/json" -Body '{}'
"{0}: {1} errors, {2} warnings" -f $r.state, $r.errors, $r.warnings
```

O PLCWare compila hardware e software e agrega o resultado. Uma resposta resumida:

```json
{
  "state": "Error", "errors": 1, "warnings": 0,
  "messages": [
    { "state": "Error", "path": "PLC_1/FB_Motor/Network 3", "dateTime": "2026-09-25T12:00:00Z",
      "description": "...", "children": [] }
  ],
  "sections": [ { "target": "hardware" }, { "target": "software" } ],
  "blockChanges": [ { "name": "FB_Motor_Instance", "detail": "InstanceDB#8", "change": "modified", "parts": ["Interface"] } ]
}
```

- `state` é o pior estado encontrado (`Error`, depois `Warning`, `Information` e `Success`). `errors` e `warnings` são
  totais, e `messages` é a árvore inteira, cada mensagem com seu `path` e seu `dateTime`.
- `sections` detalha o hardware e o software separadamente.
- `blockChanges` lista os blocos que a compilação alterou. Um DB de instância `modified` significa que a compilação o
  regenerou depois que a interface do FB mudou: exporte-o e versione-o, para que o que você versiona confira com o
  projeto.
- Só `Error` impede o download. Avisos não.

A ferramenta MCP é `tia_compile`, com `{ "plc": "PLC_1" }`. Ela achata a árvore de mensagens e acrescenta um resumo
`verification` (`compiled`, `errors`, `warnings`) e `nextHints`. `tia_block_compile` compila um único bloco (app PLCWare
1.7.0 ou posterior); uma compilação limpa de bloco não é a verificação que antecede um download, então compile o CLP
inteiro para isso.

A compilação pode demorar num projeto grande. Quando a resposta é `status: "running"` com um `jobId`, a compilação ainda
está rodando: chame `tia_job_status` com esse `jobId` até o resultado chegar, e não repita a chamada original.

## Quando a compilação tem erros

- Comece pelos primeiros erros: os demais costumam ser consequência. Use o `path` de cada mensagem para achar o bloco e
  a rede.
- Mudar a interface de um FB deixa o DB de instância dele inconsistente até uma compilação regenerá-lo. Compile de novo
  antes de começar a apagar qualquer coisa.
- Uma CPU criada pelo Openness pode falhar na primeira compilação com erros de proteção até que as configurações de
  proteção sejam definidas; veja [Criar dispositivos e hardware](create-devices-hardware-network.pt.md).
- Alguns erros são configurações que o Openness não consegue alterar, como a licença de runtime do OPC UA. Isso fica
  para uma pessoa, na janela do TIA Portal. No MCP, `tia_guide` com `{ "topic": "gui-gates" }` lista esses casos com os
  passos exatos.

## De uma compilação limpa ao download

Uma compilação com zero erros é a precondição para baixar num CLP real, e o download continua sendo uma decisão humana.
`tia_download` funciona em dois passos: primeiro com `dryRun: true`, que pede ao app `serve` um plano verificado
(compilação limpa, interface PG/PC encontrada, impressão digital do software) e devolve um `planHash` de uso único; depois,
quando uma pessoa leu e aprovou esse plano, de novo com `approved: true` e o mesmo `planHash`. Se o software mudou depois
do plano, o download é recusado com `409 plan_stale`. Planejar um download exige o escopo Pro, que o teste inclui; o
Basic lê, autora e compila, mas não consegue planejar um.

## Guias relacionados

- [Importar blocos LAD, FBD e SCL no TIA Portal por código](import-lad-fbd-scl-blocks.pt.md)
- [Criar dispositivos e hardware com o TIA Portal Openness](create-devices-hardware-network.pt.md)
- [Conectar um assistente de IA ao TIA Portal por MCP](connect-ai-assistant-mcp.pt.md)
- [Todos os guias](README.pt.md)

## Comece o teste grátis de 30 dias

O PLCWare executa esses passos para você, ou para o seu assistente de IA, no TIA Portal V21. O teste dura 30 dias, inclui
os escopos do Pro, não pede cartão e não se renova. Você precisa do TIA Portal V21 com licença STEP 7 Professional,
comprada à parte da Siemens.

**[Começar o teste grátis de 30 dias](https://plcware.io/pt/trial?utm_source=github&utm_medium=guide&utm_campaign=compile-plc-read-messages)**
· [Baixar o app](https://plcware.io/download)

*TIA Portal, SIMATIC e Siemens são marcas da Siemens AG. O PLCWare é um produto independente para o TIA Portal e não
tem vínculo com a Siemens nem é endossado por ela.*
