// scripts/test-commands.js
// Script para testar o sistema de comandos

import commandHandler from '../services/commandHandler.js';
import userDataService from '../services/userDataService.js';
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
 * Testar parser de comandos
 */
async function testCommandParser() {
  log('\n🧪 Testando Parser de Comandos', 'cyan');
  log('=' * 50, 'cyan');

  const testCases = [
    {
      input: '/start',
      expected: { command: 'start', parameters: {} }
    },
    {
      input: '/ajuda geral',
      expected: { command: 'ajuda', parameters: { 0: 'geral' } }
    },
    {
      input: '/lembrete 10min "tomar remédio"',
      expected: { command: 'lembrete', parameters: { 0: '10min', 1: 'tomar remédio' } }
    },
    {
      input: '/perfil editar',
      expected: { command: 'perfil', parameters: { 0: 'editar' } }
    },
    {
      input: '!help',
      expected: { command: 'ajuda', parameters: {} }
    },
    {
      input: '/?',
      expected: { command: 'ajuda', parameters: {} }
    },
    {
      input: 'Olá, como você está?',
      expected: null
    }
  ];

  for (const testCase of testCases) {
    try {
      log(`\n📋 Testando: "${testCase.input}"`, 'yellow');
      
      const result = commandHandler.parseCommand({ text: { body: testCase.input } });
      
      if (testCase.expected === null) {
        if (result === null) {
          log(`   ✅ Não é comando (correto)`, 'green');
        } else {
          log(`   ❌ Deveria ser null, mas retornou: ${JSON.stringify(result)}`, 'red');
        }
      } else {
        if (result && result.command === testCase.expected.command) {
          log(`   ✅ Comando: ${result.command}`, 'green');
          log(`   ✅ Parâmetros: ${JSON.stringify(result.parameters)}`, 'green');
        } else {
          log(`   ❌ Esperado: ${JSON.stringify(testCase.expected)}`, 'red');
          log(`   ❌ Obtido: ${JSON.stringify(result)}`, 'red');
        }
      }
    } catch (error) {
      log(`   ❌ Erro: ${error.message}`, 'red');
    }
  }
}

/**
 * Testar aliases
 */
async function testAliases() {
  log('\n🔗 Testando Aliases', 'cyan');
  log('=' * 50, 'cyan');

  const aliasTests = [
    { input: '/help', expected: 'ajuda' },
    { input: '/?', expected: 'ajuda' },
    { input: '/socorro', expected: 'ajuda' },
    { input: '/inicio', expected: 'start' },
    { input: '/começar', expected: 'start' },
    { input: '/profile', expected: 'perfil' },
    { input: '/me', expected: 'perfil' },
    { input: '/commands', expected: 'comandos' },
    { input: '/lista', expected: 'comandos' },
    { input: '/about', expected: 'sobre' },
    { input: '/info', expected: 'sobre' },
    { input: '/contact', expected: 'contato' },
    { input: '/suporte', expected: 'contato' },
    { input: '/support', expected: 'contato' },
    { input: '/clear', expected: 'reset' },
    { input: '/limpar', expected: 'reset' },
    { input: '/export', expected: 'exportar' },
    { input: '/dados', expected: 'exportar' },
    { input: '/delete', expected: 'deletar' },
    { input: '/apagar', expected: 'deletar' },
    { input: '/reminder', expected: 'lembrete' },
    { input: '/lembrar', expected: 'lembrete' },
    { input: '/subscribe', expected: 'assinar' },
    { input: '/premium', expected: 'assinar' },
    { input: '/pagar', expected: 'assinar' },
    { input: '/voiceconfig', expected: 'vozconfig' },
    { input: '/voz', expected: 'vozconfig' }
  ];

  for (const test of aliasTests) {
    try {
      log(`\n📋 Testando: "${test.input}"`, 'yellow');
      
      const result = commandHandler.parseCommand({ text: { body: test.input } });
      
      if (result && result.command === test.expected) {
        log(`   ✅ Alias correto: ${test.input} -> ${result.command}`, 'green');
      } else {
        log(`   ❌ Esperado: ${test.expected}, Obtido: ${result?.command}`, 'red');
      }
    } catch (error) {
      log(`   ❌ Erro: ${error.message}`, 'red');
    }
  }
}

