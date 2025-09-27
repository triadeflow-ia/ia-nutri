// services/contextCommands.js
// Comandos de contexto e memória

import { ErrorFactory, ErrorUtils } from '../utils/errors.js';
import logger from '../config/logger.js';
import contextManager from './contextManager.js';
import * as whatsappService from './whatsappService.js';
import { config } from '../config/index.js';

class ContextCommands {
  constructor() {
    this.commands = new Map();
    this.initializeCommands();
  }

  /**
   * Inicializar comandos de contexto
   */
  initializeCommands() {
    // Comando /contexto
    this.commands.set('contexto', {
      name: 'contexto',
      aliases: ['context', 'memoria', 'memória'],
      description: 'Mostra o que o bot entende da conversa atual',
      category: 'contexto',
      permission: 'user',
      handler: this.handleContexto.bind(this),
      parameters: []
    });

    // Comando /esquecer
    this.commands.set('esquecer', {
      name: 'esquecer',
      aliases: ['forget', 'limpar', 'clear'],
      description: 'Limpa o contexto atual da conversa',
      category: 'contexto',
      permission: 'user',
      handler: this.handleEsquecer.bind(this),
      parameters: []
    });

    // Comando /lembrar
    this.commands.set('lembrar', {
      name: 'lembrar',
      aliases: ['remember', 'salvar', 'anotar'],
      description: 'Salva uma informação importante para lembrar',
      category: 'contexto',
      permission: 'user',
      handler: this.handleLembrar.bind(this),
      parameters: [
        { name: 'info', type: 'string', required: true, description: 'Informação para lembrar' },
        { name: 'categoria', type: 'string', optional: true, description: 'Categoria da informação' }
      ]
    });

    // Comando /minhas_notas
    this.commands.set('minhas_notas', {
      name: 'minhas_notas',
      aliases: ['notas', 'notes', 'lembretes', 'salvos'],
      description: 'Lista as informações que você pediu para lembrar',
      category: 'contexto',
      permission: 'user',
      handler: this.handleMinhasNotas.bind(this),
      parameters: [
        { name: 'categoria', type: 'string', optional: true, description: 'Filtrar por categoria' }
      ]
    });

    // Comando /perfil_contexto
    this.commands.set('perfil_contexto', {
      name: 'perfil_contexto',
      aliases: ['perfil', 'profile', 'meu_perfil'],
      description: 'Mostra seu perfil de usuário e preferências',
      category: 'contexto',
      permission: 'user',
      handler: this.handlePerfilContexto.bind(this),
      parameters: []
    });

    // Comando /sugestoes
    this.commands.set('sugestoes', {
      name: 'sugestoes',
      aliases: ['suggestions', 'dicas', 'recomendacoes'],
      description: 'Mostra sugestões personalizadas baseadas no seu perfil',
      category: 'contexto',
      permission: 'user',
      handler: this.handleSugestoes.bind(this),
      parameters: []
    });

    // Comando /privacidade
    this.commands.set('privacidade', {
      name: 'privacidade',
      aliases: ['privacy', 'dados', 'config_privacidade'],
      description: 'Configura suas preferências de privacidade',
      category: 'contexto',
      permission: 'user',
      handler: this.handlePrivacidade.bind(this),
      parameters: [
        { name: 'nivel', type: 'string', optional: true, description: 'Nível de privacidade: baixo, padrao, alto' }
      ]
    });

    // Comando /buscar
    this.commands.set('buscar', {
      name: 'buscar',
      aliases: ['search', 'procurar', 'encontrar'],
      description: 'Busca informações nas suas conversas anteriores',
      category: 'contexto',
      permission: 'user',
      handler: this.handleBuscar.bind(this),
      parameters: [
        { name: 'termo', type: 'string', required: true, description: 'Termo para buscar' }
      ]
    });

    // Comando /resumo
    this.commands.set('resumo', {
      name: 'resumo',
      aliases: ['summary', 'sumario', 'resumir'],
      description: 'Gera um resumo da conversa atual',
      category: 'contexto',
      permission: 'user',
      handler: this.handleResumo.bind(this),
      parameters: []
    });

    // Comando /estatisticas_contexto
    this.commands.set('estatisticas_contexto', {
      name: 'estatisticas_contexto',
      aliases: ['stats_contexto', 'estatisticas', 'stats'],
      description: 'Mostra estatísticas do seu uso e contexto',
      category: 'contexto',
      permission: 'user',
      handler: this.handleEstatisticasContexto.bind(this),
      parameters: []
    });
  }

