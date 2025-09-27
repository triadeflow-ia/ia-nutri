// services/shortcutService.js
// Sistema de atalhos personalizados

import { ErrorFactory, ErrorUtils } from '../utils/errors.js';
import logger from '../config/logger.js';
import userDataService from './userDataService.js';
import * as whatsappService from './whatsappService.js';
import { config } from '../config/index.js';

class ShortcutService {
  constructor() {
    this.globalShortcuts = new Map();
    this.shortcutCategories = new Map();
    this.shortcutTemplates = new Map();
    
    this.initializeGlobalShortcuts();
    this.initializeShortcutCategories();
    this.initializeShortcutTemplates();
  }

  /**
   * Inicializar atalhos globais
   */
  initializeGlobalShortcuts() {
    // Atalhos de produtividade
    this.globalShortcuts.set('café', '/lembrete 15min "fazer café"');
    this.globalShortcuts.set('água', '/lembrete 1h "beber água"');
    this.globalShortcuts.set('medicamento', '/lembrete 8h "tomar medicamento"');
    this.globalShortcuts.set('exercício', '/lembrete 18h "fazer exercício"');
    this.globalShortcuts.set('reunião', '/lembrete 30min "reunião importante"');
    
    // Atalhos de configuração
    this.globalShortcuts.set('voz', '/vozconfig');
    this.globalShortcuts.set('perfil', '/perfil');
    this.globalShortcuts.set('ajuda', '/ajuda');
    this.globalShortcuts.set('comandos', '/comandos');
    
    // Atalhos de informações
    this.globalShortcuts.set('sobre', '/sobre');
    this.globalShortcuts.set('contato', '/contato');
    this.globalShortcuts.set('dados', '/exportar');
    
    // Atalhos de produtividade
    this.globalShortcuts.set('agenda', '/agenda');
    this.globalShortcuts.set('hoje', '/agenda');
    this.globalShortcuts.set('resumo', '/resumo');
    this.globalShortcuts.set('tarefas', '/tarefas');
  }

  /**
   * Inicializar categorias de atalhos
   */
  initializeShortcutCategories() {
    this.shortcutCategories.set('produtividade', {
      name: 'Produtividade',
      emoji: '⏰',
      description: 'Atalhos para produtividade e lembretes',
      shortcuts: ['café', 'água', 'medicamento', 'exercício', 'reunião', 'agenda', 'hoje', 'resumo', 'tarefas']
    });

    this.shortcutCategories.set('configuração', {
      name: 'Configuração',
      emoji: '⚙️',
      description: 'Atalhos para configurações e perfil',
      shortcuts: ['voz', 'perfil', 'ajuda', 'comandos']
    });

    this.shortcutCategories.set('informações', {
      name: 'Informações',
      emoji: 'ℹ️',
      description: 'Atalhos para informações e suporte',
      shortcuts: ['sobre', 'contato', 'dados']
    });
  }

  /**
   * Inicializar templates de atalhos
   */
  initializeShortcutTemplates() {
    this.shortcutTemplates.set('lembrete', {
      name: 'Lembrete',
      description: 'Criar lembrete personalizado',
      template: '/lembrete {tempo} "{mensagem}"',
      example: '/lembrete 30min "reunião importante"',
      parameters: ['tempo', 'mensagem']
    });

    this.shortcutTemplates.set('timer', {
      name: 'Timer',
      description: 'Criar timer personalizado',
      template: '/timer {minutos}min "{descrição}"',
      example: '/timer 15min "pausa para café"',
      parameters: ['minutos', 'descrição']
    });

    this.shortcutTemplates.set('config', {
      name: 'Configuração',
      description: 'Configurar opção específica',
      template: '/config {opção}',
      example: '/config voz',
      parameters: ['opção']
    });
  }

