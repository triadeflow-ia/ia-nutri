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

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.set('trust proxy', 1);
app.use(limiter);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Conectar Redis
await redisClient.connect();

// Rotas
app.use('/webhook', webhookRoutes);
app.use('/audio', audioRoutes);

const PORT = process.env.PORT || 1337;
app.listen(PORT, () => {
  console.log(`Webhook is listening on port ${PORT}`);
});

export { __dirname };