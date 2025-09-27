// services/commandHandler.js
// Sistema completo de comandos para o bot

import { ErrorFactory, ErrorUtils } from '../utils/errors.js';
import logger from '../config/logger.js';
import * as redisService from './redisService.js';
import * as whatsappService from './whatsappService.js';
import userDataService from './userDataService.js';
import shortcutService from './shortcutService.js';
import { config } from '../config/index.js';

class CommandHandler {
  constructor() {
    this.commands = new Map();
    this.aliases = new Map();
    this.permissions = new Map();
    this.contextualSuggestions = new Map();
    this.helpCategories = new Map();
    
    this.initializeCommands();
    this.initializeAliases();
    this.initializePermissions();
    this.initializeContextualSuggestions();
    this.initializeHelpCategories();
  }

  /**
   * Inicializar comandos essenciais
   */
  initializeCommands() {
    // Comando /start ou /inicio
    this.commands.set('start', {
      name: 'start',
      aliases: ['inicio', 'começar', 'comecar'],
      description: 'Iniciar o bot e fazer onboarding',
      category: 'geral',
      permission: 'user',
      handler: this.handleStart.bind(this),
      parameters: []
    });

    // Comando /ajuda
    this.commands.set('ajuda', {
      name: 'ajuda',
      aliases: ['help', '?', 'socorro'],
      description: 'Mostrar menu de ajuda',
      category: 'geral',
      permission: 'user',
      handler: this.handleHelp.bind(this),
      parameters: [
        { name: 'categoria', type: 'string', optional: true, description: 'Categoria específica de ajuda' }
      ]
    });

    // Comando /comandos
    this.commands.set('comandos', {
      name: 'comandos',
      aliases: ['commands', 'lista'],
      description: 'Listar todos os comandos disponíveis',
      category: 'geral',
      permission: 'user',
      handler: this.handleCommands.bind(this),
      parameters: []
    });

    // Comando /perfil
    this.commands.set('perfil', {
      name: 'perfil',
      aliases: ['profile', 'me'],
      description: 'Mostrar e editar informações do usuário',
      category: 'usuario',
      permission: 'user',
      handler: this.handleProfile.bind(this),
      parameters: [
        { name: 'acao', type: 'string', optional: true, description: 'Ação: ver, editar, configurar' }
      ]
    });

    // Comando /config
    this.commands.set('config', {
      name: 'config',
      aliases: ['configurar', 'settings'],
      description: 'Configurações pessoais',
      category: 'usuario',
      permission: 'user',
      handler: this.handleConfig.bind(this),
      parameters: [
        { name: 'opcao', type: 'string', optional: true, description: 'Opção de configuração' }
      ]
    });

    // Comando /sobre
    this.commands.set('sobre', {
      name: 'sobre',
      aliases: ['about', 'info'],
      description: 'Informações sobre o bot',
      category: 'geral',
      permission: 'user',
      handler: this.handleAbout.bind(this),
      parameters: []
    });

    // Comando /contato
    this.commands.set('contato', {
      name: 'contato',
      aliases: ['contact', 'suporte', 'support'],
      description: 'Falar com um humano',
      category: 'suporte',
      permission: 'user',
      handler: this.handleContact.bind(this),
      parameters: []
    });

    // Comando /reset
    this.commands.set('reset', {
      name: 'reset',
      aliases: ['limpar', 'clear'],
      description: 'Limpar contexto da conversa',
      category: 'usuario',
      permission: 'user',
      handler: this.handleReset.bind(this),
      parameters: []
    });

    // Comando /exportar
    this.commands.set('exportar', {
      name: 'exportar',
      aliases: ['export', 'dados'],
      description: 'Baixar dados do usuário (LGPD)',
      category: 'usuario',
      permission: 'user',
      handler: this.handleExport.bind(this),
      parameters: []
    });

    // Comando /deletar
    this.commands.set('deletar', {
      name: 'deletar',
      aliases: ['delete', 'apagar'],
      description: 'Apagar todos os dados (LGPD)',
      category: 'usuario',
      permission: 'user',
      handler: this.handleDelete.bind(this),
      parameters: []
    });

    // Comando /lembrete
    this.commands.set('lembrete', {
      name: 'lembrete',
      aliases: ['reminder', 'lembrar'],
      description: 'Criar lembrete',
      category: 'produtividade',
      permission: 'user',
      handler: this.handleReminder.bind(this),
      parameters: [
        { name: 'tempo', type: 'string', required: true, description: 'Tempo do lembrete (ex: 10min, 1h, 2d)' },
        { name: 'mensagem', type: 'string', required: true, description: 'Mensagem do lembrete' }
      ]
    });

    // Comando /assinar
    this.commands.set('assinar', {
      name: 'assinar',
      aliases: ['subscribe', 'premium', 'pagar'],
      description: 'Assinar plano premium',
      category: 'financeiro',
      permission: 'user',
      handler: this.handleSubscribe.bind(this),
      parameters: []
    });

    // Comando /vozconfig
    this.commands.set('vozconfig', {
      name: 'vozconfig',
      aliases: ['voiceconfig', 'voz'],
      description: 'Configurar preferências de voz',
      category: 'audio',
      permission: 'user',
      handler: this.handleVoiceConfig.bind(this),
      parameters: []
    });

    // Comando /atalho
    this.commands.set('atalho', {
      name: 'atalho',
      aliases: ['shortcut', 'atalhos'],
      description: 'Gerenciar atalhos personalizados',
      category: 'produtividade',
      permission: 'user',
      handler: this.handleShortcut.bind(this),
      parameters: [
        { name: 'acao', type: 'string', required: true, description: 'Ação: add, edit, remove, list, search, share, stats, help' },
        { name: 'param1', type: 'string', optional: true, description: 'Primeiro parâmetro' },
        { name: 'param2', type: 'string', optional: true, description: 'Segundo parâmetro' }
      ]
    });

    // Comando /agenda
    this.commands.set('agenda', {
      name: 'agenda',
      aliases: ['hoje', 'compromissos'],
      description: 'Mostrar agenda do dia',
      category: 'produtividade',
      permission: 'user',
      handler: this.handleAgenda.bind(this),
      parameters: []
    });

    // Comando /resumo
    this.commands.set('resumo', {
      name: 'resumo',
      aliases: ['resumir', 'sumário'],
      description: 'Resumo da conversa e estatísticas',
      category: 'produtividade',
      permission: 'user',
      handler: this.handleResumo.bind(this),
      parameters: []
    });

    // Comando /tarefas
    this.commands.set('tarefas', {
      name: 'tarefas',
      aliases: ['todos', 'lista', 'pendências'],
      description: 'Listar tarefas pendentes',
      category: 'produtividade',
      permission: 'user',
      handler: this.handleTarefas.bind(this),
      parameters: []
    });

    // Comando /timer
    this.commands.set('timer', {
      name: 'timer',
      aliases: ['cronômetro', 'alarme'],
      description: 'Criar timer personalizado',
      category: 'produtividade',
      permission: 'user',
      handler: this.handleTimer.bind(this),
      parameters: [
        { name: 'tempo', type: 'string', optional: true, description: 'Tempo do timer (ex: 15min, 1h)' },
        { name: 'descrição', type: 'string', optional: true, description: 'Descrição do timer' }
      ]
    });
  }