  /**
   * Criar atalho personalizado
   */
  async createShortcut(phoneNumber, shortcut, command, description = '') {
    try {
      // Validar atalho
      if (!shortcut || !command) {
        throw ErrorFactory.createValidationError(
          'Atalho e comando são obrigatórios',
          'shortcut',
          'Use: /atalho add "café" "/lembrete 15min fazer café"'
        );
      }

      // Validar formato do comando
      if (!command.startsWith('/')) {
        throw ErrorFactory.createValidationError(
          'Comando deve começar com /',
          'command',
          'Exemplo: /lembrete 15min "fazer café"'
        );
      }

      // Obter dados do usuário
      const userData = await userDataService.getUserData(phoneNumber);
      const customShortcuts = userData.customShortcuts || {};

      // Verificar se atalho já existe
      if (customShortcuts[shortcut.toLowerCase()]) {
        throw ErrorFactory.createValidationError(
          'Atalho já existe',
          'shortcut',
          'Use /atalho edit para modificar ou /atalho remove para remover'
        );
      }

      // Adicionar atalho
      customShortcuts[shortcut.toLowerCase()] = {
        command: command,
        description: description,
        createdAt: new Date().toISOString(),
        usageCount: 0
      };

      // Salvar dados do usuário
      await userDataService.updateUserData(phoneNumber, {
        customShortcuts: customShortcuts
      });

      logger.info('Custom shortcut created', {
        phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*'),
        shortcut: shortcut,
        command: command
      });

      return {
        success: true,
        shortcut: shortcut,
        command: command,
        description: description
      };

    } catch (error) {
      ErrorUtils.logError(error, {
        phoneNumber: phoneNumber?.replace(/\d(?=\d{4})/g, '*'),
        shortcut: shortcut,
        command: command
      });
      throw error;
    }
  }

  /**
   * Editar atalho existente
   */
  async editShortcut(phoneNumber, shortcut, command, description = '') {
    try {
      const userData = await userDataService.getUserData(phoneNumber);
      const customShortcuts = userData.customShortcuts || {};

      if (!customShortcuts[shortcut.toLowerCase()]) {
        throw ErrorFactory.createNotFoundError('Atalho personalizado');
      }

      // Atualizar atalho
      customShortcuts[shortcut.toLowerCase()] = {
        ...customShortcuts[shortcut.toLowerCase()],
        command: command,
        description: description,
        updatedAt: new Date().toISOString()
      };

      await userDataService.updateUserData(phoneNumber, {
        customShortcuts: customShortcuts
      });

      logger.info('Custom shortcut edited', {
        phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*'),
        shortcut: shortcut,
        command: command
      });

      return {
        success: true,
        shortcut: shortcut,
        command: command,
        description: description
      };

    } catch (error) {
      ErrorUtils.logError(error, {
        phoneNumber: phoneNumber?.replace(/\d(?=\d{4})/g, '*'),
        shortcut: shortcut
      });
      throw error;
    }
  }

  /**
   * Remover atalho
   */
  async removeShortcut(phoneNumber, shortcut) {
    try {
      const userData = await userDataService.getUserData(phoneNumber);
      const customShortcuts = userData.customShortcuts || {};

      if (!customShortcuts[shortcut.toLowerCase()]) {
        throw ErrorFactory.createNotFoundError('Atalho personalizado');
      }

      // Remover atalho
      delete customShortcuts[shortcut.toLowerCase()];

      await userDataService.updateUserData(phoneNumber, {
        customShortcuts: customShortcuts
      });

      logger.info('Custom shortcut removed', {
        phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*'),
        shortcut: shortcut
      });

      return {
        success: true,
        shortcut: shortcut
      };

    } catch (error) {
      ErrorUtils.logError(error, {
        phoneNumber: phoneNumber?.replace(/\d(?=\d{4})/g, '*'),
        shortcut: shortcut
      });
      throw error;
    }
  }

  /**
   * Listar atalhos do usuário
   */
  async listUserShortcuts(phoneNumber) {
    try {
      const userData = await userDataService.getUserData(phoneNumber);
      const customShortcuts = userData.customShortcuts || {};
      const globalShortcuts = this.globalShortcuts;

      return {
        custom: customShortcuts,
        global: Object.fromEntries(globalShortcuts),
        total: Object.keys(customShortcuts).length + globalShortcuts.size
      };

    } catch (error) {
      ErrorUtils.logError(error, {
        phoneNumber: phoneNumber?.replace(/\d(?=\d{4})/g, '*')
      });
      throw error;
    }
  }

