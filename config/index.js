// config\index.js

import dotenv from 'dotenv';

dotenv.config();

// Validação de variáveis de ambiente (tolerante em desenvolvimento)
const requiredEnvVars = [
  'WEBHOOK_VERIFY_TOKEN',
];

const optionalButRecommended = [
  'OPENAI_API_KEY',
  'GRAPH_API_TOKEN',
  'ASSISTANT_ID',
  'AI_NUMBER',
  'SERVER_URL',
  'BING_API_KEY',
  'REDIS_PASSWORD',
  'REDIS_URL',
  // Stripe
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PUBLISHABLE_KEY',
  'STRIPE_PRICE_MONTHLY',
  'STRIPE_PRICE_QUARTERLY',
  'STRIPE_PRICE_ANNUAL',
  // WhatsApp Templates
  'WHATSAPP_TEMPLATE_WELCOME',
  'WHATSAPP_TEMPLATE_CONSENT',
  'WHATSAPP_TEMPLATE_ANAMNESE'
];

const missingRequired = requiredEnvVars.filter(name => !process.env[name]);
const allowStart = process.env.ALLOW_START_WITH_MISSING_ENVS === 'true';

if (missingRequired.length > 0) {
  const message = `Variáveis obrigatórias ausentes: ${missingRequired.join(', ')}`;
  if (allowStart) {
    console.warn(message);
  } else {
    console.error(message);
    process.exit(1);
  }
}

for (const envVar of optionalButRecommended) {
  if (!process.env[envVar]) {
    console.warn(`${envVar} não está definida. Algumas funcionalidades podem não funcionar.`);
  }
}

export const config = {
  port: process.env.PORT || 1337,
  webhookVerifyToken: process.env.WEBHOOK_VERIFY_TOKEN,
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    assistantId: process.env.ASSISTANT_ID,
  },
  redis: {
    password: process.env.REDIS_PASSWORD,
    url: process.env.REDIS_URL,
  },
  whatsapp: {
    graphApiToken: process.env.GRAPH_API_TOKEN,
    aiPhoneNumber: process.env.AI_NUMBER,
    phoneNumberId: process.env.PHONE_NUMBER_ID,
    templates: {
      welcome: process.env.WHATSAPP_TEMPLATE_WELCOME,
      consent: process.env.WHATSAPP_TEMPLATE_CONSENT,
      anamnese: process.env.WHATSAPP_TEMPLATE_ANAMNESE,
    }
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    prices: {
      monthly: process.env.STRIPE_PRICE_MONTHLY,
      quarterly: process.env.STRIPE_PRICE_QUARTERLY,
      annual: process.env.STRIPE_PRICE_ANNUAL,
    },
    webhookUrl: process.env.STRIPE_WEBHOOK_URL,
    successUrl: process.env.STRIPE_SUCCESS_URL,
    cancelUrl: process.env.STRIPE_CANCEL_URL,
  },
  bing: {
    apiKey: process.env.BING_API_KEY,
  },
  server: {
    url: process.env.SERVER_URL,
  },
};

export default config;