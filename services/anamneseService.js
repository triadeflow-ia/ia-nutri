// services\anamneseService.js

import { config } from '../config/index.js';
import * as whatsappService from './whatsappService.js';
import * as redisService from './redisService.js';
import * as menuService from './menuService.js';

const ANAMNESE_QUESTIONS = [
  {
    id: 'personal_info',
    question: 'Primeiro, me conte um pouco sobre você:\n\n• Nome completo\n• Idade\n• Altura (em cm)\n• Peso atual (em kg)',
    type: 'text'
  },
  {
    id: 'objectives',
    question: 'Qual é seu principal objetivo?\n\n• Perder peso\n• Ganhar massa muscular\n• Manter o peso atual\n• Melhorar a saúde geral\n• Outro (especifique)',
    type: 'text'
  },
  {
    id: 'activity_level',
    question: 'Como você descreveria seu nível de atividade física?\n\n• Sedentário (pouco ou nenhum exercício)\n• Levemente ativo (exercício leve 1-3 dias/semana)\n• Moderadamente ativo (exercício moderado 3-5 dias/semana)\n• Muito ativo (exercício intenso 6-7 dias/semana)\n• Extremamente ativo (exercício muito intenso, trabalho físico)',
    type: 'text'
  },
  {
    id: 'allergies',
    question: 'Você tem alguma alergia ou intolerância alimentar?\n\nSe sim, liste quais. Se não, responda "nenhuma".',
    type: 'text'
  },
  {
    id: 'preferences',
    question: 'Quais são suas preferências alimentares?\n\n• Carnes (bovina, suína, frango, peixe)\n• Vegetais\n• Frutas\n• Grãos e cereais\n• Laticínios\n• Outros (especifique)\n\nResponda quais você gosta mais.',
    type: 'text'
  },
  {
    id: 'schedule',
    question: 'Me conte sobre sua rotina:\n\n• Que horas você costuma acordar?\n• Que horas faz as refeições principais?\n• Tem tempo para preparar refeições?\n• Quantas refeições por dia prefere fazer?',
    type: 'text'
  }
];

export const startAnamnese = async (phoneNumber) => {
  try {
    console.log(`📋 Iniciando anamnese para: ${phoneNumber}`);
    
    // Salvar status da anamnese
    await redisService.saveTemporaryState(`anamnese:${phoneNumber}`, {
      status: 'started',
      currentQuestion: 0,
      answers: {},
      timestamp: Date.now()
    });

    // Enviar primeira pergunta
    await sendNextQuestion(phoneNumber);
    
  } catch (error) {
    console.error('Error starting anamnese:', error);
  }
};

async function sendNextQuestion(phoneNumber) {
  const anamneseData = await redisService.getTemporaryState(`anamnese:${phoneNumber}`);
  
  if (!anamneseData) {
    console.error('Anamnese data not found');
    return;
  }

  const currentQuestionIndex = anamneseData.currentQuestion;
  
  if (currentQuestionIndex >= ANAMNESE_QUESTIONS.length) {
    // Anamnese concluída
    await completeAnamnese(phoneNumber, anamneseData.answers);
    return;
  }

  const question = ANAMNESE_QUESTIONS[currentQuestionIndex];
  
  const message = `📝 *Pergunta ${currentQuestionIndex + 1} de ${ANAMNESE_QUESTIONS.length}*\n\n${question.question}`;
  
  await whatsappService.sendReply(
    config.whatsapp.phoneNumberId,
    config.whatsapp.graphApiToken,
    phoneNumber,
    message
  );
}

export const processAnamneseAnswer = async (phoneNumber, answer) => {
  try {
    const anamneseData = await redisService.getTemporaryState(`anamnese:${phoneNumber}`);
    
    if (!anamneseData) {
      console.error('Anamnese data not found');
      return;
    }

    const currentQuestionIndex = anamneseData.currentQuestion;
    const question = ANAMNESE_QUESTIONS[currentQuestionIndex];
    
    // Salvar resposta
    anamneseData.answers[question.id] = answer;
    anamneseData.currentQuestion = currentQuestionIndex + 1;
    
    await redisService.saveTemporaryState(`anamnese:${phoneNumber}`, anamneseData);
    
    // Enviar próxima pergunta ou finalizar
    await sendNextQuestion(phoneNumber);
    
  } catch (error) {
    console.error('Error processing anamnese answer:', error);
  }
};

async function completeAnamnese(phoneNumber, answers) {
  try {
    console.log(`✅ Anamnese concluída para: ${phoneNumber}`);
    
    // Salvar dados da anamnese
    await redisService.saveTemporaryState(`anamnese:${phoneNumber}`, {
      status: 'completed',
      answers: answers,
      completedAt: Date.now(),
      timestamp: Date.now()
    });

    // Enviar mensagem de conclusão
    await whatsappService.sendReply(
      config.whatsapp.phoneNumberId,
      config.whatsapp.graphApiToken,
      phoneNumber,
      "🎉 *Anamnese concluída com sucesso!*\n\nObrigado por compartilhar essas informações! Agora vou criar seu plano nutricional personalizado.\n\n⏳ Isso pode levar alguns minutos...\n\nEm breve você receberá:\n• 📋 Seu cardápio personalizado\n• 🛒 Lista de compras\n• 📱 Cronograma de refeições\n• 💧 Lembretes personalizados"
    );

    // Gerar cardápio personalizado
    await menuService.generatePersonalizedMenu(phoneNumber, answers);
    
  } catch (error) {
    console.error('Error completing anamnese:', error);
  }
};

export const getAnamneseData = async (phoneNumber) => {
  return await redisService.getTemporaryState(`anamnese:${phoneNumber}`);
};
