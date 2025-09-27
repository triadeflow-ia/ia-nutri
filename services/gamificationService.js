// services/gamificationService.js
// Sistema de gamificação

import { ErrorFactory, ErrorUtils } from '../utils/errors.js';
import logger from '../config/logger.js';
import userDataService from './userDataService.js';
import * as whatsappService from './whatsappService.js';
import { config } from '../config/index.js';

class GamificationService {
  constructor() {
    this.achievements = new Map();
    this.xpRewards = new Map();
    this.userStats = new Map();
    this.leaderboards = new Map();
    
    this.initializeAchievements();
    this.initializeXPRewards();
  }

  /**
   * Inicializar achievements
   */
  initializeAchievements() {
    // Achievements de primeira vez
    this.achievements.set('first_message', {
      id: 'first_message',
      name: 'Primeira Mensagem',
      description: 'Enviou sua primeira mensagem',
      emoji: '👋',
      xp: 10,
      rarity: 'common',
      category: 'first_time'
    });

    this.achievements.set('first_command', {
      id: 'first_command',
      name: 'Primeiro Comando',
      description: 'Usou seu primeiro comando',
      emoji: '⚡',
      xp: 15,
      rarity: 'common',
      category: 'first_time'
    });

    this.achievements.set('first_image', {
      id: 'first_image',
      name: 'Primeira Imagem',
      description: 'Enviou sua primeira imagem',
      emoji: '📸',
      xp: 20,
      rarity: 'common',
      category: 'first_time'
    });

    this.achievements.set('first_audio', {
      id: 'first_audio',
      name: 'Primeiro Áudio',
      description: 'Enviou seu primeiro áudio',
      emoji: '🎤',
      xp: 20,
      rarity: 'common',
      category: 'first_time'
    });

    // Achievements de frequência
    this.achievements.set('daily_user', {
      id: 'daily_user',
      name: 'Usuário Diário',
      description: 'Usou o bot por 7 dias seguidos',
      emoji: '📅',
      xp: 50,
      rarity: 'rare',
      category: 'frequency'
    });

    this.achievements.set('weekly_user', {
      id: 'weekly_user',
      name: 'Usuário Semanal',
      description: 'Usou o bot por 4 semanas seguidas',
      emoji: '📊',
      xp: 100,
      rarity: 'epic',
      category: 'frequency'
    });

    this.achievements.set('monthly_user', {
      id: 'monthly_user',
      name: 'Usuário Mensal',
      description: 'Usou o bot por 3 meses seguidos',
      emoji: '🏆',
      xp: 200,
      rarity: 'legendary',
      category: 'frequency'
    });

    // Achievements de comandos
    this.achievements.set('command_master', {
      id: 'command_master',
      name: 'Mestre dos Comandos',
      description: 'Usou 10 comandos diferentes',
      emoji: '🎯',
      xp: 75,
      rarity: 'rare',
      category: 'commands'
    });

    this.achievements.set('natural_speaker', {
      id: 'natural_speaker',
      name: 'Falante Natural',
      description: 'Usou 20 comandos em linguagem natural',
      emoji: '🗣️',
      xp: 60,
      rarity: 'rare',
      category: 'commands'
    });

    this.achievements.set('shortcut_creator', {
      id: 'shortcut_creator',
      name: 'Criador de Atalhos',
      description: 'Criou 5 atalhos personalizados',
      emoji: '⚡',
      xp: 40,
      rarity: 'uncommon',
      category: 'commands'
    });

    // Achievements de produtividade
    this.achievements.set('reminder_master', {
      id: 'reminder_master',
      name: 'Mestre dos Lembretes',
      description: 'Criou 10 lembretes',
      emoji: '⏰',
      xp: 50,
      rarity: 'uncommon',
      category: 'productivity'
    });

    this.achievements.set('task_completer', {
      id: 'task_completer',
      name: 'Completador de Tarefas',
      description: 'Completou 20 tarefas',
      emoji: '✅',
      xp: 60,
      rarity: 'rare',
      category: 'productivity'
    });

    this.achievements.set('timer_user', {
      id: 'timer_user',
      name: 'Usuário de Timer',
      description: 'Usou o timer 15 vezes',
      emoji: '⏱️',
      xp: 30,
      rarity: 'uncommon',
      category: 'productivity'
    });

    // Achievements especiais
    this.achievements.set('early_adopter', {
      id: 'early_adopter',
      name: 'Adotante Antecipado',
      description: 'Foi um dos primeiros 100 usuários',
      emoji: '🚀',
      xp: 100,
      rarity: 'legendary',
      category: 'special'
    });

    this.achievements.set('beta_tester', {
      id: 'beta_tester',
      name: 'Testador Beta',
      description: 'Testou funcionalidades beta',
      emoji: '🧪',
      xp: 80,
      rarity: 'epic',
      category: 'special'
    });

    this.achievements.set('feedback_giver', {
      id: 'feedback_giver',
      name: 'Doador de Feedback',
      description: 'Deu feedback construtivo',
      emoji: '💬',
      xp: 25,
      rarity: 'uncommon',
      category: 'special'
    });
  }

