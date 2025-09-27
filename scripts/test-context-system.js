// scripts/test-context-system.js
// Script para testar sistema de contexto e memória

import contextManager from '../services/contextManager.js';
import contextCommands from '../services/contextCommands.js';
import smartReferences from '../services/smartReferences.js';
import evolutionaryProfile from '../services/evolutionaryProfile.js';
import privacyManager from '../services/privacyManager.js';
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
 * Testar context manager
 */
async function testContextManager() {
  log('\n🧠 Testando Context Manager', 'cyan');
  log('=' * 50, 'cyan');

  try {
    const testPhoneNumber = '+5511999999999';
    
    // Testar adição de mensagem
    log('\n📋 Testando adição de mensagem...', 'yellow');
    const messageResult = await contextManager.addMessage(
      testPhoneNumber,
      'Olá, como você está?',
      'text',
      { profileName: 'Teste' }
    );
    
    if (messageResult.success) {
      log(`   ✅ Mensagem adicionada: ${messageResult.messageId}`, 'green');
    } else {
      log(`   ❌ Falha ao adicionar mensagem`, 'red');
    }

    // Testar obtenção de contexto
    log('\n📋 Testando obtenção de contexto...', 'yellow');
    const context = await contextManager.getCurrentContext(testPhoneNumber);
    
    if (context) {
      log(`   ✅ Contexto obtido: ${context.messageCount} mensagens`, 'green');
      log(`   ✅ ID da conversa: ${context.conversationId}`, 'green');
    } else {
      log(`   ❌ Falha ao obter contexto`, 'red');
    }

    // Testar detecção de mudança de assunto
    log('\n📋 Testando detecção de mudança de assunto...', 'yellow');
    await contextManager.addMessage(testPhoneNumber, 'Vamos falar sobre nutrição', 'text');
    await contextManager.addMessage(testPhoneNumber, 'Que tal exercícios?', 'text');
    
    const context2 = await contextManager.getCurrentContext(testPhoneNumber);
    if (context2.topicChanges && context2.topicChanges.length > 0) {
      log(`   ✅ Mudança de assunto detectada: ${context2.topicChanges.length}`, 'green');
    } else {
      log(`   ⚠️  Nenhuma mudança de assunto detectada`, 'yellow');
    }

    // Testar resumo de conversa
    log('\n📋 Testando resumo de conversa...', 'yellow');
    // Adicionar várias mensagens para triggerar resumo
    for (let i = 0; i < 10; i++) {
      await contextManager.addMessage(testPhoneNumber, `Mensagem de teste ${i}`, 'text');
    }
    
    const context3 = await contextManager.getCurrentContext(testPhoneNumber);
    if (context3.contextSummary) {
      log(`   ✅ Resumo gerado: ${context3.contextSummary.summary}`, 'green');
    } else {
      log(`   ⚠️  Resumo não gerado ainda`, 'yellow');
    }

    // Testar salvamento de informação importante
    log('\n📋 Testando salvamento de informação...', 'yellow');
    const saveResult = await contextManager.saveImportantInfo(
      testPhoneNumber,
      'Prefiro respostas curtas',
      'preference'
    );
    
    if (saveResult.success) {
      log(`   ✅ Informação salva: ${saveResult.infoId}`, 'green');
    } else {
      log(`   ❌ Falha ao salvar informação`, 'red');
    }

    // Testar busca de informações
    log('\n📋 Testando busca de informações...', 'yellow');
    const infoResult = await contextManager.getImportantInfo(testPhoneNumber);
    
    if (infoResult.success && infoResult.count > 0) {
      log(`   ✅ Informações encontradas: ${infoResult.count}`, 'green');
    } else {
      log(`   ❌ Nenhuma informação encontrada`, 'red');
    }

    // Testar estatísticas
    log('\n📋 Testando estatísticas...', 'yellow');
    const stats = contextManager.getContextStats();
    log(`   ✅ Usuários ativos: ${stats.activeUsers}`, 'green');
    log(`   ✅ Total de perfis: ${stats.totalProfiles}`, 'green');
    log(`   ✅ Mensagens em memória: ${stats.memoryUsage.shortTerm}`, 'green');

  } catch (error) {
    log(`   ❌ Erro: ${error.message}`, 'red');
  }
}