  /**
   * Processar comando de contexto
   */
  async processContextCommand(command, parameters, phoneNumber, profileName, phoneNumberId, res) {
    try {
      const commandData = this.commands.get(command);
      
      if (!commandData) {
        throw ErrorFactory.createNotFoundError('Comando de contexto');
      }

      // Executar comando
      const result = await commandData.handler(parameters, phoneNumber, profileName, phoneNumberId, res);
      
      return {
        success: true,
        isCommand: true,
        result: result
      };

    } catch (error) {
      ErrorUtils.logError(error, {
        phoneNumber: phoneNumber?.replace(/\d(?=\d{4})/g, '*'),
        command: command,
        parameters: parameters,
        operation: 'processContextCommand'
      });
      
      throw error;
    }
  }

  /**
   * Comando /contexto
   */
  async handleContexto(parameters, phoneNumber, profileName, phoneNumberId, res) {
    try {
      const context = await contextManager.getCurrentContext(phoneNumber);
      
      if (!context) {
        throw ErrorFactory.createNotFoundError('Contexto da conversa');
      }

      let message = `🧠 *Contexto da Conversa*\n\n`;
      
      // Informações básicas
      message += `📊 *Informações Gerais:*\n`;
      message += `• ID da Conversa: ${context.conversationId}\n`;
      message += `• Mensagens: ${context.messageCount}\n`;
      message += `• Última Atividade: ${new Date(context.lastActivity).toLocaleString('pt-BR')}\n\n`;
      
      // Tópico atual
      if (context.currentTopic) {
        message += `🎯 *Tópico Atual:* ${context.currentTopic}\n\n`;
      }
      
      // Mensagens recentes
      if (context.recentMessages.length > 0) {
        message += `💬 *Mensagens Recentes:*\n`;
        context.recentMessages.slice(-3).forEach((msg, index) => {
          const time = new Date(msg.timestamp).toLocaleTimeString('pt-BR');
          const content = msg.content.length > 50 ? msg.content.substring(0, 50) + '...' : msg.content;
          message += `${index + 1}. [${time}] ${content}\n`;
        });
        message += `\n`;
      }
      
      // Mudanças de tópico
      if (context.topicChanges.length > 0) {
        message += `🔄 *Mudanças de Tópico:*\n`;
        context.topicChanges.slice(-2).forEach(change => {
          const time = new Date(change.timestamp).toLocaleTimeString('pt-BR');
          message += `• ${time}: ${change.fromTopic} → ${change.toTopic}\n`;
        });
        message += `\n`;
      }
      
      // Resumo da conversa
      if (context.contextSummary) {
        message += `📝 *Resumo da Conversa:*\n`;
        message += `${context.contextSummary.summary}\n\n`;
      }
      
      // Perfil do usuário
      if (context.userProfile) {
        message += `👤 *Seu Perfil:*\n`;
        message += `• Interesses: ${context.userProfile.interests.join(', ') || 'Nenhum'}\n`;
        message += `• Comunicação: ${context.userProfile.communicationPatterns.polite ? 'Educada' : 'Informal'}\n`;
        message += `• Preferências: ${context.userProfile.preferences.communication}\n`;
      }
      
      message += `\n*Use /esquecer para limpar o contexto atual*`;

      await whatsappService.sendSplitReply(
        phoneNumberId,
        config.whatsapp.graphApiToken,
        res.locals.recipientNumber || phoneNumber,
        message,
        res
      );

      return { success: true, message: 'Contexto mostrado' };

    } catch (error) {
      ErrorUtils.logError(error, { phoneNumber, operation: 'handleContexto' });
      throw error;
    }
  }

