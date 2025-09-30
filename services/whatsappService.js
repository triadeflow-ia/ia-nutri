// services\whatsappService.js

import https from "https";
import { v4 as uuidv4 } from 'uuid';
import fs from "fs";
import path from "path";
import { __dirname } from '../app.js';
import * as audioService from './audioService.js';

// Função principal de envio de mensagens
export async function sendReply(phone_number_id, whatsapp_token, to, reply_message, resp, isAudio = false, messageId = null) {
  let json;

  if (isAudio) {
    try {
      const audioContent = await audioService.textToSpeech(reply_message);
      const audioFileName = `response_${messageId || uuidv4()}.ogg`;
      const audioPath = path.join(__dirname, 'audio_responses', audioFileName);

      // Certifique-se de que o diretório 'audio_responses' exista
      if (!fs.existsSync(path.join(__dirname, 'audio_responses'))) {
        fs.mkdirSync(path.join(__dirname, 'audio_responses'));
      }

      // Salva o arquivo de áudio gerado pela OpenAI
      fs.writeFileSync(audioPath, audioContent, 'binary');

      // Monta o JSON para enviar o áudio
      json = {
        messaging_product: "whatsapp",
        to: to,
        type: "audio",
        audio: {
          link: `${process.env.SERVER_URL}/audio/${audioFileName}`
        }
      };
    } catch (error) {
      console.error("Erro ao converter texto para áudio (OpenAI):", error);
      if (resp && !resp.headersSent) {
        resp.sendStatus(500);
      }
      throw error;
    }
  } else {
    // JSON para mensagens de texto
    json = {
      messaging_product: "whatsapp",
      to: to,
      text: { body: reply_message }
    };
  }

  const data = JSON.stringify(json);
  const requestPath = `/v19.0/${phone_number_id}/messages?access_token=${whatsapp_token}`;
  const options = {
    host: "graph.facebook.com",
    path: requestPath,
    method: "POST",
    headers: { "Content-Type": "application/json" }
  };

  console.log(`Enviando mensagem para o número: ${to} com mensagem: ${reply_message}`);

  return new Promise((resolve, reject) => {
    const req = https.request(options, (response) => {
      let responseData = '';
      
      response.on('data', (chunk) => {
        responseData += chunk;
      });

      response.on('end', () => {
        console.log(`Resposta da API do WhatsApp: ${responseData}`);

        if (response.statusCode === 200) {
          resolve(responseData);
        } else {
          console.error(`Falha ao enviar mensagem para o número ${to}. Código de status: ${response.statusCode}, Resposta: ${responseData}`);
          reject(new Error(`Falha no envio: ${response.statusCode}`));
        }

        if (resp && !resp.headersSent) {
          resp.sendStatus(response.statusCode);
        }
      });
    });

    req.on("error", (e) => {
      console.error(`Erro ao enviar a mensagem para o número ${to}:`, e.message);
      reject(e);
      if (resp && !resp.headersSent) {
        resp.sendStatus(500);
      }
    });

    req.write(data);
    req.end();
  });
}

// Função para fracionamento de mensagem baseado em pontuação
export async function sendSplitReply(phone_number_id, whatsapp_token, to, reply_message, resp, isAudio = false, messageId = null) {
  // Se for áudio, não fraciona a mensagem
  if (isAudio) {
    return sendReply(phone_number_id, whatsapp_token, to, reply_message, resp, isAudio, messageId);
  }

  // Array de pontuações que indicam possíveis pontos de quebra
  const breakPoints = ['. ', '! ', '? ', '... ', ': ', '\n'];
  let currentMessage = reply_message;
  let parts = [];

  // Enquanto houver texto para processar
  while (currentMessage.length > 0) {
    let nextBreak = -1;
    let selectedBreakPoint = '';

    // Encontrar o próximo ponto de quebra mais próximo
    for (const bp of breakPoints) {
      const index = currentMessage.indexOf(bp);
      if (index !== -1 && (nextBreak === -1 || index < nextBreak)) {
        nextBreak = index;
        selectedBreakPoint = bp;
      }
    }

    // Se não encontrou nenhum ponto de quebra, usar todo o texto restante
    if (nextBreak === -1) {
      if (currentMessage.trim().length > 0) {
        parts.push(currentMessage.trim());
      }
      break;
    }

    // Extrair a parte até o ponto de quebra
    const part = currentMessage.substring(0, nextBreak + selectedBreakPoint.length).trim();
    if (part.length > 0) {
      parts.push(part);
    }

    // Atualizar a mensagem restante
    currentMessage = currentMessage.substring(nextBreak + selectedBreakPoint.length);
  }

  // Enviar cada parte com um pequeno delay entre elas
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.trim().length > 0) {
      // Usar await para garantir o envio sequencial
      await new Promise(resolve => setTimeout(resolve, 800)); // Delay de 800ms entre mensagens
      await sendReply(phone_number_id, whatsapp_token, to, part, i === parts.length - 1 ? resp : null);
    }
  }
}

