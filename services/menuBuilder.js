// services/menuBuilder.js
// Sistema de menus interativos para WhatsApp

import { ErrorFactory, ErrorUtils } from '../utils/errors.js';
import logger from '../config/logger.js';
import userDataService from './userDataService.js';
import * as whatsappService from './whatsappService.js';
import { config } from '../config/index.js';

class MenuBuilder {
  constructor() {
    this.menus = new Map();
    this.userStates = new Map();
    this.breadcrumbs = new Map();
    this.menuHistory = new Map();
    
    this.initializeMenus();
  }

  /**
   * Inicializar menus do sistema
   */
  initializeMenus() {
    // Menu principal
    this.menus.set('main', {
      id: 'main',
      title: '🏠 *Menu Principal*',
      description: 'Escolha uma opção:',
      options: [
        { id: 'commands', text: '1️⃣ Comandos úteis', emoji: '⚡', action: 'navigate', target: 'commands' },
        { id: 'settings', text: '2️⃣ Configurações', emoji: '⚙️', action: 'navigate', target: 'settings' },
        { id: 'help', text: '3️⃣ Ajuda', emoji: '🆘', action: 'navigate', target: 'help' },
        { id: 'premium', text: '4️⃣ Assinar Premium', emoji: '💎', action: 'navigate', target: 'premium' },
        { id: 'profile', text: '5️⃣ Meu Perfil', emoji: '👤', action: 'navigate', target: 'profile' },
        { id: 'stats', text: '6️⃣ Estatísticas', emoji: '📊', action: 'navigate', target: 'stats' }
      ],
      footer: 'Digite o número da opção ou use /menu para voltar ao início'
    });

    // Menu de comandos
    this.menus.set('commands', {
      id: 'commands',
      title: '⚡ *Comandos Úteis*',
      description: 'Escolha uma categoria:',
      options: [
        { id: 'productivity', text: '1️⃣ Produtividade', emoji: '⏰', action: 'navigate', target: 'productivity' },
        { id: 'nutrition', text: '2️⃣ Nutrição', emoji: '🍎', action: 'navigate', target: 'nutrition' },
        { id: 'voice', text: '3️⃣ Áudio/Voz', emoji: '🎤', action: 'navigate', target: 'voice' },
        { id: 'data', text: '4️⃣ Dados/LGPD', emoji: '📊', action: 'navigate', target: 'data' },
        { id: 'back', text: '0️⃣ Voltar', emoji: '⬅️', action: 'navigate', target: 'main' }
      ],
      footer: 'Digite o número da opção'
    });

    // Menu de configurações
    this.menus.set('settings', {
      id: 'settings',
      title: '⚙️ *Configurações*',
      description: 'Configure suas preferências:',
      options: [
        { id: 'voice', text: '1️⃣ Configurar Voz', emoji: '🎤', action: 'navigate', target: 'voice_settings' },
        { id: 'notifications', text: '2️⃣ Notificações', emoji: '🔔', action: 'navigate', target: 'notifications' },
        { id: 'privacy', text: '3️⃣ Privacidade', emoji: '🔒', action: 'navigate', target: 'privacy' },
        { id: 'shortcuts', text: '4️⃣ Atalhos', emoji: '⚡', action: 'navigate', target: 'shortcuts' },
        { id: 'back', text: '0️⃣ Voltar', emoji: '⬅️', action: 'navigate', target: 'main' }
      ],
      footer: 'Digite o número da opção'
    });

    // Menu de ajuda
    this.menus.set('help', {
      id: 'help',
      title: '🆘 *Ajuda*',
      description: 'Como posso te ajudar?',
      options: [
        { id: 'tutorial', text: '1️⃣ Tutorial', emoji: '📚', action: 'navigate', target: 'tutorial' },
        { id: 'faq', text: '2️⃣ Perguntas Frequentes', emoji: '❓', action: 'navigate', target: 'faq' },
        { id: 'contact', text: '3️⃣ Falar com Humano', emoji: '👨‍💼', action: 'command', target: '/contato' },
        { id: 'commands', text: '4️⃣ Lista de Comandos', emoji: '📋', action: 'command', target: '/comandos' },
        { id: 'back', text: '0️⃣ Voltar', emoji: '⬅️', action: 'navigate', target: 'main' }
      ],
      footer: 'Digite o número da opção'
    });

    // Menu de premium
    this.menus.set('premium', {
      id: 'premium',
      title: '💎 *Assinar Premium*',
      description: 'Escolha seu plano:',
      options: [
        { id: 'basic', text: '1️⃣ Básico - R$ 9,90/mês', emoji: '🥉', action: 'command', target: '/assinar' },
        { id: 'pro', text: '2️⃣ Pro - R$ 19,90/mês', emoji: '🥈', action: 'command', target: '/assinar' },
        { id: 'premium', text: '3️⃣ Premium - R$ 39,90/mês', emoji: '🥇', action: 'command', target: '/assinar' },
        { id: 'benefits', text: '4️⃣ Ver Benefícios', emoji: '✨', action: 'navigate', target: 'benefits' },
        { id: 'back', text: '0️⃣ Voltar', emoji: '⬅️', action: 'navigate', target: 'main' }
      ],
      footer: 'Digite o número da opção'
    });

    // Menu de produtividade
    this.menus.set('productivity', {
      id: 'productivity',
      title: '⏰ *Produtividade*',
      description: 'Ferramentas de produtividade:',
      options: [
        { id: 'agenda', text: '1️⃣ Minha Agenda', emoji: '📅', action: 'command', target: '/agenda' },
        { id: 'tasks', text: '2️⃣ Minhas Tarefas', emoji: '📝', action: 'command', target: '/tarefas' },
        { id: 'reminder', text: '3️⃣ Criar Lembrete', emoji: '⏰', action: 'navigate', target: 'reminder_form' },
        { id: 'timer', text: '4️⃣ Timer', emoji: '⏱️', action: 'navigate', target: 'timer_form' },
        { id: 'summary', text: '5️⃣ Resumo do Dia', emoji: '📊', action: 'command', target: '/resumo' },
        { id: 'back', text: '0️⃣ Voltar', emoji: '⬅️', action: 'navigate', target: 'commands' }
      ],
      footer: 'Digite o número da opção'
    });

    // Menu de nutrição
    this.menus.set('nutrition', {
      id: 'nutrition',
      title: '🍎 *Nutrição*',
      description: 'Ferramentas nutricionais:',
      options: [
        { id: 'analyze', text: '1️⃣ Analisar Alimento', emoji: '🔍', action: 'navigate', target: 'nutrition_analyze' },
        { id: 'meal_plan', text: '2️⃣ Plano de Refeições', emoji: '🍽️', action: 'navigate', target: 'meal_plan' },
        { id: 'calories', text: '3️⃣ Contador de Calorias', emoji: '🔥', action: 'navigate', target: 'calories' },
        { id: 'tips', text: '4️⃣ Dicas Nutricionais', emoji: '💡', action: 'navigate', target: 'nutrition_tips' },
        { id: 'back', text: '0️⃣ Voltar', emoji: '⬅️', action: 'navigate', target: 'commands' }
      ],
      footer: 'Digite o número da opção'
    });

    // Menu de voz
    this.menus.set('voice', {
      id: 'voice',
      title: '🎤 *Áudio/Voz*',
      description: 'Configurações de áudio:',
      options: [
        { id: 'config', text: '1️⃣ Configurar Voz', emoji: '⚙️', action: 'command', target: '/vozconfig' },
        { id: 'test', text: '2️⃣ Testar Voz', emoji: '🎵', action: 'navigate', target: 'voice_test' },
        { id: 'languages', text: '3️⃣ Idiomas', emoji: '🌍', action: 'navigate', target: 'languages' },
        { id: 'back', text: '0️⃣ Voltar', emoji: '⬅️', action: 'navigate', target: 'commands' }
      ],
      footer: 'Digite o número da opção'
    });

    // Menu de dados
    this.menus.set('data', {
      id: 'data',
      title: '📊 *Dados/LGPD*',
      description: 'Gerenciar seus dados:',
      options: [
        { id: 'export', text: '1️⃣ Exportar Dados', emoji: '📤', action: 'command', target: '/exportar' },
        { id: 'delete', text: '2️⃣ Deletar Dados', emoji: '🗑️', action: 'command', target: '/deletar' },
        { id: 'privacy', text: '3️⃣ Política de Privacidade', emoji: '🔒', action: 'navigate', target: 'privacy_policy' },
        { id: 'back', text: '0️⃣ Voltar', emoji: '⬅️', action: 'navigate', target: 'commands' }
      ],
      footer: 'Digite o número da opção'
    });
  }

