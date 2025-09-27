// routes/rateLimit.js
// Rotas para gerenciamento de rate limiting

import express from 'express';
import rateLimitService from '../services/rateLimitService.js';
import logger from '../config/logger.js';

const router = express.Router();

// Middleware para validar número de telefone
const validatePhoneNumber = (req, res, next) => {
  const { phoneNumber } = req.params;
  
  if (!phoneNumber) {
    return res.status(400).json({
      error: 'Phone number is required',
      message: 'Número de telefone é obrigatório'
    });
  }

  // Validar formato básico do número
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  if (!phoneRegex.test(phoneNumber)) {
    return res.status(400).json({
      error: 'Invalid phone number format',
      message: 'Formato de número de telefone inválido'
    });
  }

  req.validatedPhoneNumber = phoneNumber;
  next();
};

// GET /rate-limit/status/:phoneNumber - Verificar status do rate limit de um usuário
router.get('/status/:phoneNumber', validatePhoneNumber, async (req, res) => {
  try {
    const { phoneNumber } = req.validatedPhoneNumber;
    const status = await rateLimitService.getRateLimitStatus(phoneNumber);
    
    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting rate limit status', { 
      error: error.message, 
      phoneNumber: req.validatedPhoneNumber 
    });
    
    res.status(500).json({
      error: 'Failed to get rate limit status',
      message: 'Erro ao obter status do rate limit'
    });
  }
});

// POST /rate-limit/whitelist/:phoneNumber - Adicionar número à whitelist
router.post('/whitelist/:phoneNumber', validatePhoneNumber, async (req, res) => {
  try {
    const { phoneNumber } = req.validatedPhoneNumber;
    
    rateLimitService.addToWhitelist(phoneNumber);
    
    logger.info('Phone number added to whitelist', { 
      phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*') 
    });
    
    res.json({
      success: true,
      message: 'Número adicionado à whitelist com sucesso',
      phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*'),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error adding phone to whitelist', { 
      error: error.message, 
      phoneNumber: req.validatedPhoneNumber 
    });
    
    res.status(500).json({
      error: 'Failed to add phone to whitelist',
      message: 'Erro ao adicionar número à whitelist'
    });
  }
});

// DELETE /rate-limit/whitelist/:phoneNumber - Remover número da whitelist
router.delete('/whitelist/:phoneNumber', validatePhoneNumber, async (req, res) => {
  try {
    const { phoneNumber } = req.validatedPhoneNumber;
    
    rateLimitService.removeFromWhitelist(phoneNumber);
    
    logger.info('Phone number removed from whitelist', { 
      phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*') 
    });
    
    res.json({
      success: true,
      message: 'Número removido da whitelist com sucesso',
      phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*'),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error removing phone from whitelist', { 
      error: error.message, 
      phoneNumber: req.validatedPhoneNumber 
    });
    
    res.status(500).json({
      error: 'Failed to remove phone from whitelist',
      message: 'Erro ao remover número da whitelist'
    });
  }
});

// POST /rate-limit/reset/:phoneNumber - Resetar rate limit de um usuário
router.post('/reset/:phoneNumber', validatePhoneNumber, async (req, res) => {
  try {
    const { phoneNumber } = req.validatedPhoneNumber;
    const { type } = req.body; // Tipo opcional para resetar apenas um tipo específico
    
    await rateLimitService.resetRateLimit(phoneNumber, type);
    
    logger.info('Rate limit reset', { 
      phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*'),
      type: type || 'all'
    });
    
    res.json({
      success: true,
      message: type ? 
        `Rate limit resetado para tipo ${type}` : 
        'Rate limit resetado para todos os tipos',
      phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*'),
      type: type || 'all',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error resetting rate limit', { 
      error: error.message, 
      phoneNumber: req.validatedPhoneNumber 
    });
    
    res.status(500).json({
      error: 'Failed to reset rate limit',
      message: 'Erro ao resetar rate limit'
    });
  }
});

// GET /rate-limit/stats - Obter estatísticas de rate limiting
router.get('/stats', async (req, res) => {
  try {
    const stats = await rateLimitService.getRateLimitStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting rate limit stats', { error: error.message });
    
    res.status(500).json({
      error: 'Failed to get rate limit stats',
      message: 'Erro ao obter estatísticas de rate limiting'
    });
  }
});

// GET /rate-limit/limits - Obter configurações de limites
router.get('/limits', (req, res) => {
  try {
    const limits = {
      text: {
        max: 20,
        windowMs: 60000,
        description: '20 mensagens de texto por minuto'
      },
      audio: {
        max: 5,
        windowMs: 60000,
        description: '5 áudios por minuto'
      },
      image: {
        max: 10,
        windowMs: 60000,
        description: '10 imagens por minuto'
      },
      document: {
        max: 3,
        windowMs: 60000,
        description: '3 documentos por minuto'
      },
      global: {
        max: 50,
        windowMs: 60000,
        description: '50 mensagens totais por minuto'
      }
    };
    
    res.json({
      success: true,
      data: limits,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting rate limit limits', { error: error.message });
    
    res.status(500).json({
      error: 'Failed to get rate limit limits',
      message: 'Erro ao obter configurações de limites'
    });
  }
});

// POST /rate-limit/test - Endpoint para testar rate limiting
router.post('/test', async (req, res) => {
  try {
    const { phoneNumber, type = 'text' } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({
        error: 'Phone number is required',
        message: 'Número de telefone é obrigatório'
      });
    }

    const result = await rateLimitService.checkRateLimit(phoneNumber, type);
    
    res.json({
      success: true,
      data: {
        phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*'),
        type,
        allowed: result.allowed,
        remaining: result.remaining,
        resetTime: result.resetTime,
        message: result.message
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error testing rate limit', { error: error.message });
    
    res.status(500).json({
      error: 'Failed to test rate limit',
      message: 'Erro ao testar rate limiting'
    });
  }
});

export default router;