/**
 * Testar comandos de contexto
 */
async function testContextCommands() {
  log('\n💬 Testando Comandos de Contexto', 'cyan');
  log('=' * 50, 'cyan');

  try {
    const testPhoneNumber = '+5511999999999';
    const profileName = 'Teste';
    const phoneNumberId = 'test_phone_id';
    
    // Mock response object
    const mockRes = {
      locals: { recipientNumber: testPhoneNumber },
      headersSent: false
    };

    // Testar comando /contexto
    log('\n📋 Testando comando /contexto...', 'yellow');
    const contextoResult = await contextCommands.processContextCommand(
      'contexto', [], testPhoneNumber, profileName, phoneNumberId, mockRes
    );
    
    if (contextoResult.isCommand) {
      log(`   ✅ Comando /contexto processado`, 'green');
    } else {
      log(`   ❌ Falha ao processar comando /contexto`, 'red');
    }

    // Testar comando /lembrar
    log('\n📋 Testando comando /lembrar...', 'yellow');
    const lembrarResult = await contextCommands.processContextCommand(
      'lembrar', ['Prefiro respostas curtas'], testPhoneNumber, profileName, phoneNumberId, mockRes
    );
    
    if (lembrarResult.isCommand) {
      log(`   ✅ Comando /lembrar processado`, 'green');
    } else {
      log(`   ❌ Falha ao processar comando /lembrar`, 'red');
    }

    // Testar comando /minhas_notas
    log('\n📋 Testando comando /minhas_notas...', 'yellow');
    const notasResult = await contextCommands.processContextCommand(
      'minhas_notas', [], testPhoneNumber, profileName, phoneNumberId, mockRes
    );
    
    if (notasResult.isCommand) {
      log(`   ✅ Comando /minhas_notas processado`, 'green');
    } else {
      log(`   ❌ Falha ao processar comando /minhas_notas`, 'red');
    }

    // Testar comando /esquecer
    log('\n📋 Testando comando /esquecer...', 'yellow');
    const esquecerResult = await contextCommands.processContextCommand(
      'esquecer', [], testPhoneNumber, profileName, phoneNumberId, mockRes
    );
    
    if (esquecerResult.isCommand) {
      log(`   ✅ Comando /esquecer processado`, 'green');
    } else {
      log(`   ❌ Falha ao processar comando /esquecer`, 'red');
    }

    // Testar comando /privacidade
    log('\n📋 Testando comando /privacidade...', 'yellow');
    const privacidadeResult = await contextCommands.processContextCommand(
      'privacidade', ['alto'], testPhoneNumber, profileName, phoneNumberId, mockRes
    );
    
    if (privacidadeResult.isCommand) {
      log(`   ✅ Comando /privacidade processado`, 'green');
    } else {
      log(`   ❌ Falha ao processar comando /privacidade`, 'red');
    }

    // Testar comando /buscar
    log('\n📋 Testando comando /buscar...', 'yellow');
    const buscarResult = await contextCommands.processContextCommand(
      'buscar', ['respostas'], testPhoneNumber, profileName, phoneNumberId, mockRes
    );
    
    if (buscarResult.isCommand) {
      log(`   ✅ Comando /buscar processado`, 'green');
    } else {
      log(`   ❌ Falha ao processar comando /buscar`, 'red');
    }

    // Testar comando /sugestoes
    log('\n📋 Testando comando /sugestoes...', 'yellow');
    const sugestoesResult = await contextCommands.processContextCommand(
      'sugestoes', [], testPhoneNumber, profileName, phoneNumberId, mockRes
    );
    
    if (sugestoesResult.isCommand) {
      log(`   ✅ Comando /sugestoes processado`, 'green');
    } else {
      log(`   ❌ Falha ao processar comando /sugestoes`, 'red');
    }

  } catch (error) {
    log(`   ❌ Erro: ${error.message}`, 'red');
  }
}

