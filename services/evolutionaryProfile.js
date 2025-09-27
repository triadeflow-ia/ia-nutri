// services/evolutionaryProfile.js
// Sistema de perfil evolutivo do usuário

import { ErrorFactory, ErrorUtils } from '../utils/errors.js';
import logger from '../config/logger.js';
import contextManager from './contextManager.js';
import * as redisService from './redisService.js';
import { config } from '../config/index.js';

class EvolutionaryProfile {
  constructor() {
    this.userProfiles = new Map();
    this.learningModels = new Map();
    this.adaptationRules = new Map();
    this.preferenceWeights = new Map();
    
    this.initializeLearningModels();
    this.initializeAdaptationRules();
  }

  /**
   * Inicializar modelos de aprendizado
   */
  initializeLearningModels() {
    // Modelo de aprendizado de preferências
    this.learningModels.set('preferences', {
      name: 'preferences',
      description: 'Aprende preferências do usuário',
      features: ['communication_style', 'topic_interests', 'time_preferences', 'interaction_patterns'],
      weights: {
        communication_style: 0.3,
        topic_interests: 0.4,
        time_preferences: 0.2,
        interaction_patterns: 0.1
      },
      learningRate: 0.1,
      decayRate: 0.95
    });

    // Modelo de aprendizado de comportamento
    this.learningModels.set('behavior', {
      name: 'behavior',
      description: 'Aprende padrões de comportamento',
      features: ['command_usage', 'response_time', 'error_patterns', 'success_patterns'],
      weights: {
        command_usage: 0.4,
        response_time: 0.2,
        error_patterns: 0.2,
        success_patterns: 0.2
      },
      learningRate: 0.15,
      decayRate: 0.9
    });

    // Modelo de aprendizado de contexto
    this.learningModels.set('context', {
      name: 'context',
      description: 'Aprende contexto de uso',
      features: ['conversation_topics', 'session_length', 'interaction_frequency', 'context_switches'],
      weights: {
        conversation_topics: 0.3,
        session_length: 0.2,
        interaction_frequency: 0.3,
        context_switches: 0.2
      },
      learningRate: 0.12,
      decayRate: 0.92
    });
  }

  /**
   * Inicializar regras de adaptação
   */
  initializeAdaptationRules() {
    // Regras de adaptação de tom
    this.adaptationRules.set('tone', [
      {
        condition: 'user_uses_formal_language',
        action: 'increase_formality',
        weight: 0.8,
        description: 'Usuário usa linguagem formal'
      },
      {
        condition: 'user_uses_casual_language',
        action: 'decrease_formality',
        weight: 0.8,
        description: 'Usuário usa linguagem casual'
      },
      {
        condition: 'user_asks_questions',
        action: 'increase_helpfulness',
        weight: 0.7,
        description: 'Usuário faz muitas perguntas'
      },
      {
        condition: 'user_gives_feedback',
        action: 'adapt_to_feedback',
        weight: 0.9,
        description: 'Usuário dá feedback'
      }
    ]);

    // Regras de adaptação de conteúdo
    this.adaptationRules.set('content', [
      {
        condition: 'user_interested_in_nutrition',
        action: 'prioritize_nutrition_content',
        weight: 0.8,
        description: 'Usuário interessado em nutrição'
      },
      {
        condition: 'user_interested_in_exercise',
        action: 'prioritize_exercise_content',
        weight: 0.8,
        description: 'Usuário interessado em exercício'
      },
      {
        condition: 'user_uses_voice_commands',
        action: 'optimize_for_voice',
        weight: 0.7,
        description: 'Usuário usa comandos de voz'
      },
      {
        condition: 'user_prefers_short_responses',
        action: 'shorten_responses',
        weight: 0.6,
        description: 'Usuário prefere respostas curtas'
      }
    ]);

    // Regras de adaptação de timing
    this.adaptationRules.set('timing', [
      {
        condition: 'user_active_morning',
        action: 'optimize_morning_interactions',
        weight: 0.7,
        description: 'Usuário ativo pela manhã'
      },
      {
        condition: 'user_active_evening',
        action: 'optimize_evening_interactions',
        weight: 0.7,
        description: 'Usuário ativo à noite'
      },
      {
        condition: 'user_long_sessions',
        action: 'prepare_for_long_sessions',
        weight: 0.6,
        description: 'Usuário tem sessões longas'
      },
      {
        condition: 'user_quick_sessions',
        action: 'optimize_for_quick_sessions',
        weight: 0.6,
        description: 'Usuário tem sessões rápidas'
      }
    ]);
  }

