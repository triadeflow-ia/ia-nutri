// scripts/test-integrations.js

import * as nutritionService from '../services/nutritionService.js';
import * as webhookService from '../services/webhookService.js';
import * as redisService from '../services/redisService.js';

async function testNutritionService() {
  console.log('🧪 Testando Nutrition Service...');
  
  try {
    // Teste 1: Buscar alimento com cache
    console.log('\n1. Testando busca de alimento...');
    const banana = await nutritionService.searchFoodDeduplicated('banana', {
      quantity: 100,
      unit: 'g'
    });
    
    if (banana) {
      console.log('✅ Banana encontrada:', {
        food: banana.food,
        calories: banana.nutrients?.calories,
        fromCache: banana.fromCache
      });
    } else {
      console.log('❌ Banana não encontrada');
    }
    
    // Teste 2: Buscar novamente (deve vir do cache)
    console.log('\n2. Testando cache...');
    const bananaCached = await nutritionService.searchFoodDeduplicated('banana', {
      quantity: 100,
      unit: 'g'
    });
    
    if (bananaCached?.fromCache) {
      console.log('✅ Cache funcionando corretamente');
    } else {
      console.log('⚠️ Cache pode não estar funcionando');
    }
    
    // Teste 3: Calcular refeição
    console.log('\n3. Testando cálculo de refeição...');
    const meal = await nutritionService.calculateMealNutrition([
      { name: 'banana', quantity: 100, unit: 'g' },
      { name: 'maçã', quantity: 150, unit: 'g' }
    ]);
    
    if (meal) {
      console.log('✅ Refeição calculada:', {
        totalCalories: meal.totalCalories,
        totalProtein: meal.totalProtein,
        foods: meal.foods.length
      });
    } else {
      console.log('❌ Falha no cálculo da refeição');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste de nutrição:', error.message);
  }
}

async function testWebhookService() {
  console.log('\n🧪 Testando Webhook Service...');
  
  try {
    // Teste 1: Webhook genérico
    console.log('\n1. Testando webhook genérico...');
    const testUrl = 'https://httpbin.org/post'; // URL de teste
    
    const result = await webhookService.sendWebhookWithRetry(testUrl, {
      test: true,
      message: 'Teste de integração',
      timestamp: new Date().toISOString()
    }, {
      maxRetries: 1,
      timeout: 5000
    });
    
    if (result.success) {
      console.log('✅ Webhook enviado com sucesso');
    } else {
      console.log('❌ Falha no envio do webhook');
    }
    
    // Teste 2: Notificação
    console.log('\n2. Testando notificação webhook...');
    await webhookService.sendNotificationWebhook('test_event', {
      message: 'Teste de integração',
      timestamp: new Date().toISOString()
    });
    
    console.log('✅ Notificação webhook testada (pode falhar se URL não configurada)');
    
  } catch (error) {
    console.error('❌ Erro no teste de webhook:', error.message);
  }
}

async function testRedisService() {
  console.log('\n🧪 Testando Redis Service...');
  
  try {
    // Teste 1: Cache básico
    console.log('\n1. Testando cache básico...');
    await redisService.setCache('test_key', { message: 'teste' }, 60);
    
    const cached = await redisService.getCache('test_key');
    
    if (cached && cached.message === 'teste') {
      console.log('✅ Cache Redis funcionando');
    } else {
      console.log('❌ Cache Redis com problema');
    }
    
    // Teste 2: Estatísticas do cache
    console.log('\n2. Testando estatísticas...');
    const stats = await redisService.getCacheStats();
    console.log('📊 Estatísticas do cache:', stats);
    
    // Limpeza
    await redisService.deleteCache('test_key');
    console.log('🧹 Cache limpo');
    
  } catch (error) {
    console.error('❌ Erro no teste do Redis:', error.message);
  }
}

async function testMessageControllerIntegration() {
  console.log('\n🧪 Testando integração do MessageController...');
  
  try {
    // Simular comando de nutrição
    const nutritionKeywords = [
      'caloria', 'calorias',
      'proteína', 'proteina', 'protein',
      'carboidrato', 'carboidratos', 'carbs',
      'gordura', 'gorduras', 'fat',
      'nutriente', 'nutrientes', 'nutrition',
      'alimento', 'alimentos', 'food',
      'refeição', 'refeições', 'meal',
      'dieta', 'diet',
      'valor nutricional', 'tabela nutricional',
      'quantas calorias', 'calorias tem',
      'informação nutricional', 'info nutricional'
    ];
    
    const testMessages = [
      'quantas calorias tem uma banana',
      'informação nutricional do arroz',
      'valor nutricional da maçã',
      'olá, como você está?',
      'me fale sobre proteínas'
    ];
    
    console.log('\nTestando detecção de comandos de nutrição:');
    
    for (const message of testMessages) {
      const isNutrition = nutritionKeywords.some(keyword => 
        message.toLowerCase().includes(keyword)
      );
      
      console.log(`"${message}" -> ${isNutrition ? '✅ Comando de nutrição' : '❌ Comando normal'}`);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste de integração:', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Iniciando testes de integração do NutriZap...\n');
  
  await testRedisService();
  await testNutritionService();
  await testWebhookService();
  await testMessageControllerIntegration();
  
  console.log('\n✨ Testes concluídos!');
  console.log('\n📝 Próximos passos:');
  console.log('1. Configure as variáveis de ambiente necessárias');
  console.log('2. Teste o sistema com mensagens reais do WhatsApp');
  console.log('3. Monitore os logs para verificar funcionamento');
  console.log('4. Configure webhooks externos se necessário');
}

// Executar testes se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { runAllTests };

