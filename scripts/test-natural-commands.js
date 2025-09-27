// scripts/test-natural-commands.js
// Script para testar comandos em linguagem natural

import naturalCommands from '../services/naturalCommands.js';
import shortcutService from '../services/shortcutService.js';
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
 * Testar detecção de intenções
 */
async function testIntentDetection() {
  log('\n🧠 Testando Detecção de Intenções', 'cyan');
  log('=' * 50, 'cyan');

  const testCases = [
    {
      input: 'me ajuda',
      expected: 'help',
      description: 'Pedido de ajuda'
    },
    {
      input: 'não entendo como funciona',
      expected: 'help',
      description: 'Confusão sobre funcionamento'
    },
    {
      input: 'quanto custa para assinar',
      expected: 'pricing',
      description: 'Consulta de preço'
    },
    {
      input: 'qual o valor do plano premium',
      expected: 'pricing',
      description: 'Consulta de valor'
    },
    {
      input: 'cancela minha conta',
      expected: 'cancel',
      description: 'Solicitação de cancelamento'
    },
    {
      input: 'quero cancelar',
      expected: 'cancel',
      description: 'Desejo de cancelar'
    },
    {
      input: 'meu perfil',
      expected: 'profile',
      description: 'Consulta de perfil'
    },
    {
      input: 'minhas informações',
      expected: 'profile',
      description: 'Consulta de informações'
    },
    {
      input: 'falar com humano',
      expected: 'contact',
      description: 'Solicitação de contato'
    },
    {
      input: 'preciso de suporte',
      expected: 'contact',
      description: 'Solicitação de suporte'
    },
    {
      input: 'criar lembrete',
      expected: 'reminder',
      description: 'Solicitação de lembrete'
    },
    {
      input: 'me lembrar de algo',
      expected: 'reminder',
      description: 'Solicitação de lembrete'
    },
    {
      input: 'configurar voz',
      expected: 'voice',
      description: 'Configuração de voz'
    },
    {
      input: 'preferências de áudio',
      expected: 'voice',
      description: 'Preferências de áudio'
    },
    {
      input: 'meus dados pessoais',
      expected: 'data',
      description: 'Consulta de dados'
    },
    {
      input: 'exportar informações',
      expected: 'data',
      description: 'Exportação de dados'
    }
  ];

  for (const testCase of testCases) {
    try {
      log(`\n📋 Testando: "${testCase.input}"`, 'yellow');
      
      const intent = naturalCommands.detectIntent(testCase.input);
      
      if (intent && intent.name === testCase.expected) {
        log(`   ✅ Intenção detectada: ${intent.name}`, 'green');
        log(`   ✅ Comando: ${intent.command}`, 'green');
        log(`   ✅ Confiança: ${intent.confidence}`, 'green');
      } else {
        log(`   ❌ Esperado: ${testCase.expected}`, 'red');
        log(`   ❌ Obtido: ${intent?.name || 'null'}`, 'red');
      }
    } catch (error) {
      log(`   ❌ Erro: ${error.message}`, 'red');
    }
  }
}

/**
 * Testar padrões conversacionais
 */
