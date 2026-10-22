# Criar dispositivos e configuração de hardware com o TIA Portal Openness

> Tradução em português. Original em inglês: [create-devices-hardware-network.md](create-devices-hardware-network.md).

O Openness consegue montar uma configuração de hardware sem abrir o editor Dispositivos e redes: criar a estação e a
CPU, encaixar módulos, criar uma sub-rede, dar à CPU um endereço IP e um sistema IO. Este guia faz isso em C# e depois
pela API HTTP e pelas ferramentas MCP do PLCWare. Tudo aqui edita o projeto offline; nada chega a um CLP real. Vale para o
**TIA Portal V21**.

## Antes de começar

- Um aplicativo Openness conectado ao TIA Portal V21, com um projeto aberto
  ([Configurar o TIA Portal Openness no Windows](openness-setup-windows.pt.md)).
- O dispositivo não pode estar online enquanto você encaixa módulos.
- Trabalhe na ordem das dependências: sub-redes, depois dispositivos (CPUs primeiro), depois módulos e, por fim, as
  conexões de rede.

## Encontre o identificador de tipo

Todo objeto de hardware é criado a partir de um identificador de tipo, `<tipo>:<identificador>`, em que o tipo é
`OrderNumber`, `GSD` ou `System`. Para hardware do catálogo, é o número de artigo com a versão de firmware:

```
OrderNumber:6ES7 516-2GN00-0AB0/V2.9
```

A parte do firmware só é opcional quando o sistema tem uma única versão daquele módulo. Não chute o valor: pergunte ao
catálogo de hardware.

```csharp
foreach (var entry in portal.HardwareCatalog.Find("1516"))
    Console.WriteLine($"{entry.TypeIdentifier}  {entry.TypeName}  {entry.Version}");
```

`Find` recebe uma string de filtro. Uma segunda sobrecarga, `Find(filter, typeIdentifier)`, devolve só os módulos
compatíveis com a CPU que você passar.

## Criar a estação e a CPU

```csharp
Device station = project.Devices.CreateWithItem(
    "OrderNumber:6ES7 516-2GN00-0AB0/V2.9", "PLC_1", "Station_1");
```

Os argumentos são o identificador de tipo do item de dispositivo, o nome do item de dispositivo (a CPU) e o nome do
dispositivo (a estação). `Devices.Create(deviceTypeIdentifier, name)` cria só o dispositivo.

## Encaixar módulos

```csharp
DeviceItem rack = ...; // o rack da estação
const string di = "OrderNumber:6ES7 521-1BL00-0AB0/V1.0";

if (rack.CanPlugNew(di, "DI_1", 2))
    rack.PlugNew(di, "DI_1", 2);
```

`CanPlugNew` diz se o encaixe é possível, mas `PlugNew` ainda pode falhar: a posição já está ocupada, o contêiner não
oferece aquela posição, o nome já é usado no contêiner, o módulo não cabe no contêiner ou o dispositivo está online. Um
`PlugNew` que falha lança uma exceção recuperável.

## Criar a sub-rede, o endereço IP e o sistema IO

```csharp
using System.Linq;

Subnet subnet = project.Subnets.Create("System:Subnet.Ethernet", "PN_Line2");

DeviceItem cpuInterface = ...; // o item da interface PROFINET da CPU
NetworkInterface itf = cpuInterface.GetService<NetworkInterface>();
Node node = itf.Nodes.First();

node.ConnectToSubnet(subnet);
((IEngineeringObject)node).SetAttribute("Address", "192.168.0.1");

if ((itf.InterfaceOperatingMode & InterfaceOperatingModes.IoController) != 0)
{
    IoSystem ioSystem = itf.IoControllers.First().CreateIoSystem("PN/IE_1");
}
```

`CreateIoSystem` exige uma interface que já esteja conectada a uma sub-rede e ainda não tenha sistema IO. As
configurações de IP de um nó são atributos dinâmicos: `Address`, `SubnetMask`, `RouterAddress`, `UseRouter`,
`DhcpClientId` e `IpProtocolSelection`.

Para levar uma CPU existente para outra versão de firmware sem recriá-la, chame `ChangeType`. O exemplo da Siemens
encaixa uma CPU como `OrderNumber:6ES7 516-3AN01-0AB0/V2.8` e depois chama
`deviceItem.ChangeType("OrderNumber:6ES7 516-3AN01-0AB0/V2.9")`. Ele lança exceção se o identificador for desconhecido,
o objeto for somente leitura ou a mudança não for suportada (por exemplo, para uma família de módulos completamente
diferente).

## Criar a mesma configuração com o PLCWare

O app `serve` envolve essas chamadas. Os nomes nas chamadas abaixo são os que você deu: a estação em `device`, a
sub-rede em `subnet`. Os identificadores são os da documentação da Siemens; consulte antes os que você precisa com
`GET /catalog?filter=1516` (MCP: `tia_catalog`).

```powershell
function Post($path, $body) {
  Invoke-RestMethod -Method Post "http://localhost:5000$path" -ContentType "application/json" -Body ($body | ConvertTo-Json)
}

Post "/subnets" @{ typeIdentifier = "System:Subnet.Ethernet"; name = "PN_Line2" }
Post "/devices" @{ typeIdentifier = "OrderNumber:6ES7 516-2GN00-0AB0/V2.9"; deviceItemName = "PLC_1"; deviceName = "Station_1" }
Post "/devices/Station_1/plug" @{ typeIdentifier = "OrderNumber:6ES7 521-1BL00-0AB0/V1.0"; name = "DI_1"; position = 2 }
Post "/network/connect" @{ device = "Station_1"; subnet = "PN_Line2"; ip = "192.168.0.1"; createIoSystem = $true }
```

