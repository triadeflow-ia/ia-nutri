// services/naturalCommands.js
// Sistema de reconhecimento de comandos em linguagem natural

import { ErrorFactory, ErrorUtils } from '../utils/errors.js';
import logger from '../config/logger.js';
import userDataService from './userDataService.js';
import commandHandler from './commandHandler.js';
import * as whatsappService from './whatsappService.js';
import { config } from '../config/index.js';

class NaturalCommands {
  constructor() {
    this.intentPatterns = new Map();
    this.conversationalPatterns = new Map();
    this.productivityCommands = new Map();
    this.customShortcuts = new Map();
    this.userUsageStats = new Map();
    this.smartSuggestions = new Map();
    
    this.initializeIntentPatterns();
    this.initializeConversationalPatterns();
    this.initializeProductivityCommands();
    this.initializeSmartSuggestions();
  }

  /**
   * Inicializar padrões de intenções
   */
  initializeIntentPatterns() {
    // Intenções de ajuda
    this.intentPatterns.set('help', {
      patterns: [
        /me ajuda/i,
        /preciso de ajuda/i,
        /não sei como/i,
        /como funciona/i,
        /não entendi/i,
        /estou confuso/i,
        /me explica/i,
        /pode me ajudar/i,
        /socorro/i,
        /help/i
      ],
      command: '/ajuda',
      confidence: 0.9,
      context: 'help'
    });

    // Intenções de preço/planos
    this.intentPatterns.set('pricing', {
      patterns: [
        /quanto custa/i,
        /qual o preço/i,
        /quanto é/i,
        /valor/i,
        /preço/i,
        /custo/i,
        /planos/i,
        /assinatura/i,
        /premium/i,
        /pagar/i
      ],
      command: '/assinar',
      confidence: 0.85,
      context: 'pricing'
    });

    // Intenções de cancelamento
    this.intentPatterns.set('cancel', {
      patterns: [
        /cancela minha conta/i,
        /quero cancelar/i,
        /cancelar/i,
        /parar/i,
        /sair/i,
        /desistir/i,
        /não quero mais/i,
        /remover conta/i
      ],
      command: '/deletar',
      confidence: 0.9,
      context: 'cancel'
    });

    // Intenções de perfil
    this.intentPatterns.set('profile', {
      patterns: [
        /meu perfil/i,
        /minhas informações/i,
        /dados pessoais/i,
        /configurações/i,
        /preferências/i,
        /meu cadastro/i,
        /minha conta/i
      ],
      command: '/perfil',
      confidence: 0.8,
      context: 'profile'
    });

    // Intenções de contato
    this.intentPatterns.set('contact', {
      patterns: [
        /falar com humano/i,
        /atendimento/i,
        /suporte/i,
        /contato/i,
        /reclamação/i,
        /problema/i,
        /bug/i,
        /erro/i
      ],
      command: '/contato',
      confidence: 0.85,
      context: 'contact'
    });

    // Intenções de lembretes
    this.intentPatterns.set('reminder', {
      patterns: [
        /lembrete/i,
        /lembrar/i,
        /agendar/i,
        /marcar/i,
        /notificar/i,
        /aviso/i,
        /alerta/i,
        /timer/i
      ],
      command: '/lembrete',
      confidence: 0.8,
      context: 'reminder'
    });

    // Intenções de voz
    this.intentPatterns.set('voice', {
      patterns: [
        /configurar voz/i,
        /áudio/i,
        /voz/i,
        /falar/i,
        /ouvir/i,
        /microfone/i,
        /som/i
      ],
      command: '/vozconfig',
      confidence: 0.8,
      context: 'voice'
    });

    // Intenções de dados/LGPD
    this.intentPatterns.set('data', {
      patterns: [
        /meus dados/i,
        /dados pessoais/i,
        /privacidade/i,
        /lgpd/i,
        /exportar/i,
        /baixar dados/i,
        /informações pessoais/i
      ],
      command: '/exportar',
      confidence: 0.85,
      context: 'data'
    });
  }