  /**
   * Comando /esquecer
   */
  async handleEsquecer(parameters, phoneNumber, profileName, phoneNumberId, res) {
    try {
      const result = await contextManager.clearContext(phoneNumber);
      
      let message = `🧹 *Contexto Limpo!*\n\n`;
      message += `✅ O contexto da conversa foi limpo com sucesso.\n`;
      message += `🆕 Nova conversa iniciada: ${result.conversationId}\n\n`;
      message += `*Agora posso começar do zero!* 🚀`;

      await whatsappService.sendSplitReply(
        phoneNumberId,
        config.whatsapp.graphApiToken,
        res.locals.recipientNumber || phoneNumber,
        message,
        res
      );

      return { success: true, message: 'Contexto limpo' };

    } catch (error) {
      ErrorUtils.logError(error, { phoneNumber, operation: 'handleEsquecer' });
      throw error;
    }
  }

  /**
   * Comando /lembrar
   */
  async handleLembrar(parameters, phoneNumber, profileName, phoneNumberId, res) {
    try {
      const info = parameters[0];
      const category = parameters[1] || 'general';
      
      if (!info) {
        throw ErrorFactory.createValidationError(
          'Informação obrigatória',
          'info',
          'Digite a informação que deseja lembrar'
        );
      }

      const result = await contextManager.saveImportantInfo(phoneNumber, info, category);
      
      let message = `💾 *Informação Salva!*\n\n`;
      message += `✅ Salvei: "${info}"\n`;
      message += `📁 Categoria: ${category}\n`;
      message += `🆔 ID: ${result.infoId}\n\n`;
      message += `*Use /minhas_notas para ver todas as informações salvas*`;

      await whatsappService.sendSplitReply(
        phoneNumberId,
        config.whatsapp.graphApiToken,
        res.locals.recipientNumber || phoneNumber,
        message,
        res
      );

      return { success: true, message: 'Informação salva' };

    } catch (error) {
      ErrorUtils.logError(error, { phoneNumber, operation: 'handleLembrar' });
      throw error;
    }
  }

  /**
   * Comando /minhas_notas
   */
  async handleMinhasNotas(parameters, phoneNumber, profileName, phoneNumberId, res) {
    try {
      const category = parameters[0];
      const result = await contextManager.getImportantInfo(phoneNumber, category);
      
      let message = `📝 *Suas Notas Salvas*\n\n`;
      
      if (result.count === 0) {
        message += `📭 Nenhuma informação salva ainda.\n\n`;
        message += `*Use /lembrar "informação" para salvar algo importante*`;
      } else {
        message += `📊 Total: ${result.count} informações\n\n`;
        
        if (category) {
          message += `📁 Categoria: ${category}\n\n`;
        }
        
        message += `*Informações salvas:*\n\n`;
        
        result.info.slice(0, 10).forEach((item, index) => {
          const time = new Date(item.timestamp).toLocaleString('pt-BR');
          message += `${index + 1}. [${time}] ${item.content}\n`;
          message += `   📁 ${item.category} | 🆔 ${item.id}\n\n`;
        });
        
        if (result.count > 10) {
          message += `... e mais ${result.count - 10} informações\n\n`;
        }
        
        message += `*Use /lembrar "nova info" para adicionar mais*`;
      }

      await whatsappService.sendSplitReply(
        phoneNumberId,
        config.whatsapp.graphApiToken,
        res.locals.recipientNumber || phoneNumber,
        message,
        res
      );

      return { success: true, message: 'Notas mostradas' };

    } catch (error) {
      ErrorUtils.logError(error, { phoneNumber, operation: 'handleMinhasNotas' });
      throw error;
    }
  }

