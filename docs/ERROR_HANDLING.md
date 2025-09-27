# 🚨 Sistema de Tratamento de Erros Completo

## 📋 Visão Geral

O sistema de tratamento de erros implementado oferece controle granular sobre diferentes tipos de erros, com classes customizadas, error boundaries globais, mensagens amigáveis em português, sistema de fallback e alertas para erros críticos.

## 🎯 Funcionalidades Implementadas

### ✅ **Classes de Erro Customizadas**
- **ValidationError**: Erros de validação de dados (400)
- **AuthenticationError**: Erros de autenticação (401)
- **NotFoundError**: Recursos não encontrados (404)
- **RateLimitError**: Limite de requisições excedido (429)
- **ExternalServiceError**: Erros de serviços externos (502)
- **TimeoutError**: Erros de timeout (408)
- **ConfigurationError**: Erros de configuração (500)
- **MediaProcessingError**: Erros de processamento de mídia (422)
- **DatabaseError**: Erros de banco de dados (503)
- **WebhookError**: Erros de webhook (400)
- **NutritionServiceError**: Erros do serviço de nutrição (502)
- **FallbackError**: Erros de fallback (200)

### ✅ **Error Boundary Global**
- Captura todos os erros não tratados
- Conversão automática de erros não operacionais
- Logs estruturados com contexto
- Respostas padronizadas

### ✅ **Mensagens Amigáveis em Português**
- Mensagens personalizadas para cada tipo de erro
- Tradução automática de erros comuns
- Contexto específico para o usuário

### ✅ **Sistema de Fallback**
- Fallback quando OpenAI está fora
- Fallback quando WhatsApp está fora
- Respostas pré-definidas
- Processamento posterior de mensagens

### ✅ **Sistema de Alertas**
- Alertas para erros críticos
- Integração com Slack, Discord, email
- Thresholds configuráveis
- Cooldowns para evitar spam

## 🔧 Estrutura do Sistema

### **Classes de Erro**

```javascript
// utils/errors.js
export class CustomError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', userMessage = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.userMessage = userMessage || this.getDefaultUserMessage();
    this.timestamp = new Date().toISOString();
    this.isOperational = true;
  }
}
```

### **Error Boundary Global**

```javascript
// middleware/errorHandler.js
export const globalErrorHandler = (error, req, res, next) => {
  const operationalError = ErrorUtils.convertToOperationalError(error);
  ErrorUtils.logError(operationalError, { url: req.url, method: req.method });
  
  if (operationalError.statusCode >= 500) {
    sendCriticalErrorAlert(operationalError, req);
  }
  
  const errorResponse = ErrorUtils.createErrorResponse(operationalError);
  res.status(operationalError.statusCode || 500).json(errorResponse);
};
```

### **Sistema de Fallback**

```javascript
// services/fallbackService.js
class FallbackService {
  async processMessageWithFallback(message, phoneNumber, profileName, phoneNumberId, res) {
    const openAIStatus = await this.checkOpenAIStatus();
    const whatsAppStatus = await this.checkWhatsAppStatus();

    if (!openAIStatus) {
      return await this.handleOpenAIFallback(message, phoneNumber, profileName, phoneNumberId, res);
    }

    if (!whatsAppStatus) {
      return await this.handleWhatsAppFallback(message, phoneNumber, profileName, phoneNumberId, res);
    }

    return { useNormalProcessing: true };
  }
}
```

## 📊 Exemplos de Uso

### **1. Criar Erro Customizado**

```javascript
import { ErrorFactory } from './utils/errors.js';

// Erro de validação
const validationError = ErrorFactory.createValidationError(
  'Email é obrigatório',
  'email',
  'Por favor, forneça um email válido.'
);

// Erro de serviço externo
const serviceError = ErrorFactory.createExternalServiceError(
  'OpenAI',
  'Serviço indisponível',
  null,
  'Estamos com problemas técnicos. Tente novamente em alguns instantes.'
);

// Erro de rate limiting
const rateLimitError = ErrorFactory.createRateLimitError(
  'Muitas requisições',
  60,
  'Você enviou muitas mensagens. Aguarde 1 minuto antes de tentar novamente.'
);
```

### **2. Tratar Erro com Fallback**

