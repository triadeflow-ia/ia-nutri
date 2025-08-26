// utils\messageFormatter.js

import moment from 'moment-timezone';

export function formatMessageWithDate(message, timestamp, profileName) {
  const messageDateTime = moment(timestamp * 1000).tz("America/Sao_Paulo").format('DD/MM/YYYY HH:mm:ss');
  return `${messageDateTime} - ${profileName}: ${message}`;
}

export function getTimeBasedGreeting() {
  const now = moment().tz("America/Sao_Paulo");
  console.log("Hora atual em São Paulo:", now.format('HH:mm'));

  if (now.hours() < 12) {
    return "Bom dia";
  } else if (now.hours() < 18) {
    return "Boa tarde";
  } else {
    return "Boa noite";
  }
}

export function formatWhatsAppMessage(text, maxLength = 1600) {
  // WhatsApp tem limite de 4096 caracteres, mas é melhor manter mensagens menores
  if (text.length <= maxLength) {
    return [text];
  }

  const parts = [];
  let currentPart = '';
  const sentences = text.split(/(?<=[.!?])\s+/);

  for (const sentence of sentences) {
    if ((currentPart + sentence).length <= maxLength) {
      currentPart += (currentPart ? ' ' : '') + sentence;
    } else {
      if (currentPart) {
        parts.push(currentPart);
      }
      currentPart = sentence;
    }
  }

  if (currentPart) {
    parts.push(currentPart);
  }

  return parts;
}

export function sanitizeMessage(text) {
  // Remove caracteres especiais que podem causar problemas
  return text
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
}

export function createTypingIndicator(phoneNumberId, to) {
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: to,
    type: "text",
    text: {
      body: "..."
    }
  };
}

export function formatErrorMessage(error) {
  const defaultMessage = "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.";
  
  if (error.code === 'RATE_LIMIT') {
    return "Você atingiu o limite de mensagens. Por favor, aguarde alguns minutos antes de tentar novamente.";
  }
  
  if (error.code === 'INVALID_AUDIO') {
    return "Não consegui processar o áudio enviado. Por favor, tente enviar novamente ou digite sua mensagem.";
  }
  
  if (error.code === 'INVALID_IMAGE') {
    return "Não consegui processar a imagem enviada. Por favor, verifique se o arquivo é uma imagem válida.";
  }
  
  if (error.code === 'PDF_ERROR') {
    return "Não consegui processar o documento PDF. Por favor, verifique se o arquivo não está corrompido.";
  }
  
  return defaultMessage;
}

export function formatListMessage(title, items, footer = null) {
  let message = `*${title}*\n\n`;
  
  items.forEach((item, index) => {
    message += `${index + 1}. ${item}\n`;
  });
  
  if (footer) {
    message += `\n_${footer}_`;
  }
  
  return message;
}

export function formatButtonMessage(text, buttons) {
  // WhatsApp Business API format for buttons
  return {
    messaging_product: "whatsapp",
    type: "interactive",
    interactive: {
      type: "button",
      body: {
        text: text
      },
      action: {
        buttons: buttons.map((button, index) => ({
          type: "reply",
          reply: {
            id: `button_${index}`,
            title: button
          }
        }))
      }
    }
  };
}

export function formatLocation(latitude, longitude, name = null, address = null) {
  return {
    messaging_product: "whatsapp",
    type: "location",
    location: {
      latitude: latitude,
      longitude: longitude,
      name: name,
      address: address
    }
  };
}