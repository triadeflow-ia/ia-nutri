// config\rateLimiter.js

import rateLimit from 'express-rate-limit';

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições
  message: "Muitas solicitações criadas a partir deste dispositivo, por favor, tente novamente após 15 minutos"
});

export default limiter;