  /**
   * Atualizar perfil evolutivo
   */
  async updateEvolutionaryProfile(phoneNumber, interactionData) {
    try {
      const profile = await this.getEvolutionaryProfile(phoneNumber);
      
      // Atualizar dados de interação
      profile.interactionHistory.push({
        timestamp: new Date().toISOString(),
        type: interactionData.type,
        data: interactionData.data,
        success: interactionData.success,
        feedback: interactionData.feedback
      });
      
      // Manter apenas as últimas 100 interações
      if (profile.interactionHistory.length > 100) {
        profile.interactionHistory = profile.interactionHistory.slice(-100);
      }
      
      // Aplicar modelos de aprendizado
      await this.applyLearningModels(phoneNumber, profile, interactionData);
      
      // Aplicar regras de adaptação
      await this.applyAdaptationRules(phoneNumber, profile, interactionData);
      
      // Atualizar métricas de evolução
      await this.updateEvolutionMetrics(phoneNumber, profile);
      
      // Salvar perfil atualizado
      await this.saveEvolutionaryProfile(phoneNumber, profile);
      
      logger.info('Evolutionary profile updated', {
        phoneNumber: phoneNumber?.replace(/\d(?=\d{4})/g, '*'),
        interactionType: interactionData.type,
        success: interactionData.success
      });
      
      return {
        success: true,
        profile: profile,
        adaptations: await this.getRecentAdaptations(phoneNumber)
      };
      
    } catch (error) {
      ErrorUtils.logError(error, {
        phoneNumber: phoneNumber?.replace(/\d(?=\d{4})/g, '*'),
        operation: 'updateEvolutionaryProfile'
      });
      throw error;
    }
  }

  /**
   * Obter perfil evolutivo
   */
  async getEvolutionaryProfile(phoneNumber) {
    try {
      // Tentar carregar do cache
      if (this.userProfiles.has(phoneNumber)) {
        return this.userProfiles.get(phoneNumber);
      }
      
      // Carregar do Redis
      const profileData = await redisService.get(`evolutionary_profile:${phoneNumber}`);
      if (profileData) {
        const profile = JSON.parse(profileData);
        this.userProfiles.set(phoneNumber, profile);
        return profile;
      }
      
      // Criar novo perfil
      const newProfile = this.createNewEvolutionaryProfile(phoneNumber);
      this.userProfiles.set(phoneNumber, newProfile);
      await this.saveEvolutionaryProfile(phoneNumber, newProfile);
      
      return newProfile;
      
    } catch (error) {
      logger.error('Error getting evolutionary profile', { error: error.message, phoneNumber });
      return this.createNewEvolutionaryProfile(phoneNumber);
    }
  }

  /**
   * Criar novo perfil evolutivo
   */
  createNewEvolutionaryProfile(phoneNumber) {
    return {
      phoneNumber: phoneNumber,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      version: '1.0',
      
      // Dados de interação
      interactionHistory: [],
      totalInteractions: 0,
      successfulInteractions: 0,
      failedInteractions: 0,
      
      // Preferências aprendidas
      learnedPreferences: {
        communicationStyle: 'neutral',
        formalityLevel: 0.5,
        responseLength: 'medium',
        topicInterests: [],
        timePreferences: {},
        interactionPatterns: {}
      },
      
      // Comportamento aprendido
      learnedBehavior: {
        commandUsage: {},
        responseTime: 0,
        errorPatterns: [],
        successPatterns: [],
        adaptationLevel: 0
      },
      
      // Contexto aprendido
      learnedContext: {
        conversationTopics: [],
        sessionLength: 0,
        interactionFrequency: 0,
        contextSwitches: 0
      },
      
      // Métricas de evolução
      evolutionMetrics: {
        learningRate: 0.1,
        adaptationScore: 0,
        predictionAccuracy: 0,
        userSatisfaction: 0,
        evolutionStage: 'beginner'
      },
      
      // Adaptações aplicadas
      appliedAdaptations: [],
      
      // Previsões
      predictions: {
        nextCommand: null,
        nextTopic: null,
        nextTime: null,
        confidence: 0
      }
    };
  }