/**
 * Testar referências inteligentes
 */
async function testSmartReferences() {
  log('\n🔗 Testando Referências Inteligentes', 'cyan');
  log('=' * 50, 'cyan');

  try {
    const testPhoneNumber = '+5511999999999';
    const phoneNumberId = 'test_phone_id';
    
    // Mock response object
    const mockRes = {
      locals: { recipientNumber: testPhoneNumber },
      headersSent: false
    };

    // Adicionar algumas mensagens ao contexto
    await contextManager.addMessage(testPhoneNumber, 'Vamos falar sobre nutrição', 'text');
    await contextManager.addMessage(testPhoneNumber, 'Preciso de dicas de exercício', 'text');
    await contextManager.addMessage(testPhoneNumber, 'Que tal criar um lembrete?', 'text');

    // Testar referência temporal
    log('\n📋 Testando referência temporal...', 'yellow');
    const temporalResult = await smartReferences.processSmartReferences(
      testPhoneNumber, 'Como eu disse antes', phoneNumberId, mockRes
    );
    
    if (temporalResult.hasReferences) {
      log(`   ✅ Referência temporal detectada`, 'green');
    } else {
      log(`   ⚠️  Referência temporal não detectada`, 'yellow');
    }

    // Testar referência de ação
    log('\n📋 Testando referência de ação...', 'yellow');
    const actionResult = await smartReferences.processSmartReferences(
      testPhoneNumber, 'Faça de novo', phoneNumberId, mockRes
    );
    
    if (actionResult.hasReferences) {
      log(`   ✅ Referência de ação detectada`, 'green');
    } else {
      log(`   ⚠️  Referência de ação não detectada`, 'yellow');
    }

    // Testar referência espacial
    log('\n📋 Testando referência espacial...', 'yellow');
    const spatialResult = await smartReferences.processSmartReferences(
      testPhoneNumber, 'Aquele restaurante', phoneNumberId, mockRes
    );
    
    if (spatialResult.hasReferences) {
      log(`   ✅ Referência espacial detectada`, 'green');
    } else {
      log(`   ⚠️  Referência espacial não detectada`, 'yellow');
    }

    // Testar referência de quantidade
    log('\n📋 Testando referência de quantidade...', 'yellow');
    const quantityResult = await smartReferences.processSmartReferences(
      testPhoneNumber, 'A mesma quantidade', phoneNumberId, mockRes
    );
    
    if (quantityResult.hasReferences) {
      log(`   ✅ Referência de quantidade detectada`, 'green');
    } else {
      log(`   ⚠️  Referência de quantidade não detectada`, 'yellow');
    }

    // Testar estatísticas de referências
    log('\n📋 Testando estatísticas de referências...', 'yellow');
    const stats = smartReferences.getReferenceStats();
    log(`   ✅ Total de padrões: ${stats.totalPatterns}`, 'green');
    log(`   ✅ Usuários ativos: ${stats.activeUsers}`, 'green');
    log(`   ✅ Total de ações: ${stats.totalActions}`, 'green');

  } catch (error) {
    log(`   ❌ Erro: ${error.message}`, 'red');
  }
}

/**
 * Testar perfil evolutivo
 */
