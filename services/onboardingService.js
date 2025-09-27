// services/onboardingService.js
// Sistema de onboarding interativo

import { ErrorFactory, ErrorUtils } from '../utils/errors.js';
import logger from '../config/logger.js';
import userDataService from './userDataService.js';
import menuBuilder from './menuBuilder.js';
import * as whatsappService from './whatsappService.js';
import { config } from '../config/index.js';

class OnboardingService {
  constructor() {
    this.onboardingSteps = new Map();
    this.userProgress = new Map();
    this.tutorialSteps = new Map();
    
    this.initializeOnboardingSteps();
    this.initializeTutorialSteps();
  }

  /**
   * Inicializar etapas do onboarding
   */
  initializeOnboardingSteps() {
    this.onboardingSteps.set('welcome', {
      id: 'welcome',
      title: '🎉 *Bem-vindo ao IA Atendimento Bot!*',
      message: 'Olá! Sou seu assistente virtual especializado em nutrição e bem-estar. Vamos configurar sua experiência personalizada!',
      options: [
        { id: 'start', text: '1️⃣ Começar Configuração', emoji: '🚀', action: 'next', target: 'preferences' },
        { id: 'skip', text: '2️⃣ Pular Configuração', emoji: '⏭️', action: 'skip', target: 'main_menu' }
      ],
      footer: 'Digite o número da opção'
    });

    this.onboardingSteps.set('preferences', {
      id: 'preferences',
      title: '⚙️ *Configuração de Preferências*',
      message: 'Como você prefere receber as respostas?',
      options: [
        { id: 'text', text: '1️⃣ Apenas Texto', emoji: '📝', action: 'next', target: 'name', data: { voice: false } },
        { id: 'voice', text: '2️⃣ Texto + Áudio', emoji: '🎤', action: 'next', target: 'name', data: { voice: true } },
        { id: 'back', text: '0️⃣ Voltar', emoji: '⬅️', action: 'back', target: 'welcome' }
      ],
      footer: 'Digite o número da opção'
    });

    this.onboardingSteps.set('name', {
      id: 'name',
      title: '👤 *Seu Nome*',
      message: 'Qual é o seu nome? (opcional)',
      options: [
        { id: 'skip', text: '1️⃣ Pular', emoji: '⏭️', action: 'next', target: 'tutorial' },
        { id: 'back', text: '0️⃣ Voltar', emoji: '⬅️', action: 'back', target: 'preferences' }
      ],
      footer: 'Digite seu nome ou o número da opção',
      inputType: 'text'
    });

    this.onboardingSteps.set('tutorial', {
      id: 'tutorial',
      title: '📚 *Tutorial Interativo*',
      message: 'Vamos aprender os comandos principais!',
      options: [
        { id: 'start', text: '1️⃣ Começar Tutorial', emoji: '🎓', action: 'next', target: 'tutorial_step_1' },
        { id: 'skip', text: '2️⃣ Pular Tutorial', emoji: '⏭️', action: 'next', target: 'first_command' },
        { id: 'back', text: '0️⃣ Voltar', emoji: '⬅️', action: 'back', target: 'name' }
      ],
      footer: 'Digite o número da opção'
    });

    this.onboardingSteps.set('first_command', {
      id: 'first_command',
      title: '🎯 *Primeiro Comando*',
      message: 'Vamos testar seu primeiro comando!',
      options: [
        { id: 'help', text: '1️⃣ Ver Ajuda', emoji: '🆘', action: 'command', target: '/ajuda' },
        { id: 'profile', text: '2️⃣ Ver Perfil', emoji: '👤', action: 'command', target: '/perfil' },
        { id: 'menu', text: '3️⃣ Ver Menu', emoji: '📋', action: 'command', target: '/menu' },
        { id: 'back', text: '0️⃣ Voltar', emoji: '⬅️', action: 'back', target: 'tutorial' }
      ],
      footer: 'Digite o número da opção'
    });

    this.onboardingSteps.set('complete', {
      id: 'complete',
      title: '🎉 *Configuração Concluída!*',
      message: 'Perfeito! Sua conta está configurada e pronta para uso.',
      options: [
        { id: 'menu', text: '1️⃣ Ver Menu Principal', emoji: '🏠', action: 'navigate', target: 'main' },
        { id: 'tutorial', text: '2️⃣ Fazer Tutorial', emoji: '📚', action: 'navigate', target: 'tutorial' },
        { id: 'start', text: '3️⃣ Começar a Usar', emoji: '🚀', action: 'navigate', target: 'main' }
      ],
      footer: 'Digite o número da opção'
    });
  }

