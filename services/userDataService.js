// services/userDataService.js
// Serviço para gerenciar dados do usuário

import * as redisService from './redisService.js';
import logger from '../config/logger.js';

class UserDataService {
  constructor() {
    this.userDataPrefix = 'user_data:';
    this.reminderPrefix = 'reminder:';
  }

  /**
   * Obter dados do usuário
   */
  async getUserData(phoneNumber) {
    try {
      const key = `${this.userDataPrefix}${phoneNumber}`;
      const data = await redisService.get(key);
      return data ? JSON.parse(data) : this.getDefaultUserData(phoneNumber);
    } catch (error) {
      logger.error('Error getting user data', { error: error.message, phoneNumber });
      return this.getDefaultUserData(phoneNumber);
    }
  }

  /**
   * Salvar dados do usuário
   */
  async saveUserData(phoneNumber, userData) {
    try {
      const key = `${this.userDataPrefix}${phoneNumber}`;
      const data = {
        ...userData,
        phoneNumber,
        updatedAt: new Date().toISOString()
      };
      
      await redisService.set(key, JSON.stringify(data));
      logger.info('User data saved', { phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*') });
      return data;
    } catch (error) {
      logger.error('Error saving user data', { error: error.message, phoneNumber });
      throw error;
    }
  }

  /**
   * Atualizar dados específicos do usuário
   */
  async updateUserData(phoneNumber, updates) {
    try {
      const currentData = await this.getUserData(phoneNumber);
      const updatedData = {
        ...currentData,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      return await this.saveUserData(phoneNumber, updatedData);
    } catch (error) {
      logger.error('Error updating user data', { error: error.message, phoneNumber });
      throw error;
    }
  }

  /**
   * Incrementar contador de mensagens
   */
  async incrementMessageCount(phoneNumber) {
    try {
      const userData = await this.getUserData(phoneNumber);
      userData.messageCount = (userData.messageCount || 0) + 1;
      userData.lastMessageAt = new Date().toISOString();
      
      await this.saveUserData(phoneNumber, userData);
      return userData.messageCount;
    } catch (error) {
      logger.error('Error incrementing message count', { error: error.message, phoneNumber });
    }
  }

  /**
   * Obter dados padrão do usuário
   */
  getDefaultUserData(phoneNumber) {
    return {
      phoneNumber,
      createdAt: new Date().toISOString(),
      messageCount: 0,
      voiceEnabled: false,
      voiceSetting: 'Desativada',
      remindersEnabled: true,
      notificationsEnabled: true,
      privacyLevel: 'normal',
      preferences: {
        language: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        theme: 'light'
      },
      reminders: [],
      lastMessageAt: null,
      isActive: true
    };
  }

  /**
   * Criar lembrete
   */
  async createReminder(phoneNumber, reminderData) {
    try {
      const reminder = {
        id: `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        phoneNumber,
        message: reminderData.message,
        scheduledTime: reminderData.scheduledTime,
        createdAt: new Date().toISOString(),
        status: 'active',
        type: reminderData.type || 'general'
      };

      const key = `${this.reminderPrefix}${reminder.id}`;
      await redisService.set(key, JSON.stringify(reminder));
      
      // Adicionar ao array de lembretes do usuário
      const userData = await this.getUserData(phoneNumber);
      userData.reminders = userData.reminders || [];
      userData.reminders.push(reminder.id);
      await this.saveUserData(phoneNumber, userData);

      logger.info('Reminder created', { 
        reminderId: reminder.id, 
        phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*') 
      });
      
      return reminder;
    } catch (error) {
      logger.error('Error creating reminder', { error: error.message, phoneNumber });
      throw error;
    }
  }

  /**
   * Obter lembretes do usuário
   */
  async getUserReminders(phoneNumber) {
    try {
      const userData = await this.getUserData(phoneNumber);
      const reminders = [];
      
      for (const reminderId of userData.reminders || []) {
        const key = `${this.reminderPrefix}${reminderId}`;
        const reminderData = await redisService.get(key);
        if (reminderData) {
          reminders.push(JSON.parse(reminderData));
        }
      }
      
      return reminders.filter(r => r.status === 'active');
    } catch (error) {
      logger.error('Error getting user reminders', { error: error.message, phoneNumber });
      return [];
    }
  }

  /**
   * Cancelar lembrete
   */
  async cancelReminder(phoneNumber, reminderId) {
    try {
      const key = `${this.reminderPrefix}${reminderId}`;
      const reminderData = await redisService.get(key);
      
      if (reminderData) {
        const reminder = JSON.parse(reminderData);
        reminder.status = 'cancelled';
        await redisService.set(key, JSON.stringify(reminder));
        
        logger.info('Reminder cancelled', { 
          reminderId, 
          phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*') 
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Error cancelling reminder', { error: error.message, phoneNumber, reminderId });
      return false;
    }
  }

  /**
   * Exportar dados do usuário
   */
  async exportUserData(phoneNumber) {
    try {
      const userData = await this.getUserData(phoneNumber);
      const reminders = await this.getUserReminders(phoneNumber);
      
      const exportData = {
        user: {
          phoneNumber: userData.phoneNumber,
          createdAt: userData.createdAt,
          messageCount: userData.messageCount,
          preferences: userData.preferences,
          lastMessageAt: userData.lastMessageAt
        },
        reminders: reminders.map(r => ({
          id: r.id,
          message: r.message,
          scheduledTime: r.scheduledTime,
          createdAt: r.createdAt,
          type: r.type
        })),
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      return exportData;
    } catch (error) {
      logger.error('Error exporting user data', { error: error.message, phoneNumber });
      throw error;
    }
  }

  /**
   * Deletar todos os dados do usuário
   */
  async deleteUserData(phoneNumber) {
    try {
      // Deletar dados do usuário
      const userKey = `${this.userDataPrefix}${phoneNumber}`;
      await redisService.del(userKey);
      
      // Deletar lembretes
      const userData = await this.getUserData(phoneNumber);
      for (const reminderId of userData.reminders || []) {
        const reminderKey = `${this.reminderPrefix}${reminderId}`;
        await redisService.del(reminderKey);
      }
      
      // Deletar thread de conversa
      await redisService.deleteThreadId(phoneNumber);
      
      logger.info('User data deleted', { 
        phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*') 
      });
      
      return true;
    } catch (error) {
      logger.error('Error deleting user data', { error: error.message, phoneNumber });
      throw error;
    }
  }

  /**
   * Obter estatísticas do usuário
   */
  async getUserStats(phoneNumber) {
    try {
      const userData = await this.getUserData(phoneNumber);
      const reminders = await this.getUserReminders(phoneNumber);
      
      return {
        phoneNumber: userData.phoneNumber,
        memberSince: userData.createdAt,
        messageCount: userData.messageCount,
        activeReminders: reminders.length,
        voiceEnabled: userData.voiceEnabled,
        lastMessageAt: userData.lastMessageAt,
        preferences: userData.preferences
      };
    } catch (error) {
      logger.error('Error getting user stats', { error: error.message, phoneNumber });
      return null;
    }
  }

  /**
   * Atualizar preferências do usuário
   */
  async updateUserPreferences(phoneNumber, preferences) {
    try {
      const userData = await this.getUserData(phoneNumber);
      userData.preferences = {
        ...userData.preferences,
        ...preferences
      };
      
      await this.saveUserData(phoneNumber, userData);
      return userData.preferences;
    } catch (error) {
      logger.error('Error updating user preferences', { error: error.message, phoneNumber });
      throw error;
    }
  }

  /**
   * Configurar voz
   */
  async configureVoice(phoneNumber, voiceSetting) {
    try {
      const validSettings = ['Ativada', 'Desativada', 'Apenas para áudios', 'Sempre', 'Em horários'];
      
      if (!validSettings.includes(voiceSetting)) {
        throw new Error('Configuração de voz inválida');
      }
      
      const updates = {
        voiceSetting: voiceSetting,
        voiceEnabled: voiceSetting !== 'Desativada'
      };
      
      return await this.updateUserData(phoneNumber, updates);
    } catch (error) {
      logger.error('Error configuring voice', { error: error.message, phoneNumber });
      throw error;
    }
  }

  /**
   * Obter todos os usuários ativos
   */
  async getActiveUsers() {
    try {
      const pattern = `${this.userDataPrefix}*`;
      const keys = await redisService.keys(pattern);
      const users = [];
      
      for (const key of keys) {
        const data = await redisService.get(key);
        if (data) {
          const userData = JSON.parse(data);
          if (userData.isActive) {
            users.push({
              phoneNumber: userData.phoneNumber,
              messageCount: userData.messageCount,
              lastMessageAt: userData.lastMessageAt,
              createdAt: userData.createdAt
            });
          }
        }
      }
      
      return users;
    } catch (error) {
      logger.error('Error getting active users', { error: error.message });
      return [];
    }
  }
}

// Instância singleton
const userDataService = new UserDataService();

export default userDataService;