/**
 * Testar sugestões contextuais
 */
async function testContextualSuggestions() {
  log('\n💡 Testando Sugestões Contextuais', 'cyan');
  log('=' * 50, 'cyan');

  const suggestionTests = [
    {
      message: 'Não entendo como funciona',
      expected: ['/ajuda', '/comandos', '/sobre']
    },
    {
      message: 'Estou confuso com o sistema',
      expected: ['/ajuda', '/comandos', '/sobre']
    },
    {
      message: 'Quanto custa para assinar?',
      expected: ['/assinar', '/sobre']
    },
    {
      message: 'Preciso pagar para usar?',
      expected: ['/assinar', '/sobre']
    },
    {
      message: 'Como configurar a voz?',
      expected: ['/vozconfig', '/ajuda audio']
    },
    {
      message: 'Quero enviar um áudio',
      expected: ['/vozconfig', '/ajuda audio']
    },
    {
      message: 'Como enviar uma imagem?',
      expected: ['/ajuda imagem']
    },
    {
      message: 'Quero saber sobre meus dados',
      expected: ['/exportar', '/deletar', '/perfil']
    },
    {
      message: 'LGPD e privacidade',
      expected: ['/exportar', '/deletar', '/perfil']
    }
  ];

  for (const test of suggestionTests) {
    try {
      log(`\n📋 Testando: "${test.message}"`, 'yellow');
      
      const suggestions = commandHandler.getContextualSuggestions({ text: { body: test.message } });
      
      const hasExpectedSuggestions = test.expected.every(expected => 
        suggestions.includes(expected)
      );
      
      if (hasExpectedSuggestions) {
        log(`   ✅ Sugestões corretas: ${suggestions.join(', ')}`, 'green');
      } else {
        log(`   ❌ Esperado: ${test.expected.join(', ')}`, 'red');
        log(`   ❌ Obtido: ${suggestions.join(', ')}`, 'red');
      }
    } catch (error) {
      log(`   ❌ Erro: ${error.message}`, 'red');
    }
  }
}

/**
 * Testar categorias de ajuda
 */
async function testHelpCategories() {
  log('\n📚 Testando Categorias de Ajuda', 'cyan');
  log('=' * 50, 'cyan');

  const categories = ['geral', 'usuario', 'suporte', 'produtividade', 'financeiro', 'audio', 'imagem'];
  
  for (const category of categories) {
    try {
      log(`\n📋 Testando categoria: ${category}`, 'yellow');
      
      const commands = commandHandler.getCommandsByCategory(category);
      
      if (commands.length > 0) {
        log(`   ✅ Comandos encontrados: ${commands.length}`, 'green');
        commands.forEach(cmd => {
          log(`      • /${cmd.name} - ${cmd.description}`, 'blue');
        });
      } else {
        log(`   ⚠️  Nenhum comando encontrado`, 'yellow');
      }
    } catch (error) {
      log(`   ❌ Erro: ${error.message}`, 'red');
    }
  }
}

/**
 * Testar validação de parâmetros
 */
