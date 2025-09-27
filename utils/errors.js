// utils/errors.js
// Classes de erro customizadas e sistema de tratamento de erros

import logger from '../config/logger.js';

/**
 * Classe base para erros customizados
 */
export class CustomError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', userMessage = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.userMessage = userMessage || this.getDefaultUserMessage();
    this.timestamp = new Date().toISOString();
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  getDefaultUserMessage() {
    return 'Ocorreu um erro inesperado. Tente novamente em alguns instantes.';
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      userMessage: this.userMessage,
      timestamp: this.timestamp,
      isOperational: this.isOperational
    };
  }
}

/**
 * Erro de validação de dados
 */
export class ValidationError extends CustomError {
  constructor(message, field = null, userMessage = null) {
    super(message, 400, 'VALIDATION_ERROR', userMessage);
    this.field = field;
  }

  getDefaultUserMessage() {
    return 'Os dados fornecidos são inválidos. Verifique as informações e tente novamente.';
  }
}

/**
 * Erro de autenticação/autorização
 */
export class AuthenticationError extends CustomError {
  constructor(message, userMessage = null) {
    super(message, 401, 'AUTHENTICATION_ERROR', userMessage);
  }

  getDefaultUserMessage() {
    return 'Você não tem permissão para realizar esta ação.';
  }
}

/**
 * Erro de recurso não encontrado
 */
export class NotFoundError extends CustomError {
  constructor(resource = 'Recurso', userMessage = null) {
    super(`${resource} não encontrado`, 404, 'NOT_FOUND', userMessage);
    this.resource = resource;
  }

  getDefaultUserMessage() {
    return 'O recurso solicitado não foi encontrado.';
  }
}

/**
 * Erro de rate limiting
 */
export class RateLimitError extends CustomError {
  constructor(message, retryAfter = null, userMessage = null) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', userMessage);
    this.retryAfter = retryAfter;
  }

  getDefaultUserMessage() {
    return 'Você enviou muitas mensagens. Aguarde um momento antes de tentar novamente.';
  }
}

/**
 * Erro de serviço externo (OpenAI, WhatsApp, etc.)
 */
export class ExternalServiceError extends CustomError {
  constructor(service, message, originalError = null, userMessage = null) {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR', userMessage);
    this.service = service;
    this.originalError = originalError;
  }

  getDefaultUserMessage() {
    return 'Estamos com problemas técnicos temporários. Tente novamente em alguns instantes.';
  }
}

/**
 * Erro de timeout
 */
export class TimeoutError extends CustomError {
  constructor(operation, timeout = null, userMessage = null) {
    super(`Timeout na operação: ${operation}`, 408, 'TIMEOUT_ERROR', userMessage);
    this.operation = operation;
    this.timeout = timeout;
  }

  getDefaultUserMessage() {
    return 'A operação demorou mais que o esperado. Tente novamente.';
  }
}

/**
 * Erro de configuração
 */
export class ConfigurationError extends CustomError {
  constructor(configKey, message, userMessage = null) {
    super(message, 500, 'CONFIGURATION_ERROR', userMessage);
    this.configKey = configKey;
  }

  getDefaultUserMessage() {
    return 'Erro de configuração do sistema. Entre em contato com o suporte.';
  }
}

/**
 * Erro de processamento de mídia
 */
export class MediaProcessingError extends CustomError {
  constructor(mediaType, message, userMessage = null) {
    super(message, 422, 'MEDIA_PROCESSING_ERROR', userMessage);
    this.mediaType = mediaType;
  }

  getDefaultUserMessage() {
    return 'Não foi possível processar o arquivo enviado. Tente com outro formato.';
  }
}

/**
 * Erro de banco de dados/Redis
 */
export class DatabaseError extends CustomError {
  constructor(operation, message, userMessage = null) {
    super(message, 503, 'DATABASE_ERROR', userMessage);
    this.operation = operation;
  }

  getDefaultUserMessage() {
    return 'Problema temporário com o armazenamento de dados. Tente novamente.';
  }
}

/**
 * Erro de webhook
 */
export class WebhookError extends CustomError {
  constructor(webhookType, message, userMessage = null) {
    super(message, 400, 'WEBHOOK_ERROR', userMessage);
    this.webhookType = webhookType;
  }

  getDefaultUserMessage() {
    return 'Erro ao processar a solicitação. Verifique os dados enviados.';
  }
}

/**
 * Erro de nutrição/API externa
 */
export class NutritionServiceError extends CustomError {
  constructor(operation, message, userMessage = null) {
    super(message, 502, 'NUTRITION_SERVICE_ERROR', userMessage);
    this.operation = operation;
  }

  getDefaultUserMessage() {
    return 'Não foi possível obter informações nutricionais no momento. Tente novamente mais tarde.';
  }
}

/**
 * Erro de fallback (quando serviços principais falham)
 */
export class FallbackError extends CustomError {
  constructor(originalError, fallbackMessage, userMessage = null) {
    super(fallbackMessage, 200, 'FALLBACK_ERROR', userMessage);
    this.originalError = originalError;
    this.isFallback = true;
  }