  /**
   * Inicializar aliases
   */
  initializeAliases() {
    for (const [name, command] of this.commands) {
      for (const alias of command.aliases) {
        this.aliases.set(alias, name);
      }
    }
  }

  /**
   * Inicializar permissões
   */
  initializePermissions() {
    this.permissions.set('user', ['start', 'ajuda', 'comandos', 'perfil', 'config', 'sobre', 'contato', 'reset', 'exportar', 'deletar', 'lembrete', 'assinar', 'vozconfig']);
    this.permissions.set('admin', ['*']); // Admin tem acesso a todos os comandos
    this.permissions.set('premium', ['lembrete', 'assinar', 'vozconfig']); // Comandos premium
  }

  /**
   * Inicializar sugestões contextuais
   */
  initializeContextualSuggestions() {
    this.contextualSuggestions.set('confuso', {
      keywords: ['não entendo', 'confuso', 'perdido', 'não sei', 'como funciona'],
      suggestions: ['/ajuda', '/comandos', '/sobre']
    });

    this.contextualSuggestions.set('pagamento', {
      keywords: ['pagar', 'preço', 'custo', 'valor', 'assinatura', 'premium'],
      suggestions: ['/assinar', '/sobre']
    });

    this.contextualSuggestions.set('audio', {
      keywords: ['áudio', 'audio', 'voz', 'falar', 'ouvir'],
      suggestions: ['/vozconfig', '/ajuda audio']
    });

    this.contextualSuggestions.set('imagem', {
      keywords: ['imagem', 'foto', 'fotografia', 'enviar foto'],
      suggestions: ['/ajuda imagem']
    });

    this.contextualSuggestions.set('dados', {
      keywords: ['dados', 'privacidade', 'lgpd', 'meus dados'],
      suggestions: ['/exportar', '/deletar', '/perfil']
    });
  }

  /**
   * Inicializar categorias de ajuda
   */
  initializeHelpCategories() {
    this.helpCategories.set('geral', {
      name: 'Geral',
      emoji: '🤖',
      description: 'Comandos básicos do bot',
      commands: ['start', 'ajuda', 'comandos', 'sobre']
    });

    this.helpCategories.set('usuario', {
      name: 'Usuário',
      emoji: '👤',
      description: 'Gerenciar perfil e dados',
      commands: ['perfil', 'config', 'reset', 'exportar', 'deletar']
    });

    this.helpCategories.set('suporte', {
      name: 'Suporte',
      emoji: '🆘',
      description: 'Ajuda e contato',
      commands: ['contato', 'ajuda']
    });

    this.helpCategories.set('produtividade', {
      name: 'Produtividade',
      emoji: '⏰',
      description: 'Ferramentas de produtividade',
      commands: ['lembrete']
    });

    this.helpCategories.set('financeiro', {
      name: 'Financeiro',
      emoji: '💳',
      description: 'Assinaturas e pagamentos',
      commands: ['assinar']
    });

    this.helpCategories.set('audio', {
      name: 'Áudio',
      emoji: '🎤',
      description: 'Configurações de voz',
      commands: ['vozconfig']
    });

    this.helpCategories.set('imagem', {
      name: 'Imagem',
      emoji: '📸',
      description: 'Comandos para imagens',
      commands: []
    });
  }

  /**
   * Processar comando
   */
  async processCommand(message, phoneNumber, profileName, phoneNumberId, res) {
    try {
      const commandData = this.parseCommand(message);
      
      if (!commandData) {
        return { isCommand: false };
      }

      const { command, parameters, originalMessage } = commandData;
      
      // Verificar se comando existe
      if (!this.commands.has(command)) {
        throw ErrorFactory.createValidationError(
          `Comando '${command}' não encontrado`,
          'command',
          'Use /ajuda para ver os comandos disponíveis.'
        );
      }

      const commandInfo = this.commands.get(command);
      
      // Verificar permissões
      await this.checkPermissions(command, phoneNumber);
      
      // Validar parâmetros
      this.validateParameters(commandInfo, parameters);
      
      // Executar comando
      const result = await commandInfo.handler(parameters, phoneNumber, profileName, phoneNumberId, res);
      
      // Log do comando
      logger.info('Command executed', {
        command: command,
        parameters: parameters,
        phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*'),
        profileName: profileName
      });

      return { isCommand: true, result };

    } catch (error) {
      ErrorUtils.logError(error, {
        phoneNumber: phoneNumber?.replace(/\d(?=\d{4})/g, '*'),
        command: message,
        operation: 'processCommand'
      });

      // Enviar mensagem de erro amigável
      await this.sendErrorMessage(phoneNumberId, error, res);
      return { isCommand: true, error: true };
    }
  }

  /**
   * Fazer parse do comando
   */
  parseCommand(message) {
    const text = message.text?.body?.trim() || '';
    
    // Verificar se é comando (começa com / ou !)
    if (!text.startsWith('/') && !text.startsWith('!')) {
      return null;
    }

    // Remover prefixo
    const commandText = text.substring(1);
    
    // Dividir em partes
    const parts = commandText.split(' ');
    const commandName = parts[0].toLowerCase();
    
    // Verificar aliases
    const actualCommand = this.aliases.get(commandName) || commandName;
    
    // Extrair parâmetros
    const parameters = this.extractParameters(parts.slice(1));
    
    return {
      command: actualCommand,
      parameters: parameters,
      originalMessage: text
    };
  }

