# Configurar o TIA Portal Openness no Windows: grupo de usuários, aviso da primeira conexão e V21

> Tradução em português. Original em inglês: [openness-setup-windows.md](openness-setup-windows.md).

Antes que um aplicativo Openness possa tocar num projeto, o PC de engenharia precisa de quatro coisas: o TIA Portal V21,
o seu usuário do Windows no grupo do Openness, as bibliotecas V21 encontradas pelo seu programa e uma aprovação única
do programa no firewall do Openness do TIA Portal. Este guia percorre cada uma e depois mostra o que o PLCWare faz por
você. Vale para o **TIA Portal V21**.

## A lista rápida

1. O TIA Portal V21 está instalado no PC. O Openness vem com ele.
2. O seu usuário do Windows é membro do grupo local **Siemens TIA Openness**, e você saiu da sessão e entrou de novo.
3. O seu programa carrega as bibliotecas Siemens.Engineering a partir da instalação do TIA Portal.
4. Você aprovou o programa no aviso do firewall na primeira vez que ele se conectou.
5. O projeto é um projeto V21, ou você o abre com atualização.

## 1. O TIA Portal V21 e suas bibliotecas

No V21 o TIA Portal Openness deixou de ser uma opção do setup: é um recurso inerente do TIA Portal e é instalado com
ele. Dependendo dos produtos e opções instalados, vêm junto assemblies Siemens.Engineering modulares adicionais. Elas
ficam no diretório de instalação, em `PublicAPI\V21\net48\`, por exemplo:

```
C:\Program Files\Siemens\Automation\Portal V21\PublicAPI\V21\net48\Siemens.Engineering.Base.dll
```

Além da `Siemens.Engineering.Base.dll`, um programa que trabalha com CLPs também referencia a
`Siemens.Engineering.Step7.dll`. Duas consequências:

- As bibliotecas do V17, V18, V19 e V20 não fazem parte do V21. Um programa feito para uma versão mais antiga precisa ser
  adaptado antes de rodar no V21.
- Um programa só pode usar uma versão do TIA Portal por vez: acessar versões diferentes no mesmo AppDomain não é
  suportado.

## 2. Adicione seu usuário ao grupo "Siemens TIA Openness"

O TIA Portal cria o grupo local do Windows **Siemens TIA Openness** durante o setup. Sempre que o seu programa tenta
alcançar um processo do TIA Portal, o TIA Portal confere se você pertence ao grupo, diretamente ou por outro grupo. Se
não pertencer, uma `EngineeringSecurityException` é lançada. Ser membro permite executar qualquer aplicativo Openness.

Um administrador adiciona o usuário:

1. Abra o **Gerenciamento do Computador** como administrador.
2. Vá em **Usuários e Grupos Locais > Grupos**.
3. Abra **Siemens TIA Openness**, clique em **Adicionar...** e adicione o usuário.
4. O usuário sai da sessão e entra de novo por completo.

Num PowerShell elevado, a mesma coisa é:

```powershell
Add-LocalGroupMember -Group "Siemens TIA Openness" -Member "$env:USERDOMAIN\$env:USERNAME"
```

## 3. Faça o seu programa encontrar as bibliotecas

Defina **Copiar Local** como **False** para toda referência Siemens.Engineering e limpe o diretório de saída: copiar as
bibliotecas para junto do seu programa não é suportado. A Siemens documenta duas formas de resolvê-las em tempo de
execução e recomenda as chaves do registro junto com o evento `AssemblyResolve`.

O registro guarda o caminho para você: em
`HKEY_LOCAL_MACHINE\SOFTWARE\Siemens\Automation\Openness\<xx.xx>\PublicAPI\<xx.xx.xx.xx>\net48` (uma chave por alvo .NET
suportado), o valor `Siemens.Engineering.Base` aponta para o caminho da instalação. Um caminho fixo também funciona:

```csharp
using System;
using System.IO;
using System.Reflection;

internal static class Program
{
    private const string OpennessFolder = @"C:\Program Files\Siemens\Automation\Portal V21\PublicAPI\V21\net48";

    static Program()
    {
        // Registre o resolvedor o mais cedo possível.
        AppDomain.CurrentDomain.AssemblyResolve += OnAssemblyResolve;
    }

    public static void Main() => new HelloOpennessApp().Run(); // os tipos do Openness ficam em outra classe

