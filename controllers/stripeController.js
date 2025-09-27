// controllers/stripeController.js

import * as webhookService from '../services/webhookService.js';
import { config } from '../config/index.js';

/**
 * Processa webhooks do Stripe
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
export const handleStripeWebhook = async (req, res) => {
  try {
    console.log("Stripe webhook received:", JSON.stringify(req.body, null, 2));
    
    const signature = req.headers['stripe-signature'];
    if (!signature) {
      console.error("Missing Stripe signature");
      return res.sendStatus(400);
    }

    // Verificar se é um evento de pagamento
    const event = req.body;
    
    if (!event.type) {
      console.error("Invalid Stripe event: missing type");
      return res.sendStatus(400);
    }

    console.log(`Processing Stripe event: ${event.type}`);

    // Processar diferentes tipos de eventos
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object);
        break;
        
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
        
      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    // Enviar confirmação para o Stripe
    res.sendStatus(200);

  } catch (error) {
    console.error("Error processing Stripe webhook:", error);
    
    // Tentar notificar webhook sobre erro
    try {
      await webhookService.sendNotificationWebhook('stripe_webhook_error', {
        error: error.message,
        eventType: req.body?.type,
        timestamp: new Date().toISOString()
      });
    } catch (webhookError) {
      console.warn('Falha ao enviar notificação de erro do Stripe:', webhookError.message);
    }
    
    res.sendStatus(500);
  }
};

/**
 * Processa pagamento bem-sucedido
 * @param {object} paymentIntent - Dados do pagamento
 */
async function handlePaymentSuccess(paymentIntent) {
  try {
    console.log(`Payment succeeded: ${paymentIntent.id}`);
    
    const customerId = paymentIntent.customer;
    const amount = paymentIntent.amount / 100; // Converter de centavos
    
    // Aqui você pode:
    // 1. Atualizar status do usuário no banco de dados
    // 2. Ativar funcionalidades premium
    // 3. Enviar email de confirmação
    // 4. Notificar webhook externo
    
    await webhookService.sendNotificationWebhook('payment_success', {
      paymentIntentId: paymentIntent.id,
      customerId: customerId,
      amount: amount,
      currency: paymentIntent.currency,
      timestamp: new Date().toISOString()
    });
    
    console.log(`Payment ${paymentIntent.id} processed successfully`);
    
  } catch (error) {
    console.error("Error handling payment success:", error);
    throw error;
  }
}

/**
 * Processa falha de pagamento
 * @param {object} paymentIntent - Dados do pagamento
 */
async function handlePaymentFailure(paymentIntent) {
  try {
    console.log(`Payment failed: ${paymentIntent.id}`);
    
    const customerId = paymentIntent.customer;
    const failureReason = paymentIntent.last_payment_error?.message || 'Unknown error';
    
    await webhookService.sendNotificationWebhook('payment_failure', {
      paymentIntentId: paymentIntent.id,
      customerId: customerId,
      failureReason: failureReason,
      timestamp: new Date().toISOString()
    });
    
    console.log(`Payment failure ${paymentIntent.id} logged`);
    
  } catch (error) {
    console.error("Error handling payment failure:", error);
    throw error;
  }
}

/**
 * Processa criação de assinatura
 * @param {object} subscription - Dados da assinatura
 */
async function handleSubscriptionCreated(subscription) {
  try {
    console.log(`Subscription created: ${subscription.id}`);
    
    await webhookService.sendNotificationWebhook('subscription_created', {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      status: subscription.status,
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Error handling subscription creation:", error);
    throw error;
  }
}

/**
 * Processa atualização de assinatura
 * @param {object} subscription - Dados da assinatura
 */
async function handleSubscriptionUpdated(subscription) {
  try {
    console.log(`Subscription updated: ${subscription.id}`);
    
    await webhookService.sendNotificationWebhook('subscription_updated', {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      status: subscription.status,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Error handling subscription update:", error);
    throw error;
  }
}

/**
 * Processa cancelamento de assinatura
 * @param {object} subscription - Dados da assinatura
 */
async function handleSubscriptionDeleted(subscription) {
  try {
    console.log(`Subscription deleted: ${subscription.id}`);
    
    await webhookService.sendNotificationWebhook('subscription_deleted', {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      canceledAt: subscription.canceled_at,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Error handling subscription deletion:", error);
    throw error;
  }
}

/**
 * Valida webhook do Stripe (implementação básica)
 * @param {string} payload - Payload do webhook
 * @param {string} signature - Assinatura do webhook
 * @returns {boolean} True se válido
 */
function validateStripeSignature(payload, signature) {
  // TODO: Implementar validação real da assinatura do Stripe
  // Por enquanto, retorna true para permitir desenvolvimento
  console.warn("Stripe signature validation not implemented - using placeholder");
  return true;
}

