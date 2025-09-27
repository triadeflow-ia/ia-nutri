// services/contextManager.js
// Sistema avançado de contexto e memória

import { ErrorFactory, ErrorUtils } from '../utils/errors.js';
import logger from '../config/logger.js';
import userDataService from './userDataService.js';
import * as redisService from './redisService.js';
import { config } from '../config/index.js';

class ContextManager {
  constructor() {
    this.shortTermMemory = new Map(); // Memória de curto prazo (conversa atual)
    this.longTermMemory = new Map(); // Memória de longo prazo (preferências, histórico)
    this.conversationSummaries = new Map(); // Resumos de conversas
    this.topicChanges = new Map(); // Detecção de mudança de assunto
    this.userProfiles = new Map(); // Perfis evolutivos dos usuários
    this.privacySettings = new Map(); // Configurações de privacidade
    
    this.maxShortTermMessages = 50; // Máximo de mensagens na memória de curto prazo
    this.maxConversationLength = 100; // Máximo de mensagens antes do resumo automático
    this.topicChangeThreshold = 0.7; // Threshold para detectar mudança de assunto
    this.memoryRetentionDays = 30; // Dias para reter memória de longo prazo
  }

  /**
   * Adicionar mensagem à memória de curto prazo
   */
  async addMessage(phoneNumber, message, messageType = 'text', metadata = {}) {
    try {
      const userContext = this.getUserContext(phoneNumber);
      
      // Adicionar mensagem ao contexto de curto prazo
      const messageData = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        type: messageType,
        content: message,
        metadata: metadata,
        processed: false
      };
      
      userContext.shortTerm.push(messageData);
      
      // Manter apenas as últimas N mensagens
      if (userContext.shortTerm.length > this.maxShortTermMemory) {
        userContext.shortTerm = userContext.shortTerm.slice(-this.maxShortTermMemory);
      }
      
      // Verificar se precisa resumir conversa
      if (userContext.shortTerm.length >= this.maxConversationLength) {
        await this.summarizeConversation(phoneNumber);
      }
      
      // Detectar mudança de assunto
      const topicChange = await this.detectTopicChange(phoneNumber, message);
      if (topicChange) {
        userContext.topicChanges.push({
          timestamp: new Date().toISOString(),
          fromTopic: topicChange.fromTopic,
          toTopic: topicChange.toTopic,
          confidence: topicChange.confidence
        });
      }
      
      // Atualizar perfil do usuário
      await this.updateUserProfile(phoneNumber, message, messageType, metadata);
      
      // Salvar contexto atualizado
      await this.saveUserContext(phoneNumber, userContext);
      
      return {
        success: true,
        messageId: messageData.id,
        topicChange: topicChange,
        needsSummary: userContext.shortTerm.length >= this.maxConversationLength
      };
      
    } catch (error) {
      ErrorUtils.logError(error, {
        phoneNumber: phoneNumber?.replace(/\d(?=\d{4})/g, '*'),
        messageType: messageType,
        operation: 'addMessage'
      });
      throw error;
    }
  }

  /**
   * Obter contexto do usuário
   */
  getUserContext(phoneNumber) {
    if (!this.shortTermMemory.has(phoneNumber)) {
      this.shortTermMemory.set(phoneNumber, {
        shortTerm: [],
        longTerm: [],
        topicChanges: [],
        lastActivity: new Date().toISOString(),
        conversationId: this.generateConversationId(),
        currentTopic: null,
        contextSummary: null
      });
    }
    
    return this.shortTermMemory.get(phoneNumber);
  }

  /**
   * Gerar ID único para conversa
   */
  generateConversationId() {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Detectar mudança de assunto
   */
  async detectTopicChange(phoneNumber, newMessage) {
    try {
      const userContext = this.getUserContext(phoneNumber);
      const recentMessages = userContext.shortTerm.slice(-10); // Últimas 10 mensagens
      
      if (recentMessages.length < 3) {
        return null; // Não há mensagens suficientes para detectar mudança
      }
      
      // Extrair tópicos das mensagens recentes
      const oldTopics = this.extractTopics(recentMessages.slice(0, -1));
      const newTopic = this.extractTopics([newMessage]);
      
      // Calcular similaridade entre tópicos
      const similarity = this.calculateTopicSimilarity(oldTopics, newTopic);
      
      if (similarity < this.topicChangeThreshold) {
        return {
          fromTopic: oldTopics[0] || 'geral',
          toTopic: newTopic[0] || 'geral',
          confidence: 1 - similarity,
          timestamp: new Date().toISOString()
        };
      }
      
      return null;
      
    } catch (error) {
      logger.error('Error detecting topic change', { error: error.message, phoneNumber });
      return null;
    }
  }

  /**
   * Extrair tópicos de mensagens
   */
  extractTopics(messages) {
    const topics = [];
    
    for (const message of messages) {
      const content = message.content.toLowerCase();
      
      // Detectar tópicos baseados em palavras-chave
      if (content.includes('nutrição') || content.includes('dieta') || content.includes('alimento')) {
        topics.push('nutrição');
      } else if (content.includes('exercício') || content.includes('treino') || content.includes('academia')) {
        topics.push('exercício');
      } else if (content.includes('lembrete') || content.includes('agenda') || content.includes('tarefa')) {
        topics.push('produtividade');
      } else if (content.includes('comando') || content.includes('ajuda') || content.includes('menu')) {
        topics.push('comandos');
      } else if (content.includes('preço') || content.includes('custo') || content.includes('pagamento')) {
        topics.push('financeiro');
      } else if (content.includes('configuração') || content.includes('configurar') || content.includes('ajustar')) {
        topics.push('configuração');
      } else {
        topics.push('geral');
      }
    }
    
    return topics;
  }

  /**
   * Calcular similaridade entre tópicos
   */
  calculateTopicSimilarity(oldTopics, newTopics) {
    if (oldTopics.length === 0 || newTopics.length === 0) {
      return 0;
    }
    
    // Contar ocorrências de cada tópico
    const oldTopicCounts = {};
    const newTopicCounts = {};
    
    oldTopics.forEach(topic => {
      oldTopicCounts[topic] = (oldTopicCounts[topic] || 0) + 1;
    });
    
    newTopics.forEach(topic => {
      newTopicCounts[topic] = (newTopicCounts[topic] || 0) + 1;
    });
    
    // Calcular similaridade usando Jaccard
    const allTopics = new Set([...Object.keys(oldTopicCounts), ...Object.keys(newTopicCounts)]);
    let intersection = 0;
    let union = 0;
    
    for (const topic of allTopics) {
      const oldCount = oldTopicCounts[topic] || 0;
      const newCount = newTopicCounts[topic] || 0;
      intersection += Math.min(oldCount, newCount);
      union += Math.max(oldCount, newCount);
    }
    
    return union > 0 ? intersection / union : 0;
  }

  /**
   * Resumir conversa automaticamente
   */
  async summarizeConversation(phoneNumber) {
    try {
      const userContext = this.getUserContext(phoneNumber);
      const messages = userContext.shortTerm;
      
      if (messages.length < 5) {
        return null; // Não há mensagens suficientes para resumir
      }
      
      // Extrair informações importantes da conversa
      const summary = {
        conversationId: userContext.conversationId,
        startTime: messages[0].timestamp,
        endTime: messages[messages.length - 1].timestamp,
        messageCount: messages.length,
        topics: this.extractTopics(messages),
        keyPoints: this.extractKeyPoints(messages),
        userPreferences: this.extractUserPreferences(messages),
        actionItems: this.extractActionItems(messages),
        sentiment: this.analyzeSentiment(messages),
        summary: this.generateConversationSummary(messages)
      };
      
      // Salvar resumo
      userContext.contextSummary = summary;
      userContext.conversationSummaries = userContext.conversationSummaries || [];
      userContext.conversationSummaries.push(summary);
      
      // Mover mensagens antigas para memória de longo prazo
      const oldMessages = messages.slice(0, -10); // Manter últimas 10 mensagens
      userContext.longTerm = userContext.longTerm || [];
      userContext.longTerm.push(...oldMessages);
      
      // Limpar mensagens antigas da memória de curto prazo
      userContext.shortTerm = messages.slice(-10);
      
      // Salvar contexto atualizado
      await this.saveUserContext(phoneNumber, userContext);
      
      logger.info('Conversation summarized', {
        phoneNumber: phoneNumber?.replace(/\d(?=\d{4})/g, '*'),
        conversationId: summary.conversationId,
        messageCount: summary.messageCount,
        topics: summary.topics
      });
      
      return summary;
      
    } catch (error) {
      ErrorUtils.logError(error, {
        phoneNumber: phoneNumber?.replace(/\d(?=\d{4})/g, '*'),
        operation: 'summarizeConversation'
      });
      return null;
    }
  }

  /**
   * Extrair pontos-chave da conversa
   */
  extractKeyPoints(messages) {
    const keyPoints = [];
    
    for (const message of messages) {
      const content = message.content.toLowerCase();
      
      // Detectar pontos-chave baseados em padrões
      if (content.includes('importante') || content.includes('essencial') || content.includes('crucial')) {
        keyPoints.push({
          type: 'importance',
          content: message.content,
          timestamp: message.timestamp
        });
      }
      
      if (content.includes('problema') || content.includes('dificuldade') || content.includes('erro')) {
        keyPoints.push({
          type: 'problem',
          content: message.content,
          timestamp: message.timestamp
        });
      }
      
      if (content.includes('solução') || content.includes('resolver') || content.includes('corrigir')) {
        keyPoints.push({
          type: 'solution',
          content: message.content,
          timestamp: message.timestamp
        });
      }
      
      if (content.includes('preferência') || content.includes('gosto') || content.includes('não gosto')) {
        keyPoints.push({
          type: 'preference',
          content: message.content,
          timestamp: message.timestamp
        });
      }
    }
    
    return keyPoints;
  }

  /**
   * Extrair preferências do usuário
   */
  extractUserPreferences(messages) {
    const preferences = {
      communication: 'text', // text, voice, mixed
      topics: [],
      timezone: null,
      language: 'pt-BR',
      notifications: true,
      privacy: 'standard'
    };
    
    for (const message of messages) {
      const content = message.content.toLowerCase();
      
      // Detectar preferências de comunicação
      if (content.includes('áudio') || content.includes('voz')) {
        preferences.communication = 'voice';
      } else if (content.includes('texto') || content.includes('escrito')) {
        preferences.communication = 'text';
      }
      
      // Detectar tópicos de interesse
      if (content.includes('nutrição') || content.includes('dieta')) {
        preferences.topics.push('nutrição');
      }
      if (content.includes('exercício') || content.includes('treino')) {
        preferences.topics.push('exercício');
      }
      if (content.includes('produtividade') || content.includes('organização')) {
        preferences.topics.push('produtividade');
      }
      
      // Detectar preferências de privacidade
      if (content.includes('privacidade') || content.includes('dados')) {
        if (content.includes('alto') || content.includes('máximo')) {
          preferences.privacy = 'high';
        } else if (content.includes('baixo') || content.includes('mínimo')) {
          preferences.privacy = 'low';
        }
      }
    }
    
    return preferences;
  }

  /**
   * Extrair itens de ação da conversa
   */
  extractActionItems(messages) {
    const actionItems = [];
    
    for (const message of messages) {
      const content = message.content.toLowerCase();
      
      // Detectar itens de ação baseados em padrões
      if (content.includes('fazer') || content.includes('criar') || content.includes('agendar')) {
        actionItems.push({
          type: 'action',
          content: message.content,
          timestamp: message.timestamp,
          status: 'pending'
        });
      }
      
      if (content.includes('lembrar') || content.includes('anotar') || content.includes('salvar')) {
        actionItems.push({
          type: 'reminder',
          content: message.content,
          timestamp: message.timestamp,
          status: 'pending'
        });
      }
      
      if (content.includes('configurar') || content.includes('ajustar') || content.includes('definir')) {
        actionItems.push({
          type: 'configuration',
          content: message.content,
          timestamp: message.timestamp,
          status: 'pending'
        });
      }
    }
    
    return actionItems;
  }

  /**
   * Analisar sentimento da conversa
   */
  analyzeSentiment(messages) {
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;
    
    const positiveWords = ['bom', 'ótimo', 'excelente', 'perfeito', 'obrigado', 'obrigada', 'legal', 'bacana'];
    const negativeWords = ['ruim', 'terrível', 'péssimo', 'erro', 'problema', 'dificuldade', 'não gosto'];
    
    for (const message of messages) {
      const content = message.content.toLowerCase();
      
      let sentiment = 'neutral';
      
      for (const word of positiveWords) {
        if (content.includes(word)) {
          sentiment = 'positive';
          break;
        }
      }
      
      if (sentiment === 'neutral') {
        for (const word of negativeWords) {
          if (content.includes(word)) {
            sentiment = 'negative';
            break;
          }
        }
      }
      
      if (sentiment === 'positive') positiveCount++;
      else if (sentiment === 'negative') negativeCount++;
      else neutralCount++;
    }
    
    const total = positiveCount + negativeCount + neutralCount;
    
    return {
      positive: total > 0 ? (positiveCount / total) * 100 : 0,
      negative: total > 0 ? (negativeCount / total) * 100 : 0,
      neutral: total > 0 ? (neutralCount / total) * 100 : 0,
      overall: positiveCount > negativeCount ? 'positive' : negativeCount > positiveCount ? 'negative' : 'neutral'
    };
  }

  /**
   * Gerar resumo da conversa
   */
  generateConversationSummary(messages) {
    const topics = this.extractTopics(messages);
    const keyPoints = this.extractKeyPoints(messages);
    const actionItems = this.extractActionItems(messages);
    
    let summary = `Conversa sobre: ${topics.join(', ')}\n\n`;
    
    if (keyPoints.length > 0) {
      summary += `Pontos importantes:\n`;
      keyPoints.slice(0, 3).forEach(point => {
        summary += `• ${point.content}\n`;
      });
      summary += '\n';
    }
    
    if (actionItems.length > 0) {
      summary += `Ações pendentes:\n`;
      actionItems.slice(0, 3).forEach(item => {
        summary += `• ${item.content}\n`;
      });
      summary += '\n';
    }
    
    summary += `Total de mensagens: ${messages.length}`;
    
    return summary;
  }

  /**
   * Atualizar perfil do usuário
   */
  async updateUserProfile(phoneNumber, message, messageType, metadata) {
    try {
      const userProfile = this.getUserProfile(phoneNumber);
      const content = message.toLowerCase();
      
      // Atualizar estatísticas de uso
      userProfile.usageStats.totalMessages++;
      userProfile.usageStats.messageTypes[messageType] = (userProfile.usageStats.messageTypes[messageType] || 0) + 1;
      
      // Atualizar tópicos de interesse
      const topics = this.extractTopics([{ content: message }]);
      topics.forEach(topic => {
        if (!userProfile.interests.includes(topic)) {
          userProfile.interests.push(topic);
        }
      });
      
      // Atualizar padrões de comunicação
      if (content.includes('obrigado') || content.includes('obrigada')) {
        userProfile.communicationPatterns.polite = true;
      }
      
      if (content.includes('por favor') || content.includes('pode')) {
        userProfile.communicationPatterns.formal = true;
      }
      
      if (content.includes('!') || content.includes('??')) {
        userProfile.communicationPatterns.enthusiastic = true;
      }
      
      // Atualizar preferências de horário
      const hour = new Date().getHours();
      userProfile.usageStats.hourlyUsage[hour] = (userProfile.usageStats.hourlyUsage[hour] || 0) + 1;
      
      // Atualizar frequência de uso
      const today = new Date().toISOString().split('T')[0];
      userProfile.usageStats.dailyUsage[today] = (userProfile.usageStats.dailyUsage[today] || 0) + 1;
      
      // Salvar perfil atualizado
      await this.saveUserProfile(phoneNumber, userProfile);
      
    } catch (error) {
      logger.error('Error updating user profile', { error: error.message, phoneNumber });
    }
  }

  /**
   * Obter perfil do usuário
   */
  getUserProfile(phoneNumber) {
    if (!this.userProfiles.has(phoneNumber)) {
      this.userProfiles.set(phoneNumber, {
        phoneNumber: phoneNumber,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        interests: [],
        communicationPatterns: {
          polite: false,
          formal: false,
          enthusiastic: false,
          technical: false
        },
        usageStats: {
          totalMessages: 0,
          messageTypes: {},
          hourlyUsage: {},
          dailyUsage: {},
          averageSessionLength: 0,
          favoriteTopics: []
        },
        preferences: {
          communication: 'text',
          privacy: 'standard',
          notifications: true,
          timezone: null,
          language: 'pt-BR'
        },
        learningData: {
          successfulInteractions: 0,
          failedInteractions: 0,
          feedbackScore: 0,
          adaptationLevel: 0
        }
      });
    }
    
    return this.userProfiles.get(phoneNumber);
  }

  /**
   * Salvar perfil do usuário
   */
  async saveUserProfile(phoneNumber, profile) {
    try {
      profile.lastUpdated = new Date().toISOString();
      this.userProfiles.set(phoneNumber, profile);
      
      // Salvar no Redis para persistência
      await redisService.set(
        `user_profile:${phoneNumber}`,
        JSON.stringify(profile),
        60 * 60 * 24 * 30 // 30 dias
      );
      
    } catch (error) {
      logger.error('Error saving user profile', { error: error.message, phoneNumber });
    }
  }

  /**
   * Salvar contexto do usuário
   */
  async saveUserContext(phoneNumber, context) {
    try {
      context.lastActivity = new Date().toISOString();
      this.shortTermMemory.set(phoneNumber, context);
      
      // Salvar no Redis para persistência
      await redisService.set(
        `user_context:${phoneNumber}`,
        JSON.stringify(context),
        60 * 60 * 24 * 7 // 7 dias
      );
      
    } catch (error) {
      logger.error('Error saving user context', { error: error.message, phoneNumber });
    }
  }

  /**
   * Carregar contexto do usuário do Redis
   */
  async loadUserContext(phoneNumber) {
    try {
      const contextData = await redisService.get(`user_context:${phoneNumber}`);
      if (contextData) {
        const context = JSON.parse(contextData);
        this.shortTermMemory.set(phoneNumber, context);
        return context;
      }
    } catch (error) {
      logger.error('Error loading user context', { error: error.message, phoneNumber });
    }
    return null;
  }

  /**
   * Carregar perfil do usuário do Redis
   */
  async loadUserProfile(phoneNumber) {
    try {
      const profileData = await redisService.get(`user_profile:${phoneNumber}`);
      if (profileData) {
        const profile = JSON.parse(profileData);
        this.userProfiles.set(phoneNumber, profile);
        return profile;
      }
    } catch (error) {
      logger.error('Error loading user profile', { error: error.message, phoneNumber });
    }
    return null;
  }

  /**
   * Obter contexto atual da conversa
   */
  async getCurrentContext(phoneNumber) {
    try {
      const userContext = this.getUserContext(phoneNumber);
      const userProfile = this.getUserProfile(phoneNumber);
      
      return {
        conversationId: userContext.conversationId,
        messageCount: userContext.shortTerm.length,
        currentTopic: userContext.currentTopic,
        recentMessages: userContext.shortTerm.slice(-5),
        topicChanges: userContext.topicChanges.slice(-3),
        contextSummary: userContext.contextSummary,
        userProfile: {
          interests: userProfile.interests,
          communicationPatterns: userProfile.communicationPatterns,
          preferences: userProfile.preferences
        },
        lastActivity: userContext.lastActivity
      };
      
    } catch (error) {
      ErrorUtils.logError(error, {
        phoneNumber: phoneNumber?.replace(/\d(?=\d{4})/g, '*'),
        operation: 'getCurrentContext'
      });
      return null;
    }
  }

  /**
   * Limpar contexto atual
   */
  async clearContext(phoneNumber) {
    try {
      const userContext = this.getUserContext(phoneNumber);
      
      // Salvar resumo antes de limpar
      if (userContext.shortTerm.length > 0) {
        await this.summarizeConversation(phoneNumber);
      }
      
      // Limpar memória de curto prazo
      userContext.shortTerm = [];
      userContext.topicChanges = [];
      userContext.currentTopic = null;
      userContext.contextSummary = null;
      userContext.conversationId = this.generateConversationId();
      
      // Salvar contexto limpo
      await this.saveUserContext(phoneNumber, userContext);
      
      logger.info('Context cleared', {
        phoneNumber: phoneNumber?.replace(/\d(?=\d{4})/g, '*'),
        conversationId: userContext.conversationId
      });
      
      return {
        success: true,
        message: 'Contexto limpo com sucesso',
        conversationId: userContext.conversationId
      };
      
    } catch (error) {
      ErrorUtils.logError(error, {
        phoneNumber: phoneNumber?.replace(/\d(?=\d{4})/g, '*'),
        operation: 'clearContext'
      });
      throw error;
    }
  }

  /**
   * Salvar informação importante
   */
  async saveImportantInfo(phoneNumber, info, category = 'general') {
    try {
      const userContext = this.getUserContext(phoneNumber);
      
      const importantInfo = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        content: info,
        category: category,
        conversationId: userContext.conversationId
      };
      
      // Adicionar à memória de longo prazo
      userContext.longTerm = userContext.longTerm || [];
      userContext.longTerm.push(importantInfo);
      
      // Salvar contexto atualizado
      await this.saveUserContext(phoneNumber, userContext);
      
      logger.info('Important info saved', {
        phoneNumber: phoneNumber?.replace(/\d(?=\d{4})/g, '*'),
        category: category,
        infoId: importantInfo.id
      });
      
      return {
        success: true,
        message: 'Informação salva com sucesso',
        infoId: importantInfo.id
      };
      
    } catch (error) {
      ErrorUtils.logError(error, {
        phoneNumber: phoneNumber?.replace(/\d(?=\d{4})/g, '*'),
        operation: 'saveImportantInfo'
      });
      throw error;
    }
  }

  /**
   * Listar informações importantes salvas
   */
  async getImportantInfo(phoneNumber, category = null) {
    try {
      const userContext = this.getUserContext(phoneNumber);
      const longTerm = userContext.longTerm || [];
      
      let importantInfo = longTerm.filter(info => info.category !== 'message');
      
      if (category) {
        importantInfo = importantInfo.filter(info => info.category === category);
      }
      
      // Ordenar por timestamp (mais recente primeiro)
      importantInfo.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      return {
        success: true,
        info: importantInfo,
        count: importantInfo.length
      };
      
    } catch (error) {
      ErrorUtils.logError(error, {
        phoneNumber: phoneNumber?.replace(/\d(?=\d{4})/g, '*'),
        operation: 'getImportantInfo'
      });
      throw error;
    }
  }

  /**
   * Buscar referências inteligentes
   */
  async findSmartReferences(phoneNumber, query) {
    try {
      const userContext = this.getUserContext(phoneNumber);
      const allMessages = [...(userContext.shortTerm || []), ...(userContext.longTerm || [])];
      
      const references = [];
      const queryLower = query.toLowerCase();
      
      // Buscar em mensagens recentes
      for (const message of allMessages) {
        const content = message.content.toLowerCase();
        
        // Buscar referências diretas
        if (content.includes(queryLower)) {
          references.push({
            type: 'direct',
            content: message.content,
            timestamp: message.timestamp,
            confidence: 1.0
          });
        }
        
        // Buscar referências contextuais
        if (this.isContextualReference(queryLower, content)) {
          references.push({
            type: 'contextual',
            content: message.content,
            timestamp: message.timestamp,
            confidence: 0.8
          });
        }
      }
      
      // Ordenar por confiança e timestamp
      references.sort((a, b) => {
        if (a.confidence !== b.confidence) {
          return b.confidence - a.confidence;
        }
        return new Date(b.timestamp) - new Date(a.timestamp);
      });
      
      return {
        success: true,
        references: references.slice(0, 5), // Top 5 referências
        count: references.length
      };
      
    } catch (error) {
      ErrorUtils.logError(error, {
        phoneNumber: phoneNumber?.replace(/\d(?=\d{4})/g, '*'),
        operation: 'findSmartReferences'
      });
      throw error;
    }
  }

  /**
   * Verificar se é referência contextual
   */
  isContextualReference(query, content) {
    const contextualPatterns = {
      'como eu disse': ['disse', 'falei', 'mencionei'],
      'aquele': ['restaurante', 'lugar', 'produto', 'serviço'],
      'faça de novo': ['repetir', 'fazer novamente', 'executar'],
      'o que': ['o que', 'qual', 'quando', 'onde', 'como'],
      'antes': ['anteriormente', 'antes', 'no passado']
    };
    
    for (const [pattern, keywords] of Object.entries(contextualPatterns)) {
      if (query.includes(pattern)) {
        return keywords.some(keyword => content.includes(keyword));
      }
    }
    
    return false;
  }

  /**
   * Obter sugestões baseadas no perfil
   */
  async getPersonalizedSuggestions(phoneNumber) {
    try {
      const userProfile = this.getUserProfile(phoneNumber);
      const userContext = this.getUserContext(phoneNumber);
      
      const suggestions = [];
      
      // Sugestões baseadas em interesses
      if (userProfile.interests.includes('nutrição')) {
        suggestions.push({
          type: 'nutrition',
          content: 'Quer analisar um alimento ou criar um plano alimentar?',
          priority: 'high'
        });
      }
      
      if (userProfile.interests.includes('exercício')) {
        suggestions.push({
          type: 'exercise',
          content: 'Posso ajudar com dicas de exercícios ou criar um plano de treino.',
          priority: 'medium'
        });
      }
      
      if (userProfile.interests.includes('produtividade')) {
        suggestions.push({
          type: 'productivity',
          content: 'Que tal criar um lembrete ou organizar sua agenda?',
          priority: 'high'
        });
      }
      
      // Sugestões baseadas em padrões de uso
      if (userProfile.usageStats.totalMessages > 50) {
        suggestions.push({
          type: 'advanced',
          content: 'Posso criar atalhos personalizados para você!',
          priority: 'medium'
        });
      }
      
      // Sugestões baseadas no horário
      const hour = new Date().getHours();
      if (hour >= 6 && hour <= 9) {
        suggestions.push({
          type: 'morning',
          content: 'Bom dia! Que tal ver sua agenda para hoje?',
          priority: 'high'
        });
      } else if (hour >= 18 && hour <= 22) {
        suggestions.push({
          type: 'evening',
          content: 'Boa noite! Quer fazer um resumo do seu dia?',
          priority: 'medium'
        });
      }
      
      // Ordenar por prioridade
      suggestions.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
      
      return {
        success: true,
        suggestions: suggestions.slice(0, 3), // Top 3 sugestões
        count: suggestions.length
      };
      
    } catch (error) {
      ErrorUtils.logError(error, {
        phoneNumber: phoneNumber?.replace(/\d(?=\d{4})/g, '*'),
        operation: 'getPersonalizedSuggestions'
      });
      throw error;
    }
  }

  /**
   * Configurar privacidade
   */
  async setPrivacySettings(phoneNumber, settings) {
    try {
      const userProfile = this.getUserProfile(phoneNumber);
      
      userProfile.preferences.privacy = settings.privacy || 'standard';
      userProfile.preferences.dataRetention = settings.dataRetention || 30;
      userProfile.preferences.learningEnabled = settings.learningEnabled !== false;
      userProfile.preferences.profileSharing = settings.profileSharing || false;
      
      await this.saveUserProfile(phoneNumber, userProfile);
      
      logger.info('Privacy settings updated', {
        phoneNumber: phoneNumber?.replace(/\d(?=\d{4})/g, '*'),
        settings: settings
      });
      
      return {
        success: true,
        message: 'Configurações de privacidade atualizadas',
        settings: userProfile.preferences
      };
      
    } catch (error) {
      ErrorUtils.logError(error, {
        phoneNumber: phoneNumber?.replace(/\d(?=\d{4})/g, '*'),
        operation: 'setPrivacySettings'
      });
      throw error;
    }
  }

  /**
   * Obter estatísticas de contexto
   */
  getContextStats() {
    return {
      activeUsers: this.shortTermMemory.size,
      totalProfiles: this.userProfiles.size,
      memoryUsage: {
        shortTerm: Array.from(this.shortTermMemory.values()).reduce((total, context) => total + context.shortTerm.length, 0),
        longTerm: Array.from(this.shortTermMemory.values()).reduce((total, context) => total + (context.longTerm?.length || 0), 0)
      },
      topicChanges: Array.from(this.shortTermMemory.values()).reduce((total, context) => total + (context.topicChanges?.length || 0), 0),
      conversationsSummarized: Array.from(this.shortTermMemory.values()).reduce((total, context) => total + (context.conversationSummaries?.length || 0), 0)
    };
  }

  /**
   * Limpar dados antigos
   */
  async cleanupOldData() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.memoryRetentionDays);
      
      let cleanedUsers = 0;
      
      for (const [phoneNumber, context] of this.shortTermMemory.entries()) {
        // Limpar mensagens antigas da memória de longo prazo
        if (context.longTerm) {
          context.longTerm = context.longTerm.filter(message => 
            new Date(message.timestamp) > cutoffDate
          );
        }
        
        // Limpar resumos antigos
        if (context.conversationSummaries) {
          context.conversationSummaries = context.conversationSummaries.filter(summary =>
            new Date(summary.endTime) > cutoffDate
          );
        }
        
        // Salvar contexto limpo
        await this.saveUserContext(phoneNumber, context);
        cleanedUsers++;
      }
      
      logger.info('Old data cleaned up', {
        usersProcessed: cleanedUsers,
        cutoffDate: cutoffDate.toISOString()
      });
      
      return {
        success: true,
        usersProcessed: cleanedUsers,
        cutoffDate: cutoffDate.toISOString()
      };
      
    } catch (error) {
      logger.error('Error cleaning up old data', { error: error.message });
      throw error;
    }
  }
}

// Instância singleton
const contextManager = new ContextManager();

export default contextManager;

