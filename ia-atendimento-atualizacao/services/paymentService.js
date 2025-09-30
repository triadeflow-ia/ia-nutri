// services/paymentService.js

import * as redisService from './redisService.js';
import { config } from '../config/index.js';

// Inicializar Stripe se as chaves estiverem configuradas
let stripe = null;
try {
  if (config.stripe.secretKey) {
    const Stripe = (await import('stripe')).default;
    stripe = new Stripe(config.stripe.secretKey);
  }
} catch (error) {
  console.log('Stripe não disponível:', error.message);
}

export const checkPaymentStatus = async (phoneNumber) => {
  try {
    console.log(`🔍 Verificando status de pagamento para: ${phoneNumber}`);
    
    // Verificar se há dados de cliente
    const customerData = await redisService.getTemporaryState(`customer:${phoneNumber}`);
    if (customerData && customerData.paymentStatus === 'completed') {
      console.log(`✅ Pagamento confirmado para: ${phoneNumber}`);
      return {
        hasPayment: true,
        status: 'completed',
        email: customerData.email,
        subscriptionId: customerData.subscriptionId,
        sessionId: customerData.sessionId
      };
    }

    // Verificar se há assinatura ativa
    const subscriptionData = await redisService.getTemporaryState(`subscription:${phoneNumber}`);
    if (subscriptionData && subscriptionData.status === 'active') {
      console.log(`✅ Assinatura ativa para: ${phoneNumber}`);
      return {
        hasPayment: true,
        status: 'active',
        subscriptionId: subscriptionData.subscriptionId,
        currentPeriodEnd: subscriptionData.currentPeriodEnd
      };
    }

    console.log(`❌ Nenhum pagamento encontrado para: ${phoneNumber}`);
    return {
      hasPayment: false,
      status: 'none'
    };

  } catch (error) {
    console.error('Erro ao verificar status de pagamento:', error);
    return {
      hasPayment: false,
      status: 'error',
      error: error.message
    };
  }
};

export const getPaymentRequiredMessage = (phoneNumber = null) => {
  // Links de pagamento do Stripe (teste)
  const paymentLinks = {
    monthly: 'https://buy.stripe.com/test_4gMeVdfk12tU6O13lh48002', // R$ 29,90/mês
    quarterly: 'https://buy.stripe.com/test_aFacN5efX1pQb4h9JF48001', // R$ 79,90 a cada 3 meses
    annual: 'https://buy.stripe.com/test_6oU14n8VD8Si6O12hd48000' // R$ 299,90/ano
  };
  
  return `🔒 Acesso Restrito

Este recurso é exclusivo para assinantes.

Para liberar o assistente nutricional e receber orientações personalizadas, escolha um dos planos abaixo:

💳 Planos disponíveis:

📅 Mensal — R$ 29,90/mês
${paymentLinks.monthly}

📅 Trimestral — R$ 79,90 a cada 3 meses
${paymentLinks.quarterly}

📅 Anual — R$ 299,90/ano (melhor custo-benefício)
${paymentLinks.annual}

📋 Você terá acesso a:
• Consultoria nutricional personalizada
• Cardápios sob medida
• Acompanhamento de progresso
• Suporte 24h via WhatsApp

⚠️ O acesso será liberado apenas para usuários com assinatura ativa.`;
};

export const getWelcomeAfterPaymentMessage = (userName) => {
  return `🎉 *Bem-vindo(a), ${userName}!*

Seu pagamento foi confirmado e você agora tem acesso completo ao assistente nutricional!

Vamos começar criando seu perfil personalizado para oferecer o melhor atendimento possível.`;
};

