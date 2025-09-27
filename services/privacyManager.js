// services/privacyManager.js
// Sistema de controle de privacidade e opt-out

import { ErrorFactory, ErrorUtils } from '../utils/errors.js';
import logger from '../config/logger.js';
import contextManager from './contextManager.js';
import evolutionaryProfile from './evolutionaryProfile.js';
import * as redisService from './redisService.js';
import { config } from '../config/index.js';

class PrivacyManager {
  constructor() {
    this.privacySettings = new Map();
    this.optOutUsers = new Set();
    this.dataRetentionPolicies = new Map();
    this.consentHistory = new Map();
    
    this.initializePrivacySettings();
    this.initializeDataRetentionPolicies();
  }

  /**
   * Inicializar configurações de privacidade
   */
  initializePrivacySettings() {
    // Níveis de privacidade
    this.privacySettings.set('low', {
      name: 'Baixo',
      description: 'Menos privacidade, mais personalização',
      dataRetention: 90, // dias
      learningEnabled: true,
      profileSharing: true,
      contextTracking: true,
      behaviorAnalysis: true,
      dataExport: true,
      dataDeletion: 'on_request'
    });

    this.privacySettings.set('standard', {
      name: 'Padrão',
      description: 'Privacidade equilibrada',
      dataRetention: 30, // dias
      learningEnabled: true,
      profileSharing: false,
      contextTracking: true,
      behaviorAnalysis: true,
      dataExport: true,
      dataDeletion: 'on_request'
    });

    this.privacySettings.set('high', {
      name: 'Alto',
      description: 'Máxima privacidade',
      dataRetention: 7, // dias
      learningEnabled: false,
      profileSharing: false,
      contextTracking: false,
      behaviorAnalysis: false,
      dataExport: false,
      dataDeletion: 'automatic'
    });
  }

  /**
   * Inicializar políticas de retenção de dados
   */
  initializeDataRetentionPolicies() {
    this.dataRetentionPolicies.set('conversation_data', {
      name: 'Dados de Conversa',
      description: 'Mensagens e contexto de conversas',
      retentionDays: 30,
      autoDelete: true,
      categories: ['messages', 'context', 'topics', 'sentiment']
    });

    this.dataRetentionPolicies.set('user_profile', {
      name: 'Perfil do Usuário',
      description: 'Preferências e características do usuário',
      retentionDays: 90,
      autoDelete: false,
      categories: ['preferences', 'interests', 'behavior', 'patterns']
    });

    this.dataRetentionPolicies.set('learning_data', {
      name: 'Dados de Aprendizado',
      description: 'Dados usados para aprendizado automático',
      retentionDays: 60,
      autoDelete: true,
      categories: ['interactions', 'feedback', 'adaptations', 'predictions']
    });

    this.dataRetentionPolicies.set('analytics_data', {
      name: 'Dados Analíticos',
      description: 'Estatísticas e métricas de uso',
      retentionDays: 365,
      autoDelete: true,
      categories: ['usage_stats', 'performance', 'errors', 'metrics']
    });
  }

  /**
   * Configurar privacidade do usuário
   */
  async setUserPrivacy(phoneNumber, privacyLevel, customSettings = {}) {
    try {
      // Validar nível de privacidade
      if (!this.privacySettings.has(privacyLevel)) {
        throw ErrorFactory.createValidationError(
          'Nível de privacidade inválido',
          'privacyLevel',
          'Use: low, standard ou high'
        );
      }

      const baseSettings = this.privacySettings.get(privacyLevel);
      const userSettings = {
        ...baseSettings,
        ...customSettings,
        phoneNumber: phoneNumber,
        setAt: new Date().toISOString(),
        version: '1.0'
      };

      // Salvar configurações
      await redisService.set(
        `privacy_settings:${phoneNumber}`,
        JSON.stringify(userSettings),
        60 * 60 * 24 * 365 // 1 ano
      );

      // Aplicar configurações
      await this.applyPrivacySettings(phoneNumber, userSettings);

      // Registrar consentimento
      await this.recordConsent(phoneNumber, 'privacy_settings', userSettings);

      logger.info('Privacy settings updated', {
        phoneNumber: phoneNumber?.replace(/\d(?=\d{4})/g, '*'),
        privacyLevel: privacyLevel,
        settings: userSettings
      });

      return {
        success: true,
        message: 'Configurações de privacidade atualizadas',
        settings: userSettings
      };

    } catch (error) {
      ErrorUtils.logError(error, {
        phoneNumber: phoneNumber?.replace(/\d(?=\d{4})/g, '*'),
        operation: 'setUserPrivacy'
      });
      throw error;
    }
  }