async function testConversationalPatterns() {
  log('\n💬 Testando Padrões Conversacionais', 'cyan');
  log('=' * 50, 'cyan');

  const testCases = [
    {
      input: 'bom dia',
      expected: 'greeting',
      description: 'Saudação matinal'
    },
    {
      input: 'boa tarde',
      expected: 'greeting',
      description: 'Saudação vespertina'
    },
    {
      input: 'boa noite',
      expected: 'greeting',
      description: 'Saudação noturna'
    },
    {
      input: 'olá',
      expected: 'greeting',
      description: 'Saudação geral'
    },
    {
      input: 'obrigado',
      expected: 'thanks',
      description: 'Agradecimento'
    },
    {
      input: 'muito obrigado',
      expected: 'thanks',
      description: 'Agradecimento enfático'
    },
    {
      input: 'valeu',
      expected: 'thanks',
      description: 'Agradecimento informal'
    },
    {
      input: 'tchau',
      expected: 'goodbye',
      description: 'Despedida'
    },
    {
      input: 'até logo',
      expected: 'goodbye',
      description: 'Despedida formal'
    },
    {
      input: 'muito bom',
      expected: 'compliment',
      description: 'Elogio'
    },
    {
      input: 'excelente trabalho',
      expected: 'compliment',
      description: 'Elogio específico'
    },
    {
      input: 'não funciona',
      expected: 'frustration',
      description: 'Frustração'
    },
    {
      input: 'deu erro',
      expected: 'frustration',
      description: 'Relato de erro'
    }
  ];

  for (const testCase of testCases) {
    try {
      log(`\n📋 Testando: "${testCase.input}"`, 'yellow');
      
      const conversational = naturalCommands.detectConversational(testCase.input);
      
      if (conversational && conversational.name === testCase.expected) {
        log(`   ✅ Padrão detectado: ${conversational.name}`, 'green');
        log(`   ✅ Contexto: ${conversational.context}`, 'green');
      } else {
        log(`   ❌ Esperado: ${testCase.expected}`, 'red');
        log(`   ❌ Obtido: ${conversational?.name || 'null'}`, 'red');
      }
    } catch (error) {
      log(`   ❌ Erro: ${error.message}`, 'red');
    }
  }
}

/**
 * Testar comandos de produtividade
 */
async function testProductivityCommands() {
  log('\n⏰ Testando Comandos de Produtividade', 'cyan');
  log('=' * 50, 'cyan');

  const testCases = [
    {
      input: 'agenda',
      expected: 'agenda',
      description: 'Consulta de agenda'
    },
    {
      input: 'hoje',
      expected: 'agenda',
      description: 'Consulta de hoje'
    },
    {
      input: 'compromissos',
      expected: 'agenda',
      description: 'Consulta de compromissos'
    },
    {
      input: 'resumo',
      expected: 'resumo',
      description: 'Solicitação de resumo'
    },
    {
      input: 'resumir conversa',
      expected: 'resumo',
      description: 'Resumo de conversa'
    },
    {
      input: 'tarefas',
      expected: 'tarefas',
      description: 'Consulta de tarefas'
    },
    {
      input: 'lista de pendências',
      expected: 'tarefas',
      description: 'Lista de pendências'
    },
    {
      input: 'timer',
      expected: 'timer',
      description: 'Solicitação de timer'
    },
    {
      input: 'cronômetro',
      expected: 'timer',
      description: 'Solicitação de cronômetro'
    }
  ];

  for (const testCase of testCases) {
    try {
      log(`\n📋 Testando: "${testCase.input}"`, 'yellow');
      
      const productivity = naturalCommands.detectProductivity(testCase.input);
      
      if (productivity && productivity.name === testCase.expected) {
        log(`   ✅ Comando detectado: ${productivity.name}`, 'green');
      } else {
        log(`   ❌ Esperado: ${testCase.expected}`, 'red');
        log(`   ❌ Obtido: ${productivity?.name || 'null'}`, 'red');
      }
    } catch (error) {
      log(`   ❌ Erro: ${error.message}`, 'red');
    }
  }
}

/**
 * Testar atalhos personalizados
 */