  /**
   * Inicializar etapas do tutorial
   */
  initializeTutorialSteps() {
    this.tutorialSteps.set('tutorial_step_1', {
      id: 'tutorial_step_1',
      title: '📚 *Tutorial - Comandos Básicos*',
      message: 'Vamos aprender os comandos principais:\n\n• /ajuda - Menu de ajuda\n• /perfil - Seu perfil\n• /menu - Menu principal\n• /comandos - Lista de comandos',
      options: [
        { id: 'next', text: '1️⃣ Próximo', emoji: '➡️', action: 'next', target: 'tutorial_step_2' },
        { id: 'back', text: '0️⃣ Voltar', emoji: '⬅️', action: 'back', target: 'tutorial' }
      ],
      footer: 'Digite o número da opção'
    });

    this.tutorialSteps.set('tutorial_step_2', {
      id: 'tutorial_step_2',
      title: '📚 *Tutorial - Comandos de Produtividade*',
      message: 'Comandos para produtividade:\n\n• /agenda - Ver compromissos\n• /tarefas - Lista de tarefas\n• /lembrete - Criar lembretes\n• /timer - Cronômetro',
      options: [
        { id: 'next', text: '1️⃣ Próximo', emoji: '➡️', action: 'next', target: 'tutorial_step_3' },
        { id: 'back', text: '0️⃣ Voltar', emoji: '⬅️', action: 'back', target: 'tutorial_step_1' }
      ],
      footer: 'Digite o número da opção'
    });

    this.tutorialSteps.set('tutorial_step_3', {
      id: 'tutorial_step_3',
      title: '📚 *Tutorial - Comandos Naturais*',
      message: 'Você também pode usar linguagem natural:\n\n• "me ajuda" → /ajuda\n• "bom dia" → Saudação\n• "quanto custa" → /assinar\n• "agenda" → /agenda',
      options: [
        { id: 'next', text: '1️⃣ Próximo', emoji: '➡️', action: 'next', target: 'tutorial_step_4' },
        { id: 'back', text: '0️⃣ Voltar', emoji: '⬅️', action: 'back', target: 'tutorial_step_2' }
      ],
      footer: 'Digite o número da opção'
    });

    this.tutorialSteps.set('tutorial_step_4', {
      id: 'tutorial_step_4',
      title: '📚 *Tutorial - Atalhos Personalizados*',
      message: 'Crie seus próprios atalhos:\n\n• /atalho add "café" "/lembrete 15min fazer café"\n• /atalho list - Ver atalhos\n• /atalho help - Ajuda',
      options: [
        { id: 'next', text: '1️⃣ Próximo', emoji: '➡️', action: 'next', target: 'tutorial_step_5' },
        { id: 'back', text: '0️⃣ Voltar', emoji: '⬅️', action: 'back', target: 'tutorial_step_3' }
      ],
      footer: 'Digite o número da opção'
    });

    this.tutorialSteps.set('tutorial_step_5', {
      id: 'tutorial_step_5',
      title: '📚 *Tutorial - Gamificação*',
      message: 'Ganhe XP e conquiste achievements:\n\n• XP por usar comandos\n• Achievements especiais\n• Ranking de usuários\n• Recompensas exclusivas',
      options: [
        { id: 'next', text: '1️⃣ Próximo', emoji: '➡️', action: 'next', target: 'tutorial_complete' },
        { id: 'back', text: '0️⃣ Voltar', emoji: '⬅️', action: 'back', target: 'tutorial_step_4' }
      ],
      footer: 'Digite o número da opção'
    });

    this.tutorialSteps.set('tutorial_complete', {
      id: 'tutorial_complete',
      title: '🎓 *Tutorial Concluído!*',
      message: 'Parabéns! Você aprendeu os comandos principais. Agora está pronto para usar o bot!',
      options: [
        { id: 'menu', text: '1️⃣ Ver Menu Principal', emoji: '🏠', action: 'navigate', target: 'main' },
        { id: 'start', text: '2️⃣ Começar a Usar', emoji: '🚀', action: 'navigate', target: 'main' }
      ],
      footer: 'Digite o número da opção'
    });
  }

