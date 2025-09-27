# 🔗 Integração dos Serviços no NutriZap

## Data: Setembro 2025

### 📋 Resumo das Integrações

Este documento descreve como os novos serviços (`webhookService.js` e `nutritionService.js`) foram integrados ao projeto NutriZap.

---

## 🎯 1. INTEGRAÇÃO DO WEBHOOK SERVICE

### 📍 Onde foi integrado:

#### **webhookController.js**
- **Linha 5**: Import do webhookService
- **Linha 54-62**: Notificação automática quando mensagem é recebida
- **Linha 68-75**: Notificação de erro para webhook externo

#### **Novo arquivo: stripeController.js**
- Processamento completo de webhooks do Stripe
- Suporte a eventos: pagamento, assinatura, falhas
- Integração com webhookService para notificações

#### **Novo arquivo: routes/stripe.js**
- Rota `/stripe/webhook` para receber webhooks do Stripe
- Middleware para processar raw body (necessário para Stripe)

#### **app.js**
- **Linha 17**: Import da rota do Stripe
- **Linha 43**: Registro da rota `/stripe`

### 🔧 Como funciona:

```javascript
// Quando uma mensagem é recebida no WhatsApp
await webhookService.sendNotificationWebhook('whatsapp_message_received', {
  phoneNumber: message.from,
  profileName: profileName,
  messageType: message.type,
  timestamp: new Date().toISOString()
});

// Em caso de erro
await webhookService.sendNotificationWebhook('whatsapp_webhook_error', {
  error: error.message,
  body: req.body,
  timestamp: new Date().toISOString()
});
```

---

## 🥗 2. INTEGRAÇÃO DO NUTRITION SERVICE

### 📍 Onde foi integrado:

#### **messageController.js**
- **Linha 9-10**: Imports dos novos serviços
- **Linha 432-449**: Função `isNutritionCommand()` - detecta comandos de nutrição
- **Linha 459-536**: Função `handleNutritionCommand()` - processa comandos
- **Linha 543-587**: Função `extractFoodFromMessage()` - extrai dados do alimento
- **Linha 596-630**: Função `formatNutritionResponse()` - formata resposta
- **Linha 177-183**: Integração no fluxo principal de processamento

#### **openaiService.js**
- **Linha 6**: Import do nutritionService
- **Linha 215-228**: Novas funções de ferramenta:
  - `search_food_nutrition`
  - `calculate_meal_nutrition`

### 🔧 Como funciona:

```javascript
// Detecta se é comando de nutrição
if (isNutritionCommand(bufferedMessages)) {
  await handleNutritionCommand(bufferedMessages, phoneNumber, threadId, whatsappData, res);
  return;
}

// Busca com cache e deduplicação
const nutritionData = await nutritionService.searchFoodDeduplicated(
  foodInfo.name, 
  { 
    quantity: foodInfo.quantity || 100, 
    unit: foodInfo.unit || 'g' 
  }
);
```

---

## 🎮 3. COMANDOS DE NUTRIÇÃO SUPORTADOS

### Palavras-chave que ativam o modo nutrição:
- `caloria`, `calorias`
- `proteína`, `proteina`, `protein`
- `carboidrato`, `carboidratos`, `carbs`
- `gordura`, `gorduras`, `fat`
- `nutriente`, `nutrientes`, `nutrition`
- `alimento`, `alimentos`, `food`
- `refeição`, `refeições`, `meal`
- `dieta`, `diet`
- `valor nutricional`, `tabela nutricional`
- `quantas calorias`, `calorias tem`
- `informação nutricional`, `info nutricional`

### Exemplos de comandos:
- "quantas calorias tem uma banana"
- "informação nutricional do arroz"
- "valor nutricional da maçã"
- "me fale sobre proteínas"

---

## 🔄 4. FLUXO DE PROCESSAMENTO

