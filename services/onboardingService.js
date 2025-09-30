// services\onboardingService.js

import { config } from '../config/index.js';
import * as whatsappService from './whatsappService.js';
import * as redisService from './redisService.js';
import * as anamneseService from './anamneseService.js';

export const startOnboarding = async (phoneNumber, session = null, userName = null) => {
  try {
    console.log(`🚀 Iniciando onboarding para: ${phoneNumber}`);
    
    // Verificar se já foi iniciado
    const existingOnboarding = await redisService.getTemporaryState(`onboarding:${phoneNumber}`);
    if (existingOnboarding && existingOnboarding.status === 'completed') {
      console.log('Onboarding já foi concluído para este usuário');
      return;
    }

    // Salvar status do onboarding
    await redisService.saveTemporaryState(`onboarding:${phoneNumber}`, {
      status: 'started',
      step: 'welcome',
      sessionId: session?.id,
      userName: userName,
      timestamp: Date.now()
    });

    // Enviar mensagem de boas-vindas
    await sendWelcomeMessage(phoneNumber, userName);

    } catch (error) {
    console.error('Error starting onboarding:', error);
  }
};

async function sendWelcomeMessage(phoneNumber, userName = null) {
  try {
    console.log('Enviando template de boas-vindas: assistente_nutricional');
    
    // Usar a função específica para template de boas-vindas
    await whatsappService.sendWelcomeTemplate(
      config.whatsapp.phoneNumberId,
      config.whatsapp.graphApiToken,
      phoneNumber,
      userName
    );
    
    console.log('Template de boas-vindas enviado com sucesso');
  } catch (error) {
    console.error('Erro ao enviar template, usando fallback:', error);
    
    // Fallback: mensagem normal caso o template falhe
    const welcomeMessage = `🎉 *Bem-vindo(a) ao seu Assistente Nutricional!*

Parabéns por dar o primeiro passo em direção a uma vida mais saudável!

Sou seu assistente personalizado de nutrição e estarei aqui para te ajudar com:
• 📋 Criação de cardápios personalizados
• 🛒 Listas de compras organizadas  
• 💧 Lembretes de hidratação
• 📸 Análise de suas refeições
• 💪 Motivação diária
• 📊 Acompanhamento de progresso

*Vamos começar?* 🚀

Para iniciarmos, preciso do seu consentimento para coletar algumas informações sobre seus hábitos alimentares e objetivos.

Você autoriza o uso dos seus dados para criar um plano nutricional personalizado?

Responda:
• ✅ *Sim* - para autorizar
• ❌ *Não* - para não autorizar`;

    await whatsappService.sendReply(
      config.whatsapp.phoneNumberId,
      config.whatsapp.graphApiToken,
      phoneNumber,
      welcomeMessage
    );
  }
}

export const handleConsentResponse = async (phoneNumber, consentGiven) => {
  try {
    if (consentGiven) {
      // Atualizar status do onboarding
      await redisService.saveTemporaryState(`onboarding:${phoneNumber}`, {
        status: 'consent_given',
        step: 'anamnese_flow',
        consentGiven: true,
        timestamp: Date.now()
      });

          // Iniciar anamnese por mensagens sequenciais
          await anamneseService.startAnamnese(phoneNumber);
    } else {
      // Consentimento negado
      await whatsappService.sendReply(
        config.whatsapp.phoneNumberId,
      config.whatsapp.graphApiToken,
        phoneNumber,
        "Entendo perfeitamente! 😊\n\nSem seu consentimento, não posso coletar as informações necessárias para criar um plano nutricional personalizado.\n\nSe mudar de ideia, é só me avisar! Estarei aqui quando precisar."
      );
    }
  } catch (error) {
    console.error('Error handling consent response:', error);
  }
};

export const completeOnboarding = async (phoneNumber) => {
  try {
    // Marcar onboarding como concluído
    await redisService.saveTemporaryState(`onboarding:${phoneNumber}`, {
      status: 'completed',
      step: 'completed',
      completedAt: Date.now(),
      timestamp: Date.now()
    });

    console.log(`✅ Onboarding concluído para: ${phoneNumber}`);
  } catch (error) {
    console.error('Error completing onboarding:', error);
  }
};

export const getOnboardingStatus = async (phoneNumber) => {
  return await redisService.getTemporaryState(`onboarding:${phoneNumber}`);
};