// services\menuService.js

import { config } from '../config/index.js';
import * as whatsappService from './whatsappService.js';
import * as redisService from './redisService.js';
import * as openaiService from './openaiService.js';
import * as alertService from './alertService.js';

export const generatePersonalizedMenu = async (phoneNumber, anamneseData) => {
  try {
    console.log(`🍽️ Gerando cardápio personalizado para: ${phoneNumber}`);
    
    // Enviar mensagem de progresso
    await whatsappService.sendReply(
      config.whatsapp.phoneNumberId,
      config.whatsapp.graphApiToken,
      phoneNumber,
      "🔬 Analisando seus dados e criando seu plano nutricional...\n\nIsso pode levar 2-3 minutos. ⏳"
    );

    // Criar prompt para geração do cardápio
    const menuPrompt = createMenuPrompt(anamneseData);
    
    // Gerar cardápio com IA
    const menuResponse = await openaiService.getOpenAIResponse(menuPrompt);
    
    // Processar e salvar cardápio
    const menuData = await processMenuResponse(phoneNumber, menuResponse);
    
    // Salvar dados do cardápio
    await redisService.saveTemporaryState(`menu:${phoneNumber}`, {
      menuData: menuData,
      generatedAt: Date.now(),
      timestamp: Date.now()
    });

    // Enviar cardápio para o usuário
    await sendMenuToUser(phoneNumber, menuData);
    
    // Configurar alertas personalizados
    await alertService.setupPersonalizedAlerts(phoneNumber, anamneseData);
    
  } catch (error) {
    console.error('Error generating personalized menu:', error);
    
    await whatsappService.sendReply(
      config.whatsapp.phoneNumberId,
      config.whatsapp.graphApiToken,
      phoneNumber,
      "❌ Ocorreu um erro ao gerar seu cardápio. Nossa equipe foi notificada e resolveremos isso em breve.\n\nPor favor, tente novamente em alguns minutos."
    );
  }
};

function createMenuPrompt(anamneseData) {
  return `Você é um nutricionista especializado. Com base nas informações fornecidas, crie um plano nutricional completo.

DADOS DO CLIENTE:
${JSON.stringify(anamneseData, null, 2)}

Crie um cardápio de 7 dias (segunda a domingo) incluindo:
1. CAFÉ DA MANHÃ
2. LANCHE DA MANHÃ  
3. ALMOÇO
4. LANCHE DA TARDE
5. JANTAR
6. CEIA (se necessário)

Para cada refeição, inclua:
- Ingredientes específicos
- Quantidades em medidas caseiras (xícaras, colheres, unidades)
- Modo de preparo básico
- Valores nutricionais aproximados (calorias, proteínas, carboidratos, gorduras)

Também crie:
- Lista de compras organizada por seção do supermercado
- Dicas de preparo e armazenamento
- Sugestões de substituições
- Cronograma semanal de preparo

Formate tudo de forma clara e organizada para WhatsApp.`;
}

async function processMenuResponse(phoneNumber, menuResponse) {
  // Processar resposta da IA e estruturar dados
  const lines = menuResponse.split('\n');
  const menuData = {
    weeklyMenu: {},
    shoppingList: [],
    tips: [],
    schedule: {}
  };

  let currentSection = '';
  let currentDay = '';
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.includes('SEGUNDA') || trimmedLine.includes('TERÇA') || 
        trimmedLine.includes('QUARTA') || trimmedLine.includes('QUINTA') ||
        trimmedLine.includes('SEXTA') || trimmedLine.includes('SÁBADO') ||
        trimmedLine.includes('DOMINGO')) {
      currentDay = trimmedLine;
      menuData.weeklyMenu[currentDay] = {};
    } else if (trimmedLine.includes('CAFÉ') || trimmedLine.includes('LANCHE') || 
               trimmedLine.includes('ALMOÇO') || trimmedLine.includes('JANTAR') ||
               trimmedLine.includes('CEIA')) {
      currentSection = trimmedLine;
      if (currentDay && !menuData.weeklyMenu[currentDay]) {
        menuData.weeklyMenu[currentDay] = {};
      }
      if (currentDay) {
        menuData.weeklyMenu[currentDay][currentSection] = [];
      }
    } else if (trimmedLine.includes('LISTA DE COMPRAS') || trimmedLine.includes('DICAS')) {
      currentSection = trimmedLine;
    } else if (trimmedLine && currentSection && currentDay && 
               menuData.weeklyMenu[currentDay] && menuData.weeklyMenu[currentDay][currentSection]) {
      menuData.weeklyMenu[currentDay][currentSection].push(trimmedLine);
    }
  }

  return menuData;
}

async function sendMenuToUser(phoneNumber, menuData) {
  try {
    // Enviar mensagem de conclusão
    await whatsappService.sendReply(
      config.whatsapp.phoneNumberId,
      config.whatsapp.graphApiToken,
      phoneNumber,
      "🎉 *Seu plano nutricional está pronto!*\n\n📋 Aqui está seu cardápio personalizado para esta semana:"
    );

    // Enviar cardápio por partes (WhatsApp tem limite de caracteres)
    const menuText = formatMenuForWhatsApp(menuData);
    const chunks = splitMessageIntoChunks(menuText, 4000);

    for (let i = 0; i < chunks.length; i++) {
      await whatsappService.sendReply(
        config.whatsapp.phoneNumberId,
        config.whatsapp.graphApiToken,
        phoneNumber,
        chunks[i]
      );
      
      // Pequeno delay entre mensagens
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Enviar lista de compras
    await whatsappService.sendReply(
      config.whatsapp.phoneNumberId,
      config.whatsapp.graphApiToken,
      phoneNumber,
      "🛒 *LISTA DE COMPRAS*\n\nOrganize sua lista por seção do supermercado para facilitar as compras!"
    );

    // Enviar próximos passos
    await whatsappService.sendReply(
      config.whatsapp.phoneNumberId,
      config.whatsapp.graphApiToken,
      phoneNumber,
      "🚀 *Próximos passos:*\n\n• 📸 Envie fotos das suas refeições para análise\n• 💧 Receba lembretes de hidratação\n• 💪 Motivação diária personalizada\n• 📊 Acompanhamento de progresso\n\nDigite 'ajuda' para ver todos os comandos disponíveis!"
    );

  } catch (error) {
    console.error('Error sending menu to user:', error);
  }
}

function formatMenuForWhatsApp(menuData) {
  let formattedMenu = '';
  
  for (const [day, meals] of Object.entries(menuData.weeklyMenu)) {
    formattedMenu += `\n📅 *${day}*\n\n`;
    
    for (const [meal, items] of Object.entries(meals)) {
      formattedMenu += `🍽️ *${meal}*\n`;
      items.forEach(item => {
        formattedMenu += `• ${item}\n`;
      });
      formattedMenu += '\n';
    }
  }
  
  return formattedMenu;
}

function splitMessageIntoChunks(text, maxLength) {
  const chunks = [];
  let currentChunk = '';
  
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (currentChunk.length + line.length + 1 > maxLength) {
      chunks.push(currentChunk);
      currentChunk = line + '\n';
    } else {
      currentChunk += line + '\n';
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

export const getMenuData = async (phoneNumber) => {
  return await redisService.getTemporaryState(`menu:${phoneNumber}`);
};
