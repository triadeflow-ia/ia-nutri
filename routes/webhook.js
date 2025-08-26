// routes\webhook.js

import express from 'express';
import { validateWebhook, handleWebhookPost } from '../controllers/webhookController.js';
import { checkMessageSize } from '../middleware/messageValidator.js';

const router = express.Router();

// Rota para validar o webhook da Meta
router.get('/', validateWebhook);

// Rota para processar mensagens do webhook
router.post('/', checkMessageSize, handleWebhookPost);

export default router;