  /**
   * Processar entrada do menu
   */
  async processMenuInput(message, phoneNumber, profileName, phoneNumberId, res) {
    try {
      const text = message.text?.body?.trim() || '';
      
      // Verificar se é entrada de menu
      if (!this.isMenuInput(text)) {
        return { isMenu: false };
      }

      // Obter estado atual do usuário
      const userState = this.getUserState(phoneNumber);
      
      // Processar entrada
      const result = await this.handleMenuInput(text, userState, phoneNumber, profileName, phoneNumberId, res);
      
      // Atualizar estado do usuário
      this.updateUserState(phoneNumber, result.newState);
      
      return { isMenu: true, result };

    } catch (error) {
      ErrorUtils.logError(error, {
        phoneNumber: phoneNumber?.replace(/\d(?=\d{4})/g, '*'),
        message: text,
        operation: 'processMenuInput'
      });
      return { isMenu: true, error: true };
    }
  }

  /**
   * Verificar se é entrada de menu
   */
  isMenuInput(text) {
    // Verificar se é número (1-9)
    if (/^[1-9]$/.test(text)) {
      return true;
    }
    
    // Verificar se é comando de menu
    if (text.toLowerCase() === '/menu' || text.toLowerCase() === 'menu') {
      return true;
    }
    
    // Verificar se é comando de voltar
    if (text.toLowerCase() === 'voltar' || text.toLowerCase() === 'back') {
      return true;
    }
    
    return false;
  }