  getDefaultUserMessage() {
    return 'Estamos com problemas técnicos, mas você pode continuar usando o sistema com funcionalidades limitadas.';
  }
}

/**
 * Factory para criar erros específicos
 */
export class ErrorFactory {
  static createValidationError(message, field = null) {
    return new ValidationError(message, field);
  }

  static createAuthenticationError(message) {
    return new AuthenticationError(message);
  }

  static createNotFoundError(resource) {
    return new NotFoundError(resource);
  }

  static createRateLimitError(message, retryAfter = null) {
    return new RateLimitError(message, retryAfter);
  }

  static createExternalServiceError(service, message, originalError = null) {
    return new ExternalServiceError(service, message, originalError);
  }

  static createTimeoutError(operation, timeout = null) {
    return new TimeoutError(operation, timeout);
  }

  static createConfigurationError(configKey, message) {
    return new ConfigurationError(configKey, message);
  }

  static createMediaProcessingError(mediaType, message) {
    return new MediaProcessingError(mediaType, message);
  }

  static createDatabaseError(operation, message) {
    return new DatabaseError(operation, message);
  }

  static createWebhookError(webhookType, message) {
    return new WebhookError(webhookType, message);
  }

  static createNutritionServiceError(operation, message) {
    return new NutritionServiceError(operation, message);
  }

  static createFallbackError(originalError, fallbackMessage) {
    return new FallbackError(originalError, fallbackMessage);
  }
}

/**
 * Utilitários para tratamento de erros
 */
export class ErrorUtils {
  /**
   * Verifica se um erro é operacional (esperado)
   */
  static isOperationalError(error) {
    if (error instanceof CustomError) {
      return error.isOperational;
    }
    return false;
  }

  /**
   * Converte erro não operacional em erro operacional
   */
  static convertToOperationalError(error) {
    if (error instanceof CustomError) {
      return error;
    }

    // Converter erros comuns do Node.js
    if (error.code === 'ENOTFOUND') {
      return new ExternalServiceError('DNS', 'Serviço não encontrado', error);
    }

    if (error.code === 'ECONNREFUSED') {
      return new ExternalServiceError('Connection', 'Conexão recusada', error);
    }

    if (error.code === 'ETIMEDOUT') {
      return new TimeoutError('Network', null, error);
    }

    if (error.name === 'ValidationError') {
      return new ValidationError(error.message);
    }

    // Erro genérico
    return new CustomError(error.message, 500, 'UNKNOWN_ERROR');
  }

  /**
   * Obtém mensagem amigável para o usuário
   */
  static getUserFriendlyMessage(error) {
    if (error instanceof CustomError) {
      return error.userMessage;
    }

    // Mensagens padrão para erros comuns
    const commonErrors = {
      'ENOTFOUND': 'Problema de conexão. Tente novamente em alguns instantes.',
      'ECONNREFUSED': 'Serviço temporariamente indisponível. Tente novamente.',
      'ETIMEDOUT': 'A operação demorou mais que o esperado. Tente novamente.',
      'ValidationError': 'Dados inválidos. Verifique as informações e tente novamente.',
      'SyntaxError': 'Erro no formato dos dados. Tente novamente.',
      'TypeError': 'Erro interno. Tente novamente em alguns instantes.'
    };

    return commonErrors[error.code] || commonErrors[error.name] || 'Ocorreu um erro inesperado. Tente novamente.';
  }

  /**
   * Loga erro com contexto apropriado
   */
  static logError(error, context = {}) {
    const errorInfo = {
      name: error.name,
      message: error.message,
      code: error.code || 'UNKNOWN',
      statusCode: error.statusCode || 500,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context
    };

    if (error instanceof CustomError) {
      errorInfo.isOperational = error.isOperational;
      errorInfo.userMessage = error.userMessage;
    }

    if (error instanceof ExternalServiceError) {
      errorInfo.service = error.service;
      errorInfo.originalError = error.originalError?.message;
    }

    if (error.statusCode >= 500) {
      logger.error('Server error occurred', errorInfo);
    } else if (error.statusCode >= 400) {
      logger.warn('Client error occurred', errorInfo);
    } else {
      logger.info('Error occurred', errorInfo);
    }
  }

  /**
   * Cria resposta de erro padronizada
   */
  static createErrorResponse(error, includeStack = false) {
    const response = {
      success: false,
      error: {
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR',
        statusCode: error.statusCode || 500,
        userMessage: ErrorUtils.getUserFriendlyMessage(error),
        timestamp: error.timestamp || new Date().toISOString()
      }
    };

    if (includeStack && process.env.NODE_ENV === 'development') {
      response.error.stack = error.stack;
    }

    if (error instanceof RateLimitError && error.retryAfter) {
      response.error.retryAfter = error.retryAfter;
    }

    return response;
  }
}

export default {
  CustomError,
  ValidationError,
  AuthenticationError,
  NotFoundError,
  RateLimitError,
  ExternalServiceError,
  TimeoutError,
  ConfigurationError,
  MediaProcessingError,
  DatabaseError,
  WebhookError,
  NutritionServiceError,
  FallbackError,
  ErrorFactory,
  ErrorUtils
};