  /**
   * Inicializar padrões conversacionais
   */
  initializeConversationalPatterns() {
    // Saudações
    this.conversationalPatterns.set('greeting', {
      patterns: [
        /bom dia/i,
        /boa tarde/i,
        /boa noite/i,
        /olá/i,
        /oi/i,
        /hey/i,
        /hi/i,
        /hello/i,
        /e aí/i,
        /salve/i
      ],
      handler: this.handleGreeting.bind(this),
      context: 'greeting'
    });

    // Agradecimentos
    this.conversationalPatterns.set('thanks', {
      patterns: [
        /obrigado/i,
        /obrigada/i,
        /valeu/i,
        /thanks/i,
        /thank you/i,
        /muito obrigado/i,
        /obrigadão/i,
        /grato/i,
        /agradecido/i
      ],
      handler: this.handleThanks.bind(this),
      context: 'thanks'
    });

    // Despedidas
    this.conversationalPatterns.set('goodbye', {
      patterns: [
        /tchau/i,
        /até logo/i,
        /até mais/i,
        /bye/i,
        /goodbye/i,
        /até breve/i,
        /nos vemos/i,
        /falou/i,
        /flw/i,
        /até/i
      ],
      handler: this.handleGoodbye.bind(this),
      context: 'goodbye'
    });

    // Elogios
    this.conversationalPatterns.set('compliment', {
      patterns: [
        /muito bom/i,
        /excelente/i,
        /ótimo/i,
        /perfeito/i,
        /incrível/i,
        /fantástico/i,
        /maravilhoso/i,
        /show/i,
        /top/i,
        /demais/i
      ],
      handler: this.handleCompliment.bind(this),
      context: 'compliment'
    });

    // Frustrações
    this.conversationalPatterns.set('frustration', {
      patterns: [
        /não funciona/i,
        /deu erro/i,
        /bugou/i,
        /travou/i,
        /lento/i,
        /demora/i,
        /chato/i,
        /irritante/i,
        /frustrante/i
      ],
      handler: this.handleFrustration.bind(this),
      context: 'frustration'
    });
  }

  /**
   * Inicializar comandos de produtividade
   */
  initializeProductivityCommands() {
    this.productivityCommands.set('agenda', {
      patterns: [/agenda/i, /hoje/i, /compromissos/i, /eventos/i],
      handler: this.handleAgenda.bind(this)
    });

    this.productivityCommands.set('resumo', {
      patterns: [/resumo/i, /resumir/i, /sumário/i, /resumir conversa/i],
      handler: this.handleResumo.bind(this)
    });

    this.productivityCommands.set('tarefas', {
      patterns: [/tarefas/i, /todos/i, /lista/i, /pendências/i, /afazeres/i],
      handler: this.handleTarefas.bind(this)
    });

    this.productivityCommands.set('timer', {
      patterns: [/timer/i, /cronômetro/i, /contador/i, /alarme/i],
      handler: this.handleTimer.bind(this)
    });
  }

  /**
   * Inicializar sugestões inteligentes
   */
  initializeSmartSuggestions() {
    this.smartSuggestions.set('time_based', {
      morning: ['/agenda', '/tarefas', '/lembrete'],
      afternoon: ['/resumo', '/tarefas', '/agenda'],
      evening: ['/resumo', '/tarefas', '/timer']
    });

    this.smartSuggestions.set('usage_based', {
      frequent: ['/ajuda', '/perfil', '/config'],
      recent: ['/lembrete', '/agenda', '/resumo']
    });
  }

