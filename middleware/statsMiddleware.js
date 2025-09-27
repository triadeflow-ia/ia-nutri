// middleware/statsMiddleware.js

import statsService from '../services/statsService.js';
import logger from '../config/logger.js';

// Middleware para contar mensagens processadas
export const messageCounter = async (req, res, next) => {
  const startTime = Date.now();
  
  // Interceptar a resposta para capturar dados
  const originalSend = res.send;
  const originalJson = res.json;
  
  let responseData = null;
  let phone = null;
  
  // Capturar dados da requisição
  if (req.body) {
    // Para webhooks do WhatsApp
    if (req.body.entry && req.body.entry[0] && req.body.entry[0].changes) {
      const changes = req.body.entry[0].changes;
      for (const change of changes) {
        if (change.value && change.value.messages) {
          for (const message of change.value.messages) {
            phone = message.from;
            break;
          }
        }
      }
    }
    
    // Para outras requisições que possam ter phone
    if (!phone && req.body.phone) {
      phone = req.body.phone;
    }
    
    // Para requisições de áudio
    if (!phone && req.body.from) {
      phone = req.body.from;
    }
  }
  
  // Interceptar resposta
  res.send = function(data) {
    responseData = data;
    return originalSend.call(this, data);
  };
  
  res.json = function(data) {
    responseData = data;
    return originalJson.call(this, data);
  };
  
  // Interceptar o final da resposta
  res.on('finish', async () => {
    const processingTime = Date.now() - startTime;
    
    // Só contar se for uma resposta de sucesso e tivermos dados
    if (res.statusCode >= 200 && res.statusCode < 300 && phone) {
      try {
        await statsService.incrementMessageCount(phone);
        
        // Log da mensagem processada
        logger.info('Message processed', {
          phone: phone.replace(/\d(?=\d{4})/g, '*'), // Mascarar número
          processingTime,
          statusCode: res.statusCode,
          responseSize: responseData ? JSON.stringify(responseData).length : 0
        });
      } catch (error) {
        logger.error('Error updating message stats', { 
          error: error.message,
          phone: phone.replace(/\d(?=\d{4})/g, '*')
        });
      }
    }
  });
  
  next();
};

// Middleware para contar erros
export const errorCounter = (err, req, res, next) => {
  // Incrementar contador de erros
  statsService.incrementErrorCount().catch(error => {
    logger.error('Error updating error stats', { error: error.message });
  });
  
  // Log do erro
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    statusCode: res.statusCode || 500
  });
  
  next(err);
};

// Middleware para log de requisições
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const processingTime = Date.now() - startTime;
    
    logger.info('Request processed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      processingTime,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  });
  
  next();
};