  /**
   * Aplicar configurações de privacidade
   */
  async applyPrivacySettings(phoneNumber, settings) {
    try {
      // Aplicar configurações no context manager
      if (!settings.contextTracking) {
        await contextManager.clearContext(phoneNumber);
      }

      // Aplicar configurações no perfil evolutivo
      if (!settings.learningEnabled) {
        await this.disableLearning(phoneNumber);
      }

      // Aplicar configurações de retenção de dados
      if (settings.dataRetention) {
        await this.applyDataRetention(phoneNumber, settings.dataRetention);
      }

      // Aplicar configurações de compartilhamento
      if (!settings.profileSharing) {
        await this.disableProfileSharing(phoneNumber);
      }

    } catch (error) {
      logger.error('Error applying privacy settings', { error: error.message, phoneNumber });
    }
  }

  /**
   * Desabilitar aprendizado para usuário
   */
  async disableLearning(phoneNumber) {
    try {
      const profile = await evolutionaryProfile.getEvolutionaryProfile(phoneNumber);
      
      if (profile) {
        profile.evolutionMetrics.learningEnabled = false;
        profile.learnedPreferences = {};
        profile.learnedBehavior = {};
        profile.learnedContext = {};
        
        await evolutionaryProfile.saveEvolutionaryProfile(phoneNumber, profile);
      }

    } catch (error) {
      logger.error('Error disabling learning', { error: error.message, phoneNumber });
    }
  }

  /**
   * Aplicar retenção de dados
   */
  async applyDataRetention(phoneNumber, retentionDays) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      // Limpar dados de contexto
      const context = await contextManager.getCurrentContext(phoneNumber);
      if (context) {
        // Filtrar mensagens antigas
        if (context.recentMessages) {
          context.recentMessages = context.recentMessages.filter(msg => 
            new Date(msg.timestamp) > cutoffDate
          );
        }
        
        if (context.longTerm) {
          context.longTerm = context.longTerm.filter(msg => 
            new Date(msg.timestamp) > cutoffDate
          );
        }

        await contextManager.saveUserContext(phoneNumber, context);
      }

