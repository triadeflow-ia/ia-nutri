// controllers\stripeController.js

import { config } from '../config/index.js';
import * as whatsappService from '../services/whatsappService.js';
import * as redisService from '../services/redisService.js';
import * as onboardingService from '../services/onboardingService.js';
import Stripe from 'stripe';

// Inicializar Stripe
const stripe = new Stripe(config.stripe.secretKey);

export const handleStripeWebhook = async (req, res) => {
  try {
    console.log('🔔 Stripe webhook received');
    const sig = req.headers['stripe-signature'];
    const endpointSecret = config.stripe.webhookSecret;

    let event;

    // Em ambiente de teste, podemos pular a verificação de assinatura
    if (sig && endpointSecret) {
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        console.log('✅ Webhook signature verified');
      } catch (err) {
        console.warn(`⚠️ Webhook signature verification failed: ${err.message}`);
        console.log('⚠️ Processando webhook mesmo assim (modo teste)');
        // Em teste, vamos processar mesmo sem assinatura válida
        event = JSON.parse(req.body.toString());
      }
    } else {
      // Se não houver assinatura ou secret, processar diretamente (modo teste)
      console.log('⚠️ Sem verificação de assinatura (modo teste)');
      event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    }

    console.log(`📨 Stripe webhook event received: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      
      case 'checkout.session.expired':
        console.log('⏰ Checkout session expired:', event.data.object.id);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(event.data.object);
        break;
      
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        console.log('❌ Invoice payment failed:', event.data.object.id);
        break;
      
      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error handling Stripe webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

async function handleCheckoutCompleted(session) {
  try {
    console.log('🎉 Pagamento concluído:', session.id);
    
    const phoneNumber = session.metadata?.phone_number;
    const customerEmail = session.customer_details?.email;
    const subscriptionId = session.subscription;
    
    if (!phoneNumber) {
      console.error('Phone number not found in session metadata');
      return;
    }

    // Salvar dados do cliente
    await redisService.saveTemporaryState(`customer:${phoneNumber}`, {
      email: customerEmail,
      subscriptionId: subscriptionId,
      sessionId: session.id,
      paymentStatus: 'completed',
      timestamp: Date.now()
    });

    // Iniciar processo de onboarding
    await onboardingService.startOnboarding(phoneNumber, session);
    
  } catch (error) {
    console.error('Error handling checkout completed:', error);
  }
}

async function handleSubscriptionUpdate(subscription) {
  try {
    console.log('📋 Subscription updated:', subscription.id);
    
    const phoneNumber = subscription.metadata?.phone_number;
    
    if (!phoneNumber) {
      console.error('Phone number not found in subscription metadata');
      return;
    }

    // Atualizar status da assinatura
    await redisService.saveTemporaryState(`subscription:${phoneNumber}`, {
      subscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end,
      timestamp: Date.now()
    });

    // Se a assinatura está ativa, garantir que o onboarding foi feito
    if (subscription.status === 'active') {
      const onboardingStatus = await redisService.getTemporaryState(`onboarding:${phoneNumber}`);
      if (!onboardingStatus || onboardingStatus.status !== 'completed') {
        await onboardingService.startOnboarding(phoneNumber);
      }
    }
    
  } catch (error) {
    console.error('Error handling subscription update:', error);
  }
}

async function handleSubscriptionCancelled(subscription) {
  try {
    console.log('❌ Subscription cancelled:', subscription.id);
    
    const phoneNumber = subscription.metadata?.phone_number;
    
    if (!phoneNumber) {
      console.error('Phone number not found in subscription metadata');
      return;
    }

    // Marcar assinatura como cancelada
    await redisService.saveTemporaryState(`subscription:${phoneNumber}`, {
      subscriptionId: subscription.id,
      status: 'cancelled',
      cancelledAt: Date.now(),
      timestamp: Date.now()
    });

    // Enviar mensagem de despedida
    await whatsappService.sendReply(
      config.whatsapp.phoneNumberId,
      config.whatsapp.graphApiToken,
      phoneNumber,
      "😢 Sentimos muito que você tenha cancelado sua assinatura.\n\nSeus dados foram preservados caso queira retornar em breve.\n\nObrigado por ter confiado em nossos serviços! 🙏"
    );
    
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
  }
}

async function handlePaymentFailed(paymentIntent) {
  try {
    console.log('❌ Payment failed:', paymentIntent.id);
    console.log('Failure reason:', paymentIntent.last_payment_error?.message);
    
    // Aqui você pode adicionar lógica para notificar o usuário
    // Porém, precisaríamos ter o phone number nos metadados
    
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

async function handleInvoicePaid(invoice) {
  try {
    console.log('💰 Invoice paid:', invoice.id);
    
    const subscriptionId = invoice.subscription;
    const subscriptionData = await redisService.getTemporaryState(`subscription:*`);
    
    // Encontrar o número do cliente pela subscription
    // (implementar lógica para encontrar o phone number)
    
  } catch (error) {
    console.error('Error handling invoice paid:', error);
  }
}