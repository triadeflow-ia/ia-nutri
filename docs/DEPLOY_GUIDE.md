# 🚀 Guia Completo de Deploy em Produção

## 📋 Visão Geral

Este guia fornece instruções detalhadas para fazer deploy do sistema IA Atendimento Bot em produção usando Docker, PM2 e Nginx.

## 🏗️ Arquitetura de Produção

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Nginx       │    │   Aplicação     │    │     Redis       │
│  (Proxy Reverso)│────│   Node.js + PM2 │────│    (Cache)      │
│   Porta 80/443  │    │   Porta 1337    │    │   Porta 6379    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 Estrutura de Arquivos de Deploy

```
ia-atendimento-atualizacao/
├── 🐳 Docker & Containerização
│   ├── Dockerfile                 # Imagem Docker otimizada
│   ├── docker-compose.yml         # Orquestração completa
│   └── .dockerignore              # Otimização de build
│
├── ⚙️ PM2 & Process Management
│   └── ecosystem.config.js        # Configuração PM2
│
├── 🔧 Scripts
│   └── health-check.js            # Health check
│
├── 🌐 Nginx
│   └── nginx/nginx.conf           # Configuração proxy reverso
│
├── 📋 Configuração
│   ├── env.example                # Variáveis de ambiente
│   └── package.json               # Scripts NPM
│
└── 📚 Documentação
    └── DEPLOY_GUIDE.md            # Este guia
```

## 🚀 Métodos de Deploy

### 1. Deploy com Docker Compose (Recomendado)

#### Pré-requisitos
- Docker 20.10+
- Docker Compose 2.0+
- 2GB RAM mínimo
- 10GB espaço em disco

#### Passo a Passo

**1. Clone o repositório**
```bash
git clone <seu-repositorio>
cd ia-atendimento-atualizacao
```

**2. Configure as variáveis de ambiente**
```bash
cp env.example .env
nano .env  # Configure as variáveis necessárias
```

**3. Execute o deploy**
```bash
# Deploy completo
npm run deploy:prod

# Ou usando docker-compose diretamente
docker-compose up -d --build
```

**4. Verifique o status**
```bash
# Status dos containers
docker-compose ps

# Logs da aplicação
docker-compose logs -f app

# Health check
curl http://localhost/monitoring/health
```

### 2. Deploy com PM2 (Sem Docker)

#### Pré-requisitos
- Node.js 18+
- PM2
- Redis
- Nginx (opcional)

#### Passo a Passo

**1. Instale as dependências**
```bash
npm install
npm install -g pm2
```

**2. Configure as variáveis de ambiente**
```bash
cp env.example .env
nano .env
```

**3. Inicie com PM2**
```bash
# Iniciar em produção
npm run start:prod

# Verificar status
npm run status

# Ver logs
npm run logs
```

**4. Configure Nginx (opcional)**
```bash
# Copie a configuração do Nginx
sudo cp nginx/nginx.conf /etc/nginx/sites-available/ia-atendimento
sudo ln -s /etc/nginx/sites-available/ia-atendimento /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## ⚙️ Configuração de Variáveis de Ambiente

### Variáveis Obrigatórias

```env
# OpenAI
OPENAI_API_KEY=sk-sua_chave_aqui

# WhatsApp
WHATSAPP_TOKEN=seu_token_aqui
WHATSAPP_VERIFY_TOKEN=seu_verify_token_aqui

# Redis
REDIS_PASSWORD=sua_senha_redis_aqui
```

### Variáveis Opcionais

```env
# Ambiente
NODE_ENV=production
PORT=1337
LOG_LEVEL=info

# Stripe (se usar pagamentos)
STRIPE_SECRET_KEY=sk_test_sua_chave_aqui
STRIPE_WEBHOOK_SECRET=whsec_seu_webhook_secret_aqui

# APIs Externas
USDA_API_KEY=sua_chave_usda_aqui
EDAMAM_APP_ID=seu_app_id_aqui
EDAMAM_APP_KEY=sua_app_key_aqui
```

## 🔧 Scripts Disponíveis

### Scripts NPM

```bash
# Desenvolvimento
npm run dev                 # Modo desenvolvimento
npm start                   # Iniciar aplicação

# Produção
npm run start:prod         # Iniciar com PM2
npm run restart            # Reiniciar aplicação
npm run stop               # Parar aplicação
npm run delete             # Remover da PM2

# Logs
npm run logs               # Ver todos os logs
npm run logs:error         # Ver apenas erros
npm run logs:out           # Ver apenas output

# Monitoramento
npm run status             # Status da PM2
npm run monit              # Interface gráfica PM2
npm run health             # Health check

# Docker
npm run docker:build       # Construir imagem
npm run docker:run         # Executar container
npm run docker:up          # Subir com compose
npm run docker:down        # Parar containers
npm run docker:logs        # Ver logs Docker
npm run docker:restart     # Reiniciar container

