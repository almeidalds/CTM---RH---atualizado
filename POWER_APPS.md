# CTM RH — Power Apps Code Apps

Este projeto foi ajustado para rodar como **Power Apps Code App** sem alterar as regras funcionais do painel.

## O que foi corrigido

- Vite configurado com `base: "./"` para que CSS/JS sejam carregados corretamente dentro do host do Power Apps.
- Plugin oficial `@microsoft/power-apps-vite` adicionado.
- SDK `@microsoft/power-apps` adicionado para permitir Dataverse, conectores e flows no próximo passo.
- Build padronizado em `./dist` com `index.html` como entry point.
- Servidor local padronizado na porta `3000`.
- Alias `@` corrigido para apontar para `src`.
- `ErrorBoundary` adicionado para impedir tela totalmente branca quando houver uma exceção React.
- Leitura das configurações do `localStorage` protegida contra bloqueios do navegador/iframe.
- Scripts PowerShell para inicializar e publicar o aplicativo.
- Referências específicas do Google AI Studio removidas da configuração do projeto.

## Pré-requisitos

1. Node.js LTS.
2. Acesso ao ambiente Power Platform onde Code Apps estão habilitados.
3. Permissão para criar/publicar aplicativos no ambiente.

## Caminho recomendado — CLI atual `pa`

Abra o PowerShell na pasta raiz do projeto e execute:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\INICIAR-POWERAPPS.ps1
```

O script instala as dependências, verifica a Power Apps CLI, solicita o **Environment ID**, executa `pa app init` e valida o build.

### Testar no Power Apps local host

Terminal 1:

```powershell
npm run dev
```

Terminal 2:

```powershell
npm run powerapps:run
```

### Publicar

```powershell
.\scripts\PUBLICAR-POWERAPPS.ps1
```

Se o Code App precisar entrar diretamente em uma Solution:

```powershell
.\scripts\PUBLICAR-POWERAPPS.ps1 -SolutionId "GUID-DA-SOLUTION"
```

## Comandos equivalentes

```powershell
npm install
pa auth login
pa app init --display-name "CTM - RH" --environment-id "SEU-ENVIRONMENT-ID" --build-path ./dist --file-entry-point index.html --app-url http://localhost:3000
npm run build
pa app push
```

## Compatibilidade com o fluxo antigo `pac code`

Se o seu computador ainda estiver usando o Power Platform CLI antigo, o projeto também está preparado para `./dist` + `index.html`. O equivalente é:

```powershell
pac auth create
pac code init --displayName "CTM - RH" --buildPath ./dist --fileEntryPoint index.html --appUrl http://localhost:3000
npm run build
pac code push
```

A CLI `pa` é o caminho mais novo e recomendado para os próximos passos.

## Sobre os dados atuais

O aplicativo ainda usa os dados de demonstração e `localStorage` que já existiam no projeto. Isso permite publicar e validar a interface imediatamente, mas **não transforma esses dados em banco compartilhado**.

Para uso real por várias pessoas, o próximo passo é ligar os módulos a tabelas do **Dataverse** usando a Power Apps CLI e os serviços TypeScript gerados. A estrutura foi preparada para isso com `@microsoft/power-apps`.

## `power.config.json`

Não há um `power.config.json` real incluído de propósito, porque ele contém os IDs do seu ambiente/aplicativo e deve ser gerado pelo `pa app init` no ambiente correto. O arquivo `power.config.example.json` mostra apenas a estrutura esperada.

Não copie um `appId` de outro Code App: cada aplicativo deve ser inicializado/publicado no ambiente correto.

## Erro: `'vite' nao e reconhecido` / `Build output not found at './dist'`

Esse erro significa que as dependencias locais nao foram instaladas corretamente ou que `node_modules` ficou incompleto.

Na raiz do projeto, execute:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\REPARAR-PROJETO.ps1
```

O script:

1. remove uma instalacao incompleta de `node_modules`;
2. refaz `npm install`;
3. confirma o Vite com `npx --no-install vite --version`;
4. executa o diagnostico do projeto;
5. executa `npm run build`;
6. confirma a existencia de `dist/index.html`.

Somente depois disso execute:

```powershell
pa app run
```
