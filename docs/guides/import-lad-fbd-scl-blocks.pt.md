# Importar blocos LAD, FBD e SCL no TIA Portal por código

> Tradução em português. Original em inglês: [import-lad-fbd-scl-blocks.md](import-lad-fbd-scl-blocks.md).

O Openness consegue criar blocos num projeto a partir de arquivos: XML SimaticML para qualquer linguagem (LAD, FBD,
GRAPH, SCL ou STL) e arquivos-fonte em texto para SCL e STL. Este guia mostra as duas rotas em C# e depois o mesmo
trabalho pela API HTTP e pelas ferramentas MCP do PLCWare. Vale para o **TIA Portal V21**.

## Escolha a rota

| Você tem | Openness | Ferramenta do PLCWare |
|---|---|---|
| Lógica LAD, FBD ou GRAPH, ou qualquer bloco em XML | Importação SimaticML | `tia_import_xml` (`POST /plcs/{plc}/import`) |
| SCL em texto | Fonte externa (`.scl`) e depois gerar os blocos | `tia_source_put` (`POST /plcs/{plc}/source`) |
| STL em texto | Fonte externa (`.awl`) e depois gerar os blocos | Não a `tia_source_put`, que só escreve SCL: importe o bloco como SimaticML com `tia_import_xml` |
| Um tipo de dados de usuário (UDT) | Importação XML do tipo | `tia_types_import` (`POST /plcs/{plc}/types/import`) |

LAD, FBD e GRAPH não têm fonte em texto, então as ferramentas do PLCWare não desenham redes novas do zero. O fluxo
usual é um modelo: alguém desenha o bloco uma vez no TIA Portal, você o exporta
([Exportar um bloco do CLP para XML SimaticML](export-plc-block-simaticml.pt.md)), muda nomes, tags e constantes no XML
e importa quantas vezes precisar. Com SCL é diferente: é texto puro, então dá para gerá-lo do começo ao fim.

## Antes de começar

- Um aplicativo Openness conectado ao TIA Portal V21, com um projeto aberto
  ([Configurar o TIA Portal Openness no Windows](openness-setup-windows.pt.md)).
- O CLP **não pode estar online**.
- Importe os UDTs **antes** dos blocos que os usam.

## Importar SimaticML com o Openness (C#)

```csharp
using System.Collections.Generic;
using System.IO;
using Siemens.Engineering;
using Siemens.Engineering.SW;
using Siemens.Engineering.SW.Blocks;

static void ImportBlocks(PlcSoftware plcSoftware)
{
    IList<PlcBlock> blocks = plcSoftware.BlockGroup.Blocks.Import(
        new FileInfo(@"D:\Blocks\FB_Motor.xml"), ImportOptions.Override);
}
```

- `ImportOptions.None` importa sem sobrescrever: se um objeto do arquivo já existe, a importação é interrompida e uma
  exceção é lançada.
- `ImportOptions.Override` apaga o objeto existente antes da importação e o recria. Se o objeto existente e o novo não
  estiverem no mesmo grupo, nada é sobrescrito e a importação é cancelada com uma exceção.

O que a importação faz, segundo a Siemens:

- O XML pode conter menos dados do que o bloco no projeto, por exemplo menos parâmetros.
- Informações redundantes, como as de chamada, precisam ser idênticas no projeto e no arquivo, senão uma exceção é
  lançada.
- Os dados importados podem ficar inconsistentes: compile depois.
- Atributos marcados com `ReadOnly=True` e `Informative=True` não são importados.
- DBs de instância ausentes não são criados automaticamente.
- Sem número de bloco no arquivo, o número é atribuído automaticamente. Um bloco novo sem versão recebe "0.1".
- Todos os objetos raiz de um arquivo precisam ser do mesmo tipo. Se um deles for inválido, nada do arquivo é importado.
- O arquivo precisa ser XML bem formado. Um erro de sintaxe ou de estrutura cancela a importação e volta na exceção.

## Importar um arquivo-fonte SCL com o Openness (C#)

```csharp
using System.Text;
using Siemens.Engineering.SW.ExternalSources;

static void ImportScl(PlcSoftware plcSoftware, string sclText)
{
    string path = @"D:\Sources\FB_Motor.scl";
    File.WriteAllText(path, sclText, new UTF8Encoding(true));

    PlcExternalSource source =
        plcSoftware.ExternalSourceGroup.ExternalSources.CreateFromFile("FB_Motor", path);
    source.GenerateBlocksFromSource();
}
```

- Os arquivos-fonte precisam ser `.awl` (STL), `.scl`, `.db` ou `.udt`. Qualquer outra extensão lança exceção.
- Grave o arquivo em UTF-8 **com BOM** quando ele tiver caracteres especiais.
- Blocos existentes com o mesmo nome são sobrescritos.
- Se a geração falhar, uma exceção traz as mensagens de erro e o projeto volta ao estado anterior à chamada.
  `GenerateBlocksFromSource(GenerateBlockOptions.KeepOnError)` mantém o que foi gerado e não lança nada: confira cada
  bloco gerado compilando-o.

