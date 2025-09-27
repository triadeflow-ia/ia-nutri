// test-onboarding.js
// Script para testar o onboarding sem precisar fazer pagamento

import { config } from './config/index.js';
import * as onboardingService from './services/onboardingService.js';

const TEST_PHONE = '5519983805908'; // Seu número de teste

async function testOnboarding() {
  try {
    console.log('🧪 Iniciando teste de onboarding...');
    console.log(`📱 Número de teste: ${TEST_PHONE}`);
    
    // Simular início de onboarding (como se fosse um pagamento)
    await onboardingService.startOnboarding(TEST_PHONE);
    
    console.log('✅ Teste de onboarding iniciado!');
    console.log('📱 Verifique seu WhatsApp!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar teste
testOnboarding();
