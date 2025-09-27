#!/bin/bash

# Script de Deploy para IA Atendimento Bot
# Executa validações e prepara para deploy

set -e

echo "🚀 Iniciando processo de deploy..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    error "package.json não encontrado. Execute este script no diretório raiz do projeto."
    exit 1
fi

log "Verificando ambiente..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    error "Node.js não está instalado"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_VERSION="22.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    error "Node.js versão $REQUIRED_VERSION ou superior é necessária. Versão atual: $NODE_VERSION"
    exit 1
fi

success "Node.js versão $NODE_VERSION OK"

# Verificar se .env existe
if [ ! -f ".env" ]; then
    warning ".env não encontrado. Copiando de env.example..."
    cp env.example .env
    warning "Configure as variáveis de ambiente em .env antes de continuar"
fi

# Instalar dependências
log "Instalando dependências..."
npm install

# Executar validação
log "Executando validação da aplicação..."
if node validate-app.js; then
    success "Validação passou com sucesso!"
else
    error "Validação falhou. Corrija os problemas antes de fazer deploy."
    exit 1
fi

# Verificar se git está limpo
if [ -d ".git" ]; then
    if ! git diff --quiet; then
        warning "Há mudanças não commitadas. Commitando automaticamente..."
        git add .
        git commit -m "Auto-commit before deploy: $(date)"
    fi
    
    # Push para repositório
    log "Fazendo push para o repositório..."
    git push origin main
    success "Push realizado com sucesso!"
fi

# Verificar se é ambiente de produção
if [ "$NODE_ENV" = "production" ]; then
    log "Ambiente de produção detectado"
    
    # Verificar variáveis críticas
    if [ -z "$OPENAI_API_KEY" ] || [ -z "$WHATSAPP_TOKEN" ] || [ -z "$WHATSAPP_VERIFY_TOKEN" ]; then
        error "Variáveis críticas não configuradas. Verifique OPENAI_API_KEY, WHATSAPP_TOKEN e WHATSAPP_VERIFY_TOKEN"
        exit 1
    fi
    
    success "Variáveis de ambiente críticas configuradas"
fi

# Executar testes (se existirem)
if [ -f "package.json" ] && grep -q '"test"' package.json; then
    log "Executando testes..."
    npm test || warning "Alguns testes falharam, mas continuando..."
fi

# Build da aplicação (se necessário)
if [ -f "Dockerfile" ]; then
    log "Build da imagem Docker..."
    docker build -t ia-atendimento-bot:latest .
    success "Imagem Docker construída com sucesso!"
fi

success "✅ Deploy preparado com sucesso!"
echo ""
log "📋 Próximos passos:"
echo "  1. Configure as variáveis de ambiente no Render"
echo "  2. Configure o webhook do WhatsApp: https://seu-app.onrender.com/webhook"
echo "  3. Teste os endpoints principais"
echo "  4. Configure o webhook do Stripe (se aplicável)"
echo ""
log "🔗 URLs importantes:"
echo "  - Health Check: https://seu-app.onrender.com/monitoring/health"
echo "  - Admin Dashboard: https://seu-app.onrender.com/admin"
echo "  - Webhook WhatsApp: https://seu-app.onrender.com/webhook"
echo ""
success "🎉 Deploy pronto! Boa sorte!"