As ferramentas MCP são `tia_subnet_create`, `tia_device_create`, `tia_device_plug` e `tia_network_connect`. A parte da
versão de um identificador se escreve com barra, `/V2.9`, nunca `:V2.9`; o PLCWare recusa a segunda forma. A CPU e seus
dispositivos IO precisam estar na mesma sub-rede, e exatamente um `createIoSystem` cria cada sistema IO. A partir do
app PLCWare 1.7.0 (hoje em beta), a resposta de `tia_network_connect` traz um `postcheck`: o serve relê a conexão depois
de gravá-la, e `409 postcheck_failed` significa que a gravação não teve o efeito pedido, então releia a interface com
`tia_device_network` antes de tentar de novo. O app estável, 1.6.3, não verifica a gravação: confira a configuração
você mesmo depois, na visão de rede do TIA Portal ou relendo-a com `tia_devices` e `tia_subnets`.

Todas essas ferramentas aceitam `dryRun: true`, que confere as travas e devolve o plano sem alterar o projeto. O Openness
não tem rollback, então confira que um nome ainda não existe antes de criá-lo: repetir a execução não converge.

O TIA Portal dá ao software do CLP de uma CPU o nome do item de dispositivo da CPU (`PLC_1` acima), não o da estação.
Tudo que é escopo de CLP depois, como tags, blocos e compilação, usa esse nome; `tia_plcs` o lista.

### Ou descreva o projeto inteiro num documento só

`tia_spec_validate`, `tia_spec_plan` e `tia_spec_apply` recebem uma especificação de projeto em JSON, validam, a
transformam na lista ordenada de operações e as executam na ordem das dependências: sub-redes, dispositivos, módulos,
rede, tabelas de tags, tags, FBs vazios e a compilação. Uma especificação mínima:

```json
{
  "project": { "name": "Line2", "directory": "C:\\TIA\\Line2" },
  "conventions": {
    "namingScheme": "plcopen",
    "optimizedAccess": true,
    "symbolicOnly": true,
    "defaultLanguages": { "interlocks": "LAD", "algorithms": "SCL", "sequencers": "GRAPH" }
  },
  "devices": [
    {
      "name": "Line2_CPU",
      "typeIdentifier": "OrderNumber:6ES7 511-1AK02-0AB0/V2.9",
      "role": "cpu",
      "family": "S7-1500"
    }
  ],
  "network": {
    "subnet": { "type": "System:Subnet.Ethernet", "name": "PN_Line2", "cidr": "192.168.0.0/24" },
    "nodes": [{ "device": "Line2_CPU", "ip": "192.168.0.1", "createIoSystem": true }]
  },
  "tagTables": [{ "name": "IO", "purpose": "IO" }],
  "tags": [{ "table": "IO", "name": "Conv01_Run", "dataType": "Bool", "address": "%Q0.0" }]
}
```

`tia_spec_validate` e `tia_spec_plan` não precisam de um TIA Portal rodando. `tia_spec_apply` para no primeiro passo que
falhar, nunca baixa nada no CLP e não importa UDTs nem escreve lógica de blocos; isso fica com `tia_types_import`,
`tia_source_put` e `tia_import_xml`.

## O que costuma dar errado

- Uma CPU criada pelo Openness pode não compilar limpa de início: as configurações de proteção dela não estão definidas.
  O PLCWare documenta uma receita para isso (`tia_guide` com `{ "topic": "recipes" }`), e a senha de que ela precisa
  sempre vem de uma pessoa. Nada a gera.
- A versão de firmware do projeto não pode ser maior que a da CPU física. `tia_device_change_version` a altera no
  lugar e mantém o programa, mas zera configurações que só a janela do TIA Portal define (ativação do servidor OPC UA e
  licença de runtime). Por isso, arquive o projeto antes com `tia_project_archive` e recompile depois.
- Baixar o hardware num CLP real não faz parte deste guia. É uma trava que uma pessoa aprova.

## Guias relacionados

- [Compilar um CLP por código e ler as mensagens](compile-plc-read-messages.pt.md)
- [Configurar o TIA Portal Openness no Windows](openness-setup-windows.pt.md)
- [Conectar um assistente de IA ao TIA Portal por MCP](connect-ai-assistant-mcp.pt.md)
- [Todos os guias](README.pt.md)

## Comece o teste grátis de 30 dias

O PLCWare executa esses passos para você, ou para o seu assistente de IA, no TIA Portal V21. O teste dura 30 dias, inclui
os escopos do Pro, não pede cartão e não se renova. Você precisa do TIA Portal V21 com licença STEP 7 Professional,
comprada à parte da Siemens.

**[Começar o teste grátis de 30 dias](https://plcware.io/pt/trial?utm_source=github&utm_medium=guide&utm_campaign=create-devices-hardware-network)**
· [Baixar o app](https://plcware.io/download)

*TIA Portal, SIMATIC e Siemens são marcas da Siemens AG. O PLCWare é um produto independente para o TIA Portal e não
tem vínculo com a Siemens nem é endossado por ela.*