async function testCustomShortcuts() {
  log('\n⚡ Testando Atalhos Personalizados', 'cyan');
  log('=' * 50, 'cyan');

  const testPhoneNumber = '+5511999999999';
  
  try {
    // Criar atalho de teste
    log('\n📋 Criando atalho de teste...', 'yellow');
    const createResult = await shortcutService.createShortcut(
      testPhoneNumber, 
      'café', 
      '/lembrete 15min "fazer café"',
      'Lembrete para fazer café'
    );
    
    if (createResult.success) {
      log(`   ✅ Atalho criado: ${createResult.shortcut}`, 'green');
    } else {
      log(`   ❌ Falha ao criar atalho`, 'red');
    }

    // Testar detecção de atalho
    log('\n📋 Testando detecção de atalho...', 'yellow');
    const shortcut = await shortcutService.getShortcut(testPhoneNumber, 'café');
    
    if (shortcut) {
      log(`   ✅ Atalho detectado: ${shortcut.command}`, 'green');
      log(`   ✅ Tipo: ${shortcut.type}`, 'green');
    } else {
      log(`   ❌ Atalho não detectado`, 'red');
    }

    // Testar busca de atalhos
    log('\n📋 Testando busca de atalhos...', 'yellow');
    const suggestions = await shortcutService.getShortcutSuggestions(testPhoneNumber, 'café');
    
    if (suggestions.length > 0) {
      log(`   ✅ Sugestões encontradas: ${suggestions.length}`, 'green');
      suggestions.forEach(suggestion => {
        log(`      • ${suggestion.shortcut} → ${suggestion.command}`, 'blue');
      });
    } else {
      log(`   ❌ Nenhuma sugestão encontrada`, 'red');
    }

    // Testar listagem de atalhos
    log('\n📋 Testando listagem de atalhos...', 'yellow');
    const shortcuts = await shortcutService.listUserShortcuts(testPhoneNumber);
    
    if (shortcuts.custom && Object.keys(shortcuts.custom).length > 0) {
      log(`   ✅ Atalhos personalizados: ${Object.keys(shortcuts.custom).length}`, 'green');
    } else {
      log(`   ❌ Nenhum atalho personalizado encontrado`, 'red');
    }

    // Testar estatísticas
    log('\n📋 Testando estatísticas...', 'yellow');
    const stats = await shortcutService.getShortcutStats(testPhoneNumber);
    
    log(`   ✅ Total de atalhos: ${stats.totalShortcuts}`, 'green');
    log(`   ✅ Total de usos: ${stats.totalUsage}`, 'green');

    // Remover atalho de teste
    log('\n📋 Removendo atalho de teste...', 'yellow');
    const removeResult = await shortcutService.removeShortcut(testPhoneNumber, 'café');
    
    if (removeResult.success) {
      log(`   ✅ Atalho removido: ${removeResult.shortcut}`, 'green');
    } else {
      log(`   ❌ Falha ao remover atalho`, 'red');
    }

  } catch (error) {
    log(`   ❌ Erro: ${error.message}`, 'red');
  }
}

/**
 * Testar sugestões inteligentes
 */
async function testSmartSuggestions() {
  log('\n🤖 Testando Sugestões Inteligentes', 'cyan');
  log('=' * 50, 'cyan');

  const testPhoneNumber = '+5511999999999';
  
  try {
    // Testar sugestões baseadas no horário
    log('\n📋 Testando sugestões baseadas no horário...', 'yellow');
    const suggestions = await naturalCommands.getSmartSuggestions(testPhoneNumber, '');
    
    if (suggestions.length > 0) {
      log(`   ✅ Sugestões encontradas: ${suggestions.length}`, 'green');
      suggestions.forEach(suggestion => {
        log(`      • ${suggestion}`, 'blue');
      });
    } else {
      log(`   ❌ Nenhuma sugestão encontrada`, 'red');
    }

    // Testar sugestões baseadas no uso
    log('\n📋 Testando sugestões baseadas no uso...', 'yellow');
    const usageStats = naturalCommands.getUsageStats(testPhoneNumber);
    
    if (Object.keys(usageStats).length > 0) {
      log(`   ✅ Estatísticas de uso encontradas: ${Object.keys(usageStats).length}`, 'green');
      Object.entries(usageStats).forEach(([command, count]) => {
        log(`      • ${command}: ${count}x`, 'blue');
      });
    } else {
      log(`   ⚠️  Nenhuma estatística de uso encontrada`, 'yellow');
    }

  } catch (error) {
    log(`   ❌ Erro: ${error.message}`, 'red');
  }
}

/**
 * Testar processamento de mensagens naturais
 */