  /**
   * Obter atalho
   */
  async getShortcut(phoneNumber, shortcut) {
    try {
      // Verificar atalhos personalizados primeiro
      const userData = await userDataService.getUserData(phoneNumber);
      const customShortcuts = userData.customShortcuts || {};

      if (customShortcuts[shortcut.toLowerCase()]) {
        // Incrementar contador de uso
        customShortcuts[shortcut.toLowerCase()].usageCount = 
          (customShortcuts[shortcut.toLowerCase()].usageCount || 0) + 1;
        
        await userDataService.updateUserData(phoneNumber, {
          customShortcuts: customShortcuts
        });

        return {
          type: 'custom',
          command: customShortcuts[shortcut.toLowerCase()].command,
          description: customShortcuts[shortcut.toLowerCase()].description,
          usageCount: customShortcuts[shortcut.toLowerCase()].usageCount
        };
      }

      // Verificar atalhos globais
      if (this.globalShortcuts.has(shortcut.toLowerCase())) {
        return {
          type: 'global',
          command: this.globalShortcuts.get(shortcut.toLowerCase()),
          description: 'Atalho global'
        };
      }

      return null;

    } catch (error) {
      ErrorUtils.logError(error, {
        phoneNumber: phoneNumber?.replace(/\d(?=\d{4})/g, '*'),
        shortcut: shortcut
      });
      return null;
    }
  }

  /**
   * Compartilhar atalho
   */
  async shareShortcut(phoneNumber, shortcut, targetPhoneNumber) {
    try {
      const userData = await userDataService.getUserData(phoneNumber);
      const customShortcuts = userData.customShortcuts || {};

      if (!customShortcuts[shortcut.toLowerCase()]) {
        throw ErrorFactory.createNotFoundError('Atalho personalizado');
      }

      const shortcutData = customShortcuts[shortcut.toLowerCase()];
      const targetUserData = await userDataService.getUserData(targetPhoneNumber);
      const targetShortcuts = targetUserData.customShortcuts || {};

      // Adicionar atalho ao usuário destino
      targetShortcuts[shortcut.toLowerCase()] = {
        ...shortcutData,
        sharedFrom: phoneNumber,
        sharedAt: new Date().toISOString(),
        usageCount: 0
      };

      await userDataService.updateUserData(targetPhoneNumber, {
        customShortcuts: targetShortcuts
      });

      logger.info('Shortcut shared', {
        fromPhone: phoneNumber.replace(/\d(?=\d{4})/g, '*'),
        toPhone: targetPhoneNumber.replace(/\d(?=\d{4})/g, '*'),
        shortcut: shortcut
      });

      return {
        success: true,
        shortcut: shortcut,
        command: shortcutData.command,
        targetPhone: targetPhoneNumber
      };

    } catch (error) {
      ErrorUtils.logError(error, {
        phoneNumber: phoneNumber?.replace(/\d(?=\d{4})/g, '*'),
        targetPhone: targetPhoneNumber?.replace(/\d(?=\d{4})/g, '*'),
        shortcut: shortcut
      });
      throw error;
    }
  }

