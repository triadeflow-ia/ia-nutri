// services/fallbackService.js
// Sistema de fallback quando serviços principais estão indisponíveis

import { ErrorFactory, FallbackError } from '../utils/errors.js';
import logger from '../config/logger.js';
import * as redisService from './redisService.js';

class FallbackService {
  constructor() {
    this.isOpenAIDown = false;
    this.isWhatsAppDown = false;
    this.fallbackMessages = this.initializeFallbackMessages();
    this.responses = this.initializeResponses();
  }

  /**
   * Inicializar mensagens de fallback
   */
  initializeFallbackMessages() {
    return {
      openaiDown: {
        greeting: "👋 Olá! Estou com problemas técnicos temporários, mas posso te ajudar com algumas funcionalidades básicas.",
        help: "📋 Funcionalidades disponíveis:\n• Informações nutricionais básicas\n• Respostas pré-definidas\n• Suporte técnico",
        nutrition: "🍎 Para informações nutricionais, me diga o alimento que você quer saber. Exemplo: 'calorias da banana'",
        error: "❌ Desculpe, não consegui processar sua solicitação. Tente novamente em alguns instantes.",
        goodbye: "👋 Obrigado por usar nosso serviço! Em breve estarei funcionando normalmente."
      },
      whatsappDown: {
        error: "⚠️ Problema temporário com o WhatsApp. Sua mensagem foi recebida e será respondida assim que possível.",
        retry: "🔄 Tentando reenviar sua mensagem..."
      },
      general: {
        maintenance: "🔧 Estamos em manutenção. Volte em alguns minutos.",
        overload: "⏳ Muitas pessoas estão usando o sistema. Aguarde um momento e tente novamente.",
        unknown: "🤔 Não entendi sua mensagem. Tente ser mais específico ou use uma das opções disponíveis."
      }
    };
  }

  /**
   * Inicializar respostas pré-definidas
   */
  initializeResponses() {
    return {
      greetings: [
        "👋 Olá! Como posso te ajudar hoje?",
        "😊 Oi! Estou aqui para te auxiliar!",
        "🤖 Olá! Sou seu assistente virtual. Em que posso ajudar?"
      ],
      nutrition: {
        banana: "🍌 Banana (100g): ~89 calorias, 1.1g proteína, 23g carboidratos, 0.3g gordura",
        apple: "🍎 Maçã (100g): ~52 calorias, 0.3g proteína, 14g carboidratos, 0.2g gordura",
        rice: "🍚 Arroz branco (100g): ~130 calorias, 2.7g proteína, 28g carboidratos, 0.3g gordura",
        chicken: "🐔 Peito de frango (100g): ~165 calorias, 31g proteína, 0g carboidratos, 3.6g gordura"
      },
      help: [
        "📋 Posso te ajudar com:\n• Informações nutricionais\n• Dicas de alimentação\n• Cálculos básicos",
        "💡 Diga o nome de um alimento para saber suas informações nutricionais!",
        "🍎 Exemplo: 'quantas calorias tem uma banana?'"
      ],
      error: [
        "❌ Desculpe, não consegui processar sua solicitação.",
        "🤔 Não entendi. Pode repetir de outra forma?",
        "⚠️ Tive um problema técnico. Tente novamente."
      ]
    };
  }

  /**
   * Verificar se OpenAI está funcionando
   */
  async checkOpenAIStatus() {
    try {
      // Implementar verificação real do OpenAI
      // Por enquanto, simular verificação
      return !this.isOpenAIDown;
    } catch (error) {
      logger.error('Error checking OpenAI status', { error: error.message });
      return false;
    }
  }

  /**
   * Verificar se WhatsApp está funcionando
   */
  async checkWhatsAppStatus() {
    try {
      // Implementar verificação real do WhatsApp
      // Por enquanto, simular verificação
      return !this.isWhatsAppDown;
    } catch (error) {
      logger.error('Error checking WhatsApp status', { error: error.message });
      return false;
    }
  }