  /**
   * Comando /perfil_contexto
   */
  async handlePerfilContexto(parameters, phoneNumber, profileName, phoneNumberId, res) {
    try {
      const context = await contextManager.getCurrentContext(phoneNumber);
      
      if (!context || !context.userProfile) {
        throw ErrorFactory.createNotFoundError('Perfil do usuário');
      }

      const profile = context.userProfile;
      
      let message = `👤 *Seu Perfil de Usuário*\n\n`;
      
      // Informações básicas
      message += `📊 *Estatísticas de Uso:*\n`;
      message += `• Total de mensagens: ${profile.usageStats?.totalMessages || 0}\n`;
      message += `• Interesses: ${profile.interests.join(', ') || 'Nenhum'}\n`;
      message += `• Padrão de comunicação: ${profile.communicationPatterns.polite ? 'Educada' : 'Informal'}\n\n`;
      
      // Preferências
      message += `⚙️ *Preferências:*\n`;
      message += `• Comunicação: ${profile.preferences.communication}\n`;
      message += `• Privacidade: ${profile.preferences.privacy}\n`;
      message += `• Notificações: ${profile.preferences.notifications ? 'Ativas' : 'Inativas'}\n`;
      message += `• Idioma: ${profile.preferences.language}\n\n`;
      
      // Padrões de uso
      if (profile.usageStats?.hourlyUsage) {
        const hourlyUsage = profile.usageStats.hourlyUsage;
        const peakHour = Object.keys(hourlyUsage).reduce((a, b) => 
          hourlyUsage[a] > hourlyUsage[b] ? a : b
        );
        message += `🕐 *Horário de Pico:* ${peakHour}:00\n\n`;
      }
      
      // Tópicos favoritos
      if (profile.usageStats?.favoriteTopics?.length > 0) {
        message += `⭐ *Tópicos Favoritos:*\n`;
        profile.usageStats.favoriteTopics.forEach(topic => {
          message += `• ${topic}\n`;
        });
        message += `\n`;
      }
      
      message += `*Use /sugestoes para ver recomendações personalizadas*`;

      await whatsappService.sendSplitReply(
        phoneNumberId,
        config.whatsapp.graphApiToken,
        res.locals.recipientNumber || phoneNumber,
        message,
        res
      );

      return { success: true, message: 'Perfil mostrado' };

    } catch (error) {
      ErrorUtils.logError(error, { phoneNumber, operation: 'handlePerfilContexto' });
      throw error;
    }
  }

  /**
   * Comando /sugestoes
   */
  async handleSugestoes(parameters, phoneNumber, profileName, phoneNumberId, res) {
    try {
      const result = await contextManager.getPersonalizedSuggestions(phoneNumber);
      
      let message = `💡 *Sugestões Personalizadas*\n\n`;
      
      if (result.count === 0) {
        message += `📭 Nenhuma sugestão disponível no momento.\n\n`;
        message += `*Continue usando o bot para receber sugestões personalizadas!*`;
      } else {
        message += `🎯 Baseado no seu perfil e uso:\n\n`;
        
        result.suggestions.forEach((suggestion, index) => {
          const emoji = this.getSuggestionEmoji(suggestion.type);
          message += `${emoji} *${suggestion.content}*\n\n`;
        });
        
        message += `*Use os comandos sugeridos para uma experiência personalizada!*`;
      }

      await whatsappService.sendSplitReply(
        phoneNumberId,
        config.whatsapp.graphApiToken,
        res.locals.recipientNumber || phoneNumber,
        message,
        res
      );

      return { success: true, message: 'Sugestões mostradas' };

    } catch (error) {
      ErrorUtils.logError(error, { phoneNumber, operation: 'handleSugestoes' });
      throw error;
    }
  }

