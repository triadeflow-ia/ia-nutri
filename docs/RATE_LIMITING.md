# 🚦 Sistema de Rate Limiting Avançado

## 📋 Visão Geral

O sistema de rate limiting implementado oferece controle granular sobre o número de mensagens que cada usuário pode enviar, com limites diferentes para cada tipo de mídia e funcionalidades avançadas como whitelist.

## 🎯 Funcionalidades

### ✅ **Rate Limiting por Tipo de Mídia**
- **Texto**: 20 mensagens por minuto
- **Áudio**: 5 áudios por minuto  
- **Imagem**: 10 imagens por minuto
- **Documento**: 3 documentos por minuto
- **Global**: 50 mensagens totais por minuto

### ✅ **Whitelist**
- Números específicos podem ser isentos de rate limiting
- Gerenciamento via API
- Logs de adição/remoção

### ✅ **Mensagens Amigáveis**
- Mensagens personalizadas para cada tipo de limite
- Informações sobre tempo de reset
- Emojis e formatação clara

### ✅ **Monitoramento**
- Endpoints para verificar status
- Estatísticas em tempo real
- Logs detalhados

## 🔧 Configuração

### **Limites Configuráveis**

```javascript
// services/rateLimitService.js
const limits = {
  text: {
    max: 20,           // 20 mensagens de texto por minuto
    windowMs: 60 * 1000, // 1 minuto
    friendlyMessage: "⏰ Você enviou muitas mensagens de texto! Aguarde 1 minuto antes de enviar mais mensagens. Limite: 20 mensagens por minuto."
  },
  audio: {
    max: 5,            // 5 áudios por minuto
    windowMs: 60 * 1000, // 1 minuto
    friendlyMessage: "🎤 Você enviou muitos áudios! Aguarde 1 minuto antes de enviar mais áudios. Limite: 5 áudios por minuto."
  },
  image: {
    max: 10,           // 10 imagens por minuto
    windowMs: 60 * 1000, // 1 minuto
    friendlyMessage: "📸 Você enviou muitas imagens! Aguarde 1 minuto antes de enviar mais imagens. Limite: 10 imagens por minuto."
  },
  document: {
    max: 3,            // 3 documentos por minuto
    windowMs: 60 * 1000, // 1 minuto
    friendlyMessage: "📄 Você enviou muitos documentos! Aguarde 1 minuto antes de enviar mais documentos. Limite: 3 documentos por minuto."
  }
};
```

### **Whitelist**

```javascript
// Adicionar número à whitelist
rateLimitService.addToWhitelist('+5511999999999');

// Remover número da whitelist
rateLimitService.removeFromWhitelist('+5511999999999');

// Verificar se está na whitelist
const isWhitelisted = rateLimitService.isWhitelisted('+5511999999999');
```

## 📊 Endpoints da API

### **Verificar Status do Rate Limiting**

```bash
GET /rate-limit/status/{phoneNumber}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "phoneNumber": "+5511999999999",
    "isWhitelisted": false,
    "global": {
      "limit": 50,
      "windowMs": 60000,
      "remaining": 45,
      "resetTime": 1640995200000
    },
    "types": {
      "text": {
        "limit": 20,
        "windowMs": 60000,
        "remaining": 18,
        "resetTime": 1640995200000
      },
      "audio": {
        "limit": 5,
        "windowMs": 60000,
        "remaining": 5,
        "resetTime": 1640995200000
      }
    }
  }
}
```

### **Gerenciar Whitelist**

```bash
# Adicionar à whitelist
POST /rate-limit/whitelist/{phoneNumber}

# Remover da whitelist
DELETE /rate-limit/whitelist/{phoneNumber}
```

### **Resetar Rate Limiting**

```bash
# Resetar todos os tipos
POST /rate-limit/reset/{phoneNumber}

# Resetar tipo específico
POST /rate-limit/reset/{phoneNumber}
Content-Type: application/json
{
  "type": "text"
}
```

### **Obter Estatísticas**

```bash
GET /rate-limit/stats
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "whitelistedUsers": ["+5511999999999"],
    "activeUsers": ["+5511888888888", "+5511777777777"],
    "totalActiveUsers": 2,
    "limits": { ... },
    "globalLimit": { ... },
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

### **Obter Configurações de Limites**

```bash
GET /rate-limit/limits
```

## 🧪 Como Testar

### **1. Teste Automático Completo**

```bash
# Executar todos os testes
node scripts/test-rate-limits.js

# Testar tipo específico
node scripts/test-rate-limits.js test text
node scripts/test-rate-limits.js test audio
node scripts/test-rate-limits.js test image
node scripts/test-rate-limits.js test document
```

### **2. Teste Manual via API**

```bash
# Verificar status
curl http://localhost:1337/rate-limit/status/+5511999999999

