# CTM Brasil — RH

Painel de RH em React + TypeScript + Vite, preparado para execução como **Power Apps Code App**.

## Executar localmente

```bash
npm install
npm run dev
```

## Preparar para Power Apps

No PowerShell:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\INICIAR-POWERAPPS.ps1
```

## Publicar

```powershell
.\scripts\PUBLICAR-POWERAPPS.ps1
```

Consulte [POWER_APPS.md](./POWER_APPS.md) para os detalhes de configuração, teste local, publicação e futura integração com Dataverse.
