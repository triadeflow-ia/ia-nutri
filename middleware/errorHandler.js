// middleware/errorHandler.js
// Error boundary global e tratamento centralizado de erros

import { ErrorUtils, ErrorFactory } from '../utils/errors.js';
import logger from '../config/logger.js';
import statsService from '../services/statsService.js';

/**
 * Error boundary global para capturar todos os erros não tratados
 */
export const globalErrorHandler = (error, req, res, next) => {
  // Converter erro não operacional em operacional
  const operationalError = ErrorUtils.convertToOperationalError(error);
  
  // Logar erro
  ErrorUtils.logError(operationalError, {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body
  });

  // Incrementar contador de erros
  statsService.incrementErrorCount().catch(err => {
    logger.error('Failed to increment error count', { error: err.message });
  });

  // Enviar alerta para erros críticos
  if (operationalError.statusCode >= 500) {
    sendCriticalErrorAlert(operationalError, req);
  }

  // Criar resposta de erro
  const errorResponse = ErrorUtils.createErrorResponse(
    operationalError, 
    process.env.NODE_ENV === 'development'
  );

  // Adicionar headers de rate limiting se aplicável
  if (operationalError.code === 'RATE_LIMIT_EXCEEDED' && operationalError.retryAfter) {
    res.set('Retry-After', operationalError.retryAfter);
  }

  // Enviar resposta
  if (!res.headersSent) {
    res.status(operationalError.statusCode || 500).json(errorResponse);
  }
};

/**
 * Handler para rotas não encontradas
 */
export const notFoundHandler = (req, res) => {
  const error = ErrorFactory.createNotFoundError('Rota');
  error.userMessage = 'A página solicitada não foi encontrada.';
  
  ErrorUtils.logError(error, {
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  const errorResponse = ErrorUtils.createErrorResponse(error);
  res.status(404).json(errorResponse);
};

/**
 * Handler para erros de validação do Express
 */
export const validationErrorHandler = (error, req, res, next) => {
  if (error.name === 'ValidationError') {
    const validationError = ErrorFactory.createValidationError(
      error.message,
      error.path
    );
    
    ErrorUtils.logError(validationError, {
      url: req.url,
      method: req.method,
      validationErrors: error.errors
    });

    const errorResponse = ErrorUtils.createErrorResponse(validationError);
    return res.status(400).json(errorResponse);
  }
  
  next(error);
};

/**
 * Handler para erros de sintaxe JSON
 */
export const jsonSyntaxErrorHandler = (error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    const syntaxError = ErrorFactory.createValidationError(
      'JSON inválido',
      'body',
      'O formato dos dados enviados é inválido. Verifique e tente novamente.'
    );
    
    ErrorUtils.logError(syntaxError, {
      url: req.url,
      method: req.method,
      body: req.body
    });

    const errorResponse = ErrorUtils.createErrorResponse(syntaxError);
    return res.status(400).json(errorResponse);
  }
  
  next(error);
};

/**
 * Handler para erros de timeout
 */
export const timeoutErrorHandler = (error, req, res, next) => {
  if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
    const timeoutError = ErrorFactory.createTimeoutError(
      req.url,
      null,
      'A operação demorou mais que o esperado. Tente novamente.'
    );
    
    ErrorUtils.logError(timeoutError, {
      url: req.url,
      method: req.method,
      timeout: error.timeout
    });

    const errorResponse = ErrorUtils.createErrorResponse(timeoutError);
    return res.status(408).json(errorResponse);
  }
  
  next(error);
};

/**
 * Handler para erros de conexão
 */
export const connectionErrorHandler = (error, req, res, next) => {
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    const connectionError = ErrorFactory.createExternalServiceError(
      'External Service',
      'Serviço externo indisponível',
      error,
      'Estamos com problemas de conexão. Tente novamente em alguns instantes.'
    );
    
    ErrorUtils.logError(connectionError, {
      url: req.url,
      method: req.method,
      service: connectionError.service
    });

    const errorResponse = ErrorUtils.createErrorResponse(connectionError);
    return res.status(502).json(errorResponse);
  }
  
  next(error);
};

/**
 * Handler para erros de processamento de mídia
 */
export const mediaErrorHandler = (error, req, res, next) => {
  if (error.message.includes('media') || error.message.includes('image') || 
      error.message.includes('audio') || error.message.includes('document')) {
    const mediaError = ErrorFactory.createMediaProcessingError(
      'unknown',
      error.message,
      'Não foi possível processar o arquivo enviado. Verifique o formato e tente novamente.'
    );
    
    ErrorUtils.logError(mediaError, {
      url: req.url,
      method: req.method,
      mediaType: mediaError.mediaType
    });

    const errorResponse = ErrorUtils.createErrorResponse(mediaError);
    return res.status(422).json(errorResponse);
  }
  
  next(error);
};