      // Limpar perfil evolutivo
      const profile = await evolutionaryProfile.getEvolutionaryProfile(phoneNumber);
      if (profile) {
        profile.interactionHistory = profile.interactionHistory.filter(h => 
          new Date(h.timestamp) > cutoffDate
        );
        
        profile.appliedAdaptations = profile.appliedAdaptations.filter(a => 
          new Date(a.timestamp) > cutoffDate
        );

        await evolutionaryProfile.saveEvolutionaryProfile(phoneNumber, profile);
      }

    } catch (error) {
      logger.error('Error applying data retention', { error: error.message, phoneNumber });
    }
  }

  /**
   * Desabilitar compartilhamento de perfil
   */
  async disableProfileSharing(phoneNumber) {
    try {
      // Remover dados de perfil de sistemas de compartilhamento
      await redisService.del(`profile_share:${phoneNumber}`);
      
      // Marcar perfil como não compartilhável
      const profile = await evolutionaryProfile.getEvolutionaryProfile(phoneNumber);
      if (profile) {
        profile.privacySettings = profile.privacySettings || {};
        profile.privacySettings.sharingEnabled = false;
        
        await evolutionaryProfile.saveEvolutionaryProfile(phoneNumber, profile);
      }

    } catch (error) {
      logger.error('Error disabling profile sharing', { error: error.message, phoneNumber });
    }
  }

  /**
   * Registrar consentimento
   */
  async recordConsent(phoneNumber, consentType, data) {
    try {
      const consent = {
        phoneNumber: phoneNumber,
        type: consentType,
        data: data,
        timestamp: new Date().toISOString(),
        ipAddress: data.ipAddress || 'unknown',
        userAgent: data.userAgent || 'unknown'
      };

      if (!this.consentHistory.has(phoneNumber)) {
        this.consentHistory.set(phoneNumber, []);
      }

      const history = this.consentHistory.get(phoneNumber);
      history.push(consent);

      // Manter apenas os últimos 50 consentimentos
      if (history.length > 50) {
        history.splice(0, history.length - 50);
      }

      this.consentHistory.set(phoneNumber, history);

      // Salvar no Redis
      await redisService.set(
        `consent_history:${phoneNumber}`,
        JSON.stringify(history),
        60 * 60 * 24 * 365 // 1 ano
      );

    } catch (error) {
      logger.error('Error recording consent', { error: error.message, phoneNumber });
    }
  }

  /**
   * Obter configurações de privacidade do usuário
   */
  async getUserPrivacySettings(phoneNumber) {
    try {
      const settingsData = await redisService.get(`privacy_settings:${phoneNumber}`);
      
      if (settingsData) {
        return JSON.parse(settingsData);
      }

      // Retornar configurações padrão
      return this.privacySettings.get('standard');

    } catch (error) {
      logger.error('Error getting user privacy settings', { error: error.message, phoneNumber });
      return this.privacySettings.get('standard');
    }
  }

  /**
   * Verificar se usuário optou por sair
   */
  async isUserOptedOut(phoneNumber) {
    try {
      const settings = await this.getUserPrivacySettings(phoneNumber);
      return settings.privacyLevel === 'opt_out' || this.optOutUsers.has(phoneNumber);
    } catch (error) {
      logger.error('Error checking opt-out status', { error: error.message, phoneNumber });
      return false;
    }
  }

  /**
   * Processar opt-out do usuário
   */
  async processOptOut(phoneNumber, reason = 'user_request') {
    try {
      // Marcar usuário como opt-out
      this.optOutUsers.add(phoneNumber);
      
      // Salvar no Redis
      await redisService.set(
        `opt_out:${phoneNumber}`,
        JSON.stringify({
          phoneNumber: phoneNumber,
          reason: reason,
          timestamp: new Date().toISOString()
        }),
        60 * 60 * 24 * 365 // 1 ano
      );

      // Limpar todos os dados do usuário
      await this.deleteAllUserData(phoneNumber);

      // Registrar opt-out
      await this.recordConsent(phoneNumber, 'opt_out', { reason: reason });

      logger.info('User opted out', {
        phoneNumber: phoneNumber?.replace(/\d(?=\d{4})/g, '*'),
        reason: reason
      });

      return {
        success: true,
        message: 'Opt-out processado com sucesso. Todos os dados foram removidos.',
        dataDeleted: true
      };

    } catch (error) {
      ErrorUtils.logError(error, {
        phoneNumber: phoneNumber?.replace(/\d(?=\d{4})/g, '*'),
        operation: 'processOptOut'
      });
      throw error;
    }
  }

  /**
   * Deletar todos os dados do usuário
   */
  async deleteAllUserData(phoneNumber) {
    try {
      const deletedData = [];

      // Deletar dados de contexto
      try {
        await contextManager.clearContext(phoneNumber);
        deletedData.push('context_data');
      } catch (error) {
        logger.error('Error deleting context data', { error: error.message, phoneNumber });
      }

      // Deletar perfil evolutivo
      try {
        await redisService.del(`evolutionary_profile:${phoneNumber}`);
        deletedData.push('evolutionary_profile');
      } catch (error) {
        logger.error('Error deleting evolutionary profile', { error: error.message, phoneNumber });
      }

      // Deletar configurações de privacidade
      try {
        await redisService.del(`privacy_settings:${phoneNumber}`);
        deletedData.push('privacy_settings');
      } catch (error) {
        logger.error('Error deleting privacy settings', { error: error.message, phoneNumber });
      }

      // Deletar histórico de consentimento
      try {
        await redisService.del(`consent_history:${phoneNumber}`);
        deletedData.push('consent_history');
      } catch (error) {
        logger.error('Error deleting consent history', { error: error.message, phoneNumber });
      }

      // Deletar dados de perfil
      try {
        await redisService.del(`user_profile:${phoneNumber}`);
        deletedData.push('user_profile');
      } catch (error) {
        logger.error('Error deleting user profile', { error: error.message, phoneNumber });
      }

      // Deletar dados de contexto
      try {
        await redisService.del(`user_context:${phoneNumber}`);
        deletedData.push('user_context');
      } catch (error) {
        logger.error('Error deleting user context', { error: error.message, phoneNumber });
      }

      logger.info('User data deleted', {
        phoneNumber: phoneNumber?.replace(/\d(?=\d{4})/g, '*'),
        deletedData: deletedData
      });

      return {
        success: true,
        deletedData: deletedData,
        message: `Dados deletados: ${deletedData.join(', ')}`
      };

    } catch (error) {
      logger.error('Error deleting all user data', { error: error.message, phoneNumber });
      throw error;
    }
  }

  /**
   * Exportar dados do usuário
   */
  async exportUserData(phoneNumber) {
    try {
      const userData = {
        phoneNumber: phoneNumber,
        exportDate: new Date().toISOString(),
        data: {}
      };

      // Exportar dados de contexto
      try {
        const context = await contextManager.getCurrentContext(phoneNumber);
        if (context) {
          userData.data.context = context;
        }
      } catch (error) {
        logger.error('Error exporting context data', { error: error.message, phoneNumber });
      }

      // Exportar perfil evolutivo
      try {
        const profile = await evolutionaryProfile.getEvolutionaryProfile(phoneNumber);
        if (profile) {
          userData.data.evolutionaryProfile = profile;
        }
      } catch (error) {
        logger.error('Error exporting evolutionary profile', { error: error.message, phoneNumber });
      }

      // Exportar configurações de privacidade
      try {
        const privacySettings = await this.getUserPrivacySettings(phoneNumber);
        userData.data.privacySettings = privacySettings;
      } catch (error) {
        logger.error('Error exporting privacy settings', { error: error.message, phoneNumber });
      }

      // Exportar histórico de consentimento
      try {
        const consentHistory = this.consentHistory.get(phoneNumber) || [];
        userData.data.consentHistory = consentHistory;
      } catch (error) {
        logger.error('Error exporting consent history', { error: error.message, phoneNumber });
      }

      // Salvar exportação
      const exportId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await redisService.set(
        `data_export:${phoneNumber}:${exportId}`,
        JSON.stringify(userData),
        60 * 60 * 24 * 7 // 7 dias
      );

      logger.info('User data exported', {
        phoneNumber: phoneNumber?.replace(/\d(?=\d{4})/g, '*'),
        exportId: exportId
      });

      return {
        success: true,
        exportId: exportId,
        data: userData,
        message: 'Dados exportados com sucesso'
      };

    } catch (error) {
      ErrorUtils.logError(error, {
        phoneNumber: phoneNumber?.replace(/\d(?=\d{4})/g, '*'),
        operation: 'exportUserData'
      });
      throw error;
    }
  }

  /**
   * Verificar conformidade com LGPD
   */
  async checkLGPDCompliance(phoneNumber) {
    try {
      const compliance = {
        phoneNumber: phoneNumber,
        checkedAt: new Date().toISOString(),
        compliant: true,
        issues: [],
        recommendations: []
      };

      // Verificar consentimento
      const consentHistory = this.consentHistory.get(phoneNumber) || [];
      if (consentHistory.length === 0) {
        compliance.issues.push('Nenhum consentimento registrado');
        compliance.recommendations.push('Solicitar consentimento explícito');
      }

      // Verificar retenção de dados
      const privacySettings = await this.getUserPrivacySettings(phoneNumber);
      if (privacySettings.dataRetention > 365) {
        compliance.issues.push('Retenção de dados muito longa');
        compliance.recommendations.push('Reduzir período de retenção');
      }

      // Verificar dados sensíveis
      const context = await contextManager.getCurrentContext(phoneNumber);
      if (context && context.userProfile) {
        const profile = context.userProfile;
        if (profile.preferences && profile.preferences.privacy === 'low') {
          compliance.issues.push('Configuração de privacidade muito baixa');
          compliance.recommendations.push('Revisar configurações de privacidade');
        }
      }

      // Verificar opt-out
      if (await this.isUserOptedOut(phoneNumber)) {
        compliance.issues.push('Usuário optou por sair');
        compliance.recommendations.push('Verificar se dados foram removidos');
      }

      compliance.compliant = compliance.issues.length === 0;

      return compliance;

    } catch (error) {
      logger.error('Error checking LGPD compliance', { error: error.message, phoneNumber });
      return {
        phoneNumber: phoneNumber,
        checkedAt: new Date().toISOString(),
        compliant: false,
        issues: ['Erro ao verificar conformidade'],
        recommendations: ['Verificar logs de erro']
      };
    }
  }

  /**
   * Obter estatísticas de privacidade
   */
  getPrivacyStats() {
    return {
      totalUsers: this.privacySettings.size,
      optOutUsers: this.optOutUsers.size,
      consentHistory: this.consentHistory.size,
      dataRetentionPolicies: this.dataRetentionPolicies.size,
      privacyLevels: {
        low: 0,
        standard: 0,
        high: 0,
        opt_out: 0
      }
    };
  }

  /**
   * Limpar dados antigos automaticamente
   */
  async cleanupOldData() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 dias

      let cleanedUsers = 0;

      // Limpar histórico de consentimento antigo
      for (const [phoneNumber, history] of this.consentHistory.entries()) {
        const recentHistory = history.filter(consent => 
          new Date(consent.timestamp) > cutoffDate
        );
        
        if (recentHistory.length !== history.length) {
          this.consentHistory.set(phoneNumber, recentHistory);
          await redisService.set(
            `consent_history:${phoneNumber}`,
            JSON.stringify(recentHistory),
            60 * 60 * 24 * 365
          );
          cleanedUsers++;
        }
      }

      logger.info('Privacy data cleaned up', {
        usersProcessed: cleanedUsers,
        cutoffDate: cutoffDate.toISOString()
      });

      return {
        success: true,
        usersProcessed: cleanedUsers,
        cutoffDate: cutoffDate.toISOString()
      };

    } catch (error) {
      logger.error('Error cleaning up privacy data', { error: error.message });
      throw error;
    }
  }

  /**
   * Obter políticas de privacidade
   */
  getPrivacyPolicies() {
    return {
      dataRetention: Array.from(this.dataRetentionPolicies.values()),
      privacyLevels: Array.from(this.privacySettings.values()),
      compliance: {
        lgpd: true,
        gdpr: false,
        ccpa: false
      }
    };
  }

  /**
   * Atualizar políticas de retenção
   */
  updateDataRetentionPolicy(dataType, retentionDays) {
    if (this.dataRetentionPolicies.has(dataType)) {
      const policy = this.dataRetentionPolicies.get(dataType);
      policy.retentionDays = retentionDays;
      this.dataRetentionPolicies.set(dataType, policy);
    }
  }

  /**
   * Adicionar novo nível de privacidade
   */
  addPrivacyLevel(level, settings) {
    this.privacySettings.set(level, settings);
  }

  /**
   * Remover nível de privacidade
   */
  removePrivacyLevel(level) {
    this.privacySettings.delete(level);
  }
}

// Instância singleton
const privacyManager = new PrivacyManager();

export default privacyManager;