  /**
   * Processar mensagem natural
   */
  async processNaturalMessage(message, phoneNumber, profileName, phoneNumberId, res) {
    try {
      const text = message.text?.body?.toLowerCase() || '';
      
      // Verificar se já é um comando estruturado
      if (text.startsWith('/') || text.startsWith('!')) {
        return { isNatural: false };
      }

      // Detectar intenções
      const intent = this.detectIntent(text);
      if (intent) {
        return await this.handleIntent(intent, message, phoneNumber, profileName, phoneNumberId, res);
      }

      // Detectar padrões conversacionais
      const conversational = this.detectConversational(text);
      if (conversational) {
        return await this.handleConversational(conversational, message, phoneNumber, profileName, phoneNumberId, res);
      }

      // Detectar comandos de produtividade
      const productivity = this.detectProductivity(text);
      if (productivity) {
        return await this.handleProductivity(productivity, message, phoneNumber, profileName, phoneNumberId, res);
      }

      // Detectar atalhos personalizados
      const shortcut = await this.detectCustomShortcut(text, phoneNumber);
      if (shortcut) {
        return await this.handleCustomShortcut(shortcut, message, phoneNumber, profileName, phoneNumberId, res);
      }

      // Sugestões inteligentes
      const suggestions = await this.getSmartSuggestions(phoneNumber, text);
      if (suggestions.length > 0) {
        return await this.handleSmartSuggestions(suggestions, message, phoneNumber, profileName, phoneNumberId, res);
      }

      return { isNatural: false };

    } catch (error) {
      ErrorUtils.logError(error, {
        phoneNumber: phoneNumber?.replace(/\d(?=\d{4})/g, '*'),
        message: text,
        operation: 'processNaturalMessage'
      });
      return { isNatural: false, error: true };
    }
  }

  /**
   * Detectar intenção na mensagem
   */
  detectIntent(text) {
    for (const [intentName, intentData] of this.intentPatterns) {
      for (const pattern of intentData.patterns) {
        if (pattern.test(text)) {
          return {
            name: intentName,
            command: intentData.command,
            confidence: intentData.confidence,
            context: intentData.context,
            matchedPattern: pattern.source
          };
        }
      }
    }
    return null;
  }

  /**
   * Detectar padrão conversacional
   */
  detectConversational(text) {
    for (const [patternName, patternData] of this.conversationalPatterns) {
      for (const pattern of patternData.patterns) {
        if (pattern.test(text)) {
          return {
            name: patternName,
            handler: patternData.handler,
            context: patternData.context,
            matchedPattern: pattern.source
          };
        }
      }
    }
    return null;
  }

  /**
   * Detectar comando de produtividade
   */
  detectProductivity(text) {
    for (const [commandName, commandData] of this.productivityCommands) {
      for (const pattern of commandData.patterns) {
        if (pattern.test(text)) {
          return {
            name: commandName,
            handler: commandData.handler,
            matchedPattern: pattern.source
          };
        }
      }
    }
    return null;
  }

  /**
   * Detectar atalho personalizado
   */
  async detectCustomShortcut(text, phoneNumber) {
    try {
      const userData = await userDataService.getUserData(phoneNumber);
      const shortcuts = userData.customShortcuts || {};
      
      for (const [shortcut, command] of Object.entries(shortcuts)) {
        if (text.includes(shortcut.toLowerCase())) {
          return {
            shortcut: shortcut,
            command: command,
            confidence: 0.9
          };
        }
      }
      return null;
    } catch (error) {
      logger.error('Error detecting custom shortcut', { error: error.message, phoneNumber });
      return null;
    }
  }