  /**
   * Aplicar modelos de aprendizado
   */
  async applyLearningModels(phoneNumber, profile, interactionData) {
    try {
      // Aplicar modelo de preferências
      await this.applyPreferenceLearning(phoneNumber, profile, interactionData);
      
      // Aplicar modelo de comportamento
      await this.applyBehaviorLearning(phoneNumber, profile, interactionData);
      
      // Aplicar modelo de contexto
      await this.applyContextLearning(phoneNumber, profile, interactionData);
      
    } catch (error) {
      logger.error('Error applying learning models', { error: error.message, phoneNumber });
    }
  }

  /**
   * Aplicar aprendizado de preferências
   */
  async applyPreferenceLearning(phoneNumber, profile, interactionData) {
    const model = this.learningModels.get('preferences');
    const preferences = profile.learnedPreferences;
    
    // Aprender estilo de comunicação
    if (interactionData.data.message) {
      const message = interactionData.data.message.toLowerCase();
      
      // Detectar formalidade
      const formalWords = ['por favor', 'obrigado', 'obrigada', 'desculpe', 'com licença'];
      const casualWords = ['oi', 'olá', 'beleza', 'tranquilo', 'valeu'];
      
      const formalCount = formalWords.filter(word => message.includes(word)).length;
      const casualCount = casualWords.filter(word => message.includes(word)).length;
      
      if (formalCount > casualCount) {
        preferences.formalityLevel = Math.min(1, preferences.formalityLevel + model.learningRate);
        preferences.communicationStyle = 'formal';
      } else if (casualCount > formalCount) {
        preferences.formalityLevel = Math.max(0, preferences.formalityLevel - model.learningRate);
        preferences.communicationStyle = 'casual';
      }
      
      // Detectar tópicos de interesse
      const topicKeywords = {
        'nutrição': ['nutrição', 'dieta', 'alimento', 'caloria', 'vitamina'],
        'exercício': ['exercício', 'treino', 'academia', 'corrida', 'musculação'],
        'produtividade': ['lembrete', 'agenda', 'tarefa', 'organização', 'produtividade'],
        'saúde': ['saúde', 'médico', 'exame', 'sintoma', 'tratamento']
      };
      
      for (const [topic, keywords] of Object.entries(topicKeywords)) {
        const topicCount = keywords.filter(keyword => message.includes(keyword)).length;
        if (topicCount > 0) {
          if (!preferences.topicInterests.includes(topic)) {
            preferences.topicInterests.push(topic);
          }
        }
      }
    }
    
    // Aprender preferências de tempo
    const hour = new Date().getHours();
    if (!preferences.timePreferences[hour]) {
      preferences.timePreferences[hour] = 0;
    }
    preferences.timePreferences[hour] += 1;
    
    // Aprender padrões de interação
    if (interactionData.type === 'command') {
      const command = interactionData.data.command;
      if (!preferences.interactionPatterns[command]) {
        preferences.interactionPatterns[command] = 0;
      }
      preferences.interactionPatterns[command] += 1;
    }
  }

  /**
   * Aplicar aprendizado de comportamento
   */
  async applyBehaviorLearning(phoneNumber, profile, interactionData) {
    const behavior = profile.learnedBehavior;
    
    // Atualizar uso de comandos
    if (interactionData.type === 'command') {
      const command = interactionData.data.command;
      if (!behavior.commandUsage[command]) {
        behavior.commandUsage[command] = 0;
      }
      behavior.commandUsage[command] += 1;
    }
    
    // Atualizar tempo de resposta
    if (interactionData.data.responseTime) {
      const currentTime = behavior.responseTime;
      const newTime = interactionData.data.responseTime;
      behavior.responseTime = (currentTime + newTime) / 2; // Média móvel
    }
    
    // Atualizar padrões de erro
    if (!interactionData.success) {
      behavior.errorPatterns.push({
        timestamp: new Date().toISOString(),
        type: interactionData.type,
        error: interactionData.data.error,
        context: interactionData.data.context
      });
      
      // Manter apenas os últimos 20 erros
      if (behavior.errorPatterns.length > 20) {
        behavior.errorPatterns = behavior.errorPatterns.slice(-20);
      }
    }
    
    // Atualizar padrões de sucesso
    if (interactionData.success) {
      behavior.successPatterns.push({
        timestamp: new Date().toISOString(),
        type: interactionData.type,
        context: interactionData.data.context
      });
      
      // Manter apenas os últimos 50 sucessos
      if (behavior.successPatterns.length > 50) {
        behavior.successPatterns = behavior.successPatterns.slice(-50);
      }
    }
    
    // Calcular nível de adaptação
    const totalInteractions = profile.totalInteractions;
    const successfulInteractions = profile.successfulInteractions;
    
    if (totalInteractions > 0) {
      behavior.adaptationLevel = successfulInteractions / totalInteractions;
    }
  }

