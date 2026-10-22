# Set up TIA Portal Openness on Windows: user group, first-connection prompt and V21

Before an Openness application can touch a project, the engineering PC needs four things: TIA Portal V21, your Windows
user in the Openness group, the V21 libraries found by your program, and a one-time approval of the program in TIA
Portal's Openness firewall. This guide walks through each, then shows what PLCWare does for you. It applies to
**TIA Portal V21**.

## The short checklist

1. TIA Portal V21 is installed on the PC. Openness comes with it.
2. Your Windows user is a member of the local group **Siemens TIA Openness**, and you have signed out and in again.
3. Your program loads the Siemens.Engineering libraries from the TIA Portal installation.
4. You approved the program in the firewall prompt the first time it connected.
5. The project is a V21 project, or you open it with an upgrade.

## 1. TIA Portal V21 and its libraries

TIA Portal Openness is no longer a setup option in V21: it is an inherent feature of TIA Portal and is installed with
it. Depending on the products and options installed, additional modular Siemens.Engineering assemblies come with it.
They live in the installation directory under `PublicAPI\V21\net48\`, for example:

```
C:\Program Files\Siemens\Automation\Portal V21\PublicAPI\V21\net48\Siemens.Engineering.Base.dll
```

Beyond `Siemens.Engineering.Base.dll`, a program that works with PLCs also references `Siemens.Engineering.Step7.dll`.
Two consequences:

- The libraries of V17, V18, V19 and V20 are not part of V21. A program built for an older version must be adapted
  before it runs against V21.
- One program can use only one TIA Portal version at a time: accessing different versions in the same AppDomain is not
  supported.

## 2. Add your user to the "Siemens TIA Openness" group

TIA Portal creates the local Windows group **Siemens TIA Openness** during setup. Each time your program tries to reach a
TIA Portal process, TIA Portal checks that you belong to the group, directly or through another group. If you do not,
an `EngineeringSecurityException` is thrown. Membership allows you to run any Openness application.

An administrator adds the user:

1. Start **Computer Management** as administrator.
2. Go to **Local Users and Groups > Groups**.
3. Open **Siemens TIA Openness**, click **Add...** and add the user.
4. The user signs out and in again completely.

From an elevated PowerShell, the same thing is:

```powershell
Add-LocalGroupMember -Group "Siemens TIA Openness" -Member "$env:USERDOMAIN\$env:USERNAME"
```

## 3. Let your program find the libraries

Set **Copy Local** to **False** for every Siemens.Engineering reference and clean the output directory: copying the
libraries next to your program is not supported. Siemens documents two ways to resolve them at run time, and recommends
the registry keys together with the `AssemblyResolve` event.

The registry keeps the path for you: under
`HKEY_LOCAL_MACHINE\SOFTWARE\Siemens\Automation\Openness\<xx.xx>\PublicAPI\<xx.xx.xx.xx>\net48` (one key per supported
.NET target), the `Siemens.Engineering.Base` value points to the installation path. A fixed path works too:

```csharp
using System;
using System.IO;
using System.Reflection;

internal static class Program
{
    private const string OpennessFolder = @"C:\Program Files\Siemens\Automation\Portal V21\PublicAPI\V21\net48";

    static Program()
    {
        // Register the resolver as early as possible.
        AppDomain.CurrentDomain.AssemblyResolve += OnAssemblyResolve;
    }

    public static void Main() => new HelloOpennessApp().Run(); // Openness types live in another class