  /**
   * Extrair parâmetros do comando
   */
  extractParameters(parts) {
    const parameters = {};
    let currentParam = null;
    let inQuotes = false;
    let quoteChar = '';
    
    for (const part of parts) {
      if (!inQuotes && (part.startsWith('"') || part.startsWith("'"))) {
        inQuotes = true;
        quoteChar = part[0];
        currentParam = part.substring(1);
      } else if (inQuotes && part.endsWith(quoteChar)) {
        inQuotes = false;
        currentParam += ' ' + part.substring(0, part.length - 1);
        parameters[Object.keys(parameters).length] = currentParam;
        currentParam = null;
      } else if (inQuotes) {
        currentParam += ' ' + part;
      } else {
        parameters[Object.keys(parameters).length] = part;
      }
    }
    
    if (currentParam !== null) {
      parameters[Object.keys(parameters).length] = currentParam;
    }
    
    return parameters;
  }

  /**
   * Verificar permissões
   */
  async checkPermissions(command, phoneNumber) {
    // Implementar lógica de permissões baseada no usuário
    // Por enquanto, todos os usuários têm permissão para todos os comandos
    return true;
  }

  /**
   * Validar parâmetros
   */
  validateParameters(commandInfo, parameters) {
    const requiredParams = commandInfo.parameters.filter(p => p.required);
    
    for (const param of requiredParams) {
      const paramIndex = commandInfo.parameters.indexOf(param);
      if (!parameters[paramIndex]) {
        throw ErrorFactory.createValidationError(
          `Parâmetro '${param.name}' é obrigatório`,
          'parameter',
          `Use: /${commandInfo.name} ${commandInfo.parameters.map(p => p.required ? `<${p.name}>` : `[${p.name}]`).join(' ')}`
        );
      }
    }
  }

  /**
   * Enviar mensagem de erro
   */
  async sendErrorMessage(phoneNumberId, error, res) {
    try {
      const userMessage = ErrorUtils.getUserFriendlyMessage(error);
      await whatsappService.sendSplitReply(
        phoneNumberId,
        config.whatsapp.graphApiToken,
        res.locals.recipientNumber || 'unknown',
        `❌ ${userMessage}`,
        res
      );
    } catch (sendError) {
      logger.error('Error sending error message', { error: sendError.message });
    }
  }

  /**
   * Obter sugestões contextuais
   */
  getContextualSuggestions(message) {
    const text = message.text?.body?.toLowerCase() || '';
    const suggestions = [];
    
    for (const [context, data] of this.contextualSuggestions) {
      if (data.keywords.some(keyword => text.includes(keyword))) {
        suggestions.push(...data.suggestions);
      }
    }
    
    return [...new Set(suggestions)]; // Remover duplicatas
  }

  // ========== HANDLERS DE COMANDOS ==========

  /**
   * Handler para /start
   */
  async handleStart(parameters, phoneNumber, profileName, phoneNumberId, res) {
    const welcomeMessage = `👋 *Bem-vindo ao IA Atendimento Bot!*

Sou seu assistente virtual especializado em nutrição e bem-estar. Posso te ajudar com:

🍎 *Informações Nutricionais*
• Calorias e nutrientes de alimentos
• Análise de refeições
• Sugestões de cardápios

🤖 *Funcionalidades Avançadas*
• Processamento de imagens de comida
• Transcrição de áudios
• Lembretes personalizados

📱 *Comandos Úteis*
• /ajuda - Menu de ajuda
• /comandos - Lista de comandos
• /perfil - Seu perfil
• /sobre - Informações do bot

*Como posso te ajudar hoje?* 😊`;

    await whatsappService.sendSplitReply(
      phoneNumberId,
      config.whatsapp.graphApiToken,
      res.locals.recipientNumber || phoneNumber,
      welcomeMessage,
      res
    );

    return { success: true, message: 'Welcome message sent' };
  }

  /**
   * Handler para /ajuda
   */
  async handleHelp(parameters, phoneNumber, profileName, phoneNumberId, res) {
    const category = parameters[0];
    
    if (category) {
      return await this.handleHelpCategory(category, phoneNumberId, res);
    }

    const helpMessage = `🆘 *Menu de Ajuda*

Escolha uma categoria para ver os comandos disponíveis:

🤖 *Geral* - /ajuda geral
👤 *Usuário* - /ajuda usuario
🆘 *Suporte* - /ajuda suporte
⏰ *Produtividade* - /ajuda produtividade
💳 *Financeiro* - /ajuda financeiro
🎤 *Áudio* - /ajuda audio
📸 *Imagem* - /ajuda imagem

*Exemplos:*
• /ajuda geral - Ver comandos básicos
• /ajuda usuario - Ver comandos de perfil
• /ajuda audio - Ver comandos de voz

*Dica:* Use /comandos para ver todos os comandos disponíveis!`;

    await whatsappService.sendSplitReply(
      phoneNumberId,
      config.whatsapp.graphApiToken,
      res.locals.recipientNumber || phoneNumber,
      helpMessage,
      res
    );

    return { success: true, message: 'Help menu sent' };
  }

  /**
   * Handler para categoria específica de ajuda
   */
  async handleHelpCategory(category, phoneNumberId, res) {
    const categoryInfo = this.helpCategories.get(category.toLowerCase());
    
    if (!categoryInfo) {
      throw ErrorFactory.createNotFoundError('Categoria de ajuda');
    }

    const commands = categoryInfo.commands.map(cmdName => {
      const cmd = this.commands.get(cmdName);
      return `• /${cmdName} - ${cmd.description}`;
    }).join('\n');

    const categoryMessage = `${categoryInfo.emoji} *${categoryInfo.name}*

${categoryInfo.description}

*Comandos disponíveis:*
${commands}

*Uso:* /comando [parâmetros]
*Exemplo:* /${categoryInfo.commands[0]} [parâmetros]`;

    await whatsappService.sendSplitReply(
      phoneNumberId,
      config.whatsapp.graphApiToken,
      res.locals.recipientNumber || 'unknown',
      categoryMessage,
      res
    );

    return { success: true, message: 'Category help sent' };
  }