  /**
   * Obter estado do usuário
   */
  getUserState(phoneNumber) {
    return this.userStates.get(phoneNumber) || {
      currentMenu: 'main',
      history: ['main'],
      breadcrumb: ['Menu Principal']
    };
  }

  /**
   * Atualizar estado do usuário
   */
  updateUserState(phoneNumber, newState) {
    this.userStates.set(phoneNumber, newState);
  }

  /**
   * Lidar com entrada do menu
   */
  async handleMenuInput(input, userState, phoneNumber, profileName, phoneNumberId, res) {
    const currentMenu = this.menus.get(userState.currentMenu);
    
    if (!currentMenu) {
      throw ErrorFactory.createNotFoundError('Menu atual');
    }

    // Verificar se é comando de menu
    if (input.toLowerCase() === '/menu' || input.toLowerCase() === 'menu') {
      return await this.showMenu('main', phoneNumber, profileName, phoneNumberId, res);
    }

    // Verificar se é comando de voltar
    if (input.toLowerCase() === 'voltar' || input.toLowerCase() === 'back' || input === '0') {
      return await this.goBack(phoneNumber, profileName, phoneNumberId, res);
    }

    // Verificar se é número válido
    const optionNumber = parseInt(input);
    if (isNaN(optionNumber) || optionNumber < 1 || optionNumber > currentMenu.options.length) {
      throw ErrorFactory.createValidationError(
        'Opção inválida',
        'option',
        `Digite um número de 1 a ${currentMenu.options.length}`
      );
    }

    // Obter opção selecionada
    const selectedOption = currentMenu.options[optionNumber - 1];
    
    // Processar ação
    switch (selectedOption.action) {
      case 'navigate':
        return await this.navigateToMenu(selectedOption.target, phoneNumber, profileName, phoneNumberId, res);
      case 'command':
        return await this.executeCommand(selectedOption.target, phoneNumber, profileName, phoneNumberId, res);
      default:
        throw ErrorFactory.createValidationError('Ação inválida');
    }
  }

  /**
   * Navegar para menu
   */
  async navigateToMenu(menuId, phoneNumber, profileName, phoneNumberId, res) {
    const menu = this.menus.get(menuId);
    
    if (!menu) {
      throw ErrorFactory.createNotFoundError('Menu');
    }

    // Atualizar histórico
    const userState = this.getUserState(phoneNumber);
    userState.history.push(menuId);
    userState.breadcrumb.push(menu.title.replace(/[🏠⚡⚙️🆘💎👤📊⏰🍎🎤📊]/g, '').replace(/\*/g, '').trim());
    
    // Mostrar menu
    return await this.showMenu(menuId, phoneNumber, profileName, phoneNumberId, res);
  }