    private static Assembly OnAssemblyResolve(object sender, ResolveEventArgs args)
    {
        var requested = new AssemblyName(args.Name);
        string file = Path.Combine(OpennessFolder, requested.Name + ".dll");
        if (!requested.Name.StartsWith("Siemens.Engineering.") || !File.Exists(file)) return null;
        return Assembly.LoadFrom(file);
    }
}
```

Do not touch any Openness type (in a method body, a property, a parameter or a return value) before the resolver is
registered; keep that code in a separate class that is only used after the subscription.

## 4. The first connection: the Openness firewall prompt

When your program connects to a running TIA Portal instance, which includes starting a new one, TIA Portal asks whether
to accept the connection.

| Button | What it does |
|---|---|
| **Yes** | Lets this program reach this running instance, once. The prompt returns next time. |
| **Yes to all** | An administrator allows this program to reach every instance, permanently. Windows asks for UAC approval and writes an entry to the registry. |

The entry lives under `HKEY_LOCAL_MACHINE\SOFTWARE\Siemens\Automation\Openness\AllowList` (in V21 it is the same key for
every TIA Portal version) and records the program's path, its modification date and its file hash. If any of the three
changes, which includes rebuilding your program, TIA Portal sees a different program and asks again. An administrator can
also roll out the entry as a `.reg` file instead of waiting for the prompt.

## 5. Connect and open a project

```csharp
using (TiaPortal portal = new TiaPortal(TiaPortalMode.WithUserInterface))   // or WithoutUserInterface
{
    Project project = portal.Projects.Open(new FileInfo(@"C:\Projects\Line2\Line2.ap21"));
}
```

- `TiaPortal.GetProcesses()` lists the running instances you can attach to.
- `Projects.Open` opens only projects created with, or upgraded to, the current version; a project from an earlier
  version throws. `OpenWithUpgrade` creates a new upgraded project from it and opens that.
- A project cannot be open in two TIA Portal instances at once.
- With V21's libraries, exported SimaticML is V21, and files from V18 to V21 can be imported.

## What PLCWare does for you

PLCWare's `serve` app is the Openness program, so you do not write any of the above. It loads the Siemens assemblies
from your local TIA Portal installation (they are not redistributed), resolves them for you, and runs every Openness
call on one serial worker. What stays on your side:

- **The group.** The installer's first-time setup adds your Windows user to **Siemens TIA Openness**. Sign out and in
  afterwards. If the environment check later complains about the group, run the setup again and sign out and in.
- **The check.** In the tray app, **API** tab, **Check environment**, or on the command line:

  ```powershell
  TIAOpenness.exe check
  ```

  It verifies the Windows group, that the process is x64 and that TIA Portal V21 and its PublicAPI are present. In the
  MCP, `tia_readiness` runs the same kind of check on the machine where `serve` runs (x64, group, PublicAPI, registry key
  and TIA instances), and `tia_ping` tells you whether `serve` is reachable and activated.
- **The first connection.** The firewall prompt appears on the machine that runs `serve`, and a person must answer it:
  PLCWare cannot click it for you, on purpose. The installer's setup registers the installed executable in the Openness
  allow list when it can, so that the prompt is not needed. When it is, the MCP flow is `tia_start`, then `tia_show_ui`
  (it relaunches TIA Portal visibly so the prompt can show), a person clicks **Yes to all**, then `tia_connect`. A
  `tia_connect` that hits the prompt answers `requires_human_action` after about 180 seconds instead of retrying.

PLCWare works with TIA Portal V21 only.

## When it fails

| Symptom | Likely cause |
|---|---|
| `EngineeringSecurityException` as soon as the program starts TIA Portal | The user is not in **Siemens TIA Openness**, or has not signed out and in since being added |
| `Could not load file or assembly Siemens.Engineering...` | The resolver is registered too late, **Copy Local** is on, or the path points at another version |
| The prompt returns on every run | You clicked **Yes** instead of **Yes to all**, or the program file changed |
| Opening the project throws | It was created with an earlier TIA Portal version: use `OpenWithUpgrade` |
| The project will not open | It is already open in another TIA Portal instance |

## Related guides

- [Create devices and hardware with TIA Portal Openness](create-devices-hardware-network.md)
- [Connect an AI assistant to TIA Portal through MCP](connect-ai-assistant-mcp.md)
- [Installation manual](../INSTALL.md)
- [All guides](README.md)

## Start your free 30-day trial

PLCWare runs these steps for you, or for your AI assistant, against TIA Portal V21. The trial lasts 30 days, includes the
Pro scopes, needs no card and does not renew. You need TIA Portal V21 with a STEP 7 Professional license, bought
separately from Siemens.

**[Start the free 30-day trial](https://plcware.io/en/trial?utm_source=github&utm_medium=guide&utm_campaign=openness-setup-windows)**
· [Download the app](https://plcware.io/download)

*TIA Portal, SIMATIC and Siemens are trademarks of Siemens AG. PLCWare is an independent product for TIA Portal and
is not affiliated with or endorsed by Siemens.*
