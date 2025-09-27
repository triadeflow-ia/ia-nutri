// routes\stripe.js

import express from 'express';
import { handleStripeWebhook } from '../controllers/stripeController.js';

const router = express.Router();

// Rota para webhook do Stripe
router.post('/webhook', handleStripeWebhook);

export default router;