// services\alertService.js

import { config } from '../config/index.js';
import * as whatsappService from './whatsappService.js';
import * as redisService from './redisService.js';

export const setupPersonalizedAlerts = async (phoneNumber, anamneseData) => {
  try {
    console.log(`⏰ Configurando alertas personalizados para: ${phoneNumber}`);
    
    // Salvar configuração de alertas
    await redisService.saveTemporaryState(`alerts:${phoneNumber}`, {
      waterReminders: true,
      mealReminders: true,
      motivationAlerts: true,
      photoReminders: true,
      setupAt: Date.now(),
      timestamp: Date.now()
    });

    console.log(`✅ Alertas configurados para: ${phoneNumber}`);

    } catch (error) {
    console.error('Error setting up personalized alerts:', error);
  }
};

export const sendWaterReminder = async (phoneNumber) => {
  const messages = [
    `💧 *Hora de hidratar!*\n\nLembre-se: manter-se hidratado é fundamental para sua saúde! 🌟`,
    `💧 *Pausa para água!*\n\nVocê já bebeu água suficiente hoje? 💪`,
    `💧 *Momento hidratação*\n\nPequenos goles, grandes benefícios! 🌈`
  ];
  
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];
  
  await whatsappService.sendReply(
    config.whatsapp.phoneNumberId,
    config.whatsapp.graphApiToken,
    phoneNumber,
    randomMessage
  );
};

export const sendMotivationAlert = async (phoneNumber) => {
  const messages = [
    `💪 *Você está no caminho certo!*\n\nCada escolha saudável te aproxima dos seus objetivos! 🌟`,
    `🚀 *Dia de vitórias!*\n\nContinue assim! Você está fazendo um ótimo trabalho! 🎯`,
    `🌈 *Momento de motivação!*\n\nSeus objetivos estão mais próximos do que você imagina! ✨`
  ];
  
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];
  
  await whatsappService.sendReply(
    config.whatsapp.phoneNumberId,
    config.whatsapp.graphApiToken,
    phoneNumber,
    randomMessage
  );
};

export const sendPhotoReminder = async (phoneNumber) => {
  const messages = [
    `📸 *Hora da análise!*\n\nEnvie uma foto da sua refeição para eu analisar e te dar dicas! 🍽️`,
    `📸 *Foto da refeição!*\n\nQue tal me mostrar o que está comendo? Vou te ajudar! 📱`,
    `📸 *Momento selfie da comida!*\n\nEnvie a foto e eu analiso os nutrientes! 🔍`
  ];
  
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];
  
  await whatsappService.sendReply(
    config.whatsapp.phoneNumberId,
    config.whatsapp.graphApiToken,
    phoneNumber,
    randomMessage
  );
};