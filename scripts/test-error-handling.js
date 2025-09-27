// scripts/test-error-handling.js
// Script para testar o sistema de tratamento de erros

import { ErrorFactory, ErrorUtils } from '../utils/errors.js';
import fallbackService from '../services/fallbackService.js';
import alertService from '../services/alertService.js';
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
 * Testar classes de erro customizadas
 */
async function testCustomErrorClasses() {
  log('\n🧪 Testando Classes de Erro Customizadas', 'cyan');
  log('=' * 50, 'cyan');

  const errorTests = [
    {
      name: 'ValidationError',
      error: ErrorFactory.createValidationError('Campo obrigatório', 'email'),
      expectedStatus: 400
    },
    {
      name: 'AuthenticationError',
      error: ErrorFactory.createAuthenticationError('Token inválido'),
      expectedStatus: 401
    },
    {
      name: 'NotFoundError',
      error: ErrorFactory.createNotFoundError('Usuário'),
      expectedStatus: 404
    },
    {
      name: 'RateLimitError',
      error: ErrorFactory.createRateLimitError('Muitas requisições', 60),
      expectedStatus: 429
    },
    {
      name: 'ExternalServiceError',
      error: ErrorFactory.createExternalServiceError('OpenAI', 'Serviço indisponível'),
      expectedStatus: 502
    },
    {
      name: 'TimeoutError',
      error: ErrorFactory.createTimeoutError('API Call', 5000),
      expectedStatus: 408
    },
    {
      name: 'ConfigurationError',
      error: ErrorFactory.createConfigurationError('OPENAI_API_KEY', 'Chave não configurada'),
      expectedStatus: 500
    },
    {
      name: 'MediaProcessingError',
      error: ErrorFactory.createMediaProcessingError('image', 'Formato não suportado'),
      expectedStatus: 422
    },
    {
      name: 'DatabaseError',
      error: ErrorFactory.createDatabaseError('SELECT', 'Conexão perdida'),
      expectedStatus: 503
    },
    {
      name: 'WebhookError',
      error: ErrorFactory.createWebhookError('WhatsApp', 'Estrutura inválida'),
      expectedStatus: 400
    },
    {
      name: 'NutritionServiceError',
      error: ErrorFactory.createNutritionServiceError('search', 'API indisponível'),
      expectedStatus: 502
    }
  ];

  for (const test of errorTests) {
    try {
      log(`\n📋 Testando ${test.name}:`, 'yellow');
      
      // Verificar propriedades
      log(`   Status Code: ${test.error.statusCode} (esperado: ${test.expectedStatus})`, 
          test.error.statusCode === test.expectedStatus ? 'green' : 'red');
      log(`   Código: ${test.error.code}`, 'blue');
      log(`   Mensagem: ${test.error.message}`, 'blue');
      log(`   Mensagem do Usuário: ${test.error.userMessage}`, 'blue');
      log(`   Operacional: ${test.error.isOperational}`, 'blue');
      
      // Testar conversão para JSON
      const json = test.error.toJSON();
      log(`   JSON válido: ${!!json}`, 'green');
      
      // Testar log de erro
      ErrorUtils.logError(test.error, { test: test.name });
      log(`   ✅ Log registrado`, 'green');
      
    } catch (error) {
      log(`   ❌ Erro no teste: ${error.message}`, 'red');
    }
  }
}

/**
 * Testar sistema de fallback
 */
