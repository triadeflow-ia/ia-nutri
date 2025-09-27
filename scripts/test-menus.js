// scripts/test-menus.js
// Script para testar sistema de menus interativos

import menuBuilder from '../services/menuBuilder.js';
import onboardingService from '../services/onboardingService.js';
import gamificationService from '../services/gamificationService.js';
import logger from '../config/logger.js';

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Testar menu builder
 */
async function testMenuBuilder() {
  log('\n🏠 Testando Menu Builder', 'cyan');
  log('=' * 50, 'cyan');

  try {
    // Testar obtenção de menu principal
    log('\n📋 Testando menu principal...', 'yellow');
    const mainMenu = menuBuilder.getMenu('main');
    
    if (mainMenu) {
      log(`   ✅ Menu principal encontrado: ${mainMenu.title}`, 'green');
      log(`   ✅ Opções: ${mainMenu.options.length}`, 'green');
    } else {
      log(`   ❌ Menu principal não encontrado`, 'red');
    }

    // Testar listagem de todos os menus
    log('\n📋 Testando listagem de menus...', 'yellow');
    const allMenus = menuBuilder.getAllMenus();
    
    if (allMenus.length > 0) {
      log(`   ✅ Menus encontrados: ${allMenus.length}`, 'green');
      allMenus.forEach(menu => {
        log(`      • ${menu.id}: ${menu.title}`, 'blue');
      });
    } else {
      log(`   ❌ Nenhum menu encontrado`, 'red');
    }

    // Testar estatísticas
    log('\n📋 Testando estatísticas...', 'yellow');
    const stats = menuBuilder.getMenuStats();
    
    log(`   ✅ Total de menus: ${stats.totalMenus}`, 'green');
    log(`   ✅ Usuários ativos: ${stats.activeUsers}`, 'green');
    log(`   ✅ Tipos de menu: ${stats.menuTypes.join(', ')}`, 'green');

  } catch (error) {
    log(`   ❌ Erro: ${error.message}`, 'red');
  }
}

/**
 * Testar onboarding service
 */
async function testOnboardingService() {
  log('\n🎓 Testando Onboarding Service', 'cyan');
  log('=' * 50, 'cyan');

  try {
    // Testar verificação de usuário em onboarding
    log('\n📋 Testando verificação de onboarding...', 'yellow');
    const testPhoneNumber = '+5511999999999';
    const isInOnboarding = onboardingService.isUserInOnboarding(testPhoneNumber);
    
    if (!isInOnboarding) {
      log(`   ✅ Usuário não está em onboarding (correto)`, 'green');
    } else {
      log(`   ⚠️  Usuário está em onboarding`, 'yellow');
    }

    // Testar estatísticas de onboarding
    log('\n📋 Testando estatísticas de onboarding...', 'yellow');
    const stats = onboardingService.getOnboardingStats();
    
    log(`   ✅ Total de etapas: ${stats.totalSteps}`, 'green');
    log(`   ✅ Total de etapas de tutorial: ${stats.totalTutorialSteps}`, 'green');
    log(`   ✅ Usuários ativos: ${stats.activeUsers}`, 'green');

  } catch (error) {
    log(`   ❌ Erro: ${error.message}`, 'red');
  }
}

/**
 * Testar gamification service
 */