# Adicionar à whitelist
curl -X POST http://localhost:1337/rate-limit/whitelist/+5511999999999

# Resetar rate limiting
curl -X POST http://localhost:1337/rate-limit/reset/+5511999999999

# Obter estatísticas
curl http://localhost:1337/rate-limit/stats
```

### **3. Teste via Webhook**

```bash
# Simular webhook do WhatsApp
curl -X POST http://localhost:1337/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "ENTRY_ID",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "PHONE_NUMBER_ID",
            "phone_number_id": "PHONE_NUMBER_ID"
          },
          "messages": [{
            "id": "msg_123",
            "from": "+5511999999999",
            "timestamp": 1640995200,
            "type": "text",
            "text": {
              "body": "Teste de mensagem"
            }
          }]
        },
        "field": "messages"
      }]
    }]
  }'
```

## 📈 Monitoramento

### **Logs de Rate Limiting**

```javascript
// Logs são gerados automaticamente
logger.warn('Rate limit exceeded', {
  phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*'),
  messageType: 'text',
  remaining: 0,
  resetTime: 1640995200000
});
```

### **Métricas no Dashboard**

O dashboard em `/admin` mostra:
- Número de usuários ativos
- Estatísticas de mensagens
- Status de rate limiting

### **Alertas Recomendados**

Configure alertas para:
- Muitos usuários atingindo rate limits
- Números sendo adicionados à whitelist
- Erros no sistema de rate limiting

## 🔧 Configuração Avançada

### **Personalizar Limites**

```javascript
// services/rateLimitService.js
this.limits = {
  text: {
    max: 30,           // Aumentar para 30 mensagens
    windowMs: 60 * 1000,
    friendlyMessage: "Sua mensagem personalizada aqui"
  }
};
```

### **Personalizar Mensagens**

```javascript
const friendlyMessage = "🚫 Você atingiu o limite de mensagens! " +
  "Aguarde {time} antes de enviar mais mensagens. " +
  "Limite: {limit} mensagens por minuto.";
```

### **Integração com Redis**

```javascript
// O sistema usa Redis para armazenar contadores
// Chaves: rate_limit:{phoneNumber}:{type}:{timestamp}
// Expiração: baseada no windowMs
```

## 🚨 Troubleshooting

### **Problemas Comuns**

#### 1. Rate limiting não funciona
```bash
# Verificar se Redis está conectado
curl http://localhost:1337/monitoring/health

# Verificar logs
tail -f logs/combined.log | grep "rate limit"
```

#### 2. Whitelist não funciona
```bash
# Verificar se número está na whitelist
curl http://localhost:1337/rate-limit/status/+5511999999999

# Verificar logs de whitelist
tail -f logs/combined.log | grep "whitelist"
```

#### 3. Mensagens não são enviadas
```bash
# Verificar status do rate limiting
curl http://localhost:1337/rate-limit/status/+5511999999999

# Resetar rate limiting se necessário
curl -X POST http://localhost:1337/rate-limit/reset/+5511999999999
```

### **Comandos de Diagnóstico**

```bash
# Status completo
node scripts/test-rate-limits.js status +5511999999999

# Resetar tudo
node scripts/test-rate-limits.js reset +5511999999999

# Ver estatísticas
node scripts/test-rate-limits.js stats
```

## 📚 Exemplos de Uso

### **Exemplo 1: Verificar Status**

```javascript
const response = await fetch('http://localhost:1337/rate-limit/status/+5511999999999');
const data = await response.json();

console.log('Restantes:', data.data.global.remaining);
console.log('Whitelisted:', data.data.isWhitelisted);
```

### **Exemplo 2: Adicionar à Whitelist**

```javascript
const response = await fetch('http://localhost:1337/rate-limit/whitelist/+5511999999999', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
});

const data = await response.json();
console.log('Resultado:', data.message);
```

### **Exemplo 3: Resetar Rate Limiting**

```javascript
const response = await fetch('http://localhost:1337/rate-limit/reset/+5511999999999', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
});

const data = await response.json();
console.log('Rate limiting resetado:', data.success);
```

## 🎯 Próximos Passos

1. **Configure os limites** conforme sua necessidade
2. **Adicione números importantes** à whitelist
3. **Configure monitoramento** para alertas
4. **Teste o sistema** com diferentes cenários
5. **Monitore os logs** para otimizações

---

**Última atualização:** $(date)
**Versão:** 2.0.0
**Status:** ✅ Implementado e Testado

