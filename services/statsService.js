// services/statsService.js

import { redisClient } from '../config/redis.js';
import logger from '../config/logger.js';

class StatsService {
  constructor() {
    this.startTime = Date.now();
    this.messageCount = 0;
    this.errorCount = 0;
    this.activeUsers = new Set();
    this.dailyStats = {
      messages: 0,
      errors: 0,
      users: new Set()
    };
    
    // Reset daily stats at midnight
    this.scheduleDailyReset();
  }

  // Agendar reset diário às 00:00
  scheduleDailyReset() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
      this.resetDailyStats();
      this.scheduleDailyReset(); // Agendar próximo reset
    }, msUntilMidnight);
  }

  // Reset das estatísticas diárias
  resetDailyStats() {
    this.dailyStats = {
      messages: 0,
      errors: 0,
      users: new Set()
    };
    logger.info('Daily stats reset');
  }

  // Incrementar contador de mensagens
  async incrementMessageCount(phone) {
    this.messageCount++;
    this.dailyStats.messages++;
    this.activeUsers.add(phone);
    this.dailyStats.users.add(phone);

    // Salvar no Redis se disponível
    try {
      if (redisClient.isOpen) {
        await redisClient.incr('stats:messages:total');
        await redisClient.incr('stats:messages:today');
        await redisClient.sAdd('stats:active_users', phone);
        await redisClient.sAdd('stats:users_today', phone);
        
        // Expirar chaves de usuários ativos após 24h
        await redisClient.expire('stats:active_users', 86400);
        await redisClient.expire('stats:users_today', 86400);
      }
    } catch (error) {
      logger.error('Error saving stats to Redis', { error: error.message });
    }
  }

  // Incrementar contador de erros
  async incrementErrorCount() {
    this.errorCount++;
    this.dailyStats.errors++;

    try {
      if (redisClient.isOpen) {
        await redisClient.incr('stats:errors:total');
        await redisClient.incr('stats:errors:today');
      }
    } catch (error) {
      logger.error('Error saving error stats to Redis', { error: error.message });
    }
  }

  // Obter estatísticas atuais
  async getStats() {
    const uptime = Date.now() - this.startTime;
    
    let redisStats = {};
    try {
      if (redisClient.isOpen) {
        const [
          totalMessages,
          todayMessages,
          totalErrors,
          todayErrors,
          activeUsersCount,
          todayUsersCount
        ] = await Promise.all([
          redisClient.get('stats:messages:total') || '0',
          redisClient.get('stats:messages:today') || '0',
          redisClient.get('stats:errors:total') || '0',
          redisClient.get('stats:errors:today') || '0',
          redisClient.sCard('stats:active_users') || 0,
          redisClient.sCard('stats:users_today') || 0
        ]);

        redisStats = {
          totalMessages: parseInt(totalMessages),
          todayMessages: parseInt(todayMessages),
          totalErrors: parseInt(totalErrors),
          todayErrors: parseInt(todayErrors),
          activeUsers: activeUsersCount,
          todayUsers: todayUsersCount
        };
      }
    } catch (error) {
      logger.error('Error getting stats from Redis', { error: error.message });
    }

    return {
      uptime: Math.floor(uptime / 1000), // em segundos
      uptimeFormatted: this.formatUptime(uptime),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024), // MB
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024), // MB
        external: Math.round(process.memoryUsage().external / 1024 / 1024) // MB
      },
      messages: {
        total: this.messageCount,
        today: this.dailyStats.messages,
        ...redisStats
      },
      errors: {
        total: this.errorCount,
        today: this.dailyStats.errors,
        ...redisStats
      },
      users: {
        active: this.activeUsers.size,
        today: this.dailyStats.users.size,
        ...redisStats
      },
      timestamp: new Date().toISOString()
    };
  }

  // Obter status de saúde
  async getHealthStatus() {
    const uptime = Date.now() - this.startTime;
    let redisConnected = false;

    try {
      if (redisClient.isOpen) {
        await redisClient.ping();
        redisConnected = true;
      }
    } catch (error) {
      logger.error('Redis health check failed', { error: error.message });
    }

    return {
      status: 'healthy',
      uptime: Math.floor(uptime / 1000),
      uptimeFormatted: this.formatUptime(uptime),
      redis: {
        connected: redisConnected,
        status: redisConnected ? 'connected' : 'disconnected'
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      },
      timestamp: new Date().toISOString()
    };
  }

  // Formatar uptime em formato legível
  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  // Obter estatísticas das últimas 24h
  async getLast24hStats() {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return {
      period: 'last_24h',
      startTime: yesterday.toISOString(),
      endTime: now.toISOString(),
      messages: this.dailyStats.messages,
      errors: this.dailyStats.errors,
      users: this.dailyStats.users.size,
      timestamp: now.toISOString()
    };
  }
}

// Instância singleton
const statsService = new StatsService();

export default statsService;