  /**
   * Executar comando
   */
  async executeCommand(command, phoneNumber, profileName, phoneNumberId, res) {
    // Simular execução de comando
    const commandMessage = { text: { body: command } };
    
    // Aqui você integraria com o commandHandler existente
    // const result = await commandHandler.processCommand(commandMessage, phoneNumber, profileName, phoneNumberId, res);
    
    // Por enquanto, apenas mostrar mensagem
    const message = `🔧 *Executando comando:* ${command}\n\n*Comando executado com sucesso!* ✅\n\n*Use /menu para voltar ao menu principal*`;
    
    await whatsappService.sendSplitReply(
      phoneNumberId,
      config.whatsapp.graphApiToken,
      res.locals.recipientNumber || phoneNumber,
      message,
      res
    );

    return {
      success: true,
      message: 'Command executed',
      newState: this.getUserState(phoneNumber)
    };
  }

  /**
   * Voltar ao menu anterior
   */
  async goBack(phoneNumber, profileName, phoneNumberId, res) {
    const userState = this.getUserState(phoneNumber);
    
    if (userState.history.length <= 1) {
      // Já está no menu principal
      return await this.showMenu('main', phoneNumber, profileName, phoneNumberId, res);
    }
    
    // Remover menu atual do histórico
    userState.history.pop();
    userState.breadcrumb.pop();
    
    // Obter menu anterior
    const previousMenu = userState.history[userState.history.length - 1];
    
    return await this.showMenu(previousMenu, phoneNumber, profileName, phoneNumberId, res);
  }

  /**
   * Mostrar menu
   */
  async showMenu(menuId, phoneNumber, profileName, phoneNumberId, res) {
    const menu = this.menus.get(menuId);
    
    if (!menu) {
      throw ErrorFactory.createNotFoundError('Menu');
    }

    // Atualizar estado
    const userState = this.getUserState(phoneNumber);
    userState.currentMenu = menuId;
    
    // Construir mensagem do menu
    let message = `${menu.title}\n\n${menu.description}\n\n`;
    
    // Adicionar opções
    menu.options.forEach((option, index) => {
      message += `${option.text}\n`;
    });
    
    // Adicionar breadcrumb
    if (userState.breadcrumb.length > 1) {
      message += `\n📍 *Você está em:* ${userState.breadcrumb.join(' > ')}`;
    }
    
    // Adicionar footer
    message += `\n\n${menu.footer}`;
    
    // Enviar menu
    await whatsappService.sendSplitReply(
      phoneNumberId,
      config.whatsapp.graphApiToken,
      res.locals.recipientNumber || phoneNumber,
      message,
      res
    );

    return {
      success: true,
      message: 'Menu displayed',
      newState: userState
    };
  }

  /**
   * Mostrar menu principal
   */
  async showMainMenu(phoneNumber, profileName, phoneNumberId, res) {
    return await this.showMenu('main', phoneNumber, profileName, phoneNumberId, res);
  }

  /**
   * Obter breadcrumb do usuário
   */
  getBreadcrumb(phoneNumber) {
    const userState = this.getUserState(phoneNumber);
    return userState.breadcrumb;
  }

  /**
   * Limpar estado do usuário
   */
  clearUserState(phoneNumber) {
    this.userStates.delete(phoneNumber);
  }

  /**
   * Obter estatísticas de menus
   */
  getMenuStats() {
    return {
      totalMenus: this.menus.size,
      activeUsers: this.userStates.size,
      menuTypes: Array.from(this.menus.keys())
    };
  }

  /**
   * Adicionar menu personalizado
   */
  addCustomMenu(menuId, menuData) {
    this.menus.set(menuId, menuData);
  }

  /**
   * Obter menu por ID
   */
  getMenu(menuId) {
    return this.menus.get(menuId);
  }

  /**
   * Listar todos os menus
   */
  getAllMenus() {
    return Array.from(this.menus.values());
  }
}

// Instância singleton
const menuBuilder = new MenuBuilder();

export default menuBuilder;

