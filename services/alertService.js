// services/alertService.js
// Sistema de alertas para erros críticos

import logger from '../config/logger.js';
import statsService from './statsService.js';

class AlertService {
  constructor() {
    this.alertThresholds = {
      errorRate: 0.1,        // 10% de taxa de erro
      responseTime: 5000,     // 5 segundos
      memoryUsage: 0.8,       // 80% de uso de memória
      consecutiveErrors: 5,   // 5 erros consecutivos
      criticalErrors: 1       // 1 erro crítico
    };

    this.alertCooldowns = {
      errorRate: 300000,      // 5 minutos
      responseTime: 600000,   // 10 minutos
      memoryUsage: 900000,    // 15 minutos
      consecutiveErrors: 300000, // 5 minutos
      criticalErrors: 60000   // 1 minuto
    };

    this.lastAlerts = {};
    this.consecutiveErrors = 0;
    this.errorCount = 0;
    this.requestCount = 0;
  }

  /**
   * Verificar se deve enviar alerta
   */
  shouldSendAlert(alertType) {
    const now = Date.now();
    const lastAlert = this.lastAlerts[alertType];
    
    if (!lastAlert) {
      return true;
    }

    const cooldown = this.alertCooldowns[alertType] || 300000;
    return (now - lastAlert) > cooldown;
  }

  /**
   * Registrar alerta enviado
   */
  markAlertSent(alertType) {
    this.lastAlerts[alertType] = Date.now();
  }

  /**
   * Verificar taxa de erro
   */
  async checkErrorRate() {
    try {
      const stats = await statsService.getStats();
      const errorRate = stats.errors.today / Math.max(stats.messages.today, 1);
      
      if (errorRate > this.alertThresholds.errorRate) {
        await this.sendAlert('errorRate', {
          level: 'WARNING',
          message: `Taxa de erro alta: ${(errorRate * 100).toFixed(2)}%`,
          details: {
            errorRate: errorRate,
            errors: stats.errors.today,
            messages: stats.messages.today,
            threshold: this.alertThresholds.errorRate
          }
        });
      }
    } catch (error) {
      logger.error('Error checking error rate', { error: error.message });
    }
  }

  /**
   * Verificar uso de memória
   */
  checkMemoryUsage() {
    const memUsage = process.memoryUsage();
    const totalMem = memUsage.heapTotal;
    const usedMem = memUsage.heapUsed;
    const memoryUsage = usedMem / totalMem;

    if (memoryUsage > this.alertThresholds.memoryUsage) {
      this.sendAlert('memoryUsage', {
        level: 'WARNING',
        message: `Uso de memória alto: ${(memoryUsage * 100).toFixed(2)}%`,
        details: {
          memoryUsage: memoryUsage,
          used: Math.round(usedMem / 1024 / 1024),
          total: Math.round(totalMem / 1024 / 1024),
          threshold: this.alertThresholds.memoryUsage
        }
      });
    }
  }

  /**
   * Verificar erros consecutivos
   */
  checkConsecutiveErrors() {
    if (this.consecutiveErrors >= this.alertThresholds.consecutiveErrors) {
      this.sendAlert('consecutiveErrors', {
        level: 'CRITICAL',
        message: `${this.consecutiveErrors} erros consecutivos detectados`,
        details: {
          consecutiveErrors: this.consecutiveErrors,
          threshold: this.alertThresholds.consecutiveErrors
        }
      });
    }
  }

  /**
   * Registrar erro
   */
  recordError(error, context = {}) {
    this.errorCount++;
    this.consecutiveErrors++;

    // Verificar se é erro crítico
    if (error.statusCode >= 500 || error.code === 'CRITICAL_ERROR') {
      this.sendCriticalErrorAlert(error, context);
    }

    // Verificar erros consecutivos
    this.checkConsecutiveErrors();

    // Verificar taxa de erro a cada 10 erros
    if (this.errorCount % 10 === 0) {
      this.checkErrorRate();
    }
  }

  /**
   * Registrar requisição bem-sucedida
   */
  recordSuccess() {
    this.consecutiveErrors = 0;
    this.requestCount++;
  }

  /**
   * Enviar alerta crítico
   */
  async sendCriticalErrorAlert(error, context) {
    if (!this.shouldSendAlert('criticalErrors')) {
      return;
    }

    const alertData = {
      level: 'CRITICAL',
      message: `Erro crítico: ${error.message}`,
      details: {
        error: {
          name: error.name,
          message: error.message,
          code: error.code,
          statusCode: error.statusCode,
          stack: error.stack
        },
        context: context,
        system: {
          memory: process.memoryUsage(),
          uptime: process.uptime(),
          nodeVersion: process.version,
          timestamp: new Date().toISOString()
        }
      }
    };

    await this.sendAlert('criticalErrors', alertData);
  }

  /**
   * Enviar alerta
   */
  async sendAlert(alertType, alertData) {
    if (!this.shouldSendAlert(alertType)) {
      return;
    }

    try {
      // Log do alerta
      logger.error(`ALERT: ${alertType}`, alertData);

      // Enviar para serviços externos
      await this.sendToExternalServices(alertData);

      // Marcar como enviado
      this.markAlertSent(alertType);

    } catch (error) {
      logger.error('Error sending alert', { 
        error: error.message, 
        alertType, 
        alertData 
      });
    }
  }

