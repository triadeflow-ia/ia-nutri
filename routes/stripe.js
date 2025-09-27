// routes/stripe.js

import express from 'express';
import { handleStripeWebhook } from '../controllers/stripeController.js';
import { checkMessageSize } from '../middleware/messageValidator.js';

const router = express.Router();

// Middleware para processar raw body (necessário para Stripe)
router.use('/webhook', express.raw({ type: 'application/json' }));

// Rota para webhook do Stripe
router.post('/webhook', checkMessageSize, handleStripeWebhook);

export default router;

