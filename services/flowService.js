// services\flowService.js

import { config } from '../config/index.js';
import * as whatsappService from './whatsappService.js';
import * as redisService from './redisService.js';
import * as menuService from './menuService.js';

export const startAnamneseFlow = async (phoneNumber) => {
  try {
    console.log(`🔄 Iniciando Flow de anamnese para: ${phoneNumber}`);
    
    // Salvar status do flow
    await redisService.saveTemporaryState(`flow:${phoneNumber}`, {
      status: 'started',
      type: 'anamnese',
      startedAt: Date.now(),
      timestamp: Date.now()
    });

    // Enviar mensagem com botão para iniciar o Flow
    await sendFlowInvitation(phoneNumber);
    
  } catch (error) {
    console.error('Error starting anamnese flow:', error);
  }
};

async function sendFlowInvitation(phoneNumber) {
  const message = `📋 *Avaliação Nutricional Interativa*

Agora vamos fazer uma avaliação nutricional completa e personalizada!

Clique no botão abaixo para preencher o formulário interativo:

📝 **Inclui:**
• Informações pessoais
• Objetivos de saúde
• Nível de atividade física
• Alergias e preferências
• Rotina diária

⏱️ **Tempo estimado:** 3-5 minutos

*Após preencher, criarei seu plano nutricional personalizado!* 🚀`;

  await whatsappService.sendReply(
    config.whatsapp.phoneNumberId,
    config.whatsapp.graphApiToken,
    phoneNumber,
    message
  );

  // Enviar mensagem com botão do Flow
  await sendFlowButton(phoneNumber);
}

async function sendFlowButton(phoneNumber) {
  const flowMessage = {
    messaging_product: "whatsapp",
    to: phoneNumber,
    type: "interactive",
    interactive: {
      type: "flow",
      header: {
        type: "text",
        text: "📋 Avaliação Nutricional"
      },
      body: {
        text: "Clique para preencher o formulário de avaliação nutricional personalizada."
      },
      action: {
        name: "flow",
        parameters: {
          flow_message_version: "7.2",
          flow_token: "nutrition_assessment_flow",
          flow_id: "nutrition_assessment_flow", // ID do Flow criado no Facebook
          flow_cta: "Preencher Avaliação",
          flow_action_payload: {
            phone_number: phoneNumber,
            flow_type: "anamnese"
          }
        }
      },
      footer: {
        text: "Seus dados são seguros e confidenciais"
      }
    }
  };

  await whatsappService.sendInteractiveMessage(phoneNumber, flowMessage);
}

export const processFlowResponse = async (phoneNumber, flowData) => {
  try {
    console.log(`📊 Processando resposta do Flow para: ${phoneNumber}`, flowData);
    
    // Extrair dados do Flow
    const anamneseData = extractAnamneseData(flowData);
    
    // Salvar dados da anamnese
    await redisService.saveTemporaryState(`anamnese:${phoneNumber}`, {
      status: 'completed',
      data: anamneseData,
      completedAt: Date.now(),
      timestamp: Date.now()
    });

    // Atualizar status do flow
    await redisService.saveTemporaryState(`flow:${phoneNumber}`, {
      status: 'completed',
      type: 'anamnese',
      completedAt: Date.now(),
      timestamp: Date.now()
    });

    // Enviar confirmação
    await sendCompletionMessage(phoneNumber);
    
    // Gerar cardápio personalizado
    await menuService.generatePersonalizedMenu(phoneNumber, anamneseData);
    
  } catch (error) {
    console.error('Error processing flow response:', error);
  }
};

function extractAnamneseData(flowData) {
  // Extrair dados do Flow baseado na estrutura JSON v7.2
  const screens = flowData.screens || [];
  const anamneseData = {
    personal_info: {},
    objectives: {},
    activity: {},
    allergies: {},
    preferences: {},
    schedule: {}
  };

  // Processar dados do payload final
  const finalScreen = screens.find(screen => screen.terminal);
  if (finalScreen && finalScreen.data) {
    const data = finalScreen.data;
    
    // Extrair dados das telas anteriores
    anamneseData.personal_info = {
      name: data.screen_0_name || '',
      age: data.screen_0_age || 0,
      height: data.screen_0_height || 0,
      weight: data.screen_0_weight || 0
    };
    
    anamneseData.objectives = {
      objective: data.screen_1_objective || ''
    };
    
    anamneseData.activity = {
      activity_level: data.screen_2_activity_level || ''
    };
    
    anamneseData.allergies = {
      allergies: data.screen_3_allergies || []
    };
    
    anamneseData.preferences = {
      diet_type: data.screen_4_diet_type || ''
    };
    
    anamneseData.schedule = {
      wake_up_time: data.screen_5_wake_up_time || '',
      meals_per_day: data.screen_5_meals_per_day || '',
      cooking_time: data.screen_5_cooking_time || ''
    };
  }

  return anamneseData;
}

async function sendCompletionMessage(phoneNumber) {
  const message = `🎉 *Avaliação Concluída com Sucesso!*

Obrigado por preencher a avaliação nutricional!

Agora vou criar seu plano nutricional personalizado com base nas suas respostas.

⏳ **Processando seus dados...**
📋 **Gerando cardápio personalizado...**
🛒 **Criando lista de compras...**
📱 **Configurando lembretes...**

Em alguns minutos você receberá:
• Seu cardápio semanal personalizado
• Lista de compras organizada
• Cronograma de refeições
• Lembretes personalizados

*Aguarde...* ⏳`;

  await whatsappService.sendReply(
    config.whatsapp.phoneNumberId,
    config.whatsapp.graphApiToken,
    phoneNumber,
    message
  );
}

export const getFlowStatus = async (phoneNumber) => {
  return await redisService.getTemporaryState(`flow:${phoneNumber}`);
};
