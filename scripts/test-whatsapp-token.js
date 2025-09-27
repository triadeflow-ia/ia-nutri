#!/usr/bin/env node

/**
 * Script para testar se o GRAPH_API_TOKEN tem permissão para o phone_number_id
 * 
 * Uso: node test-whatsapp-token.js
 */

import https from 'https';
import dotenv from 'dotenv';

dotenv.config();

const GRAPH_API_TOKEN = process.env.GRAPH_API_TOKEN;
const PHONE_NUMBER_ID = process.env.AI_NUMBER || '769802812890658';

if (!GRAPH_API_TOKEN) {
  console.error('❌ GRAPH_API_TOKEN não está definido no .env');
  process.exit(1);
}

console.log('🔍 Testando token do WhatsApp...');
console.log(`📱 Phone Number ID: ${PHONE_NUMBER_ID}`);
console.log(`🔑 Token: ${GRAPH_API_TOKEN.substring(0, 10)}...`);

// Teste 1: Verificar se o token tem acesso ao phone_number_id
const testPhoneNumberAccess = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'graph.facebook.com',
      path: `/v19.0/${PHONE_NUMBER_ID}?access_token=${GRAPH_API_TOKEN}`,
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const result = JSON.parse(data);
        
        if (res.statusCode === 200) {
          console.log('✅ Token tem acesso ao phone_number_id!');
          console.log('📞 Número:', result.display_phone_number);
          console.log('✓ ID verificado:', result.id);
          console.log('✓ Conta:', result.verified_name || 'N/A');
          resolve(result);
        } else {
          console.error('❌ Token NÃO tem acesso ao phone_number_id');
          console.error('Erro:', result.error?.message || data);
          reject(result);
        }
      });
    });
    
    req.on('error', (e) => {
      console.error('❌ Erro na requisição:', e.message);
      reject(e);
    });
    
    req.end();
  });
};

// Teste 2: Tentar enviar uma mensagem de teste
const testSendMessage = async () => {
  console.log('\n📤 Testando envio de mensagem...');
  
  const testMessage = {
    messaging_product: "whatsapp",
    to: "5519983805908", // Número de teste - ajuste se necessário
    type: "text",
    text: {
      body: "🤖 Teste de integração WhatsApp - " + new Date().toLocaleString('pt-BR')
    }
  };
  
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(testMessage);
    
    const options = {
      hostname: 'graph.facebook.com',
      path: `/v19.0/${PHONE_NUMBER_ID}/messages?access_token=${GRAPH_API_TOKEN}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        const result = JSON.parse(responseData);
        
        if (res.statusCode === 200) {
          console.log('✅ Mensagem enviada com sucesso!');
          console.log('Message ID:', result.messages?.[0]?.id);
          resolve(result);
        } else {
          console.error('❌ Falha ao enviar mensagem');
          console.error('Status:', res.statusCode);
          console.error('Erro:', result.error?.message || responseData);
          reject(result);
        }
      });
    });
    
    req.on('error', (e) => {
      console.error('❌ Erro na requisição:', e.message);
      reject(e);
    });
    
    req.write(data);
    req.end();
  });
};

// Executar testes
const runTests = async () => {
  try {
    // Teste 1
    await testPhoneNumberAccess();
    
    // Perguntar se quer fazer teste de envio
    console.log('\n❓ Deseja testar o envio de uma mensagem? (isso enviará uma mensagem real)');
    console.log('   Para testar, execute: node test-whatsapp-token.js --send');
    
    if (process.argv.includes('--send')) {
      await testSendMessage();
    }
    
    console.log('\n✅ Testes concluídos!');
    console.log('\n📝 Próximos passos:');
    console.log('1. Configure GRAPH_API_TOKEN no Render com este token');
    console.log('2. Configure AI_NUMBER=' + PHONE_NUMBER_ID);
    console.log('3. Faça redeploy no Render');
    
  } catch (error) {
    console.error('\n❌ Testes falharam');
    console.log('\n🔧 Como corrigir:');
    console.log('1. Verifique se o token está correto');
    console.log('2. Confirme que o phone_number_id está vinculado ao seu WhatsApp Business Account');
    console.log('3. Gere um novo token com as permissões corretas:');
    console.log('   - whatsapp_business_messaging');
    console.log('   - whatsapp_business_management');
  }
};

runTests();

