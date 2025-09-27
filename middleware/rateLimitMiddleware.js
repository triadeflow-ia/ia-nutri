// middleware/rateLimitMiddleware.js
// Middleware para rate limiting avançado

import rateLimitService from '../services/rateLimitService.js';
import logger from '../config/logger.js';

/**
 * Middleware para verificar rate limiting antes de processar mensagens
 * @param {string} messageType - Tipo de mensagem (text, audio, image, document)
 * @returns {Function} Middleware function
 */
export const checkRateLimit = (messageType) => {
  return async (req, res, next) => {
    try {
      // Extrair número de telefone da requisição
      let phoneNumber = null;
      
      if (req.body && req.body.entry && req.body.entry[0] && req.body.entry[0].changes) {
        const changes = req.body.entry[0].changes;
        for (const change of changes) {
          if (change.value && change.value.messages) {
            for (const message of change.value.messages) {
              phoneNumber = message.from;
              break;
            }
          }
        }
      }
      
      if (!phoneNumber) {
        logger.warn('No phone number found in request for rate limiting');
        return next();
      }

      // Verificar rate limiting
      const rateLimitResult = await rateLimitService.checkRateLimit(phoneNumber, messageType);
      
      if (!rateLimitResult.allowed) {
        logger.warn('Rate limit exceeded', {
          phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*'),
          messageType,
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime
        });

        // Adicionar informações de rate limiting à resposta
        res.rateLimitExceeded = true;
        res.rateLimitInfo = {
          type: messageType,
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime,
          message: rateLimitResult.message
        };

        // Enviar resposta de rate limiting
        if (!res.headersSent) {
          res.status(429).json({
            error: 'Rate limit exceeded',
            message: rateLimitResult.message,
            type: messageType,
            remaining: rateLimitResult.remaining,
            resetTime: rateLimitResult.resetTime,
            retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
          });
        }
        return;
      }

      // Adicionar informações de rate limiting à resposta
      res.rateLimitInfo = {
        type: messageType,
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime
      };

      logger.debug('Rate limit check passed', {
        phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*'),
        messageType,
        remaining: rateLimitResult.remaining
      });

      next();
    } catch (error) {
      logger.error('Error in rate limit middleware', { 
        error: error.message, 
        messageType 
      });
      // Em caso de erro, permitir a requisição
      next();
    }
  };
};

/**
 * Middleware para verificar rate limiting de texto
 */
export const checkTextRateLimit = checkRateLimit('text');

/**
 * Middleware para verificar rate limiting de áudio
 */
export const checkAudioRateLimit = checkRateLimit('audio');

/**
 * Middleware para verificar rate limiting de imagem
 */
export const checkImageRateLimit = checkRateLimit('image');

/**
 * Middleware para verificar rate limiting de documento
 */
export const checkDocumentRateLimit = checkRateLimit('document');

/**
 * Middleware para verificar rate limiting global
 */
export const checkGlobalRateLimit = async (req, res, next) => {
  try {
    // Extrair número de telefone da requisição
    let phoneNumber = null;
    
    if (req.body && req.body.entry && req.body.entry[0] && req.body.entry[0].changes) {
      const changes = req.body.entry[0].changes;
      for (const change of changes) {
        if (change.value && change.value.messages) {
          for (const message of change.value.messages) {
            phoneNumber = message.from;
            break;
          }
        }
      }
    }
    
    if (!phoneNumber) {
      return next();
    }

    // Verificar rate limiting global
    const rateLimitResult = await rateLimitService.checkGlobalRateLimit(phoneNumber);
    
    if (!rateLimitResult.allowed) {
      logger.warn('Global rate limit exceeded', {
        phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*'),
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime
      });

      res.rateLimitExceeded = true;
      res.rateLimitInfo = {
        type: 'global',
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime,
        message: rateLimitResult.message
      };

      if (!res.headersSent) {
        res.status(429).json({
          error: 'Global rate limit exceeded',
          message: rateLimitResult.message,
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime,
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        });
      }
      return;
    }

    res.rateLimitInfo = {
      type: 'global',
      remaining: rateLimitResult.remaining,
      resetTime: rateLimitResult.resetTime
    };

    next();
  } catch (error) {
    logger.error('Error in global rate limit middleware', { error: error.message });
    next();
  }
};

