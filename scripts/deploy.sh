#!/bin/bash
# scripts/deploy.sh
# Script de deploy para produção

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Verificar se Docker está instalado
check_docker() {
    log "Verificando Docker..."
    if ! command -v docker &> /dev/null; then
        error "Docker não está instalado. Instale o Docker primeiro."
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose não está instalado. Instale o Docker Compose primeiro."
    fi
    
    success "Docker e Docker Compose estão instalados"
}

# Verificar se o arquivo .env existe
check_env() {
    log "Verificando arquivo .env..."
    if [ ! -f .env ]; then
        warning "Arquivo .env não encontrado. Copiando de env.example..."
        if [ -f env.example ]; then
            cp env.example .env
            warning "Arquivo .env criado a partir de env.example. Configure as variáveis necessárias."
        else
            error "Arquivo env.example não encontrado. Crie um arquivo .env com as configurações necessárias."
        fi
    else
        success "Arquivo .env encontrado"
    fi
}

# Instalar dependências
install_dependencies() {
    log "Instalando dependências..."
    npm install
    success "Dependências instaladas"
}

# Construir imagem Docker
build_docker() {
    log "Construindo imagem Docker..."
    docker build -t ia-atendimento-bot:latest .
    success "Imagem Docker construída"
}

# Parar containers existentes
stop_containers() {
    log "Parando containers existentes..."
    docker-compose down --remove-orphans || true
    success "Containers parados"
}

# Iniciar containers
start_containers() {
    log "Iniciando containers..."
    docker-compose up -d --build
    success "Containers iniciados"
}

# Verificar saúde dos containers
check_health() {
    log "Verificando saúde dos containers..."
    
    # Aguardar containers iniciarem
    sleep 10
    
    # Verificar se a aplicação está respondendo
    for i in {1..30}; do
        if curl -f http://localhost:1337/monitoring/health > /dev/null 2>&1; then
            success "Aplicação está respondendo"
            return 0
        fi
        log "Aguardando aplicação iniciar... ($i/30)"
        sleep 2
    done
    
    error "Aplicação não está respondendo após 60 segundos"
}

# Mostrar status dos containers
show_status() {
    log "Status dos containers:"
    docker-compose ps
    
    log "Logs da aplicação:"
    docker-compose logs --tail=20 app
}

# Deploy completo
deploy() {
    log "Iniciando deploy..."
    
    check_docker
    check_env
    install_dependencies
    build_docker
    stop_containers
    start_containers
    check_health
    
    success "Deploy concluído com sucesso!"
    
    echo ""
    log "Aplicação disponível em:"
    echo "  - HTTP: http://localhost"
    echo "  - API: http://localhost/monitoring/health"
    echo "  - Dashboard: http://localhost/admin"
    echo ""
    
    show_status
}

# Deploy apenas da aplicação (sem rebuild)
deploy_app() {
    log "Deploy da aplicação..."
    
    check_docker
    check_env
    stop_containers
    start_containers
    check_health
    
    success "Deploy da aplicação concluído!"
}

# Rollback para versão anterior
rollback() {
    log "Fazendo rollback..."
    
    # Parar containers atuais
    docker-compose down
    
    # Iniciar versão anterior (se existir)
    if [ -f docker-compose.backup.yml ]; then
        docker-compose -f docker-compose.backup.yml up -d
        success "Rollback concluído"
    else
        error "Arquivo de backup não encontrado"
    fi
}

# Backup da configuração atual
backup() {
    log "Fazendo backup da configuração atual..."
    cp docker-compose.yml docker-compose.backup.yml
    success "Backup criado: docker-compose.backup.yml"
}

# Mostrar logs
logs() {
    log "Mostrando logs..."
    docker-compose logs -f app
}

# Mostrar ajuda
show_help() {
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos disponíveis:"
    echo "  deploy      - Deploy completo (padrão)"
    echo "  deploy-app  - Deploy apenas da aplicação"
    echo "  build       - Apenas construir imagem Docker"
    echo "  start       - Iniciar containers"
    echo "  stop        - Parar containers"
    echo "  restart     - Reiniciar containers"
    echo "  logs        - Mostrar logs"
    echo "  status      - Mostrar status dos containers"
    echo "  health      - Verificar saúde da aplicação"
    echo "  backup      - Fazer backup da configuração"
    echo "  rollback    - Fazer rollback"
    echo "  help        - Mostrar esta ajuda"
}

# Função principal
main() {
    case "${1:-deploy}" in
        deploy)
            deploy
            ;;
        deploy-app)
            deploy_app
            ;;
        build)
            check_docker
            check_env
            install_dependencies
            build_docker
            ;;
        start)
            check_docker
            check_env
            start_containers
            ;;
        stop)
            stop_containers
            ;;
        restart)
            stop_containers
            start_containers
            check_health
            ;;
        logs)
            logs
            ;;
        status)
            show_status
            ;;
        health)
            check_health
            ;;
        backup)
            backup
            ;;
        rollback)
            rollback
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            error "Comando desconhecido: $1. Use '$0 help' para ver os comandos disponíveis."
            ;;
    esac
}

# Executar função principal
main "$@"