  /**
   * Processar mensagem com fallback
   */
  async processMessageWithFallback(message, phoneNumber, profileName, phoneNumberId, res) {
    try {
      // Verificar status dos serviços
      const openAIStatus = await this.checkOpenAIStatus();
      const whatsAppStatus = await this.checkWhatsAppStatus();

      if (!openAIStatus) {
        return await this.handleOpenAIFallback(message, phoneNumber, profileName, phoneNumberId, res);
      }

      if (!whatsAppStatus) {
        return await this.handleWhatsAppFallback(message, phoneNumber, profileName, phoneNumberId, res);
      }

      // Se ambos estão funcionando, processar normalmente
      return { useNormalProcessing: true };

    } catch (error) {
      logger.error('Error in fallback processing', { error: error.message });
      return await this.handleGeneralFallback(message, phoneNumber, profileName, phoneNumberId, res);
    }
  }

  /**
   * Lidar com fallback quando OpenAI está fora
   */
  async handleOpenAIFallback(message, phoneNumber, profileName, phoneNumberId, res) {
    try {
      const userMessage = message.text?.body?.toLowerCase() || '';
      
      // Detectar tipo de mensagem
      if (this.isGreeting(userMessage)) {
        return await this.sendFallbackResponse(
          phoneNumberId,
          this.getRandomResponse(this.responses.greetings),
          res
        );
      }

      if (this.isNutritionQuery(userMessage)) {
        return await this.handleNutritionFallback(userMessage, phoneNumberId, res);
      }

      if (this.isHelpRequest(userMessage)) {
        return await this.sendFallbackResponse(
          phoneNumberId,
          this.getRandomResponse(this.responses.help),
          res
        );
      }

      // Resposta genérica
      return await this.sendFallbackResponse(
        phoneNumberId,
        this.fallbackMessages.openaiDown.help,
        res
      );

    } catch (error) {
      logger.error('Error in OpenAI fallback', { error: error.message });
      return await this.sendFallbackResponse(
        phoneNumberId,
        this.fallbackMessages.openaiDown.error,
        res
      );
    }
  }

  /**
   * Lidar com fallback quando WhatsApp está fora
   */
  async handleWhatsAppFallback(message, phoneNumber, profileName, phoneNumberId, res) {
    try {
      // Salvar mensagem para processamento posterior
      await this.saveMessageForLaterProcessing(message, phoneNumber, profileName);
      
      // Tentar reenviar após delay
      setTimeout(async () => {
        try {
          await this.retryWhatsAppMessage(phoneNumberId, message.from, res);
        } catch (retryError) {
          logger.error('Failed to retry WhatsApp message', { error: retryError.message });
        }
      }, 5000);

      return await this.sendFallbackResponse(
        phoneNumberId,
        this.fallbackMessages.whatsappDown.retry,
        res
      );

    } catch (error) {
      logger.error('Error in WhatsApp fallback', { error: error.message });
      return await this.sendFallbackResponse(
        phoneNumberId,
        this.fallbackMessages.whatsappDown.error,
        res
      );
    }
  }

  /**
   * Lidar com fallback geral
   */
  async handleGeneralFallback(message, phoneNumber, profileName, phoneNumberId, res) {
    try {
      return await this.sendFallbackResponse(
        phoneNumberId,
        this.getRandomResponse(this.responses.error),
        res
      );
    } catch (error) {
      logger.error('Error in general fallback', { error: error.message });
      // Último recurso - resposta mínima
      return { success: false, error: 'Fallback failed' };
    }
  }

  /**
   * Detectar se é uma saudação
   */
  isGreeting(message) {
    const greetings = ['oi', 'olá', 'ola', 'hey', 'hi', 'bom dia', 'boa tarde', 'boa noite'];
    return greetings.some(greeting => message.includes(greeting));
  }