async function testParameterValidation() {
  log('\n✅ Testando Validação de Parâmetros', 'cyan');
  log('=' * 50, 'cyan');

  const validationTests = [
    {
      command: 'lembrete',
      parameters: {},
      shouldFail: true,
      reason: 'Parâmetros obrigatórios ausentes'
    },
    {
      command: 'lembrete',
      parameters: { 0: '10min' },
      shouldFail: true,
      reason: 'Segundo parâmetro obrigatório ausente'
    },
    {
      command: 'lembrete',
      parameters: { 0: '10min', 1: 'tomar remédio' },
      shouldFail: false,
      reason: 'Parâmetros corretos'
    },
    {
      command: 'start',
      parameters: {},
      shouldFail: false,
      reason: 'Comando sem parâmetros obrigatórios'
    },
    {
      command: 'ajuda',
      parameters: { 0: 'geral' },
      shouldFail: false,
      reason: 'Parâmetro opcional presente'
    }
  ];

  for (const test of validationTests) {
    try {
      log(`\n📋 Testando: /${test.command} ${JSON.stringify(test.parameters)}`, 'yellow');
      
      const commandInfo = commandHandler.getCommand(test.command);
      if (!commandInfo) {
        log(`   ❌ Comando não encontrado`, 'red');
        continue;
      }
      
      try {
        commandHandler.validateParameters(commandInfo, test.parameters);
        
        if (test.shouldFail) {
          log(`   ❌ Deveria falhar mas passou: ${test.reason}`, 'red');
        } else {
          log(`   ✅ Validação passou: ${test.reason}`, 'green');
        }
      } catch (error) {
        if (test.shouldFail) {
          log(`   ✅ Falhou como esperado: ${error.message}`, 'green');
        } else {
          log(`   ❌ Falhou inesperadamente: ${error.message}`, 'red');
        }
      }
    } catch (error) {
      log(`   ❌ Erro no teste: ${error.message}`, 'red');
    }
  }
}

/**
 * Testar processamento de comandos
 */
async function testCommandProcessing() {
  log('\n⚙️ Testando Processamento de Comandos', 'cyan');
  log('=' * 50, 'cyan');

  const testCommands = [
    '/start',
    '/ajuda',
    '/comandos',
    '/sobre',
    '/perfil',
    '/ajuda geral',
    '/lembrete 10min "teste"',
    '!help',
    '/?'
  ];

  for (const command of testCommands) {
    try {
      log(`\n📋 Testando: "${command}"`, 'yellow');
      
      const message = { text: { body: command } };
      const phoneNumber = '+5511999999999';
      const profileName = 'Teste';
      const phoneNumberId = 'test_phone_id';
      
      // Mock response object
      const mockRes = {
        locals: { recipientNumber: phoneNumber },
        headersSent: false
      };
      
      const result = await commandHandler.processCommand(
        message, phoneNumber, profileName, phoneNumberId, mockRes
      );
      
      if (result.isCommand) {
        log(`   ✅ Comando processado com sucesso`, 'green');
        if (result.error) {
          log(`   ⚠️  Erro no processamento: ${result.error}`, 'yellow');
        }
      } else {
        log(`   ❌ Comando não foi reconhecido`, 'red');
      }
    } catch (error) {
      log(`   ❌ Erro: ${error.message}`, 'red');
    }
  }
}

/**
 * Testar estatísticas de comandos
 */
async function testCommandStats() {
  log('\n📊 Testando Estatísticas de Comandos', 'cyan');
  log('=' * 50, 'cyan');

  try {
    const stats = commandHandler.getCommandStats();
    
    log(`\n📈 Estatísticas:`, 'yellow');
    log(`   Total de comandos: ${stats.totalCommands}`, 'blue');
    log(`   Total de aliases: ${stats.totalAliases}`, 'blue');
    log(`   Categorias: ${stats.categories}`, 'blue');
    log(`   Sugestões contextuais: ${stats.contextualSuggestions}`, 'blue');
    
    // Listar todos os comandos
    log(`\n📋 Comandos disponíveis:`, 'yellow');
    const allCommands = commandHandler.getAllCommands();
    allCommands.forEach(cmd => {
      log(`   • /${cmd.name} (${cmd.aliases.join(', ')}) - ${cmd.description}`, 'blue');
    });
    
  } catch (error) {
    log(`   ❌ Erro: ${error.message}`, 'red');
  }
}