async function testFallbackSystem() {
  log('\n🔄 Testando Sistema de Fallback', 'cyan');
  log('=' * 50, 'cyan');

  try {
    // Simular mensagem
    const message = {
      text: { body: 'Olá, quantas calorias tem uma banana?' },
      from: '+5511999999999',
      id: 'test_msg_123',
      timestamp: Date.now()
    };

    const phoneNumber = '+5511999999999';
    const profileName = 'Teste';
    const phoneNumberId = 'test_phone_id';

    // Simular resposta
    const mockRes = {
      locals: { recipientNumber: message.from },
      headersSent: false
    };

    log('📤 Testando fallback com OpenAI fora...', 'yellow');
    
    // Simular OpenAI fora
    fallbackService.setOpenAIStatus(true);
    
    const result = await fallbackService.processMessageWithFallback(
      message, phoneNumber, profileName, phoneNumberId, mockRes
    );
    
    log(`   Resultado: ${JSON.stringify(result)}`, 'blue');
    
    // Simular WhatsApp fora
    log('\n📤 Testando fallback com WhatsApp fora...', 'yellow');
    fallbackService.setWhatsAppStatus(true);
    
    const result2 = await fallbackService.processMessageWithFallback(
      message, phoneNumber, profileName, phoneNumberId, mockRes
    );
    
    log(`   Resultado: ${JSON.stringify(result2)}`, 'blue');
    
    // Verificar status dos serviços
    const status = fallbackService.getServiceStatus();
    log(`\n📊 Status dos Serviços:`, 'yellow');
    log(`   OpenAI: ${status.openai ? 'Funcionando' : 'Fora'}`, status.openai ? 'green' : 'red');
    log(`   WhatsApp: ${status.whatsapp ? 'Funcionando' : 'Fora'}`, status.whatsapp ? 'green' : 'red');
    
    // Resetar status
    fallbackService.setOpenAIStatus(false);
    fallbackService.setWhatsAppStatus(false);
    
  } catch (error) {
    log(`❌ Erro no teste de fallback: ${error.message}`, 'red');
  }
}

/**
 * Testar sistema de alertas
 */
async function testAlertSystem() {
  log('\n🚨 Testando Sistema de Alertas', 'cyan');
  log('=' * 50, 'cyan');

  try {
    // Testar diferentes tipos de alertas
    const alertTests = [
      {
        type: 'errorRate',
        data: {
          level: 'WARNING',
          message: 'Taxa de erro alta: 15%',
          details: { errorRate: 0.15, threshold: 0.1 }
        }
      },
      {
        type: 'memoryUsage',
        data: {
          level: 'WARNING',
          message: 'Uso de memória alto: 85%',
          details: { memoryUsage: 0.85, threshold: 0.8 }
        }
      },
      {
        type: 'consecutiveErrors',
        data: {
          level: 'CRITICAL',
          message: '5 erros consecutivos detectados',
          details: { consecutiveErrors: 5, threshold: 5 }
        }
      }
    ];

    for (const test of alertTests) {
      log(`\n📋 Testando alerta ${test.type}:`, 'yellow');
      
      // Simular envio de alerta
      await alertService.sendAlert(test.type, test.data);
      log(`   ✅ Alerta ${test.type} enviado`, 'green');
    }

    // Testar registro de erros
    log('\n📊 Testando registro de erros...', 'yellow');
    
    for (let i = 0; i < 3; i++) {
      const error = ErrorFactory.createExternalServiceError('TestService', `Erro de teste ${i + 1}`);
      alertService.recordError(error, { test: true });
      log(`   Erro ${i + 1} registrado`, 'blue');
    }

    // Verificar estatísticas
    const stats = alertService.getAlertStats();
    log(`\n📈 Estatísticas de Alertas:`, 'yellow');
    log(`   Erros: ${stats.errorCount}`, 'blue');
    log(`   Requisições: ${stats.requestCount}`, 'blue');
    log(`   Erros Consecutivos: ${stats.consecutiveErrors}`, 'blue');
    log(`   Taxa de Erro: ${(stats.errorRate * 100).toFixed(2)}%`, 'blue');

  } catch (error) {
    log(`❌ Erro no teste de alertas: ${error.message}`, 'red');
  }
}

/**
 * Testar mensagens amigáveis
 */
async function testFriendlyMessages() {
  log('\n💬 Testando Mensagens Amigáveis', 'cyan');
  log('=' * 50, 'cyan');

  const errorTests = [
    new Error('ENOTFOUND'),
    new Error('ECONNREFUSED'),
    new Error('ETIMEDOUT'),
    new Error('ValidationError'),
    new Error('SyntaxError'),
    new Error('TypeError'),
    ErrorFactory.createValidationError('Campo inválido'),
    ErrorFactory.createExternalServiceError('OpenAI', 'Serviço indisponível'),
    ErrorFactory.createRateLimitError('Muitas requisições')
  ];

  for (const error of errorTests) {
    const friendlyMessage = ErrorUtils.getUserFriendlyMessage(error);
    log(`\n🔍 Erro: ${error.name || error.constructor.name}`, 'yellow');
    log(`   Mensagem Original: ${error.message}`, 'blue');
    log(`   Mensagem Amigável: ${friendlyMessage}`, 'green');
  }
}