  /**
   * Inicializar recompensas de XP
   */
  initializeXPRewards() {
    this.xpRewards.set('message', 1);
    this.xpRewards.set('command', 2);
    this.xpRewards.set('natural_command', 3);
    this.xpRewards.set('image_upload', 5);
    this.xpRewards.set('audio_upload', 5);
    this.xpRewards.set('reminder_created', 3);
    this.xpRewards.set('task_completed', 2);
    this.xpRewards.set('shortcut_created', 4);
    this.xpRewards.set('menu_used', 1);
    this.xpRewards.set('tutorial_completed', 10);
    this.xpRewards.set('onboarding_completed', 15);
  }

  /**
   * Adicionar XP ao usuário
   */
  async addXP(phoneNumber, action, amount = null) {
    try {
      const userData = await userDataService.getUserData(phoneNumber);
      const currentXP = userData.xp || 0;
      const currentLevel = userData.level || 1;
      
      // Calcular XP a ser adicionado
      const xpToAdd = amount || this.xpRewards.get(action) || 1;
      const newXP = currentXP + xpToAdd;
      
      // Calcular novo nível
      const newLevel = this.calculateLevel(newXP);
      const levelUp = newLevel > currentLevel;
      
      // Atualizar dados do usuário
      await userDataService.updateUserData(phoneNumber, {
        xp: newXP,
        level: newLevel,
        lastXPAction: action,
        lastXPTime: new Date().toISOString()
      });
      
      // Verificar achievements
      const newAchievements = await this.checkAchievements(phoneNumber, action);
      
      return {
        xpAdded: xpToAdd,
        totalXP: newXP,
        level: newLevel,
        levelUp: levelUp,
        newAchievements: newAchievements
      };
      
    } catch (error) {
      ErrorUtils.logError(error, {
        phoneNumber: phoneNumber?.replace(/\d(?=\d{4})/g, '*'),
        action: action,
        operation: 'addXP'
      });
      throw error;
    }
  }

  /**
   * Calcular nível baseado no XP
   */
  calculateLevel(xp) {
    // Fórmula: nível = floor(sqrt(xp / 100)) + 1
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  }

  /**
   * Verificar achievements
   */
  async checkAchievements(phoneNumber, action) {
    try {
      const userData = await userDataService.getUserData(phoneNumber);
      const userAchievements = userData.achievements || [];
      const newAchievements = [];
      
      // Verificar cada achievement
      for (const [achievementId, achievement] of this.achievements) {
        if (userAchievements.includes(achievementId)) {
          continue; // Já conquistado
        }
        
        // Verificar se o achievement foi conquistado
        const isEarned = await this.checkAchievementEarned(phoneNumber, achievementId, action, userData);
        
        if (isEarned) {
          // Adicionar achievement
          userAchievements.push(achievementId);
          newAchievements.push(achievement);
          
          // Adicionar XP do achievement
          await this.addXP(phoneNumber, 'achievement', achievement.xp);
        }
      }
      
      // Atualizar achievements do usuário
      if (newAchievements.length > 0) {
        await userDataService.updateUserData(phoneNumber, {
          achievements: userAchievements
        });
      }
      
      return newAchievements;
      
    } catch (error) {
      ErrorUtils.logError(error, {
        phoneNumber: phoneNumber?.replace(/\d(?=\d{4})/g, '*'),
        action: action,
        operation: 'checkAchievements'
      });
      return [];
    }
  }