  /**
   * Handler para /comandos
   */
  async handleCommands(parameters, phoneNumber, profileName, phoneNumberId, res) {
    let commandsMessage = `📋 *Todos os Comandos Disponíveis*\n\n`;

    for (const [categoryName, categoryInfo] of this.helpCategories) {
      if (categoryInfo.commands.length > 0) {
        commandsMessage += `${categoryInfo.emoji} *${categoryInfo.name}*\n`;
        
        for (const cmdName of categoryInfo.commands) {
          const cmd = this.commands.get(cmdName);
          const aliases = cmd.aliases.slice(0, 2).map(a => `/${a}`).join(', ');
          commandsMessage += `• /${cmdName} (${aliases}) - ${cmd.description}\n`;
        }
        commandsMessage += '\n';
      }
    }

    commandsMessage += `*Dica:* Use /ajuda [categoria] para ajuda específica!`;

    await whatsappService.sendSplitReply(
      phoneNumberId,
      config.whatsapp.graphApiToken,
      res.locals.recipientNumber || phoneNumber,
      commandsMessage,
      res
    );

    return { success: true, message: 'Commands list sent' };
  }

  /**
   * Handler para /perfil
   */
  async handleProfile(parameters, phoneNumber, profileName, phoneNumberId, res) {
    const action = parameters[0] || 'ver';
    
    switch (action.toLowerCase()) {
      case 'ver':
        return await this.showProfile(phoneNumber, profileName, phoneNumberId, res);
      case 'editar':
        return await this.editProfile(phoneNumber, phoneNumberId, res);
      case 'configurar':
        return await this.configureProfile(phoneNumber, phoneNumberId, res);
      default:
        throw ErrorFactory.createValidationError(
          'Ação inválida',
          'action',
          'Use: ver, editar ou configurar'
        );
    }
  }

  /**
   * Mostrar perfil do usuário
   */
  async showProfile(phoneNumber, profileName, phoneNumberId, res) {
    // Obter dados do usuário
    const userData = await userDataService.getUserData(phoneNumber);
    const reminders = await userDataService.getUserReminders(phoneNumber);
    
    const profileMessage = `👤 *Seu Perfil*

*Nome:* ${profileName || 'Não informado'}
*Telefone:* ${phoneNumber.replace(/\d(?=\d{4})/g, '*')}
*Membro desde:* ${new Date(userData.createdAt).toLocaleDateString('pt-BR')}
*Mensagens enviadas:* ${userData.messageCount || 0}
*Preferências de voz:* ${userData.voiceSetting || 'Desativada'}
*Lembretes ativos:* ${reminders.length}
*Última mensagem:* ${userData.lastMessageAt ? new Date(userData.lastMessageAt).toLocaleString('pt-BR') : 'Nunca'}

*Comandos:*
• /perfil editar - Editar informações
• /perfil configurar - Configurar preferências`;

    await whatsappService.sendSplitReply(
      phoneNumberId,
      config.whatsapp.graphApiToken,
      res.locals.recipientNumber || phoneNumber,
      profileMessage,
      res
    );

    return { success: true, message: 'Profile shown' };
  }

  /**
   * Editar perfil do usuário
   */
  async editProfile(phoneNumber, phoneNumberId, res) {
    const editMessage = `✏️ *Editar Perfil*

Para editar suas informações, me envie:

*Nome:* "Meu nome é [seu nome]"
*Email:* "Meu email é [seu email]"
*Preferências:* "Quero receber lembretes" ou "Não quero lembretes"

*Exemplo:*
"Meu nome é João Silva e meu email é joao@email.com"`;

    await whatsappService.sendSplitReply(
      phoneNumberId,
      config.whatsapp.graphApiToken,
      res.locals.recipientNumber || phoneNumber,
      editMessage,
      res
    );

    return { success: true, message: 'Edit profile instructions sent' };
  }

  /**
   * Configurar perfil do usuário
   */
  async configureProfile(phoneNumber, phoneNumberId, res) {
    const configMessage = `⚙️ *Configurações do Perfil*

*Opções disponíveis:*

🔊 *Voz:* Ativar/desativar respostas em áudio
⏰ *Lembretes:* Receber notificações de lembretes
📧 *Email:* Receber resumos por email
🌙 *Modo noturno:* Horários de silêncio

*Para configurar, use:*
• "Ativar voz" ou "Desativar voz"
• "Ativar lembretes" ou "Desativar lembretes"
• "Configurar email [seu@email.com]"
• "Modo noturno das 22h às 8h"`;

    await whatsappService.sendSplitReply(
      phoneNumberId,
      config.whatsapp.graphApiToken,
      res.locals.recipientNumber || phoneNumber,
      configMessage,
      res
    );

    return { success: true, message: 'Profile configuration sent' };
  }

  /**
   * Handler para /config
   */
  async handleConfig(parameters, phoneNumber, profileName, phoneNumberId, res) {
    const option = parameters[0];
    
    if (!option) {
      return await this.showConfigOptions(phoneNumberId, res);
    }
    
    return await this.handleConfigOption(option, parameters.slice(1), phoneNumber, phoneNumberId, res);
  }

  /**
   * Mostrar opções de configuração
   */
  async showConfigOptions(phoneNumberId, res) {
    const configMessage = `⚙️ *Configurações Disponíveis*

*Comandos de configuração:*
• /config voz - Configurar preferências de voz
• /config lembretes - Configurar lembretes
• /config notificacoes - Configurar notificações
• /config privacidade - Configurar privacidade

*Configurações rápidas:*
• "Ativar voz" - Respostas em áudio
• "Desativar voz" - Apenas texto
• "Modo silencioso" - Sem notificações
• "Modo normal" - Notificações ativas`;

    await whatsappService.sendSplitReply(
      phoneNumberId,
      config.whatsapp.graphApiToken,
      res.locals.recipientNumber || 'unknown',
      configMessage,
      res
    );

    return { success: true, message: 'Config options shown' };
  }