// Nova função para enviar resposta com timeout
export async function sendReplyWithTimeout(phone_number_id, whatsapp_token, to, reply_message, resp, delayMessage = "Hmm, só um instante...") {
  let isReplySent = false;

  // Envia a mensagem de atraso após 2 segundos, a menos que a resposta já tenha sido enviada
  const delayTimeout = setTimeout(async () => {
    if (!isReplySent) {
      try {
        await sendReply(phone_number_id, whatsapp_token, to, delayMessage, null);
      } catch (error) {
        console.error("Erro ao enviar mensagem de delay:", error);
      }
    }
  }, 2000);

  // Função que será chamada quando a resposta da IA for obtida
  const sendFinalReply = async (finalMessage) => {
    try {
      clearTimeout(delayTimeout);
      // Usa sendReply para enviar a mensagem completa (sem quebrar)
      await sendReply(phone_number_id, whatsapp_token, to, finalMessage, resp);
      isReplySent = true;
    } catch (error) {
      console.error("Erro ao enviar resposta final:", error);
      // Tenta enviar uma mensagem de erro caso a resposta principal falhe
      try {
        await sendReply(phone_number_id, whatsapp_token, to, "Desculpe, ocorreu um erro ao enviar a mensagem. Por favor, tente novamente.", resp);
      } catch (fallbackError) {
        console.error("Erro ao enviar mensagem de fallback:", fallbackError);
      }
    }
  };

  // Processa a resposta da IA
  try {
    await sendFinalReply(reply_message);
  } catch (error) {
    console.error("Erro ao processar resposta da OpenAI:", error);
    await sendFinalReply("Desculpe, houve um problema ao processar sua solicitação. Por favor, tente novamente em alguns instantes.");
  }
}

// Função auxiliar para enviar mensagens com mídia
export async function sendMediaMessage(phoneNumberId, recipientNumber, mediaMessage) {
  const json = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: recipientNumber,
    type: mediaMessage.type,
    [mediaMessage.type]: {
      link: mediaMessage[mediaMessage.type].file,
      caption: mediaMessage[mediaMessage.type].caption
    }
  };

  const data = JSON.stringify(json);
  const path = `/v19.0/${phoneNumberId}/messages`;

  // Configuração da requisição para a API do WhatsApp
  const options = {
    host: "graph.facebook.com",
    path: path,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GRAPH_API_TOKEN}`
    }
  };

  // Enviar a requisição
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => { resolve(JSON.parse(data)); });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Função para enviar template do WhatsApp
export async function sendTemplate(phoneNumberId, whatsappToken, to, templateName, language = 'pt_BR', components = []) {
  const json = {
    messaging_product: "whatsapp",
    to: to,
    type: "template",
    template: {
      name: templateName,
      language: {
        code: language
      },
      components: components
    }
  };

  const data = JSON.stringify(json);
  const requestPath = `/v19.0/${phoneNumberId}/messages?access_token=${whatsappToken}`;
  const options = {
    host: "graph.facebook.com",
    path: requestPath,
    method: "POST",
    headers: { "Content-Type": "application/json" }
  };

  console.log(`Enviando template ${templateName} para: ${to}`);

  return new Promise((resolve, reject) => {
    const req = https.request(options, (response) => {
      let responseData = '';
      
      response.on('data', (chunk) => {
        responseData += chunk;
      });

      response.on('end', () => {
        console.log(`Resposta template ${templateName}: ${responseData}`);
        if (response.statusCode === 200) {
          resolve(JSON.parse(responseData));
        } else {
          console.error(`Falha ao enviar template ${templateName}: ${response.statusCode}, Resposta: ${responseData}`);
          reject(new Error(`Falha no envio: ${response.statusCode}`));
        }
      });
    });

    req.on('error', (e) => {
      console.error(`Erro ao enviar template ${templateName}:`, e.message);
      reject(e);
    });

    req.write(data);
    req.end();
  });
}

// Função específica para enviar template de boas-vindas
export async function sendWelcomeTemplate(phoneNumberId, whatsappToken, to, userName = null) {
  try {
    console.log(`Enviando template de boas-vindas para: ${to}`);
    
    // Componentes do template (se o template tiver variáveis)
    const components = [];
    
    // Se o template tiver variáveis de nome, adicionar componente
    if (userName) {
      components.push({
        type: "body",
        parameters: [
          {
            type: "text",
            text: userName
          }
        ]
      });
    }
    
    return await sendTemplate(
      phoneNumberId,
      whatsappToken,
      to,
      'assistente_nutricional',
      'pt_BR',
      components
    );
  } catch (error) {
    console.error('Erro ao enviar template de boas-vindas:', error);
    throw error;
  }
}