  /**
   * Aplicar aprendizado de contexto
   */
  async applyContextLearning(phoneNumber, profile, interactionData) {
    const context = profile.learnedContext;
    
    // Atualizar tópicos de conversa
    if (interactionData.data.topic) {
      if (!context.conversationTopics.includes(interactionData.data.topic)) {
        context.conversationTopics.push(interactionData.data.topic);
      }
    }
    
    // Atualizar duração da sessão
    if (interactionData.data.sessionLength) {
      context.sessionLength = (context.sessionLength + interactionData.data.sessionLength) / 2;
    }
    
    // Atualizar frequência de interação
    const now = new Date();
    const lastInteraction = profile.lastUpdated ? new Date(profile.lastUpdated) : now;
    const timeDiff = (now - lastInteraction) / (1000 * 60); // em minutos
    
    if (timeDiff < 60) { // Interação dentro de 1 hora
      context.interactionFrequency += 1;
    } else {
      context.interactionFrequency = Math.max(0, context.interactionFrequency - 1);
    }
    
    // Atualizar mudanças de contexto
    if (interactionData.data.contextSwitch) {
      context.contextSwitches += 1;
    }
  }

  /**
   * Aplicar regras de adaptação
   */
  async applyAdaptationRules(phoneNumber, profile, interactionData) {
    try {
      const adaptations = [];
      
      // Aplicar regras de tom
      const toneAdaptations = await this.applyToneAdaptations(phoneNumber, profile, interactionData);
      adaptations.push(...toneAdaptations);
      
      // Aplicar regras de conteúdo
      const contentAdaptations = await this.applyContentAdaptations(phoneNumber, profile, interactionData);
      adaptations.push(...contentAdaptations);
      
      // Aplicar regras de timing
      const timingAdaptations = await this.applyTimingAdaptations(phoneNumber, profile, interactionData);
      adaptations.push(...timingAdaptations);
      
      // Salvar adaptações aplicadas
      profile.appliedAdaptations.push(...adaptations);
      
      // Manter apenas as últimas 50 adaptações
      if (profile.appliedAdaptations.length > 50) {
        profile.appliedAdaptations = profile.appliedAdaptations.slice(-50);
      }
      
    } catch (error) {
      logger.error('Error applying adaptation rules', { error: error.message, phoneNumber });
    }
  }