async function testNaturalMessageProcessing() {
  log('\n🔄 Testando Processamento de Mensagens Naturais', 'cyan');
  log('=' * 50, 'cyan');

  const testCases = [
    {
      input: 'me ajuda',
      expected: 'help',
      description: 'Pedido de ajuda'
    },
    {
      input: 'bom dia',
      expected: 'greeting',
      description: 'Saudação'
    },
    {
      input: 'obrigado',
      expected: 'thanks',
      description: 'Agradecimento'
    },
    {
      input: 'quanto custa',
      expected: 'pricing',
      description: 'Consulta de preço'
    },
    {
      input: 'agenda',
      expected: 'agenda',
      description: 'Consulta de agenda'
    },
    {
      input: 'café',
      expected: 'shortcut',
      description: 'Atalho personalizado'
    }
  ];

  for (const testCase of testCases) {
    try {
      log(`\n📋 Testando: "${testCase.input}"`, 'yellow');
      
      const message = { text: { body: testCase.input } };
      const phoneNumber = '+5511999999999';
      const profileName = 'Teste';
      const phoneNumberId = 'test_phone_id';
      
      // Mock response object
      const mockRes = {
        locals: { recipientNumber: phoneNumber },
        headersSent: false
      };
      
      const result = await naturalCommands.processNaturalMessage(
        message, phoneNumber, profileName, phoneNumberId, mockRes
      );
      
      if (result.isNatural) {
        log(`   ✅ Mensagem natural processada`, 'green');
        if (result.handled) {
          log(`   ✅ Processada com sucesso`, 'green');
        } else {
          log(`   ⚠️  Processada mas com erro`, 'yellow');
        }
      } else {
        log(`   ❌ Mensagem não reconhecida como natural`, 'red');
      }
    } catch (error) {
      log(`   ❌ Erro: ${error.message}`, 'red');
    }
  }
}

/**
 * Testar templates de atalhos
 */
async function testShortcutTemplates() {
  log('\n📋 Testando Templates de Atalhos', 'cyan');
  log('=' * 50, 'cyan');

  try {
    const templates = shortcutService.getShortcutTemplates();
    
    if (templates.length > 0) {
      log(`   ✅ Templates encontrados: ${templates.length}`, 'green');
      templates.forEach(template => {
        log(`\n   📋 ${template.name}:`, 'blue');
        log(`      Descrição: ${template.description}`, 'blue');
        log(`      Template: ${template.template}`, 'blue');
        log(`      Exemplo: ${template.example}`, 'blue');
        log(`      Parâmetros: ${template.parameters.join(', ')}`, 'blue');
      });
    } else {
      log(`   ❌ Nenhum template encontrado`, 'red');
    }

    const categories = shortcutService.getShortcutCategories();
    
    if (categories.length > 0) {
      log(`\n   ✅ Categorias encontradas: ${categories.length}`, 'green');
      categories.forEach(category => {
        log(`\n   📋 ${category.emoji} ${category.name}:`, 'blue');
        log(`      Descrição: ${category.description}`, 'blue');
        log(`      Atalhos: ${category.shortcuts.join(', ')}`, 'blue');
      });
    } else {
      log(`   ❌ Nenhuma categoria encontrada`, 'red');
    }

  } catch (error) {
    log(`   ❌ Erro: ${error.message}`, 'red');
  }
}

/**
 * Testar validação de comandos de atalho
 */
async function testShortcutValidation() {
  log('\n✅ Testando Validação de Comandos de Atalho', 'cyan');
  log('=' * 50, 'cyan');

  const testCases = [
    {
      command: '/lembrete 15min "fazer café"',
      shouldPass: true,
      description: 'Comando válido'
    },
    {
      command: '/ajuda',
      shouldPass: true,
      description: 'Comando simples válido'
    },
    {
      command: 'lembrete 15min "fazer café"',
      shouldPass: false,
      description: 'Comando sem /'
    },
    {
      command: '/atalho add "teste" "comando"',
      shouldPass: false,
      description: 'Comando recursivo'
    },
    {
      command: '/comandoinexistente',
      shouldPass: false,
      description: 'Comando inexistente'
    }
  ];

  for (const testCase of testCases) {
    try {
      log(`\n📋 Testando: "${testCase.command}"`, 'yellow');
      
      const validation = shortcutService.validateShortcutCommand(testCase.command);
      
      if (validation.valid === testCase.shouldPass) {
        log(`   ✅ Validação correta: ${validation.valid}`, 'green');
      } else {
        log(`   ❌ Esperado: ${testCase.shouldPass}, Obtido: ${validation.valid}`, 'red');
        if (validation.error) {
          log(`   ❌ Erro: ${validation.error}`, 'red');
        }
      }
    } catch (error) {
      log(`   ❌ Erro no teste: ${error.message}`, 'red');
    }
  }
}

