// Script para testar o webhook do Stripe

const testWebhook = async () => {
  const webhookUrl = 'https://ia-nutri-q4dy.onrender.com/stripe/webhook';
  
  // Dados de teste do checkout.session.completed
  const testEvent = {
    id: 'evt_test_123',
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'cs_test_123',
        object: 'checkout.session',
        customer_details: {
          email: 'teste@exemplo.com'
        },
        metadata: {
          phone_number: '19983805908'
        },
        subscription: 'sub_123',
        payment_status: 'paid'
      }
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: null,
      idempotency_key: null
    },
    type: 'checkout.session.completed'
  };

  try {
    console.log('🧪 Enviando webhook de teste para:', webhookUrl);
    console.log('📦 Payload:', JSON.stringify(testEvent, null, 2));
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': 't=123,v1=test_signature,v0=test'
      },
      body: JSON.stringify(testEvent)
    });

    console.log('\n📨 Resposta do servidor:');
    console.log('Status:', response.status, response.statusText);
    
    const responseText = await response.text();
    console.log('Body:', responseText);

    if (response.ok) {
      console.log('\n✅ Webhook recebido com sucesso!');
    } else {
      console.log('\n❌ Webhook falhou!');
    }

  } catch (error) {
    console.error('\n❌ Erro ao enviar webhook:', error.message);
  }
};

testWebhook();