```javascript
try {
  const result = await openaiService.runAssistant(threadId, whatsappData);
  return result;
} catch (error) {
  // Logar erro
  ErrorUtils.logError(error, { threadId, operation: 'runAssistant' });
  
  // Usar fallback
  const fallbackResult = await fallbackService.processMessageWithFallback(
    message, phoneNumber, profileName, phoneNumberId, res
  );
  
  if (fallbackResult.success) {
    return fallbackResult;
  }
  
  // Último recurso
  throw ErrorFactory.createFallbackError(error, 'Sistema temporariamente indisponível');
}
```

### **3. Configurar Alertas**

```javascript
import alertService from './services/alertService.js';

// Configurar thresholds
alertService.setThresholds({
  errorRate: 0.15,        // 15% de taxa de erro
  memoryUsage: 0.85,      // 85% de uso de memória
  consecutiveErrors: 3    // 3 erros consecutivos
});

// Configurar cooldowns
alertService.setCooldowns({
  errorRate: 600000,      // 10 minutos
  criticalErrors: 30000   // 30 segundos
});

// Registrar erro
alertService.recordError(error, { context: 'messageProcessing' });
```

### **4. Usar Error Boundary em Rotas**

```javascript
import { asyncErrorHandler, webhookErrorBoundary } from './middleware/errorHandler.js';

// Rota com error boundary
app.use('/webhook', webhookErrorBoundary, webhookRoutes);

// Função assíncrona com tratamento de erro
const processMessage = asyncErrorHandler(async (req, res) => {
  // Sua lógica aqui
  // Erros serão capturados automaticamente
});
```

## 🧪 Como Testar

### **1. Teste Automático Completo**

```bash
# Executar todos os testes
node scripts/test-error-handling.js

# Testar componentes específicos
node scripts/test-error-handling.js errors
node scripts/test-error-handling.js fallback
node scripts/test-error-handling.js alerts
node scripts/test-error-handling.js messages
```

### **2. Teste Manual de Classes de Erro**

```javascript
import { ErrorFactory, ErrorUtils } from './utils/errors.js';

// Testar criação de erro
const error = ErrorFactory.createValidationError('Campo obrigatório');
console.log(error.toJSON());

// Testar conversão
const convertedError = ErrorUtils.convertToOperationalError(new Error('ENOTFOUND'));
console.log(convertedError.userMessage);

// Testar resposta padronizada
const response = ErrorUtils.createErrorResponse(error);
console.log(response);
```

### **3. Teste de Fallback**

```javascript
import fallbackService from './services/fallbackService.js';

// Simular OpenAI fora
fallbackService.setOpenAIStatus(true);

// Processar mensagem
const result = await fallbackService.processMessageWithFallback(
  message, phoneNumber, profileName, phoneNumberId, res
);

console.log('Fallback usado:', result.fallback);
```

### **4. Teste de Alertas**

```javascript
import alertService from './services/alertService.js';

// Simular erro crítico
const error = ErrorFactory.createExternalServiceError('OpenAI', 'Serviço indisponível');
alertService.recordError(error, { context: 'test' });

// Verificar estatísticas
const stats = alertService.getAlertStats();
console.log('Erros registrados:', stats.errorCount);
```

## 📈 Monitoramento

### **Logs Estruturados**

```javascript
// Logs são gerados automaticamente
logger.error('Error occurred', {
  name: error.name,
  message: error.message,
  code: error.code,
  statusCode: error.statusCode,
  userMessage: error.userMessage,
  timestamp: error.timestamp,
  context: { phoneNumber: '+5511999999999' }
});
```

### **Alertas Automáticos**

- **Taxa de erro alta**: > 10% de requisições com erro
- **Uso de memória alto**: > 80% de uso de memória
- **Erros consecutivos**: > 5 erros consecutivos
- **Erros críticos**: Status 500+ ou códigos específicos

### **Integrações de Alerta**

```bash
# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Discord
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...

# Email
EMAIL_ALERTS_ENABLED=true

# Webhook customizado
ALERT_WEBHOOK_URL=https://seu-servidor.com/alerts
```

## 🔧 Configuração

### **Variáveis de Ambiente**

```bash
# Alertas
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
EMAIL_ALERTS_ENABLED=true
ALERT_WEBHOOK_URL=https://seu-servidor.com/alerts

# Fallback
FALLBACK_ENABLED=true
FALLBACK_MESSAGES_PATH=./config/fallback-messages.json

# Logs
LOG_LEVEL=info
LOG_ERRORS_TO_FILE=true
```

### **Configuração de Thresholds**