/**
 * Testar ajuda de atalhos
 */
async function testShortcutHelp() {
  log('\n❓ Testando Ajuda de Atalhos', 'cyan');
  log('=' * 50, 'cyan');

  try {
    const help = shortcutService.getShortcutHelp();
    
    if (help.commands && help.commands.length > 0) {
      log(`   ✅ Comandos de ajuda encontrados: ${help.commands.length}`, 'green');
      help.commands.forEach(cmd => {
        log(`      • ${cmd}`, 'blue');
      });
    } else {
      log(`   ❌ Nenhum comando de ajuda encontrado`, 'red');
    }

    if (help.examples && help.examples.length > 0) {
      log(`\n   ✅ Exemplos encontrados: ${help.examples.length}`, 'green');
      help.examples.forEach(example => {
        log(`      • ${example}`, 'blue');
      });
    } else {
      log(`   ❌ Nenhum exemplo encontrado`, 'red');
    }

    if (help.templates && help.templates.length > 0) {
      log(`\n   ✅ Templates encontrados: ${help.templates.length}`, 'green');
      help.templates.forEach(template => {
        log(`      • ${template.name}: ${template.template}`, 'blue');
      });
    } else {
      log(`   ❌ Nenhum template encontrado`, 'red');
    }

  } catch (error) {
    log(`   ❌ Erro: ${error.message}`, 'red');
  }
}

/**
 * Função principal
 */
async function runAllTests() {
  log('🚀 Iniciando Testes de Comandos Naturais', 'bright');
  log('=' * 60, 'cyan');

  try {
    await testIntentDetection();
    await testConversationalPatterns();
    await testProductivityCommands();
    await testCustomShortcuts();
    await testSmartSuggestions();
    await testNaturalMessageProcessing();
    await testShortcutTemplates();
    await testShortcutValidation();
    await testShortcutHelp();

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
    case 'intents':
      testIntentDetection();
      break;
    case 'conversational':
      testConversationalPatterns();
      break;
    case 'productivity':
      testProductivityCommands();
      break;
    case 'shortcuts':
      testCustomShortcuts();
      break;
    case 'suggestions':
      testSmartSuggestions();
      break;
    case 'processing':
      testNaturalMessageProcessing();
      break;
    case 'templates':
      testShortcutTemplates();
      break;
    case 'validation':
      testShortcutValidation();
      break;
    case 'help':
      testShortcutHelp();
      break;
    default:
      log('Comandos disponíveis:', 'yellow');
      log('  node test-natural-commands.js intents      - Testar detecção de intenções', 'blue');
      log('  node test-natural-commands.js conversational - Testar padrões conversacionais', 'blue');
      log('  node test-natural-commands.js productivity  - Testar comandos de produtividade', 'blue');
      log('  node test-natural-commands.js shortcuts     - Testar atalhos personalizados', 'blue');
      log('  node test-natural-commands.js suggestions   - Testar sugestões inteligentes', 'blue');
      log('  node test-natural-commands.js processing    - Testar processamento de mensagens', 'blue');
      log('  node test-natural-commands.js templates     - Testar templates de atalhos', 'blue');
      log('  node test-natural-commands.js validation    - Testar validação de comandos', 'blue');
      log('  node test-natural-commands.js help          - Testar ajuda de atalhos', 'blue');
      log('  node test-natural-commands.js (executa todos os testes)', 'blue');
  }
} else {
  runAllTests();
}

