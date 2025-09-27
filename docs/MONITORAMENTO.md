# Sistema de Monitoramento - IA Atendimento Bot

## Visão Geral

O sistema de monitoramento foi implementado para fornecer visibilidade completa sobre o funcionamento do bot de atendimento, incluindo métricas de performance, status de saúde e logs estruturados.

## Componentes Implementados

### 1. Sistema de Logs Estruturados (Winston)

**Arquivo:** `config/logger.js`

- Logs estruturados em JSON
- Rotação automática de arquivos (5MB, máximo 5 arquivos)
- Níveis de log configuráveis via `LOG_LEVEL`
- Logs separados para erros (`error.log`) e gerais (`combined.log`)
- Mascaramento de números de telefone para privacidade

**Uso:**
```javascript
import logger from './config/logger.js';
import { logMessage, logError, logStats } from './config/logger.js';

// Log geral
logger.info('Mensagem informativa');

// Log de mensagem processada
logMessage(phone, message, response, processingTime);

// Log de erro
logError(error, { context: 'webhook' });

// Log de estatísticas
logStats({ messages: 100, users: 50 });
```

### 2. Serviço de Estatísticas

**Arquivo:** `services/statsService.js`

- Contagem de mensagens processadas
- Contagem de usuários ativos
- Contagem de erros
- Estatísticas diárias com reset automático
- Integração com Redis para persistência
- Cálculo de uptime e uso de memória

**Funcionalidades:**
- `incrementMessageCount(phone)` - Incrementa contador de mensagens
- `incrementErrorCount()` - Incrementa contador de erros
- `getStats()` - Retorna estatísticas completas
- `getHealthStatus()` - Retorna status de saúde
- `getLast24hStats()` - Estatísticas das últimas 24h

### 3. Middleware de Monitoramento

**Arquivo:** `middleware/statsMiddleware.js`

- `messageCounter` - Conta mensagens processadas automaticamente
- `errorCounter` - Conta erros e faz log estruturado
- `requestLogger` - Log de todas as requisições HTTP

### 4. Endpoints de API

**Arquivo:** `routes/monitoring.js`

#### GET /monitoring/health
Retorna status de saúde do sistema:
```json
{
  "status": "healthy",
  "uptime": 3600,
  "uptimeFormatted": "1h 0m 0s",
  "redis": {
    "connected": true,
    "status": "connected"
  },
  "memory": {
    "used": 45,
    "total": 128
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### GET /monitoring/stats
Retorna estatísticas completas:
```json
{
  "uptime": 3600,
  "uptimeFormatted": "1h 0m 0s",
  "memory": {
    "used": 45,
    "total": 128,
    "external": 12
  },
  "messages": {
    "total": 1500,
    "today": 250
  },
  "errors": {
    "total": 5,
    "today": 1
  },
  "users": {
    "active": 45,
    "today": 30
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### GET /monitoring/stats/24h
Retorna estatísticas das últimas 24 horas:
```json
{
  "period": "last_24h",
  "startTime": "2024-01-01T00:00:00.000Z",
  "endTime": "2024-01-01T12:00:00.000Z",
  "messages": 250,
  "errors": 1,
  "users": 30,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### POST /monitoring/stats/reset
Reset manual das estatísticas (apenas em desenvolvimento).

### 5. Dashboard Web

**Arquivo:** `public/admin.html`

- Interface web responsiva e moderna
- Atualização automática a cada 30 segundos
- Métricas em tempo real:
  - Status do sistema e Redis
  - Uptime e uso de memória
  - Contadores de mensagens
  - Usuários ativos
  - Contadores de erros
- Design responsivo para mobile e desktop

**Acesso:** `http://localhost:1337/admin`

## Configuração

### Variáveis de Ambiente

```env
# Nível de log (opcional)
LOG_LEVEL=info

# Redis (opcional - sistema funciona sem)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=sua_senha

# Ambiente
NODE_ENV=production
```

### Estrutura de Arquivos

```
ia-atendimento-atualizacao/
├── config/
│   └── logger.js              # Configuração do Winston
├── services/
│   └── statsService.js        # Serviço de estatísticas
├── middleware/
│   └── statsMiddleware.js     # Middleware de monitoramento
├── routes/
│   └── monitoring.js          # Endpoints de monitoramento
├── public/
│   └── admin.html             # Dashboard web
├── logs/                      # Diretório de logs (criado automaticamente)
│   ├── error.log             # Logs de erro
│   └── combined.log          # Todos os logs
└── app.js                    # Aplicação principal atualizada
```

## Uso

### Iniciar o Servidor

```bash
npm start
```

### Acessar o Dashboard

1. Abra o navegador em `http://localhost:1337/admin`
2. O dashboard será atualizado automaticamente a cada 30 segundos
3. Use o botão "Atualizar Dados" para refresh manual

### Verificar Status via API

```bash
# Status de saúde
curl http://localhost:1337/monitoring/health

# Estatísticas completas
curl http://localhost:1337/monitoring/stats

# Estatísticas das últimas 24h
curl http://localhost:1337/monitoring/stats/24h
```

## Logs

Os logs são salvos em:
- `logs/error.log` - Apenas erros
- `logs/combined.log` - Todos os logs
- Console - Logs em tempo real com cores

### Formato dos Logs

```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "level": "info",
  "message": "Message processed",
  "service": "ia-atendimento-bot",
  "phone": "5511999****",
  "processingTime": 150,
  "statusCode": 200
}
```

## Monitoramento em Produção

### Health Checks

Configure seu sistema de monitoramento para verificar:
- `GET /monitoring/health` - Status geral
- Verificar se `status === "healthy"`
- Verificar se `redis.connected === true`

### Alertas

Configure alertas para:
- Status != "healthy"
- Número de erros > threshold
- Uso de memória > 80%
- Redis desconectado

### Logs em Produção

- Configure rotação de logs adequada
- Monitore o tamanho dos arquivos de log
- Configure envio de logs para sistema centralizado (ELK, Splunk, etc.)

## Troubleshooting

### Redis Desconectado

O sistema funciona normalmente sem Redis, mas as estatísticas não serão persistidas entre reinicializações.

### Logs Não Aparecem

Verifique:
1. Permissões de escrita no diretório `logs/`
2. Variável `LOG_LEVEL` configurada corretamente
3. Espaço em disco disponível

### Dashboard Não Carrega

Verifique:
1. Servidor rodando na porta correta
2. Arquivo `public/admin.html` existe
3. Não há erros no console do navegador