  /**
   * Obter sugestões inteligentes
   */
  async getSmartSuggestions(phoneNumber, text) {
    try {
      const suggestions = [];
      const userData = await userDataService.getUserData(phoneNumber);
      const currentHour = new Date().getHours();
      
      // Sugestões baseadas no horário
      let timeBasedSuggestions = [];
      if (currentHour >= 6 && currentHour < 12) {
        timeBasedSuggestions = this.smartSuggestions.get('time_based').morning;
      } else if (currentHour >= 12 && currentHour < 18) {
        timeBasedSuggestions = this.smartSuggestions.get('time_based').afternoon;
      } else {
        timeBasedSuggestions = this.smartSuggestions.get('time_based').evening;
      }
      
      suggestions.push(...timeBasedSuggestions);
      
      // Sugestões baseadas no uso
      const usageStats = this.userUsageStats.get(phoneNumber) || {};
      const frequentCommands = Object.entries(usageStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([cmd]) => cmd);
      
      suggestions.push(...frequentCommands);
      
      // Remover duplicatas e limitar
      return [...new Set(suggestions)].slice(0, 3);
      
    } catch (error) {
      logger.error('Error getting smart suggestions', { error: error.message, phoneNumber });
      return [];
    }
  }

  /**
   * Lidar com intenção detectada
   */
  async handleIntent(intent, message, phoneNumber, profileName, phoneNumberId, res) {
    try {
      // Registrar uso do comando
      this.recordCommandUsage(phoneNumber, intent.command);
      
      // Executar comando correspondente
      const commandMessage = { text: { body: intent.command } };
      const result = await commandHandler.processCommand(
        commandMessage, phoneNumber, profileName, phoneNumberId, res
      );
      
      if (result.isCommand) {
        // Adicionar contexto da intenção
        const contextMessage = this.getIntentContextMessage(intent);
        if (contextMessage) {
          await whatsappService.sendSplitReply(
            phoneNumberId,
            config.whatsapp.graphApiToken,
            res.locals.recipientNumber || phoneNumber,
            contextMessage,
            res
          );
        }
      }
      
      return { isNatural: true, handled: true, intent: intent.name };
    } catch (error) {
      ErrorUtils.logError(error, { error: error.message, intent: intent.name });
      return { isNatural: true, handled: false, error: true };
    }
  }

  /**
   * Obter mensagem de contexto da intenção
   */
  getIntentContextMessage(intent) {
    const contextMessages = {
      help: "💡 Detectei que você precisa de ajuda! Usei o comando /ajuda para você.",
      pricing: "💰 Detectei interesse em planos! Usei o comando /assinar para você.",
      cancel: "⚠️ Detectei que você quer cancelar! Usei o comando /deletar para você.",
      profile: "👤 Detectei interesse no seu perfil! Usei o comando /perfil para você.",
      contact: "🆘 Detectei que você precisa de suporte! Usei o comando /contato para você.",
      reminder: "⏰ Detectei interesse em lembretes! Usei o comando /lembrete para você.",
      voice: "🎤 Detectei interesse em configurações de voz! Usei o comando /vozconfig para você.",
      data: "📊 Detectei interesse nos seus dados! Usei o comando /exportar para você."
    };
    
    return contextMessages[intent.name] || null;
  }

  /**
   * Lidar com padrão conversacional
   */
  async handleConversational(conversational, message, phoneNumber, profileName, phoneNumberId, res) {
    try {
      const result = await conversational.handler(message, phoneNumber, profileName, phoneNumberId, res);
      return { isNatural: true, handled: true, type: 'conversational', pattern: conversational.name };
    } catch (error) {
      ErrorUtils.logError(error, { error: error.message, pattern: conversational.name });
      return { isNatural: true, handled: false, error: true };
    }
  }

  /**
   * Lidar com comando de produtividade
   */
  async handleProductivity(productivity, message, phoneNumber, profileName, phoneNumberId, res) {
    try {
      const result = await productivity.handler(message, phoneNumber, profileName, phoneNumberId, res);
      return { isNatural: true, handled: true, type: 'productivity', command: productivity.name };
    } catch (error) {
      ErrorUtils.logError(error, { error: error.message, command: productivity.name });
      return { isNatural: true, handled: false, error: true };
    }
  }

