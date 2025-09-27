// services/rateLimitService.js
// Serviço avançado de rate limiting com diferentes limites por tipo de mídia

import { redisClient } from '../config/redis.js';
import logger from '../config/logger.js';

class RateLimitService {
  constructor() {
    // Configurações de rate limiting por tipo de mídia
    this.limits = {
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

    // Whitelist de números que não têm rate limiting
    this.whitelist = new Set([
      // Adicione números específicos aqui
      // Exemplo: '+5511999999999'
    ]);

    // Configurações de rate limiting global
    this.globalLimit = {
      max: 50,             // 50 mensagens totais por minuto
      windowMs: 60 * 1000, // 1 minuto
      friendlyMessage: "🚫 Você atingiu o limite global de mensagens! Aguarde 1 minuto antes de enviar mais mensagens. Limite: 50 mensagens por minuto."
    };
  }

  /**
   * Verifica se um número está na whitelist
   * @param {string} phoneNumber - Número de telefone
   * @returns {boolean} True se estiver na whitelist
   */
  isWhitelisted(phoneNumber) {
    return this.whitelist.has(phoneNumber);
  }

  /**
   * Adiciona um número à whitelist
   * @param {string} phoneNumber - Número de telefone
   */
  addToWhitelist(phoneNumber) {
    this.whitelist.add(phoneNumber);
    logger.info('Number added to whitelist', { phoneNumber });
  }

  /**
   * Remove um número da whitelist
   * @param {string} phoneNumber - Número de telefone
   */
  removeFromWhitelist(phoneNumber) {
    this.whitelist.delete(phoneNumber);
    logger.info('Number removed from whitelist', { phoneNumber });
  }

  /**
   * Obtém a chave Redis para rate limiting
   * @param {string} phoneNumber - Número de telefone
   * @param {string} type - Tipo de mídia
   * @returns {string} Chave Redis
   */
  getRedisKey(phoneNumber, type) {
    const timestamp = Math.floor(Date.now() / this.limits[type].windowMs);
    return `rate_limit:${phoneNumber}:${type}:${timestamp}`;
  }

  /**
   * Obtém a chave Redis para rate limiting global
   * @param {string} phoneNumber - Número de telefone
   * @returns {string} Chave Redis
   */
  getGlobalRedisKey(phoneNumber) {
    const timestamp = Math.floor(Date.now() / this.globalLimit.windowMs);
    return `rate_limit:${phoneNumber}:global:${timestamp}`;
  }

  /**
   * Verifica se o usuário pode enviar uma mensagem do tipo especificado
   * @param {string} phoneNumber - Número de telefone
   * @param {string} type - Tipo de mídia (text, audio, image, document)
   * @returns {Promise<{allowed: boolean, remaining: number, resetTime: number, message?: string}>}
   */
  async checkRateLimit(phoneNumber, type) {
    try {
      // Verificar se está na whitelist
      if (this.isWhitelisted(phoneNumber)) {
        return {
          allowed: true,
          remaining: Infinity,
          resetTime: 0,
          message: 'Whitelisted user'
        };
      }

      // Verificar se o tipo é válido
      if (!this.limits[type]) {
        logger.warn('Invalid rate limit type', { type, phoneNumber });
        return {
          allowed: true,
          remaining: Infinity,
          resetTime: 0,
          message: 'Invalid type, allowing'
        };
      }

      // Verificar rate limiting global primeiro
      const globalCheck = await this.checkGlobalRateLimit(phoneNumber);
      if (!globalCheck.allowed) {
        return globalCheck;
      }

      // Verificar rate limiting específico do tipo
      const key = this.getRedisKey(phoneNumber, type);
      const limit = this.limits[type];

      if (redisClient.isOpen) {
        const current = await redisClient.get(key);
        const count = current ? parseInt(current) : 0;

        if (count >= limit.max) {
          const resetTime = (Math.floor(Date.now() / limit.windowMs) + 1) * limit.windowMs;
          return {
            allowed: false,
            remaining: 0,
            resetTime,
            message: limit.friendlyMessage
          };
        }

        // Incrementar contador
        await redisClient.incr(key);
        await redisClient.expire(key, Math.ceil(limit.windowMs / 1000));

        return {
          allowed: true,
          remaining: limit.max - count - 1,
          resetTime: (Math.floor(Date.now() / limit.windowMs) + 1) * limit.windowMs
        };
      } else {
        // Se Redis não estiver disponível, permitir mas logar
        logger.warn('Redis not available, allowing request', { phoneNumber, type });
        return {
          allowed: true,
          remaining: Infinity,
          resetTime: 0,
          message: 'Redis unavailable, allowing'
        };
      }
    } catch (error) {
      logger.error('Error checking rate limit', { error: error.message, phoneNumber, type });
      // Em caso de erro, permitir mas logar
      return {
        allowed: true,
        remaining: Infinity,
        resetTime: 0,
        message: 'Error checking rate limit, allowing'
      };
    }
  }

  /**
   * Verifica rate limiting global
   * @param {string} phoneNumber - Número de telefone
   * @returns {Promise<{allowed: boolean, remaining: number, resetTime: number, message?: string}>}
   */
  async checkGlobalRateLimit(phoneNumber) {
    try {
      const key = this.getGlobalRedisKey(phoneNumber);
      const limit = this.globalLimit;

      if (redisClient.isOpen) {
        const current = await redisClient.get(key);
        const count = current ? parseInt(current) : 0;

        if (count >= limit.max) {
          const resetTime = (Math.floor(Date.now() / limit.windowMs) + 1) * limit.windowMs;
          return {
            allowed: false,
            remaining: 0,
            resetTime,
            message: limit.friendlyMessage
          };
        }

        // Incrementar contador global
        await redisClient.incr(key);
        await redisClient.expire(key, Math.ceil(limit.windowMs / 1000));

        return {
          allowed: true,
          remaining: limit.max - count - 1,
          resetTime: (Math.floor(Date.now() / limit.windowMs) + 1) * limit.windowMs
        };
      } else {
        return {
          allowed: true,
          remaining: Infinity,
          resetTime: 0,
          message: 'Redis unavailable, allowing'
        };
      }
    } catch (error) {
      logger.error('Error checking global rate limit', { error: error.message, phoneNumber });
      return {
        allowed: true,
        remaining: Infinity,
        resetTime: 0,
        message: 'Error checking global rate limit, allowing'
      };
    }
  }

  /**
   * Obtém o status atual do rate limiting para um usuário
   * @param {string} phoneNumber - Número de telefone
   * @returns {Promise<object>} Status do rate limiting
   */
  async getRateLimitStatus(phoneNumber) {
    try {
      const status = {
        phoneNumber,
        isWhitelisted: this.isWhitelisted(phoneNumber),
        global: {
          limit: this.globalLimit.max,
          windowMs: this.globalLimit.windowMs,
          remaining: 0,
          resetTime: 0
        },
        types: {}
      };

      if (this.isWhitelisted(phoneNumber)) {
        // Se estiver na whitelist, retornar status especial
        status.global.remaining = Infinity;
        status.global.resetTime = 0;
        
        Object.keys(this.limits).forEach(type => {
          status.types[type] = {
            limit: this.limits[type].max,
            windowMs: this.limits[type].windowMs,
            remaining: Infinity,
            resetTime: 0
          };
        });

        return status;
      }

      // Verificar status global
      if (redisClient.isOpen) {
        const globalKey = this.getGlobalRedisKey(phoneNumber);
        const globalCurrent = await redisClient.get(globalKey);
        const globalCount = globalCurrent ? parseInt(globalCurrent) : 0;
        
        status.global.remaining = Math.max(0, this.globalLimit.max - globalCount);
        status.global.resetTime = (Math.floor(Date.now() / this.globalLimit.windowMs) + 1) * this.globalLimit.windowMs;

        // Verificar status de cada tipo
        for (const [type, limit] of Object.entries(this.limits)) {
          const key = this.getRedisKey(phoneNumber, type);
          const current = await redisClient.get(key);
          const count = current ? parseInt(current) : 0;
          
          status.types[type] = {
            limit: limit.max,
            windowMs: limit.windowMs,
            remaining: Math.max(0, limit.max - count),
            resetTime: (Math.floor(Date.now() / limit.windowMs) + 1) * limit.windowMs
          };
        }
      }

      return status;
    } catch (error) {
      logger.error('Error getting rate limit status', { error: error.message, phoneNumber });
      return {
        phoneNumber,
        error: 'Failed to get rate limit status',
        isWhitelisted: this.isWhitelisted(phoneNumber)
      };
    }
  }

  /**
   * Reseta o rate limiting para um usuário
   * @param {string} phoneNumber - Número de telefone
   * @param {string} type - Tipo de mídia (opcional, se não especificado reseta todos)
   */
  async resetRateLimit(phoneNumber, type = null) {
    try {
      if (redisClient.isOpen) {
        if (type) {
          // Resetar apenas um tipo específico
          const key = this.getRedisKey(phoneNumber, type);
          await redisClient.del(key);
          logger.info('Rate limit reset for specific type', { phoneNumber, type });
        } else {
          // Resetar todos os tipos
          const pattern = `rate_limit:${phoneNumber}:*`;
          const keys = await redisClient.keys(pattern);
          if (keys.length > 0) {
            await redisClient.del(...keys);
          }
          logger.info('Rate limit reset for all types', { phoneNumber });
        }
      }
    } catch (error) {
      logger.error('Error resetting rate limit', { error: error.message, phoneNumber, type });
    }
  }

  /**
   * Obtém estatísticas de rate limiting
   * @returns {Promise<object>} Estatísticas
   */
  async getRateLimitStats() {
    try {
      const stats = {
        whitelistedUsers: Array.from(this.whitelist),
        limits: this.limits,
        globalLimit: this.globalLimit,
        timestamp: new Date().toISOString()
      };

      if (redisClient.isOpen) {
        // Contar usuários ativos (com rate limiting ativo)
        const pattern = 'rate_limit:*';
        const keys = await redisClient.keys(pattern);
        const activeUsers = new Set();
        
        keys.forEach(key => {
          const parts = key.split(':');
          if (parts.length >= 2) {
            activeUsers.add(parts[1]);
          }
        });

        stats.activeUsers = Array.from(activeUsers);
        stats.totalActiveUsers = activeUsers.size;
      }

      return stats;
    } catch (error) {
      logger.error('Error getting rate limit stats', { error: error.message });
      return {
        error: 'Failed to get rate limit stats',
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Instância singleton
const rateLimitService = new RateLimitService();

export default rateLimitService;