async function testGamificationService() {
  log('\n🎮 Testando Gamification Service', 'cyan');
  log('=' * 50, 'cyan');

  try {
    // Testar obtenção de achievements
    log('\n📋 Testando achievements...', 'yellow');
    const allAchievements = gamificationService.getAllAchievements();
    
    if (allAchievements.length > 0) {
      log(`   ✅ Achievements encontrados: ${allAchievements.length}`, 'green');
      
      // Mostrar alguns achievements
      allAchievements.slice(0, 3).forEach(achievement => {
        log(`      • ${achievement.emoji} ${achievement.name} (${achievement.rarity})`, 'blue');
      });
    } else {
      log(`   ❌ Nenhum achievement encontrado`, 'red');
    }

    // Testar achievements por categoria
    log('\n📋 Testando achievements por categoria...', 'yellow');
    const categories = ['first_time', 'frequency', 'commands', 'productivity', 'special'];
    
    categories.forEach(category => {
      const achievements = gamificationService.getAchievementsByCategory(category);
      log(`   ✅ ${category}: ${achievements.length} achievements`, 'green');
    });

    // Testar achievements por raridade
    log('\n📋 Testando achievements por raridade...', 'yellow');
    const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    
    rarities.forEach(rarity => {
      const achievements = gamificationService.getAchievementsByRarity(rarity);
      log(`   ✅ ${rarity}: ${achievements.length} achievements`, 'green');
    });

    // Testar cálculo de nível
    log('\n📋 Testando cálculo de nível...', 'yellow');
    const testXPs = [0, 100, 400, 900, 1600, 2500];
    
    testXPs.forEach(xp => {
      const level = gamificationService.calculateLevel(xp);
      log(`   ✅ ${xp} XP = Nível ${level}`, 'green');
    });

    // Testar estatísticas gerais
    log('\n📋 Testando estatísticas gerais...', 'yellow');
    const generalStats = gamificationService.getGeneralStats();
    
    log(`   ✅ Total de achievements: ${generalStats.totalAchievements}`, 'green');
    log(`   ✅ Total de recompensas de XP: ${generalStats.totalXPRewards}`, 'green');
    log(`   ✅ Categorias: ${generalStats.achievementCategories.join(', ')}`, 'green');

  } catch (error) {
    log(`   ❌ Erro: ${error.message}`, 'red');
  }
}

/**
 * Testar processamento de entrada de menu
 */
async function testMenuInputProcessing() {
  log('\n🔄 Testando Processamento de Entrada de Menu', 'cyan');
  log('=' * 50, 'cyan');

  const testCases = [
    { input: '1', expected: true, description: 'Número válido' },
    { input: '2', expected: true, description: 'Número válido' },
    { input: '9', expected: true, description: 'Número válido' },
    { input: '0', expected: true, description: 'Zero (voltar)' },
    { input: '/menu', expected: true, description: 'Comando de menu' },
    { input: 'menu', expected: true, description: 'Palavra menu' },
    { input: 'voltar', expected: true, description: 'Comando voltar' },
    { input: 'back', expected: true, description: 'Comando back' },
    { input: '10', expected: false, description: 'Número inválido' },
    { input: 'a', expected: false, description: 'Letra' },
    { input: 'olá', expected: false, description: 'Texto normal' }
  ];

  for (const testCase of testCases) {
    try {
      log(`\n📋 Testando: "${testCase.input}"`, 'yellow');
      
      const isMenuInput = menuBuilder.isMenuInput(testCase.input);
      
      if (isMenuInput === testCase.expected) {
        log(`   ✅ Resultado correto: ${isMenuInput}`, 'green');
      } else {
        log(`   ❌ Esperado: ${testCase.expected}, Obtido: ${isMenuInput}`, 'red');
      }
    } catch (error) {
      log(`   ❌ Erro: ${error.message}`, 'red');
    }
  }
}

/**
 * Testar navegação de menus
 */
