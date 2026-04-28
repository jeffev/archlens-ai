# archlens-ai — instalador para Windows (PowerShell)
$ErrorActionPreference = 'Stop'

Write-Host ""
Write-Host "  archlens-ai — instalador" -ForegroundColor White
Write-Host "  ──────────────────────"

# Node >= 18
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "  x Node.js nao encontrado. Instale em https://nodejs.org" -ForegroundColor Red
    exit 1
}
$nodeVer = [int](node -e "process.stdout.write(process.versions.node.split('.')[0])")
if ($nodeVer -lt 18) {
    Write-Host "  x Node.js >= 18 necessario (atual: $nodeVer)" -ForegroundColor Red
    exit 1
}
Write-Host "  + Node.js $(node --version)" -ForegroundColor Green

# claude CLI
if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
    Write-Host "  x claude CLI nao encontrado." -ForegroundColor Red
    Write-Host "    Instale com: npm install -g @anthropic-ai/claude-code"
    exit 1
}
Write-Host "  + claude CLI encontrado" -ForegroundColor Green

# instalar deps
Write-Host ""
Write-Host "  Instalando dependencias..."
npm install --silent

# build
Write-Host "  Compilando..."
npm run build --silent

# link global
Write-Host "  Registrando comando global..."
npm link --silent

Write-Host ""
Write-Host "  + archlens-ai instalado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "  Uso:"
Write-Host "    archlens-ai analyze .\meu-projeto"
Write-Host "    archlens-ai suggest `"descricao da arquitetura`""
Write-Host "    archlens-ai --help"
Write-Host ""