  /**
   * Detectar se é consulta nutricional
   */
  isNutritionQuery(message) {
    const nutritionKeywords = [
      'caloria', 'calorias', 'proteína', 'proteina', 'carboidrato', 'carboidratos',
      'gordura', 'gorduras', 'nutriente', 'nutrientes', 'alimento', 'alimentos',
      'banana', 'maçã', 'maca', 'arroz', 'frango', 'carne', 'leite', 'ovo'
    ];
    return nutritionKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Detectar se é pedido de ajuda
   */
  isHelpRequest(message) {
    const helpKeywords = ['ajuda', 'help', 'como', 'o que', 'quais', 'funcionalidades'];
    return helpKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Lidar com consultas nutricionais no fallback
   */
  async handleNutritionFallback(message, phoneNumberId, res) {
    try {
      // Buscar em respostas pré-definidas
      const nutritionResponse = this.findNutritionResponse(message);
      
      if (nutritionResponse) {
        return await this.sendFallbackResponse(phoneNumberId, nutritionResponse, res);
      }

      // Resposta genérica para nutrição
      return await this.sendFallbackResponse(
        phoneNumberId,
        this.fallbackMessages.openaiDown.nutrition,
        res
      );

    } catch (error) {
      logger.error('Error in nutrition fallback', { error: error.message });
      return await this.sendFallbackResponse(
        phoneNumberId,
        this.fallbackMessages.openaiDown.error,
        res
      );
    }
  }

  /**
   * Encontrar resposta nutricional pré-definida
   */
  findNutritionResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    for (const [food, response] of Object.entries(this.responses.nutrition)) {
      if (lowerMessage.includes(food)) {
        return response;
      }
    }
    
    return null;
  }

  /**
   * Obter resposta aleatória de uma lista
   */
  getRandomResponse(responses) {
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Enviar resposta de fallback
   */
  async sendFallbackResponse(phoneNumberId, message, res) {
    try {
      // Importar whatsappService dinamicamente para evitar dependência circular
      const { default: whatsappService } = await import('./whatsappService.js');
      const { config } = await import('../config/index.js');
      
      await whatsappService.sendSplitReply(
        phoneNumberId,
        config.whatsapp.graphApiToken,
        res.locals.recipientNumber || 'unknown',
        message,
        res
      );

      return { success: true, fallback: true, message };
    } catch (error) {
      logger.error('Error sending fallback response', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Salvar mensagem para processamento posterior
   */
  async saveMessageForLaterProcessing(message, phoneNumber, profileName) {
    try {
      const messageData = {
        id: message.id || `fallback_${Date.now()}`,
        phoneNumber,
        profileName,
        content: message.text?.body || '',
        type: message.type || 'text',
        timestamp: Date.now(),
        status: 'pending_retry',
        retryCount: 0
      };

      await redisService.saveMessage(messageData.id, messageData);
      logger.info('Message saved for later processing', { phoneNumber, messageId: messageData.id });
    } catch (error) {
      logger.error('Error saving message for later processing', { error: error.message });
    }
  }

  /**
   * Tentar reenviar mensagem do WhatsApp
   */
  async retryWhatsAppMessage(phoneNumberId, recipientNumber, res) {
    try {
      // Implementar lógica de retry
      logger.info('Retrying WhatsApp message', { phoneNumberId, recipientNumber });
      // Aqui você implementaria a lógica de retry específica
    } catch (error) {
      logger.error('Error retrying WhatsApp message', { error: error.message });
    }
  }

  /**
   * Definir status dos serviços
   */
  setOpenAIStatus(isDown) {
    this.isOpenAIDown = isDown;
    logger.info('OpenAI status changed', { isDown });
  }

  setWhatsAppStatus(isDown) {
    this.isWhatsAppDown = isDown;
    logger.info('WhatsApp status changed', { isDown });
  }

  /**
   * Obter status dos serviços
   */
  getServiceStatus() {
    return {
      openai: !this.isOpenAIDown,
      whatsapp: !this.isWhatsAppDown,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Adicionar nova resposta de fallback
   */
  addFallbackResponse(category, response) {
    if (!this.responses[category]) {
      this.responses[category] = [];
    }
    this.responses[category].push(response);
  }

  /**
   * Adicionar nova resposta nutricional
   */
  addNutritionResponse(food, response) {
    this.responses.nutrition[food.toLowerCase()] = response;
  }
}

// Instância singleton
const fallbackService = new FallbackService();

export default fallbackService;