## Importar com o PLCWare

### SCL

```powershell
$body = @{ name = "MyLogic"; code = (Get-Content .\FB_Motor.scl -Raw); compile = $true } | ConvertTo-Json
Invoke-RestMethod -Method Post "http://localhost:5000/plcs/PLC_1/source" `
  -ContentType "application/json" -Body $body
```

A resposta traz `generatedOrUpdated` (todo bloco que a fonte criou ou regenerou), `sourceChanges`, `blocks` e, com
`compile: true`, o resultado da compilação. O TIA Portal regenera um bloco mesmo quando o texto é idêntico, então um
bloco que volta em `generatedOrUpdated` precisa de compilação. A ferramenta MCP é `tia_source_put`, com
`{ "plc": "PLC_1", "name": "MyLogic", "code": "...", "compile": true }`. Um erro de sintaxe SCL aparece aqui, na hora de
gerar os blocos.

### LAD, FBD, GRAPH e qualquer outro bloco em XML

```powershell
$body = @{ xml = (Get-Content .\FB_Motor.xml -Raw); override = $true } | ConvertTo-Json
Invoke-RestMethod -Method Post "http://localhost:5000/plcs/PLC_1/import" `
  -ContentType "application/json" -Body $body
```

Envie o conteúdo em `xml`. Use `path` só para um arquivo que já esteja na máquina onde o `serve` roda. A resposta traz
`imported` e, para cada bloco, `type`, `number`, `created`, `interfaceChanged` e `affectedInstanceDbs`. Os blocos
importados voltam inconsistentes, e quando a interface de um FB mudou, a próxima compilação regenera os DBs de
instância dele. A ferramenta MCP é `tia_import_xml`; a irmã para UDTs é `tia_types_import`.

### A ordem que funciona

1. Importe os UDTs (`tia_types_import`).
2. Importe ou gere os blocos (`tia_import_xml`, `tia_source_put`).
3. Compile ([Compilar um CLP por código e ler as mensagens](compile-plc-read-messages.pt.md)).

Importar exige o escopo `author`, que Basic, Pro e o teste incluem. Baixar no CLP é outra coisa: exige o Pro e a
aprovação de uma pessoa.

## Não sobrescreva uma mudança mais nova

O Openness não tem desfazer, então um script que lê um bloco, edita e grava de volta pode sobrescrever em silêncio uma
mudança feita no TIA Portal nesse meio tempo. A trava do PLCWare evita isso: leia o bloco com `tia_export_block`, guarde
o `contentHash` e passe-o como `expectedContentHash` para `tia_import_xml` ou `tia_source_put`. Se o bloco mudou nesse
meio tempo, a gravação é recusada com `409 state_changed` e nada é escrito; leia de novo, incorpore a sua edição e tente
outra vez. A trava exige o app PLCWare 1.7.0 ou posterior.

## O que costuma dar errado

- Regenerar a interface de um FB deixa o DB de instância dele inconsistente. Compile primeiro; a compilação costuma
  regenerar o DB de instância. Se ele ainda aparecer inconsistente, apague-o (`tia_block_delete`), recrie-o
  (`tia_instancedb_create`) e compile de novo.
- Nomes de variáveis SCL não podem ser palavras reservadas do S7, como `Counter` ou `Timer`, e variáveis locais no corpo
  levam o prefixo `#` (`#MinhaVar`).
- Use SimaticML exportado do V21: a importação do PLCWare espera arquivos V21.
- Lógica de segurança (F) nunca é autorada nem baixada de forma autônoma pela IA. Importá-la é uma decisão de uma pessoa.

## Guias relacionados

- [Exportar um bloco do CLP para XML SimaticML](export-plc-block-simaticml.pt.md)
- [Compilar um CLP por código e ler as mensagens](compile-plc-read-messages.pt.md)
- [Todos os guias](README.pt.md)

## Comece o teste grátis de 30 dias

O PLCWare executa esses passos para você, ou para o seu assistente de IA, no TIA Portal V21. O teste dura 30 dias, inclui
os escopos do Pro, não pede cartão e não se renova. Você precisa do TIA Portal V21 com licença STEP 7 Professional,
comprada à parte da Siemens.

**[Começar o teste grátis de 30 dias](https://plcware.io/pt/trial?utm_source=github&utm_medium=guide&utm_campaign=import-lad-fbd-scl-blocks)**
· [Baixar o app](https://plcware.io/download)

*TIA Portal, SIMATIC e Siemens são marcas da Siemens AG. O PLCWare é um produto independente para o TIA Portal e não
tem vínculo com a Siemens nem é endossado por ela.*