```javascript
// services/alertService.js
this.alertThresholds = {
  errorRate: 0.1,        // 10% de taxa de erro
  responseTime: 5000,     // 5 segundos
  memoryUsage: 0.8,       // 80% de uso de memória
  consecutiveErrors: 5,   // 5 erros consecutivos
  criticalErrors: 1       // 1 erro crítico
};
```

## 🚨 Exemplos de Tratamento de Erros

### **1. Erro de Validação**

```javascript
// Input: { email: "invalid-email" }
try {
  if (!isValidEmail(email)) {
    throw ErrorFactory.createValidationError(
      'Email inválido',
      'email',
      'Por favor, forneça um email válido.'
    );
  }
} catch (error) {
  // Resposta: 400 Bad Request
  // {
  //   "success": false,
  //   "error": {
  //     "message": "Email inválido",
  //     "code": "VALIDATION_ERROR",
  //     "statusCode": 400,
  //     "userMessage": "Por favor, forneça um email válido."
  //   }
  // }
}
```

### **2. Erro de Serviço Externo**

```javascript
// OpenAI está fora
try {
  const response = await openaiService.runAssistant(threadId, whatsappData);
} catch (error) {
  // Fallback automático
  const fallbackResult = await fallbackService.processMessageWithFallback(
    message, phoneNumber, profileName, phoneNumberId, res
  );
  
  // Resposta: Mensagem de fallback
  // "👋 Olá! Estou com problemas técnicos temporários, mas posso te ajudar com algumas funcionalidades básicas."
}
```

### **3. Erro de Rate Limiting**

```javascript
// Muitas requisições
try {
  const result = await rateLimitService.checkRateLimit(phoneNumber, 'text');
  if (!result.allowed) {
    throw ErrorFactory.createRateLimitError(
      'Rate limit exceeded',
      result.retryAfter,
      'Você enviou muitas mensagens. Aguarde um momento antes de tentar novamente.'
    );
  }
} catch (error) {
  // Resposta: 429 Too Many Requests
  // {
  //   "success": false,
  //   "error": {
  //     "message": "Rate limit exceeded",
  //     "code": "RATE_LIMIT_EXCEEDED",
  //     "statusCode": 429,
  //     "userMessage": "Você enviou muitas mensagens. Aguarde um momento antes de tentar novamente.",
  //     "retryAfter": 60
  //   }
  // }
}
```

### **4. Erro de Timeout**

```javascript
// Timeout na API
try {
  const response = await fetch(apiUrl, { timeout: 5000 });
} catch (error) {
  if (error.code === 'ETIMEDOUT') {
    throw ErrorFactory.createTimeoutError(
      'API Call',
      5000,
      'A operação demorou mais que o esperado. Tente novamente.'
    );
  }
}
```

## 📚 Documentação das Classes

### **CustomError (Classe Base)**

```javascript
class CustomError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', userMessage = null)
  
  // Propriedades
  statusCode: number
  code: string
  userMessage: string
  timestamp: string
  isOperational: boolean
  
  // Métodos
  toJSON(): object
  getDefaultUserMessage(): string
}
```

### **ErrorFactory**

```javascript
class ErrorFactory {
  static createValidationError(message, field = null): ValidationError
  static createAuthenticationError(message): AuthenticationError
  static createNotFoundError(resource): NotFoundError
  static createRateLimitError(message, retryAfter = null): RateLimitError
  static createExternalServiceError(service, message, originalError = null): ExternalServiceError
  static createTimeoutError(operation, timeout = null): TimeoutError
  static createConfigurationError(configKey, message): ConfigurationError
  static createMediaProcessingError(mediaType, message): MediaProcessingError
  static createDatabaseError(operation, message): DatabaseError
  static createWebhookError(webhookType, message): WebhookError
  static createNutritionServiceError(operation, message): NutritionServiceError
  static createFallbackError(originalError, fallbackMessage): FallbackError
}
```

### **ErrorUtils**

```javascript
class ErrorUtils {
  static isOperationalError(error): boolean
  static convertToOperationalError(error): CustomError
  static getUserFriendlyMessage(error): string
  static logError(error, context = {}): void
  static createErrorResponse(error, includeStack = false): object
}
```

## 🎯 Próximos Passos

1. **Configure os alertas** conforme sua necessidade
2. **Ajuste os thresholds** baseado no seu uso
3. **Teste o sistema** com diferentes cenários
4. **Monitore os logs** para otimizações
5. **Configure integrações** de alerta

---

**Última atualização:** $(date)
**Versão:** 2.0.0
**Status:** ✅ Implementado e Testado