  /**
   * Handler para opção específica de configuração
   */
  async handleConfigOption(option, parameters, phoneNumber, phoneNumberId, res) {
    switch (option.toLowerCase()) {
      case 'voz':
        return await this.configureVoice(phoneNumber, phoneNumberId, res);
      case 'lembretes':
        return await this.configureReminders(phoneNumber, phoneNumberId, res);
      case 'notificacoes':
        return await this.configureNotifications(phoneNumber, phoneNumberId, res);
      case 'privacidade':
        return await this.configurePrivacy(phoneNumber, phoneNumberId, res);
      default:
        throw ErrorFactory.createValidationError(
          'Opção de configuração inválida',
          'option',
          'Use: voz, lembretes, notificacoes ou privacidade'
        );
    }
  }

  /**
   * Configurar voz
   */
  async configureVoice(phoneNumber, phoneNumberId, res) {
    const voiceMessage = `🎤 *Configurações de Voz*

*Opções disponíveis:*
• "Ativar voz" - Respostas em áudio quando possível
• "Desativar voz" - Apenas respostas em texto
• "Voz apenas para áudios" - Resposta em áudio só quando você enviar áudio
• "Voz sempre" - Sempre responder em áudio

*Configuração atual:* ${await this.getVoiceSetting(phoneNumber)}

*Envie uma das opções acima para configurar!*`;

    await whatsappService.sendSplitReply(
      phoneNumberId,
      config.whatsapp.graphApiToken,
      res.locals.recipientNumber || phoneNumber,
      voiceMessage,
      res
    );

    return { success: true, message: 'Voice configuration sent' };
  }

  /**
   * Obter configuração de voz
   */
  async getVoiceSetting(phoneNumber) {
    const userData = await userDataService.getUserData(phoneNumber);
    return userData.voiceSetting || 'Desativada';
  }

  /**
   * Handler para /sobre
   */
  async handleAbout(parameters, phoneNumber, profileName, phoneNumberId, res) {
    const aboutMessage = `🤖 *Sobre o IA Atendimento Bot*

*Versão:* 2.0.0
*Desenvolvido por:* BemoonAI
*Especialização:* Nutrição e Bem-estar

*Funcionalidades:*
🍎 Análise nutricional de alimentos
📸 Processamento de imagens de comida
🎤 Transcrição de áudios
⏰ Lembretes personalizados
💬 Chat inteligente com IA

*Tecnologias:*
• OpenAI GPT-4
• WhatsApp Business API
• Redis para cache
• Sistema de comandos avançado

*Contato:*
📧 suporte@bemoonai.com
🌐 www.bemoonai.com

*Use /ajuda para ver todos os comandos disponíveis!*`;

    await whatsappService.sendSplitReply(
      phoneNumberId,
      config.whatsapp.graphApiToken,
      res.locals.recipientNumber || phoneNumber,
      aboutMessage,
      res
    );

    return { success: true, message: 'About information sent' };
  }

  /**
   * Handler para /contato
   */
  async handleContact(parameters, phoneNumber, profileName, phoneNumberId, res) {
    const contactMessage = `🆘 *Falar com um Humano*

*Opções de contato:*

📧 *Email:* suporte@bemoonai.com
📞 *Telefone:* (11) 99999-9999
💬 *WhatsApp:* +55 11 99999-9999
🌐 *Site:* www.bemoonai.com

*Horário de atendimento:*
Segunda a Sexta: 8h às 18h
Sábado: 9h às 13h

*Para suporte técnico:*
Descreva seu problema e nossa equipe entrará em contato em até 24h.

*Dica:* Use /ajuda para tentar resolver sozinho primeiro!`;

    await whatsappService.sendSplitReply(
      phoneNumberId,
      config.whatsapp.graphApiToken,
      res.locals.recipientNumber || phoneNumber,
      contactMessage,
      res
    );

    return { success: true, message: 'Contact information sent' };
  }

  /**
   * Handler para /reset
   */
  async handleReset(parameters, phoneNumber, profileName, phoneNumberId, res) {
    // Limpar contexto da conversa
    await redisService.deleteThreadId(phoneNumber);
    
    const resetMessage = `🔄 *Contexto da Conversa Limpo*

✅ Seu histórico de conversa foi resetado
✅ Próxima mensagem iniciará nova conversa
✅ Dados pessoais mantidos

*O que foi limpo:*
• Histórico de mensagens
• Contexto da IA
• Thread de conversa

*O que foi mantido:*
• Seu perfil
• Configurações
• Lembretes
• Dados pessoais

*Pronto para uma nova conversa!* 😊`;

    await whatsappService.sendSplitReply(
      phoneNumberId,
      config.whatsapp.graphApiToken,
      res.locals.recipientNumber || phoneNumber,
      resetMessage,
      res
    );

    return { success: true, message: 'Conversation reset' };
  }

  /**
   * Handler para /exportar
   */
  async handleExport(parameters, phoneNumber, profileName, phoneNumberId, res) {
    const exportMessage = `📊 *Exportar Dados (LGPD)*

*Seus dados pessoais:*
• Perfil e configurações
• Histórico de mensagens
• Lembretes criados
• Preferências de uso

*Formatos disponíveis:*
📄 PDF - Relatório completo
📋 JSON - Dados estruturados
📊 CSV - Dados tabulares

*Para exportar:*
1. Escolha o formato: "PDF", "JSON" ou "CSV"
2. Aguarde o processamento
3. Receba o link de download

*Tempo estimado:* 2-5 minutos

*Envie o formato desejado para continuar!*`;

    await whatsappService.sendSplitReply(
      phoneNumberId,
      config.whatsapp.graphApiToken,
      res.locals.recipientNumber || phoneNumber,
      exportMessage,
      res
    );

    return { success: true, message: 'Export instructions sent' };
  }

