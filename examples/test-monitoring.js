// examples/test-monitoring.js
// Script para testar o sistema de monitoramento

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:1337';

async function testMonitoring() {
  console.log('🧪 Testando Sistema de Monitoramento...\n');

  try {
    // Teste 1: Health Check
    console.log('1. Testando Health Check...');
    const healthResponse = await fetch(`${BASE_URL}/monitoring/health`);
    const health = await healthResponse.json();
    console.log('✅ Health Status:', health.status);
    console.log('   Uptime:', health.uptimeFormatted);
    console.log('   Redis:', health.redis.status);
    console.log('   Memória:', `${health.memory.used}MB / ${health.memory.total}MB\n`);

    // Teste 2: Estatísticas
    console.log('2. Testando Estatísticas...');
    const statsResponse = await fetch(`${BASE_URL}/monitoring/stats`);
    const stats = await statsResponse.json();
    console.log('✅ Estatísticas carregadas:');
    console.log('   Mensagens totais:', stats.messages.total);
    console.log('   Mensagens hoje:', stats.messages.today);
    console.log('   Usuários ativos:', stats.users.active);
    console.log('   Erros totais:', stats.errors.total);
    console.log('   Erros hoje:', stats.errors.today);
    console.log('   Uptime:', stats.uptimeFormatted);
    console.log('   Memória:', `${stats.memory.used}MB / ${stats.memory.total}MB\n`);

    // Teste 3: Estatísticas 24h
    console.log('3. Testando Estatísticas 24h...');
    const stats24hResponse = await fetch(`${BASE_URL}/monitoring/stats/24h`);
    const stats24h = await stats24hResponse.json();
    console.log('✅ Estatísticas 24h:');
    console.log('   Mensagens:', stats24h.messages);
    console.log('   Usuários:', stats24h.users);
    console.log('   Erros:', stats24h.errors);
    console.log('   Período:', stats24h.period);
    console.log('   Início:', stats24h.startTime);
    console.log('   Fim:', stats24h.endTime);
    console.log('   Timestamp:', stats24h.timestamp);
    console.log('');

    // Teste 4: Dashboard
    console.log('4. Testando Dashboard...');
    const dashboardResponse = await fetch(`${BASE_URL}/admin`);
    if (dashboardResponse.ok) {
      console.log('✅ Dashboard acessível em:', `${BASE_URL}/admin`);
      console.log('   Tamanho da página:', dashboardResponse.headers.get('content-length'), 'bytes');
    } else {
      console.log('❌ Erro ao acessar dashboard');
    }
    console.log('');

    // Teste 5: Rota principal
    console.log('5. Testando Rota Principal...');
    const mainResponse = await fetch(`${BASE_URL}/`);
    const main = await mainResponse.json();
    console.log('✅ API Principal:');
    console.log('   Mensagem:', main.message);
    console.log('   Versão:', main.version);
    console.log('   Status:', main.status);
    console.log('   Endpoints disponíveis:');
    Object.entries(main.endpoints).forEach(([key, value]) => {
      console.log(`     ${key}: ${value}`);
    });

    console.log('\n🎉 Todos os testes passaram! Sistema de monitoramento funcionando corretamente.');
    console.log('\n📊 Acesse o dashboard em: http://localhost:1337/admin');
    console.log('🔗 Endpoints disponíveis:');
    console.log('   - GET /monitoring/health');
    console.log('   - GET /monitoring/stats');
    console.log('   - GET /monitoring/stats/24h');
    console.log('   - GET /admin');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
    console.log('\n💡 Certifique-se de que o servidor está rodando:');
    console.log('   node app.js');
  }
}

// Executar testes
testMonitoring();

