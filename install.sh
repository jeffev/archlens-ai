#!/usr/bin/env bash
set -e

BOLD='\033[1m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
RESET='\033[0m'

echo ""
echo -e "${BOLD}  archlens-ai — instalador${RESET}"
echo "  ──────────────────────"

# Node >= 18
if ! command -v node &>/dev/null; then
  echo -e "${RED}  ✗ Node.js não encontrado. Instale em https://nodejs.org${RESET}"
  exit 1
fi
NODE_VER=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
if [ "$NODE_VER" -lt 18 ]; then
  echo -e "${RED}  ✗ Node.js >= 18 necessário (atual: $NODE_VER)${RESET}"
  exit 1
fi
echo -e "  ${GREEN}✓${RESET} Node.js $(node --version)"

# claude CLI
if ! command -v claude &>/dev/null; then
  echo -e "${RED}  ✗ claude CLI não encontrado.${RESET}"
  echo "    Instale com: npm install -g @anthropic-ai/claude-code"
  exit 1
fi
echo -e "  ${GREEN}✓${RESET} claude CLI $(claude --version 2>/dev/null | head -1)"

# instalar deps
echo ""
echo "  Instalando dependências..."
npm install --silent

# build
echo "  Compilando..."
npm run build --silent

# link global
echo "  Registrando comando global..."
npm link --silent

echo ""
echo -e "  ${GREEN}${BOLD}✓ archlens-ai instalado com sucesso!${RESET}"
echo ""
echo "  Uso:"
echo "    archlens analyze ./meu-projeto"
echo "    archlens suggest \"descrição da arquitetura\""
echo "    archlens --help"
echo ""