  /**
   * Handler para /deletar
   */
  async handleDelete(parameters, phoneNumber, profileName, phoneNumberId, res) {
    const deleteMessage = `⚠️ *Apagar Todos os Dados (LGPD)*

*ATENÇÃO: Esta ação é IRREVERSÍVEL!*

*O que será apagado:*
❌ Seu perfil completo
❌ Histórico de mensagens
❌ Configurações pessoais
❌ Lembretes criados
❌ Todos os dados associados

*O que NÃO será apagado:*
✅ Logs de sistema (anônimos)
✅ Estatísticas gerais
✅ Dados de outros usuários

*Para confirmar a exclusão:*
Digite: "CONFIRMAR EXCLUSÃO"

*Para cancelar:*
Digite: "CANCELAR"

*Tem certeza que deseja continuar?*`;

    await whatsappService.sendSplitReply(
      phoneNumberId,
      config.whatsapp.graphApiToken,
      res.locals.recipientNumber || phoneNumber,
      deleteMessage,
      res
    );

    return { success: true, message: 'Delete confirmation sent' };
  }

  /**
   * Handler para /lembrete
   */
  async handleReminder(parameters, phoneNumber, profileName, phoneNumberId, res) {
    const time = parameters[0];
    const message = parameters[1];
    
    if (!time || !message) {
      throw ErrorFactory.createValidationError(
        'Parâmetros obrigatórios',
        'parameters',
        'Use: /lembrete 10min "tomar remédio"'
      );
    }

    // Processar tempo
    const reminderTime = this.parseReminderTime(time);
    if (!reminderTime) {
      throw ErrorFactory.createValidationError(
        'Formato de tempo inválido',
        'time',
        'Use: 10min, 1h, 2d, etc.'
      );
    }

    // Criar lembrete
    const reminder = await userDataService.createReminder(phoneNumber, {
      message: message,
      scheduledTime: reminderTime,
      type: 'user_created'
    });

    const reminderMessage = `⏰ *Lembrete Criado*

*Mensagem:* ${message}
*Quando:* ${time}
*Data/Hora:* ${reminderTime.toLocaleString('pt-BR')}

*Comandos úteis:*
• /lembrete listar - Ver lembretes ativos
• /lembrete cancelar [id] - Cancelar lembrete
• /lembrete editar [id] - Editar lembrete

*Lembrete criado com sucesso!* ✅`;

    await whatsappService.sendSplitReply(
      phoneNumberId,
      config.whatsapp.graphApiToken,
      res.locals.recipientNumber || phoneNumber,
      reminderMessage,
      res
    );

    return { success: true, message: 'Reminder created' };
  }

  /**
   * Processar tempo do lembrete
   */
  parseReminderTime(timeStr) {
    const time = timeStr.toLowerCase();
    const now = new Date();
    
    // Minutos
    const minMatch = time.match(/(\d+)min/);
    if (minMatch) {
      return new Date(now.getTime() + parseInt(minMatch[1]) * 60 * 1000);
    }
    
    // Horas
    const hourMatch = time.match(/(\d+)h/);
    if (hourMatch) {
      return new Date(now.getTime() + parseInt(hourMatch[1]) * 60 * 60 * 1000);
    }
    
    // Dias
    const dayMatch = time.match(/(\d+)d/);
    if (dayMatch) {
      return new Date(now.getTime() + parseInt(dayMatch[1]) * 24 * 60 * 60 * 1000);
    }
    
    return null;
  }

  /**
   * Handler para /assinar
   */
  async handleSubscribe(parameters, phoneNumber, profileName, phoneNumberId, res) {
    const subscribeMessage = `💳 *Assinar Plano Premium*

*Planos disponíveis:*

🥉 *Básico - R$ 9,90/mês*
• Até 100 mensagens/dia
• Comandos básicos
• Suporte por email

🥈 *Pro - R$ 19,90/mês*
• Mensagens ilimitadas
• Todos os comandos
• Lembretes avançados
• Suporte prioritário

🥇 *Premium - R$ 39,90/mês*
• Tudo do Pro
• Análise nutricional avançada
• Relatórios personalizados
• Suporte 24/7

*Benefícios:*
✅ Sem limites de uso
✅ Comandos exclusivos
✅ Suporte prioritário
✅ Funcionalidades avançadas

*Para assinar:*
Escolha o plano e siga as instruções de pagamento.

*Dúvidas?* Use /contato`;

    await whatsappService.sendSplitReply(
      phoneNumberId,
      config.whatsapp.graphApiToken,
      res.locals.recipientNumber || phoneNumber,
      subscribeMessage,
      res
    );

    return { success: true, message: 'Subscription info sent' };
  }

  /**
   * Handler para /vozconfig
   */
  async handleVoiceConfig(parameters, phoneNumber, profileName, phoneNumberId, res) {
    const voiceConfigMessage = `🎤 *Configurações de Voz*

*Configuração atual:*
${await this.getVoiceSetting(phoneNumber)}

*Opções disponíveis:*

🔊 *Ativar voz* - Respostas em áudio
🔇 *Desativar voz* - Apenas texto
🎵 *Voz apenas para áudios* - Resposta em áudio só quando você enviar áudio
🔊 *Voz sempre* - Sempre responder em áudio
⏰ *Voz em horários* - Configurar horários específicos

*Qualidades de voz:*
• Padrão - Voz natural
• Rápida - Voz mais rápida
• Lenta - Voz mais devagar
• Feminina - Voz feminina
• Masculina - Voz masculina

*Para configurar:*
Envie uma das opções acima ou use comandos específicos.

*Exemplo:* "Ativar voz feminina"`;

    await whatsappService.sendSplitReply(
      phoneNumberId,
      config.whatsapp.graphApiToken,
      res.locals.recipientNumber || phoneNumber,
      voiceConfigMessage,
      res
    );

    return { success: true, message: 'Voice configuration sent' };
  }

  /**
   * Handler para /atalho
   */
  async handleShortcut(parameters, phoneNumber, profileName, phoneNumberId, res) {
    const action = parameters[0];
    const param1 = parameters[1];
    const param2 = parameters[2];

    try {
      switch (action.toLowerCase()) {
        case 'add':
          return await this.handleShortcutAdd(param1, param2, phoneNumber, phoneNumberId, res);
        case 'edit':
          return await this.handleShortcutEdit(param1, param2, phoneNumber, phoneNumberId, res);
        case 'remove':
          return await this.handleShortcutRemove(param1, phoneNumber, phoneNumberId, res);
        case 'list':
          return await this.handleShortcutList(phoneNumber, phoneNumberId, res);
        case 'search':
          return await this.handleShortcutSearch(param1, phoneNumber, phoneNumberId, res);
        case 'share':
          return await this.handleShortcutShare(param1, param2, phoneNumber, phoneNumberId, res);
        case 'stats':
          return await this.handleShortcutStats(phoneNumber, phoneNumberId, res);
        case 'help':
          return await this.handleShortcutHelp(phoneNumberId, res);
        default:
          throw ErrorFactory.createValidationError(
            'Ação inválida',
            'action',
            'Use: add, edit, remove, list, search, share, stats ou help'
          );
      }
    } catch (error) {
      ErrorUtils.logError(error, { action: action, phoneNumber });
      throw error;
    }
  }

