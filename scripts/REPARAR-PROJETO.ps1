param(
    [switch]$KeepLockFile
)

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

function Invoke-Checked {
    param([string]$Command, [string[]]$Arguments)
    Write-Host "> $Command $($Arguments -join ' ')" -ForegroundColor DarkGray
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Falha ao executar: $Command $($Arguments -join ' ')"
    }
}

Write-Host "=== CTM RH | Reparar dependencias ===" -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js nao encontrado. Instale o Node.js LTS e abra um NOVO terminal."
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw "npm nao encontrado. Reinstale o Node.js LTS e abra um NOVO terminal."
}

Write-Host "Node: $(& node --version)" -ForegroundColor Gray
Write-Host "npm : $(& npm --version)" -ForegroundColor Gray

if (Test-Path "node_modules") {
    Write-Host "Removendo node_modules incompleto/antigo..." -ForegroundColor Yellow
    Remove-Item "node_modules" -Recurse -Force
}

if (-not $KeepLockFile -and (Test-Path "package-lock.json")) {
    Write-Host "Removendo package-lock.json para refazer a arvore de dependencias..." -ForegroundColor Yellow
    Remove-Item "package-lock.json" -Force
}

if (Test-Path "dist") {
    Remove-Item "dist" -Recurse -Force
}

Write-Host "Instalando dependencias..." -ForegroundColor Cyan
Invoke-Checked "npm" @("install")

Write-Host "Validando Vite local..." -ForegroundColor Cyan
Invoke-Checked "npx" @("--no-install", "vite", "--version")

Write-Host "Executando diagnostico..." -ForegroundColor Cyan
Invoke-Checked "node" @("scripts/check-env.cjs")

Write-Host "Gerando build..." -ForegroundColor Cyan
Invoke-Checked "npm" @("run", "build")

if (-not (Test-Path "dist/index.html")) {
    throw "Build terminou sem gerar dist/index.html."
}

Write-Host "" 
Write-Host "[OK] Projeto reparado. Vite instalado e ./dist gerado." -ForegroundColor Green
Write-Host "Agora execute: pa app run" -ForegroundColor White