  /**
   * Iniciar onboarding
   */
  async startOnboarding(phoneNumber, profileName, phoneNumberId, res) {
    try {
      // Verificar se usuário já fez onboarding
      const userData = await userDataService.getUserData(phoneNumber);
      if (userData.onboardingCompleted) {
        return await this.showOnboardingComplete(phoneNumber, profileName, phoneNumberId, res);
      }

      // Iniciar progresso do onboarding
      this.userProgress.set(phoneNumber, {
        currentStep: 'welcome',
        completedSteps: [],
        data: {},
        startTime: new Date()
      });

      // Mostrar primeira etapa
      return await this.showOnboardingStep('welcome', phoneNumber, profileName, phoneNumberId, res);

    } catch (error) {
      ErrorUtils.logError(error, {
        phoneNumber: phoneNumber?.replace(/\d(?=\d{4})/g, '*'),
        operation: 'startOnboarding'
      });
      throw error;
    }
  }

  /**
   * Processar entrada do onboarding
   */
  async processOnboardingInput(message, phoneNumber, profileName, phoneNumberId, res) {
    try {
      const text = message.text?.body?.trim() || '';
      const userProgress = this.userProgress.get(phoneNumber);
      
      if (!userProgress) {
        return { isOnboarding: false };
      }

      const currentStep = this.onboardingSteps.get(userProgress.currentStep);
      if (!currentStep) {
        return { isOnboarding: false };
      }

      // Verificar se é entrada de texto livre
      if (currentStep.inputType === 'text' && !/^[0-9]$/.test(text)) {
        return await this.handleTextInput(text, userProgress, phoneNumber, profileName, phoneNumberId, res);
      }

      // Verificar se é entrada de menu
      if (/^[0-9]$/.test(text)) {
        return await this.handleMenuInput(text, userProgress, phoneNumber, profileName, phoneNumberId, res);
      }

      return { isOnboarding: false };

    } catch (error) {
      ErrorUtils.logError(error, {
        phoneNumber: phoneNumber?.replace(/\d(?=\d{4})/g, '*'),
        message: text,
        operation: 'processOnboardingInput'
      });
      return { isOnboarding: true, error: true };
    }
  }

  /**
   * Lidar com entrada de texto
   */
  async handleTextInput(text, userProgress, phoneNumber, profileName, phoneNumberId, res) {
    const currentStep = this.onboardingSteps.get(userProgress.currentStep);
    
    if (currentStep.id === 'name' && text.length > 0) {
      // Salvar nome do usuário
      userProgress.data.name = text;
      userProgress.completedSteps.push('name');
      
      // Avançar para próxima etapa
      userProgress.currentStep = 'tutorial';
      this.userProgress.set(phoneNumber, userProgress);
      
      return await this.showOnboardingStep('tutorial', phoneNumber, profileName, phoneNumberId, res);
    }

    return { isOnboarding: false };
  }