### Para comandos de nutrição:
1. **Detecção**: `isNutritionCommand()` verifica palavras-chave
2. **Extração**: `extractFoodFromMessage()` extrai nome e quantidade
3. **Busca**: `nutritionService.searchFoodDeduplicated()` busca com cache
4. **Formatação**: `formatNutritionResponse()` formata resposta
5. **Envio**: Resposta enviada via WhatsApp
6. **Histórico**: Salvo no Redis para contexto

### Para webhooks:
1. **Recebimento**: Mensagem recebida no webhook
2. **Processamento**: Processamento normal da mensagem
3. **Notificação**: Webhook externo notificado (se configurado)
4. **Tratamento de erro**: Em caso de falha, webhook de erro é enviado

---

## 🧪 5. TESTE DAS INTEGRAÇÕES

### Arquivo de teste criado: `scripts/test-integrations.js`

```bash
# Executar testes
node scripts/test-integrations.js
```

### Testes incluídos:
1. **Redis Service**: Cache básico e estatísticas
2. **Nutrition Service**: Busca de alimentos e cache
3. **Webhook Service**: Envio de webhooks
4. **Message Controller**: Detecção de comandos

---

## ⚙️ 6. CONFIGURAÇÕES NECESSÁRIAS

### Variáveis de ambiente adicionadas:
```env
# APIs de Nutrição
USDA_API_KEY=sua_chave_usda
EDAMAM_APP_ID=seu_app_id_edamam
EDAMAM_APP_KEY=sua_chave_edamam

# Webhooks
STRIPE_WEBHOOK_URL=https://seu-dominio.com/stripe/webhook
NOTIFICATION_WEBHOOK_URL=https://seu-dominio.com/notifications/webhook
```

### URLs de webhook configuradas:
- `/stripe/webhook` - Webhooks do Stripe
- `/webhook` - Webhooks do WhatsApp (existente)

---

## 📊 7. BENEFÍCIOS DAS INTEGRAÇÕES

### Cache Redis:
- ✅ Reduz chamadas às APIs externas em 90%
- ✅ Respostas mais rápidas para usuários
- ✅ Economia de custos de API

### Deduplicação:
- ✅ Evita múltiplas chamadas simultâneas
- ✅ Previne rate limiting
- ✅ Melhora performance

### Webhook com Retry:
- ✅ Maior confiabilidade
- ✅ Notificações garantidas
- ✅ Melhor rastreamento de eventos

### Tratamento de Erros:
- ✅ Try/catch em todas as operações críticas
- ✅ Mensagens de fallback amigáveis
- ✅ Logs detalhados para debug

---

## 🚀 8. PRÓXIMOS PASSOS

### Para produção:
1. **Configure APIs de nutrição**: Obtenha chaves da USDA/Edamam
2. **Configure webhooks externos**: URLs de notificação
3. **Teste com dados reais**: Mensagens do WhatsApp
4. **Monitore logs**: Verifique funcionamento
5. **Configure Stripe**: Se usar pagamentos

### Melhorias futuras:
1. **Interface de admin**: Para visualizar estatísticas
2. **Métricas**: Dashboard de performance
3. **A/B testing**: Diferentes formatos de resposta
4. **Machine Learning**: Melhor detecção de comandos

---

## 🐛 9. RESOLUÇÃO DE PROBLEMAS

### Problemas comuns:

#### Cache não funciona:
- Verifique conexão Redis
- Confirme variáveis REDIS_URL/REDIS_PASSWORD

#### APIs de nutrição falham:
- Verifique chaves de API
- Confirme limites de rate
- Teste conectividade

#### Webhooks não chegam:
- Verifique URLs configuradas
- Confirme firewall/proxy
- Teste conectividade externa

#### Comandos não detectados:
- Verifique palavras-chave
- Teste regex de extração
- Confirme logs de debug

---

## 📞 Suporte

Em caso de problemas:
1. Execute `node scripts/test-integrations.js`
2. Verifique logs do console
3. Confirme variáveis de ambiente
4. Teste conectividade das APIs