  /**
   * Comando /privacidade
   */
  async handlePrivacidade(parameters, phoneNumber, profileName, phoneNumberId, res) {
    try {
      const nivel = parameters[0];
      
      if (!nivel) {
        // Mostrar configurações atuais
        const context = await contextManager.getCurrentContext(phoneNumber);
        const currentPrivacy = context?.userProfile?.preferences?.privacy || 'standard';
        
        let message = `🔒 *Configurações de Privacidade*\n\n`;
        message += `📊 *Nível Atual:* ${currentPrivacy}\n\n`;
        message += `⚙️ *Opções Disponíveis:*\n`;
        message += `• baixo - Menos privacidade, mais personalização\n`;
        message += `• padrao - Privacidade equilibrada\n`;
        message += `• alto - Máxima privacidade\n\n`;
        message += `*Use /privacidade [nivel] para alterar*`;
        
        await whatsappService.sendSplitReply(
          phoneNumberId,
          config.whatsapp.graphApiToken,
          res.locals.recipientNumber || phoneNumber,
          message,
          res
        );
        
        return { success: true, message: 'Configurações de privacidade mostradas' };
      }
      
      // Validar nível
      const validLevels = ['baixo', 'padrao', 'alto'];
      if (!validLevels.includes(nivel.toLowerCase())) {
        throw ErrorFactory.createValidationError(
          'Nível inválido',
          'nivel',
          'Use: baixo, padrao ou alto'
        );
      }
      
      // Atualizar configurações
      const settings = {
        privacy: nivel.toLowerCase(),
        dataRetention: nivel === 'alto' ? 7 : nivel === 'padrao' ? 30 : 90,
        learningEnabled: nivel !== 'alto',
        profileSharing: nivel === 'baixo'
      };
      
      const result = await contextManager.setPrivacySettings(phoneNumber, settings);
      
      let message = `🔒 *Privacidade Atualizada!*\n\n`;
      message += `✅ Nível: ${nivel}\n`;
      message += `📊 Retenção de dados: ${settings.dataRetention} dias\n`;
      message += `🧠 Aprendizado: ${settings.learningEnabled ? 'Ativo' : 'Inativo'}\n`;
      message += `📤 Compartilhamento: ${settings.profileSharing ? 'Ativo' : 'Inativo'}\n\n`;
      message += `*Suas preferências foram salvas com sucesso!*`;

      await whatsappService.sendSplitReply(
        phoneNumberId,
        config.whatsapp.graphApiToken,
        res.locals.recipientNumber || phoneNumber,
        message,
        res
      );

      return { success: true, message: 'Privacidade atualizada' };

    } catch (error) {
      ErrorUtils.logError(error, { phoneNumber, operation: 'handlePrivacidade' });
      throw error;
    }
  }

  /**
   * Comando /buscar
   */
  async handleBuscar(parameters, phoneNumber, profileName, phoneNumberId, res) {
    try {
      const termo = parameters[0];
      
      if (!termo) {
        throw ErrorFactory.createValidationError(
          'Termo de busca obrigatório',
          'termo',
          'Digite o que deseja buscar'
        );
      }

      const result = await contextManager.findSmartReferences(phoneNumber, termo);
      
      let message = `🔍 *Resultados da Busca*\n\n`;
      message += `🔎 Termo: "${termo}"\n`;
      message += `📊 Encontrados: ${result.count} resultados\n\n`;
      
      if (result.count === 0) {
        message += `📭 Nenhum resultado encontrado.\n\n`;
        message += `*Tente usar termos diferentes ou verifique se há informações salvas*`;
      } else {
        message += `*Resultados encontrados:*\n\n`;
        
        result.references.forEach((ref, index) => {
          const time = new Date(ref.timestamp).toLocaleString('pt-BR');
          const confidence = Math.round(ref.confidence * 100);
          message += `${index + 1}. [${time}] ${ref.content}\n`;
          message += `   🎯 Confiança: ${confidence}% | Tipo: ${ref.type}\n\n`;
        });
        
        if (result.count > 5) {
          message += `... e mais ${result.count - 5} resultados\n\n`;
        }
      }

      await whatsappService.sendSplitReply(
        phoneNumberId,
        config.whatsapp.graphApiToken,
        res.locals.recipientNumber || phoneNumber,
        message,
        res
      );

      return { success: true, message: 'Busca realizada' };

    } catch (error) {
      ErrorUtils.logError(error, { phoneNumber, operation: 'handleBuscar' });
      throw error;
    }
  }