  /**
   * Handler para adicionar atalho
   */
  async handleShortcutAdd(shortcut, command, phoneNumber, phoneNumberId, res) {
    if (!shortcut || !command) {
      throw ErrorFactory.createValidationError(
        'Parâmetros obrigatórios',
        'parameters',
        'Use: /atalho add "nome" "comando"'
      );
    }

    const result = await shortcutService.createShortcut(phoneNumber, shortcut, command);
    
    const message = `⚡ *Atalho Criado!*\n\n*Nome:* ${shortcut}\n*Comando:* ${command}\n\n*Como usar:*\nDigite "${shortcut}" em qualquer mensagem para executar o comando automaticamente!`;
    
    await whatsappService.sendSplitReply(
      phoneNumberId,
      config.whatsapp.graphApiToken,
      res.locals.recipientNumber || phoneNumber,
      message,
      res
    );

    return { success: true, message: 'Shortcut created' };
  }

  /**
   * Handler para editar atalho
   */
  async handleShortcutEdit(shortcut, command, phoneNumber, phoneNumberId, res) {
    if (!shortcut || !command) {
      throw ErrorFactory.createValidationError(
        'Parâmetros obrigatórios',
        'parameters',
        'Use: /atalho edit "nome" "comando"'
      );
    }

    const result = await shortcutService.editShortcut(phoneNumber, shortcut, command);
    
    const message = `✏️ *Atalho Editado!*\n\n*Nome:* ${shortcut}\n*Comando:* ${command}\n\n*Atalho atualizado com sucesso!*`;
    
    await whatsappService.sendSplitReply(
      phoneNumberId,
      config.whatsapp.graphApiToken,
      res.locals.recipientNumber || phoneNumber,
      message,
      res
    );

    return { success: true, message: 'Shortcut edited' };
  }

  /**
   * Handler para remover atalho
   */
  async handleShortcutRemove(shortcut, phoneNumber, phoneNumberId, res) {
    if (!shortcut) {
      throw ErrorFactory.createValidationError(
        'Nome do atalho é obrigatório',
        'shortcut',
        'Use: /atalho remove "nome"'
      );
    }

    const result = await shortcutService.removeShortcut(phoneNumber, shortcut);
    
    const message = `🗑️ *Atalho Removido!*\n\n*Nome:* ${shortcut}\n\n*Atalho removido com sucesso!*`;
    
    await whatsappService.sendSplitReply(
      phoneNumberId,
      config.whatsapp.graphApiToken,
      res.locals.recipientNumber || phoneNumber,
      message,
      res
    );

    return { success: true, message: 'Shortcut removed' };
  }

  /**
   * Handler para listar atalhos
   */
  async handleShortcutList(phoneNumber, phoneNumberId, res) {
    const shortcuts = await shortcutService.listUserShortcuts(phoneNumber);
    
    let message = `⚡ *Seus Atalhos*\n\n`;
    
    if (shortcuts.custom && Object.keys(shortcuts.custom).length > 0) {
      message += `*Atalhos Personalizados:*\n`;
      for (const [name, data] of Object.entries(shortcuts.custom)) {
        message += `• ${name} → ${data.command}\n`;
        if (data.description) {
          message += `  ${data.description}\n`;
        }
      }
      message += `\n`;
    }
    
    if (shortcuts.global && Object.keys(shortcuts.global).length > 0) {
      message += `*Atalhos Globais:*\n`;
      for (const [name, command] of Object.entries(shortcuts.global)) {
        message += `• ${name} → ${command}\n`;
      }
    }
    
    message += `\n*Total:* ${shortcuts.total} atalhos\n\n*Use /atalho help para mais comandos!*`;
    
    await whatsappService.sendSplitReply(
      phoneNumberId,
      config.whatsapp.graphApiToken,
      res.locals.recipientNumber || phoneNumber,
      message,
      res
    );

    return { success: true, message: 'Shortcuts listed' };
  }

  /**
   * Handler para buscar atalhos
   */
  async handleShortcutSearch(query, phoneNumber, phoneNumberId, res) {
    if (!query) {
      throw ErrorFactory.createValidationError(
        'Termo de busca é obrigatório',
        'query',
        'Use: /atalho search "termo"'
      );
    }

    const suggestions = await shortcutService.getShortcutSuggestions(phoneNumber, query);
    
    let message = `🔍 *Busca de Atalhos*\n\n*Termo:* "${query}"\n\n`;
    
    if (suggestions.length > 0) {
      message += `*Resultados encontrados:*\n`;
      suggestions.forEach(suggestion => {
        message += `• ${suggestion.shortcut} → ${suggestion.command}\n`;
        if (suggestion.description) {
          message += `  ${suggestion.description}\n`;
        }
      });
    } else {
      message += `*Nenhum atalho encontrado.*\n\n*Dica:* Use /atalho add para criar novos atalhos!`;
    }
    
    await whatsappService.sendSplitReply(
      phoneNumberId,
      config.whatsapp.graphApiToken,
      res.locals.recipientNumber || phoneNumber,
      message,
      res
    );

    return { success: true, message: 'Shortcuts searched' };
  }