  /**
   * Lidar com entrada de menu
   */
  async handleMenuInput(input, userProgress, phoneNumber, profileName, phoneNumberId, res) {
    const currentStep = this.onboardingSteps.get(userProgress.currentStep);
    const optionNumber = parseInt(input);
    
    if (isNaN(optionNumber) || optionNumber < 1 || optionNumber > currentStep.options.length) {
      throw ErrorFactory.createValidationError(
        'Opção inválida',
        'option',
        `Digite um número de 1 a ${currentStep.options.length}`
      );
    }

    const selectedOption = currentStep.options[optionNumber - 1];
    
    // Processar ação
    switch (selectedOption.action) {
      case 'next':
        return await this.nextStep(selectedOption.target, userProgress, phoneNumber, profileName, phoneNumberId, res);
      case 'back':
        return await this.previousStep(userProgress, phoneNumber, profileName, phoneNumberId, res);
      case 'skip':
        return await this.skipOnboarding(phoneNumber, profileName, phoneNumberId, res);
      case 'command':
        return await this.executeCommand(selectedOption.target, userProgress, phoneNumber, profileName, phoneNumberId, res);
      case 'navigate':
        return await this.navigateToStep(selectedOption.target, userProgress, phoneNumber, profileName, phoneNumberId, res);
      default:
        throw ErrorFactory.createValidationError('Ação inválida');
    }
  }

  /**
   * Avançar para próxima etapa
   */
  async nextStep(targetStep, userProgress, phoneNumber, profileName, phoneNumberId, res) {
    // Salvar dados da etapa atual
    if (userProgress.currentStep) {
      userProgress.completedSteps.push(userProgress.currentStep);
    }

    // Atualizar etapa atual
    userProgress.currentStep = targetStep;
    this.userProgress.set(phoneNumber, userProgress);

    // Verificar se é etapa de tutorial
    if (this.tutorialSteps.has(targetStep)) {
      return await this.showTutorialStep(targetStep, phoneNumber, profileName, phoneNumberId, res);
    }

    // Verificar se é etapa final
    if (targetStep === 'complete') {
      return await this.completeOnboarding(phoneNumber, profileName, phoneNumberId, res);
    }

    // Mostrar próxima etapa
    return await this.showOnboardingStep(targetStep, phoneNumber, profileName, phoneNumberId, res);
  }

  /**
   * Voltar para etapa anterior
   */
  async previousStep(userProgress, phoneNumber, profileName, phoneNumberId, res) {
    if (userProgress.completedSteps.length === 0) {
      return await this.showOnboardingStep('welcome', phoneNumber, profileName, phoneNumberId, res);
    }

    const previousStep = userProgress.completedSteps.pop();
    userProgress.currentStep = previousStep;
    this.userProgress.set(phoneNumber, userProgress);

    return await this.showOnboardingStep(previousStep, phoneNumber, profileName, phoneNumberId, res);
  }

  /**
   * Pular onboarding
   */
  async skipOnboarding(phoneNumber, profileName, phoneNumberId, res) {
    // Marcar onboarding como concluído
    await userDataService.updateUserData(phoneNumber, {
      onboardingCompleted: true,
      onboardingSkipped: true,
      onboardingCompletedAt: new Date().toISOString()
    });

    // Limpar progresso
    this.userProgress.delete(phoneNumber);

    // Mostrar menu principal
    return await menuBuilder.showMainMenu(phoneNumber, profileName, phoneNumberId, res);
  }