    private static Assembly OnAssemblyResolve(object sender, ResolveEventArgs args)
    {
        var requested = new AssemblyName(args.Name);
        string file = Path.Combine(OpennessFolder, requested.Name + ".dll");
        if (!requested.Name.StartsWith("Siemens.Engineering.") || !File.Exists(file)) return null;
        return Assembly.LoadFrom(file);
    }
}
```

Não toque em nenhum tipo do Openness (no corpo de um método, numa propriedade, num parâmetro ou num valor de retorno)
antes de o resolvedor estar registrado; deixe esse código numa classe separada, usada só depois da inscrição.

## 4. A primeira conexão: o aviso do firewall do Openness

Quando o seu programa se conecta a uma instância do TIA Portal em execução, o que inclui iniciar uma nova, o TIA Portal
pergunta se aceita a conexão.

| Botão | O que faz |
|---|---|
| **Sim** | Deixa este programa alcançar esta instância em execução, uma vez. O aviso volta na próxima vez. |
| **Sim para todos** | Um administrador permite que este programa alcance todas as instâncias, em definitivo. O Windows pede aprovação do UAC e grava uma entrada no registro. |

A entrada fica em `HKEY_LOCAL_MACHINE\SOFTWARE\Siemens\Automation\Openness\AllowList` (no V21 é a mesma chave para todas
as versões do TIA Portal) e registra o caminho do programa, a data de modificação e o hash do arquivo. Se qualquer um
dos três mudar, o que inclui recompilar o seu programa, o TIA Portal enxerga outro programa e pergunta de novo. Um
administrador também pode distribuir a entrada como um arquivo `.reg`, em vez de esperar pelo aviso.

## 5. Conectar e abrir um projeto

```csharp
using (TiaPortal portal = new TiaPortal(TiaPortalMode.WithUserInterface))   // ou WithoutUserInterface
{
    Project project = portal.Projects.Open(new FileInfo(@"C:\Projects\Line2\Line2.ap21"));
}
```

- `TiaPortal.GetProcesses()` lista as instâncias em execução às quais você pode se conectar.
- `Projects.Open` abre só projetos criados com a versão atual, ou atualizados para ela; um projeto de uma versão anterior
  lança exceção. `OpenWithUpgrade` cria a partir dele um projeto novo, atualizado, e o abre.
- Um projeto não pode estar aberto em duas instâncias do TIA Portal ao mesmo tempo.
- Com as bibliotecas do V21, o SimaticML exportado é V21, e arquivos das versões V18 a V21 podem ser importados.

## O que o PLCWare faz por você

O app `serve` do PLCWare é o programa Openness, então você não escreve nada do que está acima. Ele carrega as assemblies
da Siemens a partir da sua instalação local do TIA Portal (elas não são redistribuídas), as resolve por você e executa
toda chamada do Openness num único worker serial. O que continua do seu lado:

- **O grupo.** O setup de primeira execução do instalador adiciona o seu usuário do Windows ao **Siemens TIA Openness**.
  Depois, saia da sessão e entre de novo. Se a verificação do ambiente reclamar do grupo mais tarde, rode o setup de novo
  e saia e entre de novo.
- **A verificação.** No app de bandeja, aba **API**, **Check environment**, ou pela linha de comando:

  ```powershell
  TIAOpenness.exe check
  ```

  Ela confere o grupo do Windows, se o processo é x64 e se o TIA Portal V21 e sua PublicAPI estão presentes. No MCP,
  `tia_readiness` faz o mesmo tipo de verificação na máquina onde o `serve` roda (x64, grupo, PublicAPI, chave do
  registro e instâncias do TIA), e `tia_ping` diz se o `serve` está acessível e ativado.
- **A primeira conexão.** O aviso do firewall aparece na máquina que roda o `serve`, e uma pessoa precisa respondê-lo: o
  PLCWare não pode clicar por você, de propósito. O setup do instalador registra o executável instalado na lista de
  permissões do Openness quando consegue, para que o aviso não seja necessário. Quando ele é necessário, o fluxo no MCP
  é `tia_start`, depois `tia_show_ui` (reabre o TIA Portal visível para o aviso aparecer), uma pessoa clica em
  **Sim para todos** e então `tia_connect`. Um `tia_connect` que esbarra no aviso responde `requires_human_action` após
  cerca de 180 segundos, em vez de tentar de novo.

O PLCWare funciona somente com o TIA Portal V21.

## Quando falha

| Sintoma | Causa provável |
|---|---|
| `EngineeringSecurityException` assim que o programa inicia o TIA Portal | O usuário não está em **Siemens TIA Openness**, ou não saiu e entrou na sessão depois de ser adicionado |
| `Could not load file or assembly Siemens.Engineering...` | O resolvedor foi registrado tarde demais, **Copiar Local** está ligado ou o caminho aponta para outra versão |
| O aviso volta a cada execução | Você clicou em **Sim** em vez de **Sim para todos**, ou o arquivo do programa mudou |
| Abrir o projeto lança exceção | Ele foi criado com uma versão anterior do TIA Portal: use `OpenWithUpgrade` |
| O projeto não abre | Ele já está aberto em outra instância do TIA Portal |

## Guias relacionados

- [Criar dispositivos e hardware com o TIA Portal Openness](create-devices-hardware-network.pt.md)
- [Conectar um assistente de IA ao TIA Portal por MCP](connect-ai-assistant-mcp.pt.md)
- [Manual de instalação](../INSTALL.pt.md)
- [Todos os guias](README.pt.md)

## Comece o teste grátis de 30 dias

O PLCWare executa esses passos para você, ou para o seu assistente de IA, no TIA Portal V21. O teste dura 30 dias, inclui
os escopos do Pro, não pede cartão e não se renova. Você precisa do TIA Portal V21 com licença STEP 7 Professional,
comprada à parte da Siemens.

**[Começar o teste grátis de 30 dias](https://plcware.io/pt/trial?utm_source=github&utm_medium=guide&utm_campaign=openness-setup-windows)**
· [Baixar o app](https://plcware.io/download)

*TIA Portal, SIMATIC e Siemens são marcas da Siemens AG. O PLCWare é um produto independente para o TIA Portal e não
tem vínculo com a Siemens nem é endossado por ela.*
