// config\index.js

import dotenv from 'dotenv';

dotenv.config();

// Validar variáveis de ambiente obrigatórias
const requiredEnvVars = [
  'BING_API_KEY',
  'OPENAI_API_KEY',
  'WEBHOOK_VERIFY_TOKEN',
  'REDIS_PASSWORD',
  'REDIS_URL',
  'GRAPH_API_TOKEN',
  'ASSISTANT_ID',
  'AI_NUMBER',
  'SERVER_URL'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`${envVar} não está definida nas variáveis de ambiente`);
    process.exit(1);
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
  },
  bing: {
    apiKey: process.env.BING_API_KEY,
  },
  server: {
    url: process.env.SERVER_URL,
  },
};

export default config;