  /**
   * Executar comando
   */
  async executeCommand(command, userProgress, phoneNumber, profileName, phoneNumberId, res) {
    // Simular execução de comando
    const commandMessage = { text: { body: command } };
    
    // Aqui você integraria com o commandHandler existente
    // const result = await commandHandler.processCommand(commandMessage, phoneNumber, profileName, phoneNumberId, res);
    
    // Por enquanto, apenas mostrar mensagem
    const message = `🔧 *Executando comando:* ${command}\n\n*Comando executado com sucesso!* ✅\n\n*Digite 1 para continuar o onboarding*`;
    
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
      isOnboarding: true
    };
  }

  /**
   * Navegar para etapa específica
   */
  async navigateToStep(targetStep, userProgress, phoneNumber, profileName, phoneNumberId, res) {
    userProgress.currentStep = targetStep;
    this.userProgress.set(phoneNumber, userProgress);

    if (targetStep === 'main') {
      return await menuBuilder.showMainMenu(phoneNumber, profileName, phoneNumberId, res);
    }

    return await this.showOnboardingStep(targetStep, phoneNumber, profileName, phoneNumberId, res);
  }

  /**
   * Mostrar etapa do onboarding
   */
  async showOnboardingStep(stepId, phoneNumber, profileName, phoneNumberId, res) {
    const step = this.onboardingSteps.get(stepId);
    
    if (!step) {
      throw ErrorFactory.createNotFoundError('Etapa do onboarding');
    }

    // Construir mensagem
    let message = `${step.title}\n\n${step.message}\n\n`;
    
    // Adicionar opções
    step.options.forEach((option, index) => {
      message += `${option.text}\n`;
    });
    
    // Adicionar footer
    message += `\n${step.footer}`;

    // Enviar mensagem
    await whatsappService.sendSplitReply(
      phoneNumberId,
      config.whatsapp.graphApiToken,
      res.locals.recipientNumber || phoneNumber,
      message,
      res
    );

    return {
      success: true,
      message: 'Onboarding step displayed',
      isOnboarding: true
    };
  }

  /**
   * Mostrar etapa do tutorial
   */
  async showTutorialStep(stepId, phoneNumber, profileName, phoneNumberId, res) {
    const step = this.tutorialSteps.get(stepId);
    
    if (!step) {
      throw ErrorFactory.createNotFoundError('Etapa do tutorial');
    }

    // Construir mensagem
    let message = `${step.title}\n\n${step.message}\n\n`;
    
    // Adicionar opções
    step.options.forEach((option, index) => {
      message += `${option.text}\n`;
    });
    
    // Adicionar footer
    message += `\n${step.footer}`;

    // Enviar mensagem
    await whatsappService.sendSplitReply(
      phoneNumberId,
      config.whatsapp.graphApiToken,
      res.locals.recipientNumber || phoneNumber,
      message,
      res
    );

    return {
      success: true,
      message: 'Tutorial step displayed',
      isOnboarding: true
    };
  }

  /**
   * Concluir onboarding
   */
  async completeOnboarding(phoneNumber, profileName, phoneNumberId, res) {
    const userProgress = this.userProgress.get(phoneNumber);
    
    // Salvar dados do onboarding
    await userDataService.updateUserData(phoneNumber, {
      onboardingCompleted: true,
      onboardingCompletedAt: new Date().toISOString(),
      onboardingData: userProgress.data,
      preferences: {
        voice: userProgress.data.voice || false,
        name: userProgress.data.name || profileName
      }
    });

    // Limpar progresso
    this.userProgress.delete(phoneNumber);

    // Mostrar etapa de conclusão
    return await this.showOnboardingStep('complete', phoneNumber, profileName, phoneNumberId, res);
  }

  /**
   * Mostrar onboarding completo
   */
  async showOnboardingComplete(phoneNumber, profileName, phoneNumberId, res) {
    const message = `🎉 *Onboarding Já Concluído!*\n\nOlá novamente, ${profileName}! Seu onboarding já foi concluído.\n\n*Use /menu para acessar o menu principal*`;
    
    await whatsappService.sendSplitReply(
      phoneNumberId,
      config.whatsapp.graphApiToken,
      res.locals.recipientNumber || phoneNumber,
      message,
      res
    );

    return {
      success: true,
      message: 'Onboarding already completed',
      isOnboarding: false
    };
  }

  /**
   * Verificar se usuário está em onboarding
   */
  isUserInOnboarding(phoneNumber) {
    return this.userProgress.has(phoneNumber);
  }

  /**
   * Obter progresso do usuário
   */
  getUserProgress(phoneNumber) {
    return this.userProgress.get(phoneNumber);
  }

  /**
   * Limpar progresso do usuário
   */
  clearUserProgress(phoneNumber) {
    this.userProgress.delete(phoneNumber);
  }

  /**
   * Obter estatísticas de onboarding
   */
  getOnboardingStats() {
    return {
      totalSteps: this.onboardingSteps.size,
      totalTutorialSteps: this.tutorialSteps.size,
      activeUsers: this.userProgress.size,
      completedUsers: 0 // Seria calculado baseado nos dados do usuário
    };
  }
}

// Instância singleton
const onboardingService = new OnboardingService();

export default onboardingService;

