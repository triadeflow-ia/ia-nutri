// app.js

import express from "express";
import bodyParser from "body-parser";
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from "path";

// Configurações
import './config/index.js';
import { redisClient } from './config/redis.js';
import { limiter } from './config/rateLimiter.js';

// Rotas
import webhookRoutes from './routes/webhook.js';
import audioRoutes from './routes/audio.js';
import stripeRoutes from './routes/stripe.js';
import testRoutes from './routes/test.js';

dotenv.config();

const app = express();

// Stripe webhook precisa do raw body
app.use('/stripe/webhook', express.raw({ type: 'application/json' }));

// Demais rotas usam JSON parser
app.use(bodyParser.json());
app.set('trust proxy', 1);
app.use(limiter);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Conectar Redis (opcional se variáveis não definidas)
try {
  if (process.env.REDIS_URL && process.env.REDIS_PASSWORD) {
    await redisClient.connect();
  } else {
    console.warn('Redis não configurado (REDIS_URL/REDIS_PASSWORD ausentes). Inicializando sem Redis.');
  }
} catch (err) {
  console.warn('Falha ao conectar no Redis. Servidor continuará sem Redis.', err?.message || err);
}

// Rota principal
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.0.0',
    message: 'IA Atendimento Bot - Sistema de Atendimento via WhatsApp com IA'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.0.0',
    memory: process.memoryUsage(),
    redis: redisClient.isOpen ? 'connected' : 'disconnected'
  });
});

// Rotas
app.use('/webhook', webhookRoutes);
app.use('/audio', audioRoutes);
app.use('/stripe', stripeRoutes);
app.use('/test', testRoutes);

const PORT = process.env.PORT || 1337;
app.listen(PORT, () => {
  console.log(`Webhook is listening on port ${PORT}`);
});

export { __dirname };