# Deploy
npm run deploy:setup       # Preparar deploy
npm run deploy:prod        # Deploy completo
```

## 🔍 Monitoramento e Health Checks

### Endpoints de Monitoramento

- `GET /monitoring/health` - Status de saúde
- `GET /monitoring/stats` - Estatísticas completas
- `GET /monitoring/stats/24h` - Estatísticas 24h
- `GET /admin` - Dashboard web

### Health Check Manual

```bash
# Via curl
curl http://localhost:1337/monitoring/health

# Via script
node scripts/health-check.js

# Via npm
npm run health
```

### Monitoramento com PM2

```bash
# Status geral
pm2 status

# Interface gráfica
pm2 monit

# Logs em tempo real
pm2 logs

# Reiniciar aplicação
pm2 restart ia-atendimento-bot
```

## 🔒 Configuração de Segurança

### SSL/HTTPS

1. **Obtenha certificados SSL**
```bash
# Com Let's Encrypt (recomendado)
sudo apt install certbot
sudo certbot certonly --standalone -d seu-dominio.com
```

2. **Configure Nginx para HTTPS**
```bash
# Edite nginx/nginx.conf
# Configure os caminhos dos certificados:
# ssl_certificate /etc/letsencrypt/live/seu-dominio.com/fullchain.pem;
# ssl_certificate_key /etc/letsencrypt/live/seu-dominio.com/privkey.pem;
```

### Firewall

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable

# iptables (CentOS/RHEL)
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
```

### Rate Limiting

O Nginx está configurado com rate limiting:
- API: 10 req/s com burst de 20
- Webhooks: 5 req/s com burst de 10

## 📊 Backup e Manutenção

### Backup Automático

```bash
# Adicione ao crontab
0 2 * * * /path/to/backup-script.sh
```

### Limpeza de Logs

```bash
# Limpar logs antigos
find logs/ -name "*.log" -mtime +30 -delete

# Rotacionar logs
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Atualizações

```bash
# Atualizar aplicação
git pull origin main
npm install
pm2 restart ia-atendimento-bot

# Atualizar com Docker
docker-compose down
docker-compose up -d --build
```

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. Aplicação não inicia
```bash
# Verificar logs
pm2 logs ia-atendimento-bot
docker-compose logs app

# Verificar variáveis de ambiente
cat .env

# Verificar portas em uso
netstat -tulpn | grep :1337
```

#### 2. Redis não conecta
```bash
# Verificar se Redis está rodando
redis-cli ping

# Verificar configuração
echo $REDIS_URL
echo $REDIS_PASSWORD
```

#### 3. Nginx não funciona
```bash
# Testar configuração
nginx -t

# Verificar logs
tail -f /var/log/nginx/error.log

# Reiniciar Nginx
sudo systemctl restart nginx
```

#### 4. Health check falha
```bash
# Verificar se a aplicação está respondendo
curl -v http://localhost:1337/monitoring/health

# Verificar logs da aplicação
pm2 logs ia-atendimento-bot --err
```

### Logs Importantes

```bash
# Logs da aplicação
tail -f logs/combined.log
tail -f logs/error.log

# Logs do PM2
pm2 logs

# Logs do Docker
docker-compose logs -f app

# Logs do Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## 📈 Escalabilidade

### Horizontal Scaling

```yaml
# docker-compose.yml
services:
  app:
    deploy:
      replicas: 3
    environment:
      - NODE_ENV=production
```

### Load Balancer

```nginx
# nginx.conf
upstream app {
    server app1:1337;
    server app2:1337;
    server app3:1337;
}
```

### Monitoramento Avançado

- **Prometheus + Grafana** para métricas
- **ELK Stack** para logs centralizados
- **Uptime Robot** para monitoramento externo

## 🎯 Checklist de Deploy

### Antes do Deploy
- [ ] Variáveis de ambiente configuradas
- [ ] Certificados SSL obtidos
- [ ] Firewall configurado
- [ ] Backup do sistema atual
- [ ] Testes locais passando

### Durante o Deploy
- [ ] Deploy executado com sucesso
- [ ] Containers/serviços iniciados
- [ ] Health checks passando
- [ ] Logs sem erros críticos

### Após o Deploy
- [ ] Aplicação acessível via HTTPS
- [ ] Dashboard funcionando
- [ ] Webhooks do WhatsApp funcionando
- [ ] Monitoramento ativo
- [ ] Backup automático configurado

## 📞 Suporte

Para problemas ou dúvidas:
1. Verifique os logs primeiro
2. Consulte esta documentação
3. Execute os health checks
4. Verifique as configurações de rede
5. Entre em contato com a equipe de desenvolvimento

---

**Última atualização:** $(date)
**Versão:** 2.0.0