async function testEvolutionaryProfile() {
  log('\n🧬 Testando Perfil Evolutivo', 'cyan');
  log('=' * 50, 'cyan');

  try {
    const testPhoneNumber = '+5511999999999';
    
    // Testar criação de perfil
    log('\n📋 Testando criação de perfil...', 'yellow');
    const profile = await evolutionaryProfile.getEvolutionaryProfile(testPhoneNumber);
    
    if (profile) {
      log(`   ✅ Perfil criado: ${profile.phoneNumber}`, 'green');
      log(`   ✅ Estágio: ${profile.evolutionMetrics.evolutionStage}`, 'green');
    } else {
      log(`   ❌ Falha ao criar perfil`, 'red');
    }

    // Testar atualização de perfil
    log('\n📋 Testando atualização de perfil...', 'yellow');
    const updateResult = await evolutionaryProfile.updateEvolutionaryProfile(testPhoneNumber, {
      type: 'message',
      data: {
        message: 'Olá, como você está?',
        response: 'Olá! Estou bem, obrigado!',
        responseTime: 1000
      },
      success: true,
      feedback: 5
    });
    
    if (updateResult.success) {
      log(`   ✅ Perfil atualizado`, 'green');
    } else {
      log(`   ❌ Falha ao atualizar perfil`, 'red');
    }

    // Testar geração de previsões
    log('\n📋 Testando geração de previsões...', 'yellow');
    const predictions = await evolutionaryProfile.generatePredictions(testPhoneNumber);
    
    if (predictions) {
      log(`   ✅ Previsões geradas: ${predictions.confidence}`, 'green');
      if (predictions.nextCommand) {
        log(`   ✅ Próximo comando: ${predictions.nextCommand}`, 'green');
      }
      if (predictions.nextTopic) {
        log(`   ✅ Próximo tópico: ${predictions.nextTopic}`, 'green');
      }
    } else {
      log(`   ⚠️  Previsões não geradas`, 'yellow');
    }

    // Testar sugestões personalizadas
    log('\n📋 Testando sugestões personalizadas...', 'yellow');
    const suggestions = await evolutionaryProfile.getPersonalizedSuggestions(testPhoneNumber);
    
    if (suggestions.length > 0) {
      log(`   ✅ Sugestões geradas: ${suggestions.length}`, 'green');
      suggestions.forEach((suggestion, index) => {
        log(`      ${index + 1}. ${suggestion.content} (${suggestion.priority})`, 'blue');
      });
    } else {
      log(`   ⚠️  Nenhuma sugestão gerada`, 'yellow');
    }

    // Testar estatísticas evolutivas
    log('\n📋 Testando estatísticas evolutivas...', 'yellow');
    const stats = evolutionaryProfile.getEvolutionaryStats();
    log(`   ✅ Total de perfis: ${stats.totalProfiles}`, 'green');
    log(`   ✅ Modelos de aprendizado: ${stats.learningModels}`, 'green');
    log(`   ✅ Regras de adaptação: ${stats.adaptationRules}`, 'green');
    log(`   ✅ Estágios: ${JSON.stringify(stats.evolutionStages)}`, 'green');

  } catch (error) {
    log(`   ❌ Erro: ${error.message}`, 'red');
  }
}

/**
 * Testar gerenciador de privacidade
 */
