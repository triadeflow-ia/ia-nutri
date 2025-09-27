// controllers\stripeController.js

import { config } from '../config/index.js';
import * as whatsappService from '../services/whatsappService.js';
import * as redisService from '../services/redisService.js';
import * as onboardingService from '../services/onboardingService.js';

export const handleStripeWebhook = async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = config.stripe.webhookSecret;

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`Stripe webhook event received: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
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
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
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