  /**
   * Lidar com atalho personalizado
   */
  async handleCustomShortcut(shortcut, message, phoneNumber, profileName, phoneNumberId, res) {
    try {
      // Executar comando do atalho
      const commandMessage = { text: { body: shortcut.command } };
      const result = await commandHandler.processCommand(
        commandMessage, phoneNumber, profileName, phoneNumberId, res
      );
      
      if (result.isCommand) {
        const shortcutMessage = `⚡ *Atalho executado!*\n\nDetectei "${shortcut.shortcut}" e executei: ${shortcut.command}`;
        await whatsappService.sendSplitReply(
          phoneNumberId,
          config.whatsapp.graphApiToken,
          res.locals.recipientNumber || phoneNumber,
          shortcutMessage,
          res
        );
      }
      
      return { isNatural: true, handled: true, type: 'shortcut', shortcut: shortcut.shortcut };
    } catch (error) {
      ErrorUtils.logError(error, { error: error.message, shortcut: shortcut.shortcut });
      return { isNatural: true, handled: false, error: true };
    }
  }

  /**
   * Lidar com sugestões inteligentes
   */
  async handleSmartSuggestions(suggestions, message, phoneNumber, profileName, phoneNumberId, res) {
    try {
      const suggestionsText = suggestions.map(cmd => `/${cmd}`).join(', ');
      const smartMessage = `🤖 *Sugestões Inteligentes*\n\nBaseado no seu uso e horário, você pode gostar de:\n\n${suggestionsText}\n\n*Ou continue conversando normalmente!* 😊`;
      
      await whatsappService.sendSplitReply(
        phoneNumberId,
        config.whatsapp.graphApiToken,
        res.locals.recipientNumber || phoneNumber,
        smartMessage,
        res
      );
      
      return { isNatural: true, handled: true, type: 'suggestions', suggestions: suggestions };
    } catch (error) {
      ErrorUtils.logError(error, { error: error.message, suggestions: suggestions });
      return { isNatural: true, handled: false, error: true };
    }
  }

  // ========== HANDLERS CONVERSACIONAIS ==========

  /**
   * Handler para saudação
   */
  async handleGreeting(message, phoneNumber, profileName, phoneNumberId, res) {
    const currentHour = new Date().getHours();
    let greeting = '';
    
    if (currentHour >= 6 && currentHour < 12) {
      greeting = 'Bom dia';
    } else if (currentHour >= 12 && currentHour < 18) {
      greeting = 'Boa tarde';
    } else {
      greeting = 'Boa noite';
    }
    
    const dicaDoDia = this.getDicaDoDia();
    
    const greetingMessage = `${greeting}, ${profileName}! 😊\n\n${dicaDoDia}\n\n*Como posso te ajudar hoje?*\n\n💡 *Dica:* Use comandos como /ajuda, /perfil ou /lembrete para começar!`;
    
    await whatsappService.sendSplitReply(
      phoneNumberId,
      config.whatsapp.graphApiToken,
      res.locals.recipientNumber || phoneNumber,
      greetingMessage,
      res
    );
    
    return { success: true, message: 'Greeting sent' };
  }

  /**
   * Handler para agradecimento
   */
  async handleThanks(message, phoneNumber, profileName, phoneNumberId, res) {
    const thanksResponses = [
      "De nada! Fico feliz em ajudar! 😊",
      "Por nada! Estou aqui para isso! 🤗",
      "Imagina! Sempre à disposição! 😄",
      "Que isso! Foi um prazer ajudar! 😊",
      "Disponha! Qualquer coisa é só chamar! 🤝"
    ];
    
    const randomResponse = thanksResponses[Math.floor(Math.random() * thanksResponses.length)];
    const suggestion = this.getRandomSuggestion();
    
    const thanksMessage = `${randomResponse}\n\n${suggestion}`;
    
    await whatsappService.sendSplitReply(
      phoneNumberId,
      config.whatsapp.graphApiToken,
      res.locals.recipientNumber || phoneNumber,
      thanksMessage,
      res
    );
    
    return { success: true, message: 'Thanks response sent' };
  }