  /**
   * Aplicar adaptações de tom
   */
  async applyToneAdaptations(phoneNumber, profile, interactionData) {
    const adaptations = [];
    const rules = this.adaptationRules.get('tone');
    
    for (const rule of rules) {
      let shouldApply = false;
      
      switch (rule.condition) {
        case 'user_uses_formal_language':
          shouldApply = profile.learnedPreferences.formalityLevel > 0.7;
          break;
        case 'user_uses_casual_language':
          shouldApply = profile.learnedPreferences.formalityLevel < 0.3;
          break;
        case 'user_asks_questions':
          shouldApply = this.countQuestions(profile.interactionHistory) > 5;
          break;
        case 'user_gives_feedback':
          shouldApply = interactionData.feedback !== null;
          break;
      }
      
      if (shouldApply) {
        adaptations.push({
          type: 'tone',
          rule: rule.condition,
          action: rule.action,
          weight: rule.weight,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return adaptations;
  }

  /**
   * Aplicar adaptações de conteúdo
   */
  async applyContentAdaptations(phoneNumber, profile, interactionData) {
    const adaptations = [];
    const rules = this.adaptationRules.get('content');
    
    for (const rule of rules) {
      let shouldApply = false;
      
      switch (rule.condition) {
        case 'user_interested_in_nutrition':
          shouldApply = profile.learnedPreferences.topicInterests.includes('nutrição');
          break;
        case 'user_interested_in_exercise':
          shouldApply = profile.learnedPreferences.topicInterests.includes('exercício');
          break;
        case 'user_uses_voice_commands':
          shouldApply = interactionData.type === 'voice_command';
          break;
        case 'user_prefers_short_responses':
          shouldApply = this.analyzeResponseLengthPreference(profile) === 'short';
          break;
      }
      
      if (shouldApply) {
        adaptations.push({
          type: 'content',
          rule: rule.condition,
          action: rule.action,
          weight: rule.weight,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return adaptations;
  }

  /**
   * Aplicar adaptações de timing
   */
  async applyTimingAdaptations(phoneNumber, profile, interactionData) {
    const adaptations = [];
    const rules = this.adaptationRules.get('timing');
    
    for (const rule of rules) {
      let shouldApply = false;
      
      switch (rule.condition) {
        case 'user_active_morning':
          shouldApply = this.isUserActiveInMorning(profile);
          break;
        case 'user_active_evening':
          shouldApply = this.isUserActiveInEvening(profile);
          break;
        case 'user_long_sessions':
          shouldApply = profile.learnedContext.sessionLength > 30; // 30 minutos
          break;
        case 'user_quick_sessions':
          shouldApply = profile.learnedContext.sessionLength < 5; // 5 minutos
          break;
      }
      
      if (shouldApply) {
        adaptations.push({
          type: 'timing',
          rule: rule.condition,
          action: rule.action,
          weight: rule.weight,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return adaptations;
  }

  /**
   * Atualizar métricas de evolução
   */
  async updateEvolutionMetrics(phoneNumber, profile) {
    const metrics = profile.evolutionMetrics;
    
    // Calcular taxa de aprendizado
    const totalInteractions = profile.totalInteractions;
    const successfulInteractions = profile.successfulInteractions;
    
    if (totalInteractions > 0) {
      metrics.learningRate = successfulInteractions / totalInteractions;
    }
    
    // Calcular score de adaptação
    const adaptations = profile.appliedAdaptations;
    const recentAdaptations = adaptations.filter(a => 
      new Date(a.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Últimos 7 dias
    );
    
    metrics.adaptationScore = recentAdaptations.length / 7; // Adaptações por dia
    
    // Calcular precisão de previsão
    const predictions = profile.predictions;
    if (predictions.nextCommand && predictions.confidence > 0) {
      // Simular cálculo de precisão (em implementação real, seria baseado em dados históricos)
      metrics.predictionAccuracy = Math.min(0.9, predictions.confidence * 0.8);
    }
    
    // Calcular satisfação do usuário
    const feedback = profile.interactionHistory
      .filter(h => h.feedback !== null)
      .slice(-10); // Últimos 10 feedbacks
    
    if (feedback.length > 0) {
      const positiveFeedback = feedback.filter(f => f.feedback > 0).length;
      metrics.userSatisfaction = positiveFeedback / feedback.length;
    }
    
    // Determinar estágio de evolução
    if (totalInteractions < 10) {
      metrics.evolutionStage = 'beginner';
    } else if (totalInteractions < 50) {
      metrics.evolutionStage = 'learning';
    } else if (totalInteractions < 100) {
      metrics.evolutionStage = 'adapting';
    } else {
      metrics.evolutionStage = 'expert';
    }
  }

  /**
   * Gerar previsões personalizadas
   */
  async generatePredictions(phoneNumber) {
    try {
      const profile = await this.getEvolutionaryProfile(phoneNumber);
      const predictions = {
        nextCommand: null,
        nextTopic: null,
        nextTime: null,
        confidence: 0
      };
      
      // Prever próximo comando
      const commandUsage = profile.learnedBehavior.commandUsage;
      if (Object.keys(commandUsage).length > 0) {
        const mostUsedCommand = Object.keys(commandUsage).reduce((a, b) => 
          commandUsage[a] > commandUsage[b] ? a : b
        );
        predictions.nextCommand = mostUsedCommand;
        predictions.confidence += 0.3;
      }
      
      // Prever próximo tópico
      const topics = profile.learnedContext.conversationTopics;
      if (topics.length > 0) {
        const recentTopics = topics.slice(-5);
        const topicCounts = {};
        recentTopics.forEach(topic => {
          topicCounts[topic] = (topicCounts[topic] || 0) + 1;
        });
        
        const mostRecentTopic = Object.keys(topicCounts).reduce((a, b) => 
          topicCounts[a] > topicCounts[b] ? a : b
        );
        predictions.nextTopic = mostRecentTopic;
        predictions.confidence += 0.3;
      }
      
      // Prever próximo horário
      const timePreferences = profile.learnedPreferences.timePreferences;
      if (Object.keys(timePreferences).length > 0) {
        const peakHour = Object.keys(timePreferences).reduce((a, b) => 
          timePreferences[a] > timePreferences[b] ? a : b
        );
        predictions.nextTime = parseInt(peakHour);
        predictions.confidence += 0.2;
      }
      
      // Normalizar confiança
      predictions.confidence = Math.min(1, predictions.confidence);
      
      // Atualizar previsões no perfil
      profile.predictions = predictions;
      await this.saveEvolutionaryProfile(phoneNumber, profile);
      
      return predictions;
      
    } catch (error) {
      logger.error('Error generating predictions', { error: error.message, phoneNumber });
      return null;
    }
  }

  /**
   * Obter sugestões personalizadas
   */
  async getPersonalizedSuggestions(phoneNumber) {
    try {
      const profile = await this.getEvolutionaryProfile(phoneNumber);
      const suggestions = [];
      
      // Sugestões baseadas em tópicos de interesse
      const interests = profile.learnedPreferences.topicInterests;
      if (interests.includes('nutrição')) {
        suggestions.push({
          type: 'nutrition',
          content: 'Quer analisar um alimento ou criar um plano alimentar?',
          priority: 'high',
          confidence: 0.8
        });
      }
      
      if (interests.includes('exercício')) {
        suggestions.push({
          type: 'exercise',
          content: 'Posso ajudar com dicas de exercícios ou criar um plano de treino.',
          priority: 'high',
          confidence: 0.8
        });
      }
      
      // Sugestões baseadas em padrões de uso
      const commandUsage = profile.learnedBehavior.commandUsage;
      if (commandUsage['lembrete'] > 5) {
        suggestions.push({
          type: 'productivity',
          content: 'Que tal criar um lembrete para hoje?',
          priority: 'medium',
          confidence: 0.7
        });
      }
      
      // Sugestões baseadas no horário
      const hour = new Date().getHours();
      const timePreferences = profile.learnedPreferences.timePreferences;
      
      if (hour >= 6 && hour <= 9 && timePreferences[hour] > 0) {
        suggestions.push({
          type: 'morning',
          content: 'Bom dia! Que tal ver sua agenda para hoje?',
          priority: 'high',
          confidence: 0.9
        });
      }
      
      // Sugestões baseadas no estágio de evolução
      const stage = profile.evolutionMetrics.evolutionStage;
      if (stage === 'expert') {
        suggestions.push({
          type: 'advanced',
          content: 'Posso criar atalhos personalizados para você!',
          priority: 'medium',
          confidence: 0.6
        });
      }
      
      // Ordenar por prioridade e confiança
      suggestions.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return b.confidence - a.confidence;
      });
      
      return suggestions.slice(0, 3); // Top 3 sugestões
      
    } catch (error) {
      logger.error('Error getting personalized suggestions', { error: error.message, phoneNumber });
      return [];
    }
  }

  /**
   * Salvar perfil evolutivo
   */
  async saveEvolutionaryProfile(phoneNumber, profile) {
    try {
      profile.lastUpdated = new Date().toISOString();
      this.userProfiles.set(phoneNumber, profile);
      
      // Salvar no Redis para persistência
      await redisService.set(
        `evolutionary_profile:${phoneNumber}`,
        JSON.stringify(profile),
        60 * 60 * 24 * 30 // 30 dias
      );
      
    } catch (error) {
      logger.error('Error saving evolutionary profile', { error: error.message, phoneNumber });
    }
  }

  /**
   * Obter adaptações recentes
   */
  async getRecentAdaptations(phoneNumber) {
    try {
      const profile = await this.getEvolutionaryProfile(phoneNumber);
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      return profile.appliedAdaptations.filter(adaptation => 
        new Date(adaptation.timestamp) > oneWeekAgo
      );
      
    } catch (error) {
      logger.error('Error getting recent adaptations', { error: error.message, phoneNumber });
      return [];
    }
  }

  /**
   * Métodos auxiliares
   */
  countQuestions(interactionHistory) {
    return interactionHistory.filter(h => 
      h.data.message && h.data.message.includes('?')
    ).length;
  }

  analyzeResponseLengthPreference(profile) {
    const interactions = profile.interactionHistory;
    const responses = interactions.filter(h => h.data.response);
    
    if (responses.length === 0) return 'medium';
    
    const avgLength = responses.reduce((sum, h) => 
      sum + (h.data.response.length || 0), 0) / responses.length;
    
    if (avgLength < 50) return 'short';
    if (avgLength > 200) return 'long';
    return 'medium';
  }

  isUserActiveInMorning(profile) {
    const timePreferences = profile.learnedPreferences.timePreferences;
    const morningHours = [6, 7, 8, 9, 10];
    
    return morningHours.some(hour => timePreferences[hour] > 0);
  }

  isUserActiveInEvening(profile) {
    const timePreferences = profile.learnedPreferences.timePreferences;
    const eveningHours = [18, 19, 20, 21, 22];
    
    return eveningHours.some(hour => timePreferences[hour] > 0);
  }

  /**
   * Obter estatísticas de perfis evolutivos
   */
  getEvolutionaryStats() {
    const stats = {
      totalProfiles: this.userProfiles.size,
      learningModels: this.learningModels.size,
      adaptationRules: this.adaptationRules.size,
      evolutionStages: {
        beginner: 0,
        learning: 0,
        adapting: 0,
        expert: 0
      },
      averageAdaptationScore: 0,
      averageLearningRate: 0
    };
    
    let totalAdaptationScore = 0;
    let totalLearningRate = 0;
    
    for (const profile of this.userProfiles.values()) {
      // Contar estágios de evolução
      const stage = profile.evolutionMetrics.evolutionStage;
      if (stats.evolutionStages.hasOwnProperty(stage)) {
        stats.evolutionStages[stage]++;
      }
      
      // Acumular métricas
      totalAdaptationScore += profile.evolutionMetrics.adaptationScore;
      totalLearningRate += profile.evolutionMetrics.learningRate;
    }
    
    if (this.userProfiles.size > 0) {
      stats.averageAdaptationScore = totalAdaptationScore / this.userProfiles.size;
      stats.averageLearningRate = totalLearningRate / this.userProfiles.size;
    }
    
    return stats;
  }

  /**
   * Limpar dados antigos
   */
  async cleanupOldData() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 dias
      
      let cleanedProfiles = 0;
      
      for (const [phoneNumber, profile] of this.userProfiles.entries()) {
        // Limpar histórico antigo
        profile.interactionHistory = profile.interactionHistory.filter(h => 
          new Date(h.timestamp) > cutoffDate
        );
        
        // Limpar adaptações antigas
        profile.appliedAdaptations = profile.appliedAdaptations.filter(a => 
          new Date(a.timestamp) > cutoffDate
        );
        
        // Salvar perfil limpo
        await this.saveEvolutionaryProfile(phoneNumber, profile);
        cleanedProfiles++;
      }
      
      logger.info('Evolutionary profiles cleaned up', {
        profilesProcessed: cleanedProfiles,
        cutoffDate: cutoffDate.toISOString()
      });
      
      return {
        success: true,
        profilesProcessed: cleanedProfiles,
        cutoffDate: cutoffDate.toISOString()
      };
      
    } catch (error) {
      logger.error('Error cleaning up evolutionary profiles', { error: error.message });
      throw error;
    }
  }
}

// Instância singleton
const evolutionaryProfile = new EvolutionaryProfile();

export default evolutionaryProfile;