async function testMenuNavigation() {
  log('\n🧭 Testando Navegação de Menus', 'cyan');
  log('=' * 50, 'cyan');

  const testPhoneNumber = '+5511999999999';
  const profileName = 'Teste';
  const phoneNumberId = 'test_phone_id';
  
  // Mock response object
  const mockRes = {
    locals: { recipientNumber: testPhoneNumber },
    headersSent: false
  };

  try {
    // Testar navegação para menu de comandos
    log('\n📋 Testando navegação para menu de comandos...', 'yellow');
    
    const message = { text: { body: '1' } };
    const result = await menuBuilder.processMenuInput(
      message, testPhoneNumber, profileName, phoneNumberId, mockRes
    );
    
    if (result.isMenu) {
      log(`   ✅ Navegação para menu de comandos funcionou`, 'green');
    } else {
      log(`   ❌ Navegação para menu de comandos falhou`, 'red');
    }

    // Testar navegação para menu de configurações
    log('\n📋 Testando navegação para menu de configurações...', 'yellow');
    
    const message2 = { text: { body: '2' } };
    const result2 = await menuBuilder.processMenuInput(
      message2, testPhoneNumber, profileName, phoneNumberId, mockRes
    );
    
    if (result2.isMenu) {
      log(`   ✅ Navegação para menu de configurações funcionou`, 'green');
    } else {
      log(`   ❌ Navegação para menu de configurações falhou`, 'red');
    }

    // Testar comando de menu
    log('\n📋 Testando comando /menu...', 'yellow');
    
    const message3 = { text: { body: '/menu' } };
    const result3 = await menuBuilder.processMenuInput(
      message3, testPhoneNumber, profileName, phoneNumberId, mockRes
    );
    
    if (result3.isMenu) {
      log(`   ✅ Comando /menu funcionou`, 'green');
    } else {
      log(`   ❌ Comando /menu falhou`, 'red');
    }

  } catch (error) {
    log(`   ❌ Erro: ${error.message}`, 'red');
  }
}

/**
 * Testar sistema de gamificação
 */
async function testGamificationSystem() {
  log('\n🎮 Testando Sistema de Gamificação', 'cyan');
  log('=' * 50, 'cyan');

  const testPhoneNumber = '+5511999999999';

  try {
    // Testar adição de XP
    log('\n📋 Testando adição de XP...', 'yellow');
    
    const xpResult = await gamificationService.addXP(testPhoneNumber, 'message');
    
    if (xpResult.xpAdded > 0) {
      log(`   ✅ XP adicionado: ${xpResult.xpAdded}`, 'green');
      log(`   ✅ Total de XP: ${xpResult.totalXP}`, 'green');
      log(`   ✅ Nível: ${xpResult.level}`, 'green');
    } else {
      log(`   ❌ Falha ao adicionar XP`, 'red');
    }

    // Testar estatísticas do usuário
    log('\n📋 Testando estatísticas do usuário...', 'yellow');
    
    const userStats = await gamificationService.getUserStats(testPhoneNumber);
    
    if (userStats) {
      log(`   ✅ XP: ${userStats.xp}`, 'green');
      log(`   ✅ Nível: ${userStats.level}`, 'green');
      log(`   ✅ Achievements: ${userStats.achievements}`, 'green');
      log(`   ✅ Progresso do nível: ${userStats.levelProgress.toFixed(1)}%`, 'green');
    } else {
      log(`   ❌ Falha ao obter estatísticas do usuário`, 'red');
    }

    // Testar leaderboard
    log('\n📋 Testando leaderboard...', 'yellow');
    
    const leaderboard = await gamificationService.getLeaderboard(5);
    
    if (leaderboard.length > 0) {
      log(`   ✅ Leaderboard obtido: ${leaderboard.length} usuários`, 'green');
      leaderboard.forEach((user, index) => {
        log(`      ${index + 1}. ${user.phoneNumber}: ${user.xp} XP (Nível ${user.level})`, 'blue');
      });
    } else {
      log(`   ❌ Falha ao obter leaderboard`, 'red');
    }

  } catch (error) {
    log(`   ❌ Erro: ${error.message}`, 'red');
  }
}

/**
 * Testar integração completa
 */