  /**
   * Verificar se achievement foi conquistado
   */
  async checkAchievementEarned(phoneNumber, achievementId, action, userData) {
    const achievement = this.achievements.get(achievementId);
    if (!achievement) return false;
    
    switch (achievementId) {
      case 'first_message':
        return action === 'message';
      
      case 'first_command':
        return action === 'command';
      
      case 'first_image':
        return action === 'image_upload';
      
      case 'first_audio':
        return action === 'audio_upload';
      
      case 'daily_user':
        return await this.checkDailyStreak(phoneNumber, 7);
      
      case 'weekly_user':
        return await this.checkDailyStreak(phoneNumber, 28);
      
      case 'monthly_user':
        return await this.checkDailyStreak(phoneNumber, 90);
      
      case 'command_master':
        return (userData.commandsUsed || 0) >= 10;
      
      case 'natural_speaker':
        return (userData.naturalCommandsUsed || 0) >= 20;
      
      case 'shortcut_creator':
        return (userData.shortcutsCreated || 0) >= 5;
      
      case 'reminder_master':
        return (userData.remindersCreated || 0) >= 10;
      
      case 'task_completer':
        return (userData.tasksCompleted || 0) >= 20;
      
      case 'timer_user':
        return (userData.timersUsed || 0) >= 15;
      
      default:
        return false;
    }
  }

  /**
   * Verificar sequência de dias
   */
  async checkDailyStreak(phoneNumber, requiredDays) {
    try {
      const userData = await userDataService.getUserData(phoneNumber);
      const dailyUsage = userData.dailyUsage || {};
      
      // Verificar se tem uso nos últimos N dias
      const today = new Date();
      let streak = 0;
      
      for (let i = 0; i < requiredDays; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        if (dailyUsage[dateStr]) {
          streak++;
        } else {
          break;
        }
      }
      
      return streak >= requiredDays;
      
    } catch (error) {
      logger.error('Error checking daily streak', { error: error.message, phoneNumber });
      return false;
    }
  }

  /**
   * Obter estatísticas do usuário
   */
  async getUserStats(phoneNumber) {
    try {
      const userData = await userDataService.getUserData(phoneNumber);
      const achievements = userData.achievements || [];
      
      return {
        xp: userData.xp || 0,
        level: userData.level || 1,
        achievements: achievements.length,
        totalAchievements: this.achievements.size,
        levelProgress: this.calculateLevelProgress(userData.xp || 0),
        recentAchievements: await this.getRecentAchievements(phoneNumber),
        rank: await this.getUserRank(phoneNumber)
      };
      
    } catch (error) {
      ErrorUtils.logError(error, {
        phoneNumber: phoneNumber?.replace(/\d(?=\d{4})/g, '*'),
        operation: 'getUserStats'
      });
      return null;
    }
  }

  /**
   * Calcular progresso do nível
   */
  calculateLevelProgress(xp) {
    const currentLevel = this.calculateLevel(xp);
    const currentLevelXP = Math.pow(currentLevel - 1, 2) * 100;
    const nextLevelXP = Math.pow(currentLevel, 2) * 100;
    const progress = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
    
    return Math.min(100, Math.max(0, progress));
  }

  /**
   * Obter achievements recentes
   */
  async getRecentAchievements(phoneNumber) {
    try {
      const userData = await userDataService.getUserData(phoneNumber);
      const achievements = userData.achievements || [];
      
      return achievements.slice(-3).map(achievementId => {
        const achievement = this.achievements.get(achievementId);
        return achievement ? {
          id: achievement.id,
          name: achievement.name,
          emoji: achievement.emoji,
          rarity: achievement.rarity
        } : null;
      }).filter(Boolean);
      
    } catch (error) {
      logger.error('Error getting recent achievements', { error: error.message, phoneNumber });
      return [];
    }
  }

  /**
   * Obter ranking do usuário
   */
  async getUserRank(phoneNumber) {
    try {
      // Implementar lógica de ranking baseada em XP
      // Por enquanto, retornar ranking simulado
      return {
        position: Math.floor(Math.random() * 100) + 1,
        totalUsers: 1000
      };
      
    } catch (error) {
      logger.error('Error getting user rank', { error: error.message, phoneNumber });
      return { position: 0, totalUsers: 0 };
    }
  }