async function testPrivacyManager() {
  log('\n🔒 Testando Gerenciador de Privacidade', 'cyan');
  log('=' * 50, 'cyan');

  try {
    const testPhoneNumber = '+5511999999999';
    
    // Testar configuração de privacidade
    log('\n📋 Testando configuração de privacidade...', 'yellow');
    const privacyResult = await privacyManager.setUserPrivacy(testPhoneNumber, 'high', {
      dataRetention: 7,
      learningEnabled: false
    });
    
    if (privacyResult.success) {
      log(`   ✅ Privacidade configurada: ${privacyResult.settings.privacyLevel}`, 'green');
    } else {
      log(`   ❌ Falha ao configurar privacidade`, 'red');
    }

    // Testar obtenção de configurações
    log('\n📋 Testando obtenção de configurações...', 'yellow');
    const settings = await privacyManager.getUserPrivacySettings(testPhoneNumber);
    
    if (settings) {
      log(`   ✅ Configurações obtidas: ${settings.name}`, 'green');
      log(`   ✅ Retenção de dados: ${settings.dataRetention} dias`, 'green');
      log(`   ✅ Aprendizado: ${settings.learningEnabled ? 'Ativo' : 'Inativo'}`, 'green');
    } else {
      log(`   ❌ Falha ao obter configurações`, 'red');
    }

    // Testar verificação de opt-out
    log('\n📋 Testando verificação de opt-out...', 'yellow');
    const isOptedOut = await privacyManager.isUserOptedOut(testPhoneNumber);
    
    if (!isOptedOut) {
      log(`   ✅ Usuário não optou por sair`, 'green');
    } else {
      log(`   ⚠️  Usuário optou por sair`, 'yellow');
    }

    // Testar exportação de dados
    log('\n📋 Testando exportação de dados...', 'yellow');
    const exportResult = await privacyManager.exportUserData(testPhoneNumber);
    
    if (exportResult.success) {
      log(`   ✅ Dados exportados: ${exportResult.exportId}`, 'green');
    } else {
      log(`   ❌ Falha ao exportar dados`, 'red');
    }

    // Testar verificação de conformidade LGPD
    log('\n📋 Testando conformidade LGPD...', 'yellow');
    const compliance = await privacyManager.checkLGPDCompliance(testPhoneNumber);
    
    if (compliance.compliant) {
      log(`   ✅ Conformidade LGPD: OK`, 'green');
    } else {
      log(`   ⚠️  Conformidade LGPD: ${compliance.issues.length} problemas`, 'yellow');
      compliance.issues.forEach(issue => {
        log(`      • ${issue}`, 'yellow');
      });
    }

    // Testar estatísticas de privacidade
    log('\n📋 Testando estatísticas de privacidade...', 'yellow');
    const stats = privacyManager.getPrivacyStats();
    log(`   ✅ Total de usuários: ${stats.totalUsers}`, 'green');
    log(`   ✅ Usuários opt-out: ${stats.optOutUsers}`, 'green');
    log(`   ✅ Histórico de consentimento: ${stats.consentHistory}`, 'green');

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

  try {
    const testPhoneNumber = '+5511999999999';
    const profileName = 'Teste';
    const phoneNumberId = 'test_phone_id';
    
    // Mock response object
    const mockRes = {
      locals: { recipientNumber: testPhoneNumber },
      headersSent: false
    };

    // Fluxo completo: mensagem -> contexto -> perfil -> privacidade
    log('\n📋 Testando fluxo completo...', 'yellow');
    
    // 1. Adicionar mensagem ao contexto
    log('   1. Adicionando mensagem ao contexto...', 'blue');
    await contextManager.addMessage(testPhoneNumber, 'Olá, como você está?', 'text');
    
    // 2. Atualizar perfil evolutivo
    log('   2. Atualizando perfil evolutivo...', 'blue');
    await evolutionaryProfile.updateEvolutionaryProfile(testPhoneNumber, {
      type: 'message',
      data: { message: 'Olá, como você está?' },
      success: true
    });
    
    // 3. Configurar privacidade
    log('   3. Configurando privacidade...', 'blue');
    await privacyManager.setUserPrivacy(testPhoneNumber, 'standard');
    
    // 4. Testar referências inteligentes
    log('   4. Testando referências inteligentes...', 'blue');
    await smartReferences.processSmartReferences(
      testPhoneNumber, 'Como eu disse antes', phoneNumberId, mockRes
    );
    
    // 5. Testar comando de contexto
    log('   5. Testando comando de contexto...', 'blue');
    await contextCommands.processContextCommand(
      'contexto', [], testPhoneNumber, profileName, phoneNumberId, mockRes
    );
    
    log(`   ✅ Fluxo completo executado com sucesso!`, 'green');

  } catch (error) {
    log(`   ❌ Erro no fluxo completo: ${error.message}`, 'red');
  }
}

/**
 * Testar performance do sistema
 */
async function testPerformance() {
  log('\n⚡ Testando Performance do Sistema', 'cyan');
  log('=' * 50, 'cyan');

  try {
    const testPhoneNumber = '+5511999999999';
    const startTime = Date.now();
    
    // Teste de adição de mensagens
    log('\n📋 Testando adição de mensagens...', 'yellow');
    const messageStart = Date.now();
    
    for (let i = 0; i < 100; i++) {
      await contextManager.addMessage(testPhoneNumber, `Mensagem de teste ${i}`, 'text');
    }
    
    const messageTime = Date.now() - messageStart;
    log(`   ✅ 100 mensagens adicionadas em ${messageTime}ms`, 'green');
    
    // Teste de atualização de perfil
    log('\n📋 Testando atualização de perfil...', 'yellow');
    const profileStart = Date.now();
    
    for (let i = 0; i < 50; i++) {
      await evolutionaryProfile.updateEvolutionaryProfile(testPhoneNumber, {
        type: 'message',
        data: { message: `Teste ${i}` },
        success: true
      });
    }
    
    const profileTime = Date.now() - profileStart;
    log(`   ✅ 50 atualizações de perfil em ${profileTime}ms`, 'green');
    
    // Teste de referências inteligentes
    log('\n📋 Testando referências inteligentes...', 'yellow');
    const referenceStart = Date.now();
    
    const referenceMessages = [
      'Como eu disse antes',
      'Faça de novo',
      'Aquele restaurante',
      'A mesma quantidade',
      'No mesmo horário'
    ];
    
    for (const message of referenceMessages) {
      await smartReferences.processSmartReferences(testPhoneNumber, message, 'test', {});
    }
    
    const referenceTime = Date.now() - referenceStart;
    log(`   ✅ ${referenceMessages.length} referências processadas em ${referenceTime}ms`, 'green');
    
    const totalTime = Date.now() - startTime;
    log(`\n📊 *Resumo de Performance:*`, 'bright');
    log(`   ⏱️  Tempo total: ${totalTime}ms`, 'green');
    log(`   📝 Mensagens/segundo: ${Math.round(100 / (messageTime / 1000))}`, 'green');
    log(`   👤 Perfis/segundo: ${Math.round(50 / (profileTime / 1000))}`, 'green');
    log(`   🔗 Referências/segundo: ${Math.round(referenceMessages.length / (referenceTime / 1000))}`, 'green');

  } catch (error) {
    log(`   ❌ Erro: ${error.message}`, 'red');
  }
}

/**
 * Função principal
 */
async function runAllTests() {
  log('🚀 Iniciando Testes do Sistema de Contexto e Memória', 'bright');
  log('=' * 60, 'cyan');

  try {
    await testContextManager();
    await testContextCommands();
    await testSmartReferences();
    await testEvolutionaryProfile();
    await testPrivacyManager();
    await testCompleteIntegration();
    await testPerformance();

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
    case 'context':
      testContextManager();
      break;
    case 'commands':
      testContextCommands();
      break;
    case 'references':
      testSmartReferences();
      break;
    case 'profile':
      testEvolutionaryProfile();
      break;
    case 'privacy':
      testPrivacyManager();
      break;
    case 'integration':
      testCompleteIntegration();
      break;
    case 'performance':
      testPerformance();
      break;
    default:
      log('Comandos disponíveis:', 'yellow');
      log('  node test-context-system.js context      - Testar context manager', 'blue');
      log('  node test-context-system.js commands     - Testar comandos de contexto', 'blue');
      log('  node test-context-system.js references   - Testar referências inteligentes', 'blue');
      log('  node test-context-system.js profile      - Testar perfil evolutivo', 'blue');
      log('  node test-context-system.js privacy      - Testar gerenciador de privacidade', 'blue');
      log('  node test-context-system.js integration  - Testar integração completa', 'blue');
      log('  node test-context-system.js performance  - Testar performance', 'blue');
      log('  node test-context-system.js (executa todos os testes)', 'blue');
  }
} else {
  runAllTests();
}