  /**
   * Enviar para serviços externos
   */
  async sendToExternalServices(alertData) {
    const promises = [];

    // Slack
    if (process.env.SLACK_WEBHOOK_URL) {
      promises.push(this.sendToSlack(alertData));
    }

    // Discord
    if (process.env.DISCORD_WEBHOOK_URL) {
      promises.push(this.sendToDiscord(alertData));
    }

    // Email (se configurado)
    if (process.env.EMAIL_ALERTS_ENABLED === 'true') {
      promises.push(this.sendEmail(alertData));
    }

    // Webhook customizado
    if (process.env.ALERT_WEBHOOK_URL) {
      promises.push(this.sendToWebhook(alertData));
    }

    await Promise.allSettled(promises);
  }

  /**
   * Enviar para Slack
   */
  async sendToSlack(alertData) {
    try {
      const fetch = (await import('node-fetch')).default;
      
      const slackMessage = {
        text: `🚨 ${alertData.level}: ${alertData.message}`,
        attachments: [{
          color: alertData.level === 'CRITICAL' ? 'danger' : 'warning',
          fields: [
            { title: 'Serviço', value: 'IA Atendimento Bot', short: true },
            { title: 'Nível', value: alertData.level, short: true },
            { title: 'Mensagem', value: alertData.message, short: false },
            { title: 'Timestamp', value: new Date().toISOString(), short: true }
          ]
        }]
      };

      if (alertData.details?.error) {
        slackMessage.attachments[0].fields.push({
          title: 'Erro',
          value: `\`\`\`${alertData.details.error.message}\`\`\``,
          short: false
        });
      }

      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackMessage)
      });

    } catch (error) {
      logger.error('Error sending alert to Slack', { error: error.message });
    }
  }

  /**
   * Enviar para Discord
   */
  async sendToDiscord(alertData) {
    try {
      const fetch = (await import('node-fetch')).default;
      
      const discordMessage = {
        content: `🚨 **${alertData.level}**: ${alertData.message}`,
        embeds: [{
          title: 'IA Atendimento Bot - Alerta',
          color: alertData.level === 'CRITICAL' ? 0xff0000 : 0xffaa00,
          fields: [
            { name: 'Nível', value: alertData.level, inline: true },
            { name: 'Serviço', value: 'IA Atendimento Bot', inline: true },
            { name: 'Timestamp', value: new Date().toISOString(), inline: true },
            { name: 'Mensagem', value: alertData.message, inline: false }
          ]
        }]
      };

      if (alertData.details?.error) {
        discordMessage.embeds[0].fields.push({
          name: 'Erro',
          value: `\`\`\`${alertData.details.error.message}\`\`\``,
          inline: false
        });
      }

      await fetch(process.env.DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discordMessage)
      });

    } catch (error) {
      logger.error('Error sending alert to Discord', { error: error.message });
    }
  }

  /**
   * Enviar email
   */
  async sendEmail(alertData) {
    // Implementar envio de email
    // Pode usar nodemailer, sendgrid, etc.
    logger.info('Email alert would be sent', { alertData });
  }

  /**
   * Enviar para webhook customizado
   */
  async sendToWebhook(alertData) {
    try {
      const fetch = (await import('node-fetch')).default;
      
      await fetch(process.env.ALERT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertData)
      });

    } catch (error) {
      logger.error('Error sending alert to webhook', { error: error.message });
    }
  }

  /**
   * Verificar saúde do sistema
   */
  async checkSystemHealth() {
    try {
      // Verificar uso de memória
      this.checkMemoryUsage();

      // Verificar taxa de erro
      await this.checkErrorRate();

      // Verificar erros consecutivos
      this.checkConsecutiveErrors();

    } catch (error) {
      logger.error('Error checking system health', { error: error.message });
    }
  }

  /**
   * Obter estatísticas de alertas
   */
  getAlertStats() {
    return {
      errorCount: this.errorCount,
      requestCount: this.requestCount,
      consecutiveErrors: this.consecutiveErrors,
      errorRate: this.requestCount > 0 ? this.errorCount / this.requestCount : 0,
      lastAlerts: this.lastAlerts,
      thresholds: this.alertThresholds
    };
  }

  /**
   * Resetar contadores
   */
  resetCounters() {
    this.errorCount = 0;
    this.requestCount = 0;
    this.consecutiveErrors = 0;
    this.lastAlerts = {};
  }

  /**
   * Configurar thresholds
   */
  setThresholds(thresholds) {
    this.alertThresholds = { ...this.alertThresholds, ...thresholds };
  }

  /**
   * Configurar cooldowns
   */
  setCooldowns(cooldowns) {
    this.alertCooldowns = { ...this.alertCooldowns, ...cooldowns };
  }
}

// Instância singleton
const alertService = new AlertService();

// Verificar saúde do sistema a cada 5 minutos
setInterval(() => {
  alertService.checkSystemHealth();
}, 5 * 60 * 1000);

export default alertService;