/**
 * Handler para erros de webhook
 */
export const webhookErrorHandler = (error, req, res, next) => {
  if (req.url.includes('/webhook')) {
    const webhookError = ErrorFactory.createWebhookError(
      'WhatsApp',
      error.message,
      'Erro ao processar webhook. Verifique a configuração.'
    );
    
    ErrorUtils.logError(webhookError, {
      url: req.url,
      method: req.method,
      webhookType: webhookError.webhookType,
      body: req.body
    });

    const errorResponse = ErrorUtils.createErrorResponse(webhookError);
    return res.status(400).json(errorResponse);
  }
  
  next(error);
};

/**
 * Handler para erros de rate limiting
 */
export const rateLimitErrorHandler = (error, req, res, next) => {
  if (error.code === 'RATE_LIMIT_EXCEEDED' || res.rateLimitExceeded) {
    const rateLimitError = ErrorFactory.createRateLimitError(
      error.message || 'Rate limit exceeded',
      res.rateLimitInfo?.resetTime ? Math.ceil((res.rateLimitInfo.resetTime - Date.now()) / 1000) : null,
      res.rateLimitInfo?.message || 'Você enviou muitas mensagens. Aguarde um momento antes de tentar novamente.'
    );
    
    ErrorUtils.logError(rateLimitError, {
      url: req.url,
      method: req.method,
      retryAfter: rateLimitError.retryAfter
    });

    const errorResponse = ErrorUtils.createErrorResponse(rateLimitError);
    if (rateLimitError.retryAfter) {
      res.set('Retry-After', rateLimitError.retryAfter);
    }
    return res.status(429).json(errorResponse);
  }
  
  next(error);
};

/**
 * Enviar alerta para erros críticos
 */
async function sendCriticalErrorAlert(error, req) {
  try {
    const alertData = {
      level: 'CRITICAL',
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        stack: error.stack
      },
      request: {
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      },
      system: {
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        nodeVersion: process.version
      }
    };

    // Log crítico
    logger.error('CRITICAL ERROR ALERT', alertData);

    // Aqui você pode adicionar integração com serviços de alerta
    // como Slack, Discord, email, etc.
    await sendAlertToExternalService(alertData);

  } catch (alertError) {
    logger.error('Failed to send critical error alert', { 
      error: alertError.message,
      originalError: error.message 
    });
  }
}

/**
 * Enviar alerta para serviço externo (implementar conforme necessário)
 */
async function sendAlertToExternalService(alertData) {
  // Implementar integração com serviço de alertas
  // Exemplo: Slack, Discord, email, etc.
  
  if (process.env.ALERT_WEBHOOK_URL) {
    try {
      const fetch = (await import('node-fetch')).default;
      await fetch(process.env.ALERT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 ERRO CRÍTICO no IA Atendimento Bot`,
          attachments: [{
            color: 'danger',
            fields: [
              { title: 'Erro', value: alertData.error.message, short: false },
              { title: 'Código', value: alertData.error.code, short: true },
              { title: 'Status', value: alertData.error.statusCode, short: true },
              { title: 'URL', value: alertData.request.url, short: false },
              { title: 'Método', value: alertData.request.method, short: true },
              { title: 'IP', value: alertData.request.ip, short: true },
              { title: 'Timestamp', value: alertData.request.timestamp, short: false }
            ]
          }]
        })
      });
    } catch (error) {
      logger.error('Failed to send alert to external service', { error: error.message });
    }
  }
}

/**
 * Middleware para capturar erros assíncronos
 */
export const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Middleware para capturar erros de webhook específicos
 */
export const webhookErrorBoundary = (req, res, next) => {
  try {
    // Validar estrutura básica do webhook
    if (!req.body || !req.body.entry) {
      throw ErrorFactory.createWebhookError(
        'WhatsApp',
        'Estrutura de webhook inválida',
        'Formato de dados inválido. Verifique a configuração do webhook.'
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware para capturar erros de processamento de mensagens
 */
export const messageProcessingErrorBoundary = (req, res, next) => {
  try {
    // Validar dados básicos da mensagem
    const entry = req.body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const messages = changes?.value?.messages;

    if (!messages || !Array.isArray(messages)) {
      throw ErrorFactory.createWebhookError(
        'WhatsApp',
        'Nenhuma mensagem encontrada no webhook',
        'Webhook recebido sem mensagens válidas.'
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default {
  globalErrorHandler,
  notFoundHandler,
  validationErrorHandler,
  jsonSyntaxErrorHandler,
  timeoutErrorHandler,
  connectionErrorHandler,
  mediaErrorHandler,
  webhookErrorHandler,
  rateLimitErrorHandler,
  asyncErrorHandler,
  webhookErrorBoundary,
  messageProcessingErrorBoundary
};