  /**
   * Handler para compartilhar atalho
   */
  async handleShortcutShare(shortcut, targetPhone, phoneNumber, phoneNumberId, res) {
    if (!shortcut || !targetPhone) {
      throw ErrorFactory.createValidationError(
        'Parâmetros obrigatórios',
        'parameters',
        'Use: /atalho share "nome" "telefone"'
      );
    }

    const result = await shortcutService.shareShortcut(phoneNumber, shortcut, targetPhone);
    
    const message = `📤 *Atalho Compartilhado!*\n\n*Atalho:* ${shortcut}\n*Comando:* ${result.command}\n*Para:* ${targetPhone}\n\n*Atalho compartilhado com sucesso!*`;
    
    await whatsappService.sendSplitReply(
      phoneNumberId,
      config.whatsapp.graphApiToken,
      res.locals.recipientNumber || phoneNumber,
      message,
      res
    );

    return { success: true, message: 'Shortcut shared' };
  }

  /**
   * Handler para estatísticas de atalhos
   */
  async handleShortcutStats(phoneNumber, phoneNumberId, res) {
    const stats = await shortcutService.getShortcutStats(phoneNumber);
    
    let message = `📊 *Estatísticas de Atalhos*\n\n`;
    message += `*Atalhos personalizados:* ${stats.totalShortcuts}\n`;
    message += `*Atalhos globais:* ${stats.globalShortcuts}\n`;
    message += `*Total de usos:* ${stats.totalUsage}\n\n`;
    
    if (stats.mostUsed.length > 0) {
      message += `*Mais usados:*\n`;
      stats.mostUsed.forEach((shortcut, index) => {
        message += `${index + 1}. ${shortcut.shortcut} (${shortcut.usageCount}x)\n`;
      });
    }
    
    await whatsappService.sendSplitReply(
      phoneNumberId,
      config.whatsapp.graphApiToken,
      res.locals.recipientNumber || phoneNumber,
      message,
      res
    );

    return { success: true, message: 'Shortcut stats sent' };
  }

  /**
   * Handler para ajuda de atalhos
   */
  async handleShortcutHelp(phoneNumberId, res) {
    const help = shortcutService.getShortcutHelp();
    
    let message = `⚡ *Ajuda de Atalhos*\n\n`;
    message += `*Comandos disponíveis:*\n`;
    help.commands.forEach(cmd => {
      message += `• ${cmd}\n`;
    });
    
    message += `\n*Exemplos:*\n`;
    help.examples.forEach(example => {
      message += `• ${example}\n`;
    });
    
    message += `\n*Templates disponíveis:*\n`;
    help.templates.forEach(template => {
      message += `• ${template.name}: ${template.template}\n`;
    });
    
    await whatsappService.sendSplitReply(
      phoneNumberId,
      config.whatsapp.graphApiToken,
      res.locals.recipientNumber || 'unknown',
      message,
      res
    );

    return { success: true, message: 'Shortcut help sent' };
  }

  /**
   * Handler para /agenda
   */
  async handleAgenda(parameters, phoneNumber, profileName, phoneNumberId, res) {
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
   * Handler para /resumo
   */
  async handleResumo(parameters, phoneNumber, profileName, phoneNumberId, res) {
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
   * Handler para /tarefas
   */
  async handleTarefas(parameters, phoneNumber, profileName, phoneNumberId, res) {
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
   * Handler para /timer
   */
  async handleTimer(parameters, phoneNumber, profileName, phoneNumberId, res) {
    const time = parameters[0];
    const description = parameters[1];
    
    if (!time) {
      const timerMessage = `⏰ *Timer*\n\n*Como usar:*\n• /timer 15min - Timer de 15 minutos\n• /timer 1h - Timer de 1 hora\n• /timer 30min "fazer café" - Timer com descrição\n\n*Exemplo:*\n/timer 15min "pausa para café"`;
      
      await whatsappService.sendSplitReply(
        phoneNumberId,
        config.whatsapp.graphApiToken,
        res.locals.recipientNumber || phoneNumber,
        timerMessage,
        res
      );
      
      return { success: true, message: 'Timer instructions sent' };
    }

    // Processar tempo
    const timeMatch = time.match(/(\d+)\s*(min|minutos?|h|horas?)/i);
    if (!timeMatch) {
      throw ErrorFactory.createValidationError(
        'Formato de tempo inválido',
        'time',
        'Use: 15min, 1h, 30min, etc.'
      );
    }

    const timeValue = parseInt(timeMatch[1]);
    const unit = timeMatch[2].toLowerCase();
    const minutes = unit.includes('h') ? timeValue * 60 : timeValue;
    
    // Criar lembrete para o timer
    const timerMessage = description || `Timer de ${timeValue}${unit}`;
    const timerReminder = await userDataService.createReminder(phoneNumber, {
      message: `⏰ ${timerMessage} finalizado!`,
      scheduledTime: new Date(Date.now() + minutes * 60 * 1000),
      type: 'timer'
    });
    
    const timerResponse = `⏰ *Timer Iniciado*\n\n*Duração:* ${timeValue}${unit}\n*Descrição:* ${timerMessage}\n*Finaliza em:* ${new Date(Date.now() + minutes * 60 * 1000).toLocaleTimeString('pt-BR')}\n\n*Timer configurado com sucesso!* ✅`;
    
    await whatsappService.sendSplitReply(
      phoneNumberId,
      config.whatsapp.graphApiToken,
      res.locals.recipientNumber || phoneNumber,
      timerResponse,
      res
    );

    return { success: true, message: 'Timer started' };
  }

  // ========== MÉTODOS AUXILIARES ==========

  /**
   * Obter estatísticas de comandos
   */
  getCommandStats() {
    return {
      totalCommands: this.commands.size,
      totalAliases: this.aliases.size,
      categories: this.helpCategories.size,
      contextualSuggestions: this.contextualSuggestions.size
    };
  }

  /**
   * Obter comando por nome
   */
  getCommand(name) {
    return this.commands.get(name);
  }

  /**
   * Verificar se comando existe
   */
  hasCommand(name) {
    return this.commands.has(name) || this.aliases.has(name);
  }

  /**
   * Obter todos os comandos
   */
  getAllCommands() {
    return Array.from(this.commands.values());
  }

  /**
   * Obter comandos por categoria
   */
  getCommandsByCategory(category) {
    const categoryInfo = this.helpCategories.get(category);
    if (!categoryInfo) return [];
    
    return categoryInfo.commands.map(cmdName => this.commands.get(cmdName));
  }
}

// Instância singleton
const commandHandler = new CommandHandler();

export default commandHandler;