  /**
   * Handler para despedida
   */
  async handleGoodbye(message, phoneNumber, profileName, phoneNumberId, res) {
    const userData = await userDataService.getUserData(phoneNumber);
    const messageCount = userData.messageCount || 0;
    const reminders = await userDataService.getUserReminders(phoneNumber);
    
    const goodbyeMessage = `Tchau, ${profileName}! 👋\n\n*Resumo do dia:*\n📊 Mensagens: ${messageCount}\n⏰ Lembretes ativos: ${reminders.length}\n\n*Até a próxima!* 😊\n\n💡 *Dica:* Use /resumo quando voltar para ver o que aconteceu!`;
    
    await whatsappService.sendSplitReply(
      phoneNumberId,
      config.whatsapp.graphApiToken,
      res.locals.recipientNumber || phoneNumber,
      goodbyeMessage,
      res
    );
    
    return { success: true, message: 'Goodbye sent' };
  }

  /**
   * Handler para elogio
   */
  async handleCompliment(message, phoneNumber, profileName, phoneNumberId, res) {
    const complimentResponses = [
      "Obrigado! Fico muito feliz que tenha gostado! 😊",
      "Que bom! Isso me motiva a melhorar ainda mais! 🤗",
      "Muito obrigado pelo feedback positivo! 😄",
      "Fico feliz em saber que estou ajudando! 😊",
      "Obrigado! Seu feedback é muito importante! 🤝"
    ];
    
    const randomResponse = complimentResponses[Math.floor(Math.random() * complimentResponses.length)];
    
    await whatsappService.sendSplitReply(
      phoneNumberId,
      config.whatsapp.graphApiToken,
      res.locals.recipientNumber || phoneNumber,
      randomResponse,
      res
    );
    
    return { success: true, message: 'Compliment response sent' };
  }

  /**
   * Handler para frustração
   */
  async handleFrustration(message, phoneNumber, profileName, phoneNumberId, res) {
    const frustrationMessage = `Entendo sua frustração! 😔\n\nVamos resolver isso juntos:\n\n🆘 *Opções de ajuda:*\n• /contato - Falar com humano\n• /ajuda - Menu de ajuda\n• /reset - Limpar contexto\n\n*Descreva melhor o problema para eu te ajudar!*`;
    
    await whatsappService.sendSplitReply(
      phoneNumberId,
      config.whatsapp.graphApiToken,
      res.locals.recipientNumber || phoneNumber,
      frustrationMessage,
      res
    );
    
    return { success: true, message: 'Frustration response sent' };
  }

  // ========== HANDLERS DE PRODUTIVIDADE ==========

  /**
   * Handler para agenda
   */
  async handleAgenda(message, phoneNumber, profileName, phoneNumberId, res) {
    const reminders = await userDataService.getUserReminders(phoneNumber);
    const today = new Date();
    const todayReminders = reminders.filter(r => {
      const reminderDate = new Date(r.scheduledTime);
      return reminderDate.toDateString() === today.toDateString();
    });
    
    let agendaMessage = `📅 *Sua Agenda de Hoje*\n\n`;
    
    if (todayReminders.length === 0) {
      agendaMessage += `✅ Nenhum compromisso agendado para hoje!\n\n*Que tal criar um lembrete?*\nUse: /lembrete 2h "reunião importante"`;
    } else {
      agendaMessage += `*Compromissos:*\n\n`;
      todayReminders.forEach((reminder, index) => {
        const time = new Date(reminder.scheduledTime).toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        agendaMessage += `${index + 1}. ${time} - ${reminder.message}\n`;
      });
      
      agendaMessage += `\n*Total:* ${todayReminders.length} compromissos`;
    }
    
    await whatsappService.sendSplitReply(
      phoneNumberId,
      config.whatsapp.graphApiToken,
      res.locals.recipientNumber || phoneNumber,
      agendaMessage,
      res
    );
    
    return { success: true, message: 'Agenda sent' };
  }