  /**
   * Comando /resumo
   */
  async handleResumo(parameters, phoneNumber, profileName, phoneNumberId, res) {
    try {
      const context = await contextManager.getCurrentContext(phoneNumber);
      
      if (!context) {
        throw ErrorFactory.createNotFoundError('Contexto da conversa');
      }

      let message = `📝 *Resumo da Conversa*\n\n`;
      
      // Informações básicas
      message += `📊 *Estatísticas:*\n`;
      message += `• ID: ${context.conversationId}\n`;
      message += `• Mensagens: ${context.messageCount}\n`;
      message += `• Duração: ${this.calculateConversationDuration(context)}\n\n`;
      
      // Resumo da conversa
      if (context.contextSummary) {
        message += `📋 *Resumo:*\n`;
        message += `${context.contextSummary.summary}\n\n`;
      } else {
        message += `📋 *Resumo:*\n`;
        message += `Conversa em andamento com ${context.messageCount} mensagens.\n\n`;
      }
      
      // Tópicos discutidos
      if (context.topicChanges.length > 0) {
        message += `🎯 *Tópicos Discutidos:*\n`;
        const topics = [...new Set(context.topicChanges.map(tc => tc.toTopic))];
        topics.forEach(topic => {
          message += `• ${topic}\n`;
        });
        message += `\n`;
      }
      
      // Próximos passos
      message += `🚀 *Próximos Passos:*\n`;
      message += `• Continue a conversa normalmente\n`;
      message += `• Use /contexto para ver detalhes\n`;
      message += `• Use /esquecer para limpar o contexto\n`;

      await whatsappService.sendSplitReply(
        phoneNumberId,
        config.whatsapp.graphApiToken,
        res.locals.recipientNumber || phoneNumber,
        message,
        res
      );

      return { success: true, message: 'Resumo gerado' };

    } catch (error) {
      ErrorUtils.logError(error, { phoneNumber, operation: 'handleResumo' });
      throw error;
    }
  }

  /**
   * Comando /estatisticas_contexto
   */
  async handleEstatisticasContexto(parameters, phoneNumber, profileName, phoneNumberId, res) {
    try {
      const context = await contextManager.getCurrentContext(phoneNumber);
      const stats = contextManager.getContextStats();
      
      let message = `📊 *Estatísticas de Contexto*\n\n`;
      
      // Estatísticas pessoais
      if (context) {
        message += `👤 *Suas Estatísticas:*\n`;
        message += `• Mensagens na conversa: ${context.messageCount}\n`;
        message += `• Interesses: ${context.userProfile?.interests?.length || 0}\n`;
        message += `• Mudanças de tópico: ${context.topicChanges?.length || 0}\n\n`;
      }
      
      // Estatísticas gerais
      message += `🌐 *Estatísticas Gerais:*\n`;
      message += `• Usuários ativos: ${stats.activeUsers}\n`;
      message += `• Total de perfis: ${stats.totalProfiles}\n`;
      message += `• Mensagens em memória: ${stats.memoryUsage.shortTerm}\n`;
      message += `• Mensagens arquivadas: ${stats.memoryUsage.longTerm}\n`;
      message += `• Mudanças de tópico: ${stats.topicChanges}\n`;
      message += `• Conversas resumidas: ${stats.conversationsSummarized}\n\n`;
      
      message += `*Use /contexto para ver seu contexto atual*`;

      await whatsappService.sendSplitReply(
        phoneNumberId,
        config.whatsapp.graphApiToken,
        res.locals.recipientNumber || phoneNumber,
        message,
        res
      );

      return { success: true, message: 'Estatísticas mostradas' };

    } catch (error) {
      ErrorUtils.logError(error, { phoneNumber, operation: 'handleEstatisticasContexto' });
      throw error;
    }
  }

  /**
   * Obter emoji para tipo de sugestão
   */
  getSuggestionEmoji(type) {
    const emojis = {
      nutrition: '🍎',
      exercise: '💪',
      productivity: '⏰',
      advanced: '⚡',
      morning: '🌅',
      evening: '🌙',
      general: '💡'
    };
    
    return emojis[type] || '💡';
  }

  /**
   * Calcular duração da conversa
   */
  calculateConversationDuration(context) {
    if (!context.recentMessages || context.recentMessages.length === 0) {
      return 'N/A';
    }
    
    const firstMessage = context.recentMessages[0];
    const lastMessage = context.recentMessages[context.recentMessages.length - 1];
    
    const startTime = new Date(firstMessage.timestamp);
    const endTime = new Date(lastMessage.timestamp);
    const duration = endTime - startTime;
    
    const minutes = Math.floor(duration / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}min`;
    } else {
      return `${minutes}min`;
    }
  }

  /**
   * Obter todos os comandos de contexto
   */
  getAllCommands() {
    return Array.from(this.commands.values());
  }

  /**
   * Obter comando por nome
   */
  getCommand(commandName) {
    return this.commands.get(commandName);
  }

  /**
   * Verificar se é comando de contexto
   */
  isContextCommand(command) {
    return this.commands.has(command);
  }
}

// Instância singleton
const contextCommands = new ContextCommands();

export default contextCommands;