/**
 * Testar conversão de erros
 */
async function testErrorConversion() {
  log('\n🔄 Testando Conversão de Erros', 'cyan');
  log('=' * 50, 'cyan');

  const errorTests = [
    new Error('Erro genérico'),
    { code: 'ENOTFOUND', message: 'Serviço não encontrado' },
    { code: 'ECONNREFUSED', message: 'Conexão recusada' },
    { code: 'ETIMEDOUT', message: 'Timeout' },
    { name: 'ValidationError', message: 'Dados inválidos' },
    { name: 'SyntaxError', message: 'Erro de sintaxe' }
  ];

  for (const error of errorTests) {
    try {
      log(`\n📋 Convertendo: ${error.name || error.constructor?.name || 'Unknown'}`, 'yellow');
      
      const convertedError = ErrorUtils.convertToOperationalError(error);
      
      log(`   Nome: ${convertedError.name}`, 'blue');
      log(`   Código: ${convertedError.code}`, 'blue');
      log(`   Status: ${convertedError.statusCode}`, 'blue');
      log(`   Operacional: ${convertedError.isOperational}`, 'blue');
      log(`   Mensagem do Usuário: ${convertedError.userMessage}`, 'green');
      
    } catch (conversionError) {
      log(`   ❌ Erro na conversão: ${conversionError.message}`, 'red');
    }
  }
}

/**
 * Testar respostas de erro padronizadas
 */
async function testErrorResponses() {
  log('\n📝 Testando Respostas de Erro Padronizadas', 'cyan');
  log('=' * 50, 'cyan');

  const errorTests = [
    ErrorFactory.createValidationError('Email inválido'),
    ErrorFactory.createNotFoundError('Usuário'),
    ErrorFactory.createRateLimitError('Muitas requisições', 60),
    ErrorFactory.createExternalServiceError('OpenAI', 'Serviço indisponível'),
    ErrorFactory.createTimeoutError('API Call', 5000)
  ];

  for (const error of errorTests) {
    log(`\n📋 Testando ${error.name}:`, 'yellow');
    
    const response = ErrorUtils.createErrorResponse(error, true);
    
    log(`   Resposta:`, 'blue');
    console.log(JSON.stringify(response, null, 2));
  }
}

/**
 * Função principal
 */
async function runAllTests() {
  log('🚀 Iniciando Testes de Tratamento de Erros', 'bright');
  log('=' * 60, 'cyan');

  try {
    await testCustomErrorClasses();
    await testFallbackSystem();
    await testAlertSystem();
    await testFriendlyMessages();
    await testErrorConversion();
    await testErrorResponses();

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
    case 'errors':
      testCustomErrorClasses();
      break;
    case 'fallback':
      testFallbackSystem();
      break;
    case 'alerts':
      testAlertSystem();
      break;
    case 'messages':
      testFriendlyMessages();
      break;
    case 'conversion':
      testErrorConversion();
      break;
    case 'responses':
      testErrorResponses();
      break;
    default:
      log('Comandos disponíveis:', 'yellow');
      log('  node test-error-handling.js errors     - Testar classes de erro', 'blue');
      log('  node test-error-handling.js fallback   - Testar sistema de fallback', 'blue');
      log('  node test-error-handling.js alerts     - Testar sistema de alertas', 'blue');
      log('  node test-error-handling.js messages   - Testar mensagens amigáveis', 'blue');
      log('  node test-error-handling.js conversion - Testar conversão de erros', 'blue');
      log('  node test-error-handling.js responses  - Testar respostas padronizadas', 'blue');
      log('  node test-error-handling.js (executa todos os testes)', 'blue');
  }
} else {
  runAllTests();
}

