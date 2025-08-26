// controllers\webhookController.js

import { config } from '../config/index.js';
import { processMessage } from './messageController.js';

export const validateWebhook = (req, res) => {
  console.log("Recebida requisição GET no /webhook");
  console.log("Query params:", req.query);
  
  const VERIFY_TOKEN = config.webhookVerifyToken;
  console.log("VERIFY_TOKEN:", VERIFY_TOKEN);

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WEBHOOK_VERIFIED');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
};

export const handleWebhookPost = async (req, res) => {
  try {
    console.log("Webhook received:", JSON.stringify(req.body, null, 2));
    
    if (!req.body.object) {
      console.log("Invalid webhook object");
      return res.sendStatus(404);
    }

    // Processa apenas mensagens, ignora status updates
    const change = req.body.entry?.[0]?.changes?.[0];
    
    // Verifica se é uma notificação de status (sent, delivered, read)
    if (change?.value?.statuses) {
      console.log("Status update received, ignoring...");
      return res.sendStatus(200);
    }
    
    const message = change?.value?.messages?.[0];
    const profileName = change?.value?.contacts?.[0]?.profile?.name || 'Desconhecido';
    const phoneNumberId = change?.value?.metadata?.phone_number_id;
    
    console.log("Received message:", JSON.stringify(message, null, 2));
    console.log("Nome do perfil do usuário no WhatsApp:", profileName);

    if (message && message.from) {
      await processMessage(message, profileName, phoneNumberId, res);
    } else {
      res.sendStatus(200);
    }
  } catch (error) {
    console.error("Error during webhook handling:", error);
    if (!res.headersSent) {
      res.sendStatus(500);
    }
  }
};