# Guia de Produção - IA Atendimento Bot

## 🎯 Visão Geral

Este documento contém informações essenciais para operar o sistema IA Atendimento Bot em ambiente de produção.

## 📊 Monitoramento em Produção

### Endpoints de Saúde

| Endpoint | Descrição | Frequência |
|----------|-----------|------------|
| `/monitoring/health` | Status geral do sistema | 30s |
| `/monitoring/stats` | Estatísticas completas | 1min |
| `/monitoring/stats/24h` | Estatísticas das últimas 24h | 5min |
| `/admin` | Dashboard web | Manual |

### Alertas Recomendados

#### Críticos (Ação Imediata)
- Status != "healthy"
- Uptime < 1 minuto
- Erros > 10 nas últimas 5 minutos
- Uso de memória > 90%
- Redis desconectado

#### Avisos (Monitorar)
- Uptime < 5 minutos
- Erros > 5 nas últimas 5 minutos
- Uso de memória > 80%
- Latência > 5 segundos

### Configuração de Alertas

#### Com Uptime Robot
```
URL: https://seu-dominio.com/monitoring/health
Intervalo: 5 minutos
Timeout: 30 segundos
```

#### Com Prometheus + Alertmanager
```yaml
groups:
- name: ia-atendimento-bot
  rules:
  - alert: ServiceDown
    expr: up{job="ia-atendimento-bot"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "IA Atendimento Bot está fora do ar"
  
  - alert: HighMemoryUsage
    expr: process_resident_memory_bytes / 1024 / 1024 / 1024 > 1
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "Uso de memória alto: {{ $value }}GB"
```

## 🔧 Manutenção Rotineira

### Diária
- [ ] Verificar logs de erro
- [ ] Verificar status dos containers/serviços
- [ ] Verificar uso de recursos
- [ ] Verificar backup automático

### Semanal
- [ ] Revisar métricas de performance
- [ ] Verificar logs de acesso
- [ ] Atualizar dependências (se necessário)
- [ ] Verificar certificados SSL

### Mensal
- [ ] Análise de logs de longo prazo
- [ ] Revisão de configurações de segurança
- [ ] Teste de disaster recovery
- [ ] Atualização do sistema operacional

## 📈 Otimização de Performance

### Configurações Recomendadas

#### PM2 (ecosystem.config.js)
```javascript
{
  instances: 'max',           // Usar todos os cores
  max_memory_restart: '500M', // Restart se memória > 500MB
  cron_restart: '0 3 * * *'   // Restart diário às 3h
}
```

#### Nginx (nginx.conf)
```nginx
worker_processes auto;
worker_connections 1024;
keepalive_timeout 65;
gzip on;
gzip_comp_level 6;
```

#### Redis
```conf
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

### Monitoramento de Performance

#### Métricas Importantes
- **Throughput**: Mensagens processadas por minuto
- **Latência**: Tempo de resposta médio
- **Disponibilidade**: Uptime do serviço
- **Erro Rate**: Percentual de requisições com erro
- **Uso de Recursos**: CPU, Memória, Disco

#### Ferramentas Recomendadas
- **APM**: New Relic, DataDog, AppDynamics
- **Logs**: ELK Stack, Splunk, Fluentd
- **Métricas**: Prometheus + Grafana
- **Uptime**: Uptime Robot, Pingdom

## 🔒 Segurança em Produção

### Checklist de Segurança

#### Aplicação
- [ ] Variáveis de ambiente seguras
- [ ] Logs sem informações sensíveis
- [ ] Rate limiting configurado
- [ ] Headers de segurança (HSTS, CSP, etc.)
- [ ] Validação de entrada rigorosa

#### Infraestrutura
- [ ] Firewall configurado
- [ ] SSL/TLS configurado
- [ ] Containers com usuário não-root
- [ ] Imagens Docker atualizadas
- [ ] Backup criptografado

#### Acesso
- [ ] SSH com chaves (sem senha)
- [ ] Acesso restrito por IP
- [ ] Logs de acesso monitorados
- [ ] Rotação de senhas
- [ ] 2FA habilitado

### Configurações de Segurança

#### Nginx
```nginx
# Headers de segurança
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req zone=api burst=20 nodelay;
```

#### Docker
```dockerfile
# Usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs
```

## 🚨 Procedimentos de Emergência

### Serviço Fora do Ar

1. **Verificar Status**
```bash
# PM2
pm2 status
pm2 logs ia-atendimento-bot --lines 50