async function testCompleteIntegration() {
  log('\n🔗 Testando Integração Completa', 'cyan');
  log('=' * 50, 'cyan');

  const testPhoneNumber = '+5511999999999';
  const profileName = 'Teste';
  const phoneNumberId = 'test_phone_id';
  
  // Mock response object
  const mockRes = {
    locals: { recipientNumber: testPhoneNumber },
    headersSent: false
  };

  try {
    // Testar fluxo completo: menu -> comando -> gamificação
    log('\n📋 Testando fluxo completo...', 'yellow');
    
    // 1. Mostrar menu principal
    log('   1. Mostrando menu principal...', 'blue');
    await menuBuilder.showMainMenu(testPhoneNumber, profileName, phoneNumberId, mockRes);
    
    // 2. Navegar para menu de comandos
    log('   2. Navegando para menu de comandos...', 'blue');
    const message1 = { text: { body: '1' } };
    await menuBuilder.processMenuInput(message1, testPhoneNumber, profileName, phoneNumberId, mockRes);
    
    // 3. Adicionar XP
    log('   3. Adicionando XP...', 'blue');
    const xpResult = await gamificationService.addXP(testPhoneNumber, 'menu_used');
    
    if (xpResult.xpAdded > 0) {
      log(`   ✅ Fluxo completo funcionou! XP adicionado: ${xpResult.xpAdded}`, 'green');
    } else {
      log(`   ❌ Falha no fluxo completo`, 'red');
    }

  } catch (error) {
    log(`   ❌ Erro no fluxo completo: ${error.message}`, 'red');
  }
}

/**
 * Testar breadcrumbs
 */
async function testBreadcrumbs() {
  log('\n🍞 Testando Breadcrumbs', 'cyan');
  log('=' * 50, 'cyan');

  const testPhoneNumber = '+5511999999999';

  try {
    // Simular navegação e verificar breadcrumbs
    log('\n📋 Testando breadcrumbs...', 'yellow');
    
    // Simular estado de usuário
    menuBuilder.updateUserState(testPhoneNumber, {
      currentMenu: 'commands',
      history: ['main', 'commands'],
      breadcrumb: ['Menu Principal', 'Comandos Úteis']
    });
    
    const breadcrumb = menuBuilder.getBreadcrumb(testPhoneNumber);
    
    if (breadcrumb.length > 0) {
      log(`   ✅ Breadcrumb obtido: ${breadcrumb.join(' > ')}`, 'green');
    } else {
      log(`   ❌ Falha ao obter breadcrumb`, 'red');
    }

  } catch (error) {
    log(`   ❌ Erro: ${error.message}`, 'red');
  }
}

/**
 * Função principal
 */
async function runAllTests() {
  log('🚀 Iniciando Testes de Menus Interativos', 'bright');
  log('=' * 60, 'cyan');

  try {
    await testMenuBuilder();
    await testOnboardingService();
    await testGamificationService();
    await testMenuInputProcessing();
    await testMenuNavigation();
    await testGamificationSystem();
    await testCompleteIntegration();
    await testBreadcrumbs();

    log('\n🎉 Todos os testes concluídos!', 'green');
    log('📊 Verifique os logs para mais detalhes', 'yellow');

  } catch (error) {
    log(`\n❌ Erro geral nos testes: ${error.message}`, 'red');
    console.error(error.stack);
  }
}

// Verificar argumentos da linha de comando
const args = process.argv.slice(2);

if (args.length > 0) {
  const command = args[0];
  
  switch (command) {
    case 'menus':
      testMenuBuilder();
      break;
    case 'onboarding':
      testOnboardingService();
      break;
    case 'gamification':
      testGamificationService();
      break;
    case 'input':
      testMenuInputProcessing();
      break;
    case 'navigation':
      testMenuNavigation();
      break;
    case 'gamification-system':
      testGamificationSystem();
      break;
    case 'integration':
      testCompleteIntegration();
      break;
    case 'breadcrumbs':
      testBreadcrumbs();
      break;
    default:
      log('Comandos disponíveis:', 'yellow');
      log('  node test-menus.js menus           - Testar menu builder', 'blue');
      log('  node test-menus.js onboarding      - Testar onboarding service', 'blue');
      log('  node test-menus.js gamification    - Testar gamification service', 'blue');
      log('  node test-menus.js input           - Testar processamento de entrada', 'blue');
      log('  node test-menus.js navigation      - Testar navegação de menus', 'blue');
      log('  node test-menus.js gamification-system - Testar sistema de gamificação', 'blue');
      log('  node test-menus.js integration     - Testar integração completa', 'blue');
      log('  node test-menus.js breadcrumbs     - Testar breadcrumbs', 'blue');
      log('  node test-menus.js (executa todos os testes)', 'blue');
  }
} else {
  runAllTests();
}