  /**
   * Handler para resumo
   */
  async handleResumo(message, phoneNumber, profileName, phoneNumberId, res) {
    const userData = await userDataService.getUserData(phoneNumber);
    const reminders = await userDataService.getUserReminders(phoneNumber);
    
    const resumoMessage = `📊 *Resumo da Conversa*\n\n*Estatísticas:*\n📱 Mensagens enviadas: ${userData.messageCount || 0}\n⏰ Lembretes ativos: ${reminders.length}\n👤 Membro desde: ${new Date(userData.createdAt).toLocaleDateString('pt-BR')}\n\n*Lembretes ativos:*\n${reminders.slice(0, 3).map((r, i) => `${i + 1}. ${r.message}`).join('\n')}\n\n*Preferências:*\n🎤 Voz: ${userData.voiceSetting || 'Desativada'}\n🔔 Notificações: ${userData.notificationsEnabled ? 'Ativas' : 'Inativas'}\n\n*Use /perfil para mais detalhes!*`;
    
    await whatsappService.sendSplitReply(
      phoneNumberId,
      config.whatsapp.graphApiToken,
      res.locals.recipientNumber || phoneNumber,
      resumoMessage,
      res
    );
    
    return { success: true, message: 'Resumo sent' };
  }

  /**
   * Handler para tarefas
   */
  async handleTarefas(message, phoneNumber, profileName, phoneNumberId, res) {
    const reminders = await userDataService.getUserReminders(phoneNumber);
    const pendingTasks = reminders.filter(r => r.status === 'active');
    
    let tarefasMessage = `📝 *Suas Tarefas*\n\n`;
    
    if (pendingTasks.length === 0) {
      tarefasMessage += `✅ Nenhuma tarefa pendente!\n\n*Que tal criar uma?*\nUse: /lembrete 30min "estudar"`;
    } else {
      tarefasMessage += `*Tarefas pendentes:*\n\n`;
      pendingTasks.forEach((task, index) => {
        const time = new Date(task.scheduledTime).toLocaleString('pt-BR');
        tarefasMessage += `${index + 1}. ${task.message}\n   ⏰ ${time}\n\n`;
      });
      
      tarefasMessage += `*Total:* ${pendingTasks.length} tarefas`;
    }
    
    await whatsappService.sendSplitReply(
      phoneNumberId,
      config.whatsapp.graphApiToken,
      res.locals.recipientNumber || phoneNumber,
      tarefasMessage,
      res
    );
    
    return { success: true, message: 'Tarefas sent' };
  }

  /**
   * Handler para timer
   */
  async handleTimer(message, phoneNumber, profileName, phoneNumberId, res) {
    const text = message.text?.body || '';
    const timeMatch = text.match(/(\d+)\s*(min|minutos?|h|horas?)/i);
    
    if (!timeMatch) {
      const timerMessage = `⏰ *Timer*\n\n*Como usar:*\n• "timer 5min" - Timer de 5 minutos\n• "timer 1h" - Timer de 1 hora\n• "alarme 30min" - Alarme de 30 minutos\n\n*Exemplo:*\n"timer 15min fazer café"`;
      
      await whatsappService.sendSplitReply(
        phoneNumberId,
        config.whatsapp.graphApiToken,
        res.locals.recipientNumber || phoneNumber,
        timerMessage,
        res
      );
      
      return { success: true, message: 'Timer instructions sent' };
    }
    
    const time = parseInt(timeMatch[1]);
    const unit = timeMatch[2].toLowerCase();
    const minutes = unit.includes('h') ? time * 60 : time;
    
    // Criar lembrete para o timer
    const timerReminder = await userDataService.createReminder(phoneNumber, {
      message: `⏰ Timer de ${time}${unit} finalizado!`,
      scheduledTime: new Date(Date.now() + minutes * 60 * 1000),
      type: 'timer'
    });
    
    const timerMessage = `⏰ *Timer Iniciado*\n\n*Duração:* ${time}${unit}\n*Finaliza em:* ${new Date(Date.now() + minutes * 60 * 1000).toLocaleTimeString('pt-BR')}\n\n*Timer configurado com sucesso!* ✅`;
    
    await whatsappService.sendSplitReply(
      phoneNumberId,
      config.whatsapp.graphApiToken,
      res.locals.recipientNumber || phoneNumber,
      timerMessage,
      res
    );
    
    return { success: true, message: 'Timer started' };
  }