// Função para criar link de pagamento dinâmico
export const createPaymentLink = async (phoneNumber, planType = 'monthly') => {
  try {
    if (!stripe) {
      console.error('⚠️ Stripe não configurado');
      return null;
    }

    // Price IDs hardcoded como fallback se não houver nas env vars
    const hardcodedPrices = {
      monthly: 'price_1SCuW4F9Wxiy3vIi7kIl9I3x',    // R$ 29,90/mês
      quarterly: 'price_1SCuWXF9Wxiy3vIit5mGfFkH',  // R$ 79,90/3 meses
      annual: 'price_1SCuWpF9Wxiy3vIi5MnHE8FU'      // R$ 299,90/ano
    };

    const priceId = config.stripe.prices?.[planType] || hardcodedPrices[planType];
    
    if (!priceId) {
      console.error(`❌ Preço não encontrado para o plano: ${planType}`);
      return null;
    }

    console.log(`💳 Criando checkout session com Price ID: ${priceId} para ${phoneNumber}`);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${config.server.url || 'https://ia-nutri-q4dy.onrender.com'}/success?phone=${phoneNumber}`,
      cancel_url: `${config.server.url || 'https://ia-nutri-q4dy.onrender.com'}/cancel?phone=${phoneNumber}`,
      metadata: {
        phone_number: phoneNumber,
        plan_type: planType
      },
    });

    console.log(`✅ Checkout session criada: ${session.id}`);
    return session.url;
  } catch (error) {
    console.error('❌ Erro ao criar link de pagamento:', error.message);
    console.error('Detalhes:', error);
    return null;
  }
};

// Função para obter mensagem de pagamento com link dinâmico
export const getPaymentRequiredMessageWithLink = async (phoneNumber) => {
  try {
    console.log(`💳 Criando links de pagamento dinâmicos para: ${phoneNumber}`);
    
    // Criar links dinâmicos para cada plano
    const monthlyLink = await createPaymentLink(phoneNumber, 'monthly');
    const quarterlyLink = await createPaymentLink(phoneNumber, 'quarterly');
    const annualLink = await createPaymentLink(phoneNumber, 'annual');
    
    // Se conseguiu criar os links dinâmicos, usar eles
    if (monthlyLink && quarterlyLink && annualLink) {
      console.log(`✅ Links dinâmicos criados com sucesso`);
      return `🔒 Acesso Restrito

Este recurso é exclusivo para assinantes.

Para liberar o assistente nutricional e receber orientações personalizadas, escolha um dos planos abaixo:

💳 Planos disponíveis:

📅 Mensal — R$ 29,90/mês
${monthlyLink}

📅 Trimestral — R$ 79,90 a cada 3 meses
${quarterlyLink}

📅 Anual — R$ 299,90/ano (melhor custo-benefício)
${annualLink}

📋 Você terá acesso a:
• Consultoria nutricional personalizada
• Cardápios sob medida
• Acompanhamento de progresso
• Suporte 24h via WhatsApp

⚠️ O acesso será liberado apenas para usuários com assinatura ativa.`;
    }
    
    // Fallback para links estáticos
    console.log(`⚠️ Usando links estáticos (fallback)`);
    return getPaymentRequiredMessage(phoneNumber);
  } catch (error) {
    console.error('Erro ao gerar mensagem de pagamento:', error);
    return getPaymentRequiredMessage(phoneNumber);
  }
};

// Função para obter link de pagamento específico
export const getPaymentLink = (planType = 'monthly') => {
  const paymentLinks = {
    monthly: 'https://buy.stripe.com/test_4gMeVdfk12tU6O13lh48002', // R$ 29,90/mês
    quarterly: 'https://buy.stripe.com/test_aFacN5efX1pQb4h9JF48001', // R$ 79,90 a cada 3 meses
    annual: 'https://buy.stripe.com/test_6oU14n8VD8Si6O12hd48000' // R$ 299,90/ano
  };
  
  return paymentLinks[planType] || paymentLinks.monthly;
};

// Função para detectar plano solicitado pelo usuário
export const detectPlanFromMessage = (message) => {
  const userMessage = message.toLowerCase();
  
  if (userMessage.includes('anual') || userMessage.includes('ano') || userMessage.includes('299')) {
    return 'annual';
  } else if (userMessage.includes('trimestral') || userMessage.includes('3 meses') || userMessage.includes('79')) {
    return 'quarterly';
  } else if (userMessage.includes('mensal') || userMessage.includes('mês') || userMessage.includes('29')) {
    return 'monthly';
  }
  
  return null; // Plano não detectado
};

// Função para obter mensagem de plano específico
export const getSpecificPlanMessage = async (planType, phoneNumber) => {
  const planInfo = {
    monthly: {
      name: 'Mensal',
      price: 'R$ 29,90/mês',
      staticLink: 'https://buy.stripe.com/test_4gMeVdfk12tU6O13lh48002'
    },
    quarterly: {
      name: 'Trimestral',
      price: 'R$ 79,90 a cada 3 meses',
      staticLink: 'https://buy.stripe.com/test_aFacN5efX1pQb4h9JF48001'
    },
    annual: {
      name: 'Anual',
      price: 'R$ 299,90/ano',
      staticLink: 'https://buy.stripe.com/test_6oU14n8VD8Si6O12hd48000'
    }
  };
  
  const plan = planInfo[planType] || planInfo.monthly;
  
  // Tentar criar link dinâmico com metadata
  let paymentLink = plan.staticLink;
  try {
    const dynamicLink = await createPaymentLink(phoneNumber, planType);
    if (dynamicLink) {
      paymentLink = dynamicLink;
      console.log(`✅ Link dinâmico criado para plano ${planType}`);
    }
  } catch (error) {
    console.error(`Erro ao criar link dinâmico, usando estático:`, error);
  }
  
  return `🔒 Acesso Restrito

Este recurso é exclusivo para assinantes.

💳 Plano ${plan.name} — ${plan.price}

📋 Você terá acesso a:
• Consultoria nutricional personalizada
• Cardápios sob medida
• Acompanhamento de progresso
• Suporte 24h via WhatsApp

🔗 Para assinar agora:
${paymentLink}

⚠️ O acesso será liberado apenas para usuários com assinatura ativa.`;
};