/**
 * Testar userDataService
 */
async function testUserDataService() {
  log('\n👤 Testando UserDataService', 'cyan');
  log('=' * 50, 'cyan');

  const testPhoneNumber = '+5511999999999';
  
  try {
    // Testar criação de dados do usuário
    log(`\n📋 Testando criação de dados do usuário...`, 'yellow');
    const userData = await userDataService.getUserData(testPhoneNumber);
    log(`   ✅ Dados do usuário obtidos: ${userData.phoneNumber}`, 'green');
    
    // Testar atualização de dados
    log(`\n📋 Testando atualização de dados...`, 'yellow');
    const updatedData = await userDataService.updateUserData(testPhoneNumber, {
      messageCount: 5,
      voiceEnabled: true
    });
    log(`   ✅ Dados atualizados: ${updatedData.messageCount} mensagens`, 'green');
    
    // Testar criação de lembrete
    log(`\n📋 Testando criação de lembrete...`, 'yellow');
    const reminder = await userDataService.createReminder(testPhoneNumber, {
      message: 'Teste de lembrete',
      scheduledTime: new Date(Date.now() + 60000), // 1 minuto
      type: 'test'
    });
    log(`   ✅ Lembrete criado: ${reminder.id}`, 'green');
    
    // Testar obtenção de lembretes
    log(`\n📋 Testando obtenção de lembretes...`, 'yellow');
    const reminders = await userDataService.getUserReminders(testPhoneNumber);
    log(`   ✅ Lembretes obtidos: ${reminders.length}`, 'green');
    
    // Testar exportação de dados
    log(`\n📋 Testando exportação de dados...`, 'yellow');
    const exportData = await userDataService.exportUserData(testPhoneNumber);
    log(`   ✅ Dados exportados: ${exportData.user.phoneNumber}`, 'green');
    
    // Testar estatísticas do usuário
    log(`\n📋 Testando estatísticas do usuário...`, 'yellow');
    const userStats = await userDataService.getUserStats(testPhoneNumber);
    log(`   ✅ Estatísticas obtidas: ${userStats.messageCount} mensagens`, 'green');
    
  } catch (error) {
    log(`   ❌ Erro: ${error.message}`, 'red');
  }
}

/**
 * Função principal
 */
async function runAllTests() {
  log('🚀 Iniciando Testes do Sistema de Comandos', 'bright');
  log('=' * 60, 'cyan');

  try {
    await testCommandParser();
    await testAliases();
    await testContextualSuggestions();
    await testHelpCategories();
    await testParameterValidation();
    await testCommandProcessing();
    await testCommandStats();
    await testUserDataService();

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
    case 'parser':
      testCommandParser();
      break;
    case 'aliases':
      testAliases();
      break;
    case 'suggestions':
      testContextualSuggestions();
      break;
    case 'categories':
      testHelpCategories();
      break;
    case 'validation':
      testParameterValidation();
      break;
    case 'processing':
      testCommandProcessing();
      break;
    case 'stats':
      testCommandStats();
      break;
    case 'userdata':
      testUserDataService();
      break;
    default:
      log('Comandos disponíveis:', 'yellow');
      log('  node test-commands.js parser      - Testar parser de comandos', 'blue');
      log('  node test-commands.js aliases     - Testar aliases', 'blue');
      log('  node test-commands.js suggestions - Testar sugestões contextuais', 'blue');
      log('  node test-commands.js categories  - Testar categorias de ajuda', 'blue');
      log('  node test-commands.js validation  - Testar validação de parâmetros', 'blue');
      log('  node test-commands.js processing  - Testar processamento de comandos', 'blue');
      log('  node test-commands.js stats       - Testar estatísticas', 'blue');
      log('  node test-commands.js userdata    - Testar userDataService', 'blue');
      log('  node test-commands.js (executa todos os testes)', 'blue');
  }
} else {
  runAllTests();
}