  // ========== MÉTODOS AUXILIARES ==========

  /**
   * Obter dica do dia
   */
  getDicaDoDia() {
    const dicas = [
      "💡 *Dica do dia:* Use /lembrete para nunca mais esquecer algo importante!",
      "💡 *Dica do dia:* Use /agenda para ver seus compromissos de hoje!",
      "💡 *Dica do dia:* Use /resumo para ver um resumo da sua conversa!",
      "💡 *Dica do dia:* Use /vozconfig para personalizar como eu falo com você!",
      "💡 *Dica do dia:* Use /perfil para gerenciar suas informações!",
      "💡 *Dica do dia:* Use /ajuda para descobrir todos os comandos disponíveis!",
      "💡 *Dica do dia:* Use /timer para criar cronômetros personalizados!",
      "💡 *Dica do dia:* Use /tarefas para ver suas pendências!",
      "💡 *Dica do dia:* Use /contato se precisar falar com um humano!",
      "💡 *Dica do dia:* Use /sobre para saber mais sobre mim!"
    ];
    
    return dicas[Math.floor(Math.random() * dicas.length)];
  }

  /**
   * Obter sugestão aleatória
   */
  getRandomSuggestion() {
    const suggestions = [
      "💡 *Dica:* Use /lembrete para criar alertas personalizados!",
      "💡 *Dica:* Use /agenda para ver seus compromissos!",
      "💡 *Dica:* Use /resumo para ver estatísticas da conversa!",
      "💡 *Dica:* Use /perfil para gerenciar suas informações!",
      "💡 *Dica:* Use /ajuda para ver todos os comandos!",
      "💡 *Dica:* Use /timer para criar cronômetros!",
      "💡 *Dica:* Use /tarefas para ver suas pendências!",
      "💡 *Dica:* Use /vozconfig para personalizar a voz!",
      "💡 *Dica:* Use /sobre para saber mais sobre mim!",
      "💡 *Dica:* Use /contato se precisar de ajuda humana!"
    ];
    
    return suggestions[Math.floor(Math.random() * suggestions.length)];
  }

  /**
   * Registrar uso de comando
   */
  recordCommandUsage(phoneNumber, command) {
    try {
      if (!this.userUsageStats.has(phoneNumber)) {
        this.userUsageStats.set(phoneNumber, {});
      }
      
      const stats = this.userUsageStats.get(phoneNumber);
      stats[command] = (stats[command] || 0) + 1;
      
      // Manter apenas os últimos 50 comandos
      if (Object.keys(stats).length > 50) {
        const sorted = Object.entries(stats).sort(([,a], [,b]) => b - a);
        const top50 = sorted.slice(0, 50);
        this.userUsageStats.set(phoneNumber, Object.fromEntries(top50));
      }
    } catch (error) {
      logger.error('Error recording command usage', { error: error.message, phoneNumber });
    }
  }

  /**
   * Obter estatísticas de uso
   */
  getUsageStats(phoneNumber) {
    return this.userUsageStats.get(phoneNumber) || {};
  }

  /**
   * Obter estatísticas gerais
   */
  getGeneralStats() {
    return {
      totalUsers: this.userUsageStats.size,
      totalIntents: this.intentPatterns.size,
      totalConversational: this.conversationalPatterns.size,
      totalProductivity: this.productivityCommands.size
    };
  }
}

// Instância singleton
const naturalCommands = new NaturalCommands();

export default naturalCommands;