# Docker
docker-compose ps
docker-compose logs app --tail 50
```

2. **Restart do Serviço**
```bash
# PM2
pm2 restart ia-atendimento-bot

# Docker
docker-compose restart app
```

3. **Se não resolver**
```bash
# PM2
pm2 delete ia-atendimento-bot
pm2 start ecosystem.config.js --env production

# Docker
docker-compose down
docker-compose up -d --build
```

### Alto Uso de Memória

1. **Verificar Uso**
```bash
# PM2
pm2 monit

# Docker
docker stats
```

2. **Restart Preventivo**
```bash
# PM2 (configurado para restart automático)
pm2 restart ia-atendimento-bot

# Docker
docker-compose restart app
```

### Problemas de Conectividade

1. **Verificar Redis**
```bash
redis-cli ping
```

2. **Verificar Rede**
```bash
# Testar conectividade
curl -v http://localhost:1337/monitoring/health
```

3. **Verificar DNS**
```bash
nslookup seu-dominio.com
```

### Rollback de Emergência

1. **Backup Atual**
```bash
./scripts/deploy.sh backup
```

2. **Rollback**
```bash
./scripts/deploy.sh rollback
```

3. **Verificar Funcionamento**
```bash
curl http://localhost/monitoring/health
```

## 📋 Logs e Auditoria

### Estrutura de Logs

```
logs/
├── combined.log      # Todos os logs
├── error.log         # Apenas erros
├── access.log        # Logs de acesso (Nginx)
└── audit.log         # Logs de auditoria
```

### Níveis de Log

- **ERROR**: Erros críticos que impedem funcionamento
- **WARN**: Avisos que podem afetar performance
- **INFO**: Informações gerais de operação
- **DEBUG**: Informações detalhadas (apenas desenvolvimento)

### Retenção de Logs

```bash
# Configuração PM2
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

### Análise de Logs

#### Comandos Úteis
```bash
# Erros nas últimas 24h
grep "ERROR" logs/error.log | grep "$(date +%Y-%m-%d)"

# Top 10 IPs com mais requisições
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -nr | head -10

# Tempo de resposta médio
grep "processingTime" logs/combined.log | awk '{sum+=$NF; count++} END {print sum/count}'
```

## 🔄 Backup e Recovery

### Estratégia de Backup

#### Dados Críticos
- Configurações (.env, nginx.conf)
- Logs de auditoria
- Dados do Redis (se persistente)
- Certificados SSL

#### Frequência
- **Configurações**: Diário
- **Logs**: Semanal
- **Redis**: Diário (se persistente)
- **Certificados**: Mensal

### Script de Backup

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/var/backups/ia-atendimento"
DATE=$(date +%Y%m%d_%H%M%S)

# Criar diretório de backup
mkdir -p $BACKUP_DIR/$DATE

# Backup de configurações
cp .env $BACKUP_DIR/$DATE/
cp nginx/nginx.conf $BACKUP_DIR/$DATE/
cp ecosystem.config.js $BACKUP_DIR/$DATE/

# Backup de logs
tar -czf $BACKUP_DIR/$DATE/logs.tar.gz logs/

# Backup do Redis (se persistente)
redis-cli --rdb $BACKUP_DIR/$DATE/redis.rdb

# Limpar backups antigos (manter 30 dias)
find $BACKUP_DIR -type d -mtime +30 -exec rm -rf {} \;
```

### Recovery

1. **Restaurar Configurações**
```bash
cp /var/backups/ia-atendimento/YYYYMMDD_HHMMSS/.env .
cp /var/backups/ia-atendimento/YYYYMMDD_HHMMSS/nginx.conf nginx/
```

2. **Restaurar Redis**
```bash
redis-cli --pipe < /var/backups/ia-atendimento/YYYYMMDD_HHMMSS/redis.rdb
```

3. **Reiniciar Serviços**
```bash
pm2 restart ia-atendimento-bot
# ou
docker-compose restart
```

## 📞 Contatos de Emergência

### Equipe Técnica
- **DevOps**: devops@empresa.com
- **Desenvolvimento**: dev@empresa.com
- **Infraestrutura**: infra@empresa.com

### Fornecedores
- **Hosting**: suporte@hosting.com
- **CDN**: suporte@cdn.com
- **Monitoramento**: suporte@monitoring.com

### Escalação
1. **Nível 1**: Equipe de desenvolvimento
2. **Nível 2**: DevOps/Infraestrutura
3. **Nível 3**: Arquitetos/CTO

---

**Última atualização**: $(date)
**Versão**: 2.0.0
**Responsável**: Equipe de Desenvolvimento

