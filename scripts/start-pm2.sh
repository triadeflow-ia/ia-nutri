#!/bin/bash
# scripts/start-pm2.sh
# Script de inicialização com PM2

set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 Iniciando IA Atendimento Bot com PM2...${NC}"

# Verificar se PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}❌ PM2 não está instalado. Instalando...${NC}"
    npm install -g pm2
fi

# Verificar se o arquivo .env existe
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env não encontrado. Copiando de env.example...${NC}"
    if [ -f env.example ]; then
        cp env.example .env
        echo -e "${YELLOW}⚠️  Configure as variáveis no arquivo .env antes de continuar.${NC}"
        exit 1
    else
        echo -e "${RED}❌ Arquivo env.example não encontrado.${NC}"
        exit 1
    fi
fi

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Instalando dependências...${NC}"
    npm install
fi

# Parar instâncias existentes
echo -e "${YELLOW}🛑 Parando instâncias existentes...${NC}"
pm2 delete ia-atendimento-bot 2>/dev/null || true

# Iniciar aplicação
echo -e "${GREEN}▶️  Iniciando aplicação...${NC}"
pm2 start ecosystem.config.js --env production

# Aguardar inicialização
echo -e "${YELLOW}⏳ Aguardando inicialização...${NC}"
sleep 5

# Verificar status
echo -e "${GREEN}📊 Status da aplicação:${NC}"
pm2 status

# Verificar health check
echo -e "${YELLOW}🔍 Verificando health check...${NC}"
if curl -f http://localhost:1337/monitoring/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Aplicação iniciada com sucesso!${NC}"
    echo -e "${GREEN}🌐 Acesse: http://localhost:1337${NC}"
    echo -e "${GREEN}📊 Dashboard: http://localhost:1337/admin${NC}"
    echo -e "${GREEN}🔍 Health: http://localhost:1337/monitoring/health${NC}"
else
    echo -e "${RED}❌ Health check falhou. Verifique os logs:${NC}"
    pm2 logs ia-atendimento-bot --lines 20
    exit 1
fi

echo -e "${GREEN}🎉 Deploy concluído!${NC}"
echo ""
echo "Comandos úteis:"
echo "  pm2 status                    - Ver status"
echo "  pm2 logs ia-atendimento-bot   - Ver logs"
echo "  pm2 restart ia-atendimento-bot - Reiniciar"
echo "  pm2 stop ia-atendimento-bot   - Parar"
echo "  pm2 monit                     - Interface gráfica"

