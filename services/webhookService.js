// services/webhookService.js

import axios from 'axios';
import { config } from '../config/index.js';

// Configuração de retry
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 segundo inicial
const RETRY_MULTIPLIER = 2; // Dobra o delay a cada tentativa

/**
 * Envia webhook com retry automático
 * @param {string} url - URL do webhook
 * @param {object} data - Dados a enviar
 * @param {object} options - Opções adicionais
 * @returns {Promise<object>} Resposta do webhook
 */
export async function sendWebhookWithRetry(url, data, options = {}) {
  const {
    maxRetries = MAX_RETRIES,
    retryDelay = RETRY_DELAY,
    retryMultiplier = RETRY_MULTIPLIER,
    headers = {},
    timeout = 30000
  } = options;

  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios({
        method: 'POST',
        url,
        data,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        timeout,
        validateStatus: (status) => status < 500 // Retry apenas em erros 5xx
      });

      // Log de sucesso
      console.log(`Webhook enviado com sucesso para ${url} na tentativa ${attempt + 1}`);
      
      return {
        success: true,
        attempt: attempt + 1,
        response: response.data,
        status: response.status
      };

    } catch (error) {
      lastError = error;
      
      // Log do erro
      console.error(`Erro ao enviar webhook para ${url} (tentativa ${attempt + 1}/${maxRetries + 1}):`, error.message);
      
      // Se não for erro de servidor (5xx) ou se for a última tentativa, não fazer retry
      if (error.response && error.response.status < 500) {
        throw new WebhookError('Erro do cliente, não será feito retry', error);
      }
      
      if (attempt < maxRetries) {
        const delay = retryDelay * Math.pow(retryMultiplier, attempt);
        console.log(`Aguardando ${delay}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Se chegou aqui, todas as tentativas falharam
  throw new WebhookError(`Webhook falhou após ${maxRetries + 1} tentativas`, lastError);
}

/**
 * Classe de erro customizada para webhooks
 */
export class WebhookError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'WebhookError';
    this.originalError = originalError;
  }
}

/**
 * Envia webhook para Stripe com configurações específicas
 * @param {object} event - Evento do Stripe
 * @returns {Promise<object>} Resposta do webhook
 */
export async function sendStripeWebhook(event) {
  const stripeWebhookUrl = process.env.STRIPE_WEBHOOK_URL;
  
  if (!stripeWebhookUrl) {
    console.warn('STRIPE_WEBHOOK_URL não configurada, pulando envio de webhook Stripe');
    return { success: false, message: 'URL não configurada' };
  }

  const signature = generateStripeSignature(event);
  
  return sendWebhookWithRetry(stripeWebhookUrl, event, {
    headers: {
      'Stripe-Signature': signature
    },
    maxRetries: 5, // Mais tentativas para pagamentos
    retryDelay: 2000 // Delay maior para não sobrecarregar
  });
}

/**
 * Gera assinatura para webhook do Stripe (implementação simplificada)
 * @param {object} event - Evento do Stripe
 * @returns {string} Assinatura
 */
function generateStripeSignature(event) {
  // TODO: Implementar assinatura real do Stripe
  // Por enquanto, retorna uma string placeholder
  return `t=${Date.now()},v1=placeholder`;
}

/**
 * Webhook genérico para notificações
 * @param {string} type - Tipo de notificação
 * @param {object} payload - Dados da notificação
 * @returns {Promise<object>} Resposta do webhook
 */
export async function sendNotificationWebhook(type, payload) {
  const notificationUrl = process.env.NOTIFICATION_WEBHOOK_URL;
  
  if (!notificationUrl) {
    console.log(`Webhook de notificação ${type} não enviado (URL não configurada)`);
    return { success: false, message: 'URL não configurada' };
  }

  const data = {
    type,
    payload,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  };

  return sendWebhookWithRetry(notificationUrl, data);
}

/**
 * Registra falha de webhook para reprocessamento posterior
 * @param {string} url - URL do webhook
 * @param {object} data - Dados que falharam
 * @param {Error} error - Erro ocorrido
 */
export async function logWebhookFailure(url, data, error) {
  // TODO: Implementar salvamento em banco/Redis para reprocessamento
  console.error('Webhook failure logged:', {
    url,
    data,
    error: error.message,
    timestamp: new Date().toISOString()
  });
}

