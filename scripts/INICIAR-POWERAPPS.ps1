param(
    [string]$EnvironmentId = "",
    [string]$DisplayName = "CTM - RH"
)

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

function Invoke-Checked {
    param([string]$Command, [string[]]$Arguments)
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Falha ao executar: $Command $($Arguments -join ' ')"
    }
}

Write-Host "=== CTM RH | Preparacao para Power Apps Code Apps ===" -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js nao encontrado. Instale a versao LTS e abra um NOVO terminal."
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw "npm nao encontrado. Reinstale o Node.js LTS."
}

Write-Host "Instalando dependencias locais do projeto..." -ForegroundColor Cyan
Invoke-Checked "npm" @("install")
Invoke-Checked "npx" @("--no-install", "vite", "--version")

if (-not (Get-Command pa -ErrorAction SilentlyContinue)) {
    Write-Host "Instalando Power Apps CLI..." -ForegroundColor Yellow
    Invoke-Checked "npm" @("install", "--global", "@microsoft/power-apps-cli")
}

# The Microsoft quickstart also installs the SDK globally for CLI tooling.
Write-Host "Garantindo Power Apps SDK global..." -ForegroundColor Cyan
Invoke-Checked "npm" @("install", "--global", "@microsoft/power-apps@1.3.0")

if ([string]::IsNullOrWhiteSpace($EnvironmentId)) {
    $EnvironmentId = Read-Host "Cole o Environment ID do ambiente Power Platform"
}
if ([string]::IsNullOrWhiteSpace($EnvironmentId)) {
    throw "Environment ID e obrigatorio."
}

if (-not (Test-Path "power.config.json")) {
    Write-Host "Inicializando o Code App..." -ForegroundColor Cyan
    Invoke-Checked "pa" @(
        "app", "init",
        "--display-name", $DisplayName,
        "--environment-id", $EnvironmentId,
        "--description", "Painel de RH do CTM Brasil",
        "--build-path", "./dist",
        "--file-entry-point", "index.html",
        "--app-url", "http://localhost:3000"
    )
} else {
    Write-Host "power.config.json ja existe; mantendo a configuracao atual." -ForegroundColor Yellow
}

Write-Host "Gerando build de validacao..." -ForegroundColor Cyan
Invoke-Checked "npm" @("run", "build")

if (-not (Test-Path "dist/index.html")) {
    throw "O build nao gerou dist/index.html."
}

Write-Host "" 
Write-Host "[OK] Projeto pronto para Power Apps." -ForegroundColor Green
Write-Host "Para testar: pa app run" -ForegroundColor White
Write-Host "Para publicar: .\scripts\PUBLICAR-POWERAPPS.ps1" -ForegroundColor White
