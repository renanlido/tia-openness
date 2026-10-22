# Exportar um bloco do CLP para XML SimaticML com o TIA Portal Openness

> Tradução em português. Original em inglês: [export-plc-block-simaticml.md](export-plc-block-simaticml.md).

SimaticML é o formato XML que o TIA Portal Openness usa para levar blocos do CLP para dentro e para fora de um
projeto. Este guia exporta um bloco, ou todos os blocos, para XML: primeiro com o Openness puro em C#, depois com a
API HTTP e as ferramentas MCP do PLCWare. Vale para o **TIA Portal V21**.

## Antes de começar

- Um aplicativo Openness conectado ao TIA Portal V21, com um projeto aberto. Se ainda não configurou isso, veja
  [Configurar o TIA Portal Openness no Windows](openness-setup-windows.pt.md).
- O CLP **não pode estar online**.
- Só blocos **consistentes** são exportados. Se o bloco mudou desde a última compilação, compile antes
  ([Compilar um CLP por código](compile-plc-read-messages.pt.md)).
- Tipos de bloco suportados: FB, FC, OB e DB global. Linguagens suportadas: STL, FBD, LAD, GRAPH e SCL.

## Exportar um bloco com o Openness (C#)

```csharp
using System.IO;
using Siemens.Engineering;
using Siemens.Engineering.SW;
using Siemens.Engineering.SW.Blocks;

static void ExportBlock(PlcSoftware plcSoftware)
{
    PlcBlock block = plcSoftware.BlockGroup.Blocks.Find("FB_Motor");
    block.Export(new FileInfo(@"D:\Export\FB_Motor.xml"), ExportOptions.WithDefaults);
}
```

`ExportOptions` define quanto vai para o arquivo:

| Opção | O que o arquivo contém |
|---|---|
| `ExportOptions.None` | Só os dados modificados ou diferentes do padrão, mais o que a importação exige |
| `ExportOptions.WithDefaults` | Também os valores padrão |
| `ExportOptions.WithReadOnly` | Também os valores protegidos contra escrita |

Combine as duas últimas com `ExportOptions.WithDefaults | ExportOptions.WithReadOnly`. O arquivo é escrito em
inglês, e os textos do projeto são exportados em todos os idiomas que o projeto tem.

As bibliotecas Openness do TIA Portal V21 escrevem SimaticML da versão de engenharia V21 e leem arquivos das versões
V18 a V21.

## Exportar todos os blocos, grupos de usuário incluídos

```csharp
static void ExportAll(PlcSoftware plc, string folder)
{
    Directory.CreateDirectory(folder);
    ExportBlocks(plc.BlockGroup.Blocks, folder);
    foreach (PlcBlockUserGroup group in plc.BlockGroup.Groups)
        ExportGroup(group, Path.Combine(folder, group.Name));
}

static void ExportGroup(PlcBlockUserGroup group, string folder)
{
    Directory.CreateDirectory(folder);
    ExportBlocks(group.Blocks, folder);
    foreach (PlcBlockUserGroup sub in group.Groups)
        ExportGroup(sub, Path.Combine(folder, sub.Name));
}

static void ExportBlocks(PlcBlockComposition blocks, string folder)
{
    foreach (PlcBlock block in blocks)
        block.Export(new FileInfo(Path.Combine(folder, block.Name + ".xml")), ExportOptions.WithDefaults);
}
```

Um bloco com proteção de know-how exporta só a interface pública, a menos que você o desbloqueie antes com o
`PlcBlockProtectionProvider`.

## Exportar com o PLCWare

O app `serve` do PLCWare envolve as mesmas chamadas do Openness numa API HTTP/JSON local (padrão
`http://localhost:5000`), e o servidor MCP `tia` as expõe como ferramentas para um assistente de IA. Exportar só lê o
projeto, então funciona em todos os planos, inclusive no Basic.

### Um bloco, devolvido na resposta

```powershell
$r = Invoke-RestMethod "http://localhost:5000/plcs/PLC_1/blocks/FB_Motor/xml"
$r.xml | Out-File FB_Motor.xml -Encoding utf8
$r.contentHash
```

A resposta é `{ name, options, contentHash, contentHashError, xml }`. Acrescente `?options=WithDefaults` (ou `None`,
`WithReadOnly`, combinados com `,`) para escolher as opções de exportação. A ferramenta MCP é `tia_export_block`, com
`{ "plc": "PLC_1", "block": "FB_Motor" }`.

### Todos os blocos e tipos, numa pasta

```powershell
Invoke-RestMethod -Method Post "http://localhost:5000/plcs/PLC_1/export" `
  -ContentType "application/json" -Body '{"directory":"C:\\export"}'
```

Os blocos vão para `Blocks\` e os tipos para `Types\`, dentro desse diretório, **na máquina onde o `serve` roda**, e a
resposta lista cada arquivo com seu SHA-256 e tamanho. A ferramenta MCP é `tia_export_xml`; use-a quando o projeto for
grande demais para voltar num único resultado de ferramenta.

## Prove que o projeto ainda confere com o XML do git

Não compare hashes de duas exportações brutas: duas exportações do mesmo bloco diferem em `<Created>` e nos UIds. Em
vez disso, passe o XML versionado para a `tia_block_compare`. Ela compara o bloco do projeto com o seu arquivo depois de
normalizar os dois (ignora formatação, BOM, `<Created>` e UIds) e responde `verdict: "equal"` ou `"different"`.

Outros detalhes que valem a pena:

- Exportar um bloco inconsistente o compila antes, o que pode regenerar o DB de instância. Exporte e versione também o
  DB de instância.
- `contentHash` é o hash que a trava contra escrita desatualizada confere antes de uma importação sobrescrever um bloco
  (veja [Importar blocos LAD, FBD e SCL](import-lad-fbd-scl-blocks.pt.md)). A trava exige o app PLCWare 1.7.0 ou
  posterior.
- `tia_block_render` transforma uma exportação SimaticML em pseudo-SCL legível, rede por rede, sem um TIA Portal
  rodando. Ajuda a revisar blocos LAD e FBD num pull request.
- Blocos F consistentes podem ser exportados e importados de novo, mas os blocos de sistema F do próprio sistema de
  segurança não podem ser exportados.

## Guias relacionados

- [Importar blocos LAD, FBD e SCL no TIA Portal por código](import-lad-fbd-scl-blocks.pt.md)
- [Compilar um CLP por código e ler as mensagens](compile-plc-read-messages.pt.md)
- [Todos os guias](README.pt.md)

## Comece o teste grátis de 30 dias

O PLCWare executa esses passos para você, ou para o seu assistente de IA, no TIA Portal V21. O teste dura 30 dias,
inclui os escopos do Pro, não pede cartão e não se renova. Você precisa do TIA Portal V21 com licença STEP 7 Professional, comprada à
parte da Siemens.

**[Começar o teste grátis de 30 dias](https://plcware.io/pt/trial?utm_source=github&utm_medium=guide&utm_campaign=export-plc-block-simaticml)**
· [Baixar o app](https://plcware.io/download)

*TIA Portal, SIMATIC e Siemens são marcas da Siemens AG. O PLCWare é um produto independente para o TIA Portal e não
tem vínculo com a Siemens nem é endossado por ela.*