  /**
   * Obter atalhos mais usados
   */
  async getMostUsedShortcuts(phoneNumber, limit = 5) {
    try {
      const userData = await userDataService.getUserData(phoneNumber);
      const customShortcuts = userData.customShortcuts || {};

      const shortcuts = Object.entries(customShortcuts)
        .map(([shortcut, data]) => ({
          shortcut: shortcut,
          command: data.command,
          description: data.description,
          usageCount: data.usageCount || 0,
          createdAt: data.createdAt
        }))
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, limit);

      return shortcuts;

    } catch (error) {
      ErrorUtils.logError(error, {
        phoneNumber: phoneNumber?.replace(/\d(?=\d{4})/g, '*')
      });
      return [];
    }
  }

  /**
   * Obter sugestões de atalhos
   */
  async getShortcutSuggestions(phoneNumber, text) {
    try {
      const suggestions = [];
      const userData = await userDataService.getUserData(phoneNumber);
      const customShortcuts = userData.customShortcuts || {};

      // Buscar atalhos personalizados que correspondem ao texto
      for (const [shortcut, data] of Object.entries(customShortcuts)) {
        if (shortcut.includes(text.toLowerCase()) || 
            data.description.toLowerCase().includes(text.toLowerCase())) {
          suggestions.push({
            shortcut: shortcut,
            command: data.command,
            description: data.description,
            type: 'custom'
          });
        }
      }

      // Buscar atalhos globais que correspondem ao texto
      for (const [shortcut, command] of this.globalShortcuts) {
        if (shortcut.includes(text.toLowerCase())) {
          suggestions.push({
            shortcut: shortcut,
            command: command,
            description: 'Atalho global',
            type: 'global'
          });
        }
      }

      return suggestions.slice(0, 5); // Limitar a 5 sugestões

    } catch (error) {
      ErrorUtils.logError(error, {
        phoneNumber: phoneNumber?.replace(/\d(?=\d{4})/g, '*'),
        text: text
      });
      return [];
    }
  }

  /**
   * Obter templates de atalhos
   */
  getShortcutTemplates() {
    return Array.from(this.shortcutTemplates.values());
  }

  /**
   * Obter categorias de atalhos
   */
  getShortcutCategories() {
    return Array.from(this.shortcutCategories.values());
  }

  /**
   * Obter estatísticas de atalhos
   */
  async getShortcutStats(phoneNumber) {
    try {
      const userData = await userDataService.getUserData(phoneNumber);
      const customShortcuts = userData.customShortcuts || {};

      const totalUsage = Object.values(customShortcuts)
        .reduce((sum, shortcut) => sum + (shortcut.usageCount || 0), 0);

      const mostUsed = await this.getMostUsedShortcuts(phoneNumber, 3);

      return {
        totalShortcuts: Object.keys(customShortcuts).length,
        totalUsage: totalUsage,
        mostUsed: mostUsed,
        globalShortcuts: this.globalShortcuts.size
      };

    } catch (error) {
      ErrorUtils.logError(error, {
        phoneNumber: phoneNumber?.replace(/\d(?=\d{4})/g, '*')
      });
      return {
        totalShortcuts: 0,
        totalUsage: 0,
        mostUsed: [],
        globalShortcuts: this.globalShortcuts.size
      };
    }
  }

  /**
   * Validar comando de atalho
   */
  validateShortcutCommand(command) {
    try {
      // Verificar se é um comando válido
      if (!command.startsWith('/')) {
        return { valid: false, error: 'Comando deve começar com /' };
      }

      // Verificar se não é um comando de atalho (evitar recursão)
      if (command.startsWith('/atalho')) {
        return { valid: false, error: 'Não é possível criar atalho para comandos de atalho' };
      }

      // Verificar se é um comando conhecido
      const commandName = command.split(' ')[0].substring(1);
      const knownCommands = [
        'start', 'ajuda', 'comandos', 'perfil', 'config', 'sobre', 'contato',
        'reset', 'exportar', 'deletar', 'lembrete', 'assinar', 'vozconfig',
        'agenda', 'resumo', 'tarefas', 'timer'
      ];

      if (!knownCommands.includes(commandName)) {
        return { valid: false, error: 'Comando não reconhecido' };
      }

      return { valid: true };

    } catch (error) {
      return { valid: false, error: 'Erro ao validar comando' };
    }
  }

  /**
   * Obter ajuda de atalhos
   */
  getShortcutHelp() {
    return {
      commands: [
        '/atalho add "nome" "comando" - Criar atalho personalizado',
        '/atalho edit "nome" "comando" - Editar atalho existente',
        '/atalho remove "nome" - Remover atalho',
        '/atalho list - Listar todos os atalhos',
        '/atalho search "texto" - Buscar atalhos',
        '/atalho share "nome" "telefone" - Compartilhar atalho',
        '/atalho stats - Estatísticas de uso',
        '/atalho help - Esta ajuda'
      ],
      examples: [
        '/atalho add "café" "/lembrete 15min fazer café"',
        '/atalho add "água" "/lembrete 1h beber água"',
        '/atalho add "voz" "/vozconfig"',
        '/atalho add "hoje" "/agenda"'
      ],
      templates: this.getShortcutTemplates(),
      categories: this.getShortcutCategories()
    };
  }
}

// Instância singleton
const shortcutService = new ShortcutService();

export default shortcutService;