  /**
   * Obter leaderboard
   */
  async getLeaderboard(limit = 10) {
    try {
      // Implementar lógica de leaderboard
      // Por enquanto, retornar leaderboard simulado
      const leaderboard = [];
      
      for (let i = 0; i < limit; i++) {
        leaderboard.push({
          position: i + 1,
          phoneNumber: `+551199999999${i}`,
          xp: 1000 - (i * 50),
          level: Math.floor(Math.sqrt((1000 - (i * 50)) / 100)) + 1
        });
      }
      
      return leaderboard;
      
    } catch (error) {
      logger.error('Error getting leaderboard', { error: error.message });
      return [];
    }
  }

  /**
   * Notificar achievement conquistado
   */
  async notifyAchievement(phoneNumber, achievement, phoneNumberId, res) {
    try {
      const message = `🎉 *Achievement Conquistado!*\n\n${achievement.emoji} *${achievement.name}*\n\n${achievement.description}\n\n*XP ganho:* +${achievement.xp}\n*Raridade:* ${achievement.rarity.toUpperCase()}`;
      
      await whatsappService.sendSplitReply(
        phoneNumberId,
        config.whatsapp.graphApiToken,
        res.locals.recipientNumber || phoneNumber,
        message,
        res
      );
      
    } catch (error) {
      logger.error('Error notifying achievement', { error: error.message, phoneNumber });
    }
  }

  /**
   * Notificar level up
   */
  async notifyLevelUp(phoneNumber, newLevel, phoneNumberId, res) {
    try {
      const message = `🎊 *Level Up!*\n\n🎉 Parabéns! Você subiu para o nível ${newLevel}!\n\n*Continue usando o bot para ganhar mais XP!*`;
      
      await whatsappService.sendSplitReply(
        phoneNumberId,
        config.whatsapp.graphApiToken,
        res.locals.recipientNumber || phoneNumber,
        message,
        res
      );
      
    } catch (error) {
      logger.error('Error notifying level up', { error: error.message, phoneNumber });
    }
  }

  /**
   * Obter recompensas por nível
   */
  getLevelRewards(level) {
    const rewards = {
      5: { name: 'Atalho Personalizado', description: 'Desbloqueou criação de atalhos' },
      10: { name: 'Temas Personalizados', description: 'Desbloqueou temas de interface' },
      15: { name: 'Comandos Avançados', description: 'Desbloqueou comandos premium' },
      20: { name: 'Estatísticas Detalhadas', description: 'Desbloqueou estatísticas avançadas' },
      25: { name: 'Suporte Prioritário', description: 'Desbloqueou suporte prioritário' }
    };
    
    return rewards[level] || null;
  }

  /**
   * Obter estatísticas gerais
   */
  getGeneralStats() {
    return {
      totalAchievements: this.achievements.size,
      totalXPRewards: this.xpRewards.size,
      achievementCategories: [...new Set(Array.from(this.achievements.values()).map(a => a.category))],
      rarityDistribution: this.getRarityDistribution()
    };
  }

  /**
   * Obter distribuição de raridade
   */
  getRarityDistribution() {
    const distribution = {};
    
    for (const achievement of this.achievements.values()) {
      distribution[achievement.rarity] = (distribution[achievement.rarity] || 0) + 1;
    }
    
    return distribution;
  }

  /**
   * Obter achievement por ID
   */
  getAchievement(achievementId) {
    return this.achievements.get(achievementId);
  }

  /**
   * Listar todos os achievements
   */
  getAllAchievements() {
    return Array.from(this.achievements.values());
  }

  /**
   * Obter achievements por categoria
   */
  getAchievementsByCategory(category) {
    return Array.from(this.achievements.values()).filter(a => a.category === category);
  }

  /**
   * Obter achievements por raridade
   */
  getAchievementsByRarity(rarity) {
    return Array.from(this.achievements.values()).filter(a => a.rarity === rarity);
  }
}

// Instância singleton
const gamificationService = new GamificationService();

export default gamificationService;

