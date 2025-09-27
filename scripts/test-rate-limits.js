// scripts/test-rate-limits.js
// Script para testar os diferentes tipos de rate limiting

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:1337';
const TEST_PHONE = '+5511999999999';

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

// Função para simular webhook do WhatsApp
async function sendWebhookMessage(messageType, phoneNumber = TEST_PHONE) {
  const webhookData = {
    object: 'whatsapp_business_account',
    entry: [{
      id: 'ENTRY_ID',
      changes: [{
        value: {
          messaging_product: 'whatsapp',
          metadata: {
            display_phone_number: 'PHONE_NUMBER_ID',
            phone_number_id: 'PHONE_NUMBER_ID'
          },
          messages: [{
            id: `msg_${Date.now()}`,
            from: phoneNumber,
            timestamp: Math.floor(Date.now() / 1000),
            type: messageType,
            ...getMessageContent(messageType)
          }]
        },
        field: 'messages'
      }]
    }]
  };

  try {
    const response = await fetch(`${BASE_URL}/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookData)
    });

    return {
      status: response.status,
      ok: response.ok,
      data: await response.json().catch(() => null)
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

// Função para obter conteúdo da mensagem baseado no tipo
function getMessageContent(messageType) {
  switch (messageType) {
    case 'text':
      return {
        text: {
          body: `Teste de mensagem de texto ${Date.now()}`
        }
      };
    case 'audio':
      return {
        audio: {
          id: 'audio_id_test',
          mime_type: 'audio/ogg'
        }
      };
    case 'image':
      return {
        image: {
          id: 'image_id_test',
          mime_type: 'image/jpeg',
          caption: 'Teste de imagem'
        }
      };
    case 'document':
      return {
        document: {
          id: 'document_id_test',
          mime_type: 'application/pdf',
          filename: 'test.pdf'
        }
      };
    default:
      return {
        text: {
          body: 'Teste de mensagem'
        }
      };
  }
}

// Função para testar rate limiting de um tipo específico
async function testRateLimitType(messageType, limit, phoneNumber = TEST_PHONE) {
  log(`\n🧪 Testando rate limiting para ${messageType} (limite: ${limit})`, 'cyan');
  log(`📱 Número: ${phoneNumber}`, 'blue');
  
  const results = [];
  
  for (let i = 1; i <= limit + 5; i++) {
    log(`📤 Enviando mensagem ${i}/${limit + 5}...`, 'yellow');
    
    const result = await sendWebhookMessage(messageType, phoneNumber);
    results.push({
      attempt: i,
      status: result.status,
      ok: result.ok,
      error: result.error
    });
    
    if (result.status === 429) {
      log(`❌ Rate limit atingido na tentativa ${i}`, 'red');
      break;
    } else if (result.ok) {
      log(`✅ Mensagem ${i} enviada com sucesso`, 'green');
    } else {
      log(`⚠️  Erro na mensagem ${i}: ${result.status}`, 'yellow');
    }
    
    // Pequena pausa entre mensagens
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

// Função para verificar status do rate limiting
async function checkRateLimitStatus(phoneNumber = TEST_PHONE) {
  try {
    const response = await fetch(`${BASE_URL}/rate-limit/status/${encodeURIComponent(phoneNumber)}`);
    const data = await response.json();
    
    if (data.success) {
      log(`\n📊 Status do Rate Limiting para ${phoneNumber}:`, 'cyan');
      log(`   Whitelisted: ${data.data.isWhitelisted ? 'Sim' : 'Não'}`, 'blue');
      log(`   Global - Restantes: ${data.data.global.remaining}/${data.data.global.limit}`, 'blue');
      
      Object.entries(data.data.types).forEach(([type, info]) => {
        log(`   ${type.toUpperCase()} - Restantes: ${info.remaining}/${info.limit}`, 'blue');
      });
    } else {
      log(`❌ Erro ao obter status: ${data.message}`, 'red');
    }
  } catch (error) {
    log(`❌ Erro ao verificar status: ${error.message}`, 'red');
  }
}

// Função para resetar rate limiting
async function resetRateLimit(phoneNumber = TEST_PHONE) {
  try {
    const response = await fetch(`${BASE_URL}/rate-limit/reset/${encodeURIComponent(phoneNumber)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      log(`✅ Rate limiting resetado para ${phoneNumber}`, 'green');
    } else {
      log(`❌ Erro ao resetar: ${data.message}`, 'red');
    }
  } catch (error) {
    log(`❌ Erro ao resetar: ${error.message}`, 'red');
  }
}

// Função para adicionar à whitelist
async function addToWhitelist(phoneNumber = TEST_PHONE) {
  try {
    const response = await fetch(`${BASE_URL}/rate-limit/whitelist/${encodeURIComponent(phoneNumber)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      log(`✅ ${phoneNumber} adicionado à whitelist`, 'green');
    } else {
      log(`❌ Erro ao adicionar à whitelist: ${data.message}`, 'red');
    }
  } catch (error) {
    log(`❌ Erro ao adicionar à whitelist: ${error.message}`, 'red');
  }
}

// Função para remover da whitelist
async function removeFromWhitelist(phoneNumber = TEST_PHONE) {
  try {
    const response = await fetch(`${BASE_URL}/rate-limit/whitelist/${encodeURIComponent(phoneNumber)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      log(`✅ ${phoneNumber} removido da whitelist`, 'green');
    } else {
      log(`❌ Erro ao remover da whitelist: ${data.message}`, 'red');
    }
  } catch (error) {
    log(`❌ Erro ao remover da whitelist: ${error.message}`, 'red');
  }
}

// Função para obter estatísticas
async function getStats() {
  try {
    const response = await fetch(`${BASE_URL}/rate-limit/stats`);
    const data = await response.json();
    
    if (data.success) {
      log(`\n📈 Estatísticas de Rate Limiting:`, 'cyan');
      log(`   Usuários na whitelist: ${data.data.whitelistedUsers.length}`, 'blue');
      log(`   Usuários ativos: ${data.data.totalActiveUsers || 0}`, 'blue');
      log(`   Timestamp: ${data.data.timestamp}`, 'blue');
    } else {
      log(`❌ Erro ao obter estatísticas: ${data.message}`, 'red');
    }
  } catch (error) {
    log(`❌ Erro ao obter estatísticas: ${error.message}`, 'red');
  }
}

// Função principal de teste
async function runTests() {
  log('🚀 Iniciando testes de Rate Limiting', 'bright');
  log('=' * 50, 'cyan');
  
  // Verificar se o servidor está rodando
  try {
    const healthResponse = await fetch(`${BASE_URL}/monitoring/health`);
    if (!healthResponse.ok) {
      throw new Error('Servidor não está respondendo');
    }
    log('✅ Servidor está rodando', 'green');
  } catch (error) {
    log(`❌ Erro ao conectar com o servidor: ${error.message}`, 'red');
    log('💡 Certifique-se de que o servidor está rodando em http://localhost:1337', 'yellow');
    return;
  }
  
  // Resetar rate limiting antes dos testes
  log('\n🔄 Resetando rate limiting...', 'yellow');
  await resetRateLimit();
  
  // Verificar status inicial
  await checkRateLimitStatus();
  
  // Testar cada tipo de mensagem
  const testTypes = [
    { type: 'text', limit: 20 },
    { type: 'audio', limit: 5 },
    { type: 'image', limit: 10 },
    { type: 'document', limit: 3 }
  ];
  
  for (const testType of testTypes) {
    await testRateLimitType(testType.type, testType.limit);
    await checkRateLimitStatus();
    
    // Resetar para o próximo teste
    await resetRateLimit();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Testar whitelist
  log('\n🔒 Testando Whitelist', 'cyan');
  await addToWhitelist();
  await checkRateLimitStatus();
  
  // Tentar enviar muitas mensagens (deve passar por estar na whitelist)
  log('\n📤 Testando envio com whitelist (deve passar)...', 'yellow');
  for (let i = 1; i <= 25; i++) {
    const result = await sendWebhookMessage('text');
    if (result.status === 429) {
      log(`❌ Rate limit atingido na tentativa ${i} (não deveria acontecer!)`, 'red');
      break;
    } else if (result.ok) {
      log(`✅ Mensagem ${i} enviada com sucesso (whitelist funcionando)`, 'green');
    }
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  // Remover da whitelist
  await removeFromWhitelist();
  await checkRateLimitStatus();
  
  // Obter estatísticas finais
  await getStats();
  
  log('\n🎉 Testes concluídos!', 'green');
}

// Função para teste específico
async function testSpecificType(messageType) {
  const limits = {
    text: 20,
    audio: 5,
    image: 10,
    document: 3
  };
  
  const limit = limits[messageType] || 20;
  
  log(`🧪 Testando apenas ${messageType} (limite: ${limit})`, 'cyan');
  
  await resetRateLimit();
  await checkRateLimitStatus();
  await testRateLimitType(messageType, limit);
  await checkRateLimitStatus();
}

// Verificar argumentos da linha de comando
const args = process.argv.slice(2);

if (args.length > 0) {
  const command = args[0];
  const phoneNumber = args[1] || TEST_PHONE;
  
  switch (command) {
    case 'status':
      checkRateLimitStatus(phoneNumber);
      break;
    case 'reset':
      resetRateLimit(phoneNumber);
      break;
    case 'whitelist':
      addToWhitelist(phoneNumber);
      break;
    case 'unwhitelist':
      removeFromWhitelist(phoneNumber);
      break;
    case 'stats':
      getStats();
      break;
    case 'test':
      const type = args[1] || 'text';
      testSpecificType(type);
      break;
    default:
      log('Comandos disponíveis:', 'yellow');
      log('  node test-rate-limits.js status [phone]', 'blue');
      log('  node test-rate-limits.js reset [phone]', 'blue');
      log('  node test-rate-limits.js whitelist [phone]', 'blue');
      log('  node test-rate-limits.js unwhitelist [phone]', 'blue');
      log('  node test-rate-limits.js stats', 'blue');
      log('  node test-rate-limits.js test [type]', 'blue');
      log('  node test-rate-limits.js (executa todos os testes)', 'blue');
  }
} else {
  runTests();
}

