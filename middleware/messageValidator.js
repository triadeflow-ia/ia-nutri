// middleware\messageValidator.js

export function checkMessageSize(req, res, next) {
  const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  
  if (message && message.text && message.text.body && message.text.body.length > 1000) {
    return res.status(400).send("Mensagem muito longa");
  }
  
  next();
}

export function validateWebhookPayload(req, res, next) {
  // Validar estrutura básica do payload
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Invalid payload structure' });
  }
  
  // Validar que é um evento do WhatsApp
  if (req.body.object !== 'whatsapp_business_account') {
    return res.status(400).json({ error: 'Not a WhatsApp Business event' });
  }
  
  next();
}

export function validateMessageType(req, res, next) {
  const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  
  if (!message) {
    return next();
  }
  
  const validTypes = ['text', 'image', 'document', 'audio', 'video', 'location', 'contacts', 'sticker'];
  
  if (message.type && !validTypes.includes(message.type)) {
    console.warn(`Tipo de mensagem não suportado: ${message.type}`);
    return res.status(200).send('Message type not supported');
  }
  
  next();
}

export function sanitizeInput(req, res, next) {
  const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  
  if (message && message.text && message.text.body) {
    // Remove caracteres de controle e sanitiza a entrada
    message.text.body = message.text.body
      .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]/g, '')
      .trim();
  }
  
  next();
}

export function checkRateLimit(limitMap = new Map(), maxRequests = 10, windowMs = 60000) {
  return (req, res, next) => {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    
    if (!message || !message.from) {
      return next();
    }
    
    const phoneNumber = message.from;
    const now = Date.now();
    
    if (!limitMap.has(phoneNumber)) {
      limitMap.set(phoneNumber, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }
    
    const userLimit = limitMap.get(phoneNumber);
    
    if (now > userLimit.resetTime) {
      userLimit.count = 1;
      userLimit.resetTime = now + windowMs;
      return next();
    }
    
    if (userLimit.count >= maxRequests) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
      });
    }
    
    userLimit.count++;
    next();
  };
}

export function logRequest(req, res, next) {
  const timestamp = new Date().toISOString();
  const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  
  if (message) {
    console.log(`[${timestamp}] Mensagem recebida de ${message.from}: ${message.type}`);
  }
  
  next();
}

export function handleErrors(err, req, res, next) {
  console.error('Erro no middleware:', err);
  
  // Não expor detalhes do erro em produção
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    error: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack })
  });
}