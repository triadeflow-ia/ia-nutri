# Variáveis de Ambiente para Render

## Configuração Essencial

Configure estas variáveis no Render (Settings → Environment):

```env
# WhatsApp (OBRIGATÓRIAS)
WEBHOOK_VERIFY_TOKEN=blue_panda
GRAPH_API_TOKEN=[SEU_TOKEN_COM_PERMISSAO_PARA_769802812890658]
AI_NUMBER=769802812890658

# Server
SERVER_URL=https://ia-nutri-q4dy.onrender.com
PORT=10000

# OpenAI (para funcionar completamente)
OPENAI_API_KEY=[SUA_CHAVE_OPENAI]
ASSISTANT_ID=[SEU_ASSISTANT_ID_SE_TIVER]

# Redis (opcional - funciona sem)
REDIS_URL=[URL_DO_REDIS_SE_TIVER]
REDIS_PASSWORD=[SENHA_DO_REDIS_SE_TIVER]

# Bing Search (opcional)
BING_API_KEY=[SUA_CHAVE_BING_SE_TIVER]

# Permitir iniciar sem todas as vars
ALLOW_START_WITH_MISSING_ENVS=true
```

## Como Obter o Token Correto

1. Acesse: https://developers.facebook.com
2. Vá ao seu App → WhatsApp → Configuration
3. Em "Phone number" verifique se o número 769802812890658 está listado
4. Se não estiver:
   - Você está usando o token/app errado
   - Ou precisa adicionar este número ao seu WhatsApp Business Account

## Testando o Token

No terminal:
```bash
curl -X GET "https://graph.facebook.com/v19.0/769802812890658?access_token=SEU_TOKEN"
```

Se retornar dados do número, o token está correto.
Se retornar erro 190 ou 400, o token não tem permissão.

## Debug no Render

Após configurar e fazer redeploy, monitore os logs:
- Mensagem recebida: "Webhook received..."
- Tentativa de envio: "Enviando mensagem para o número..."
- Sucesso: Status 200
- Erro: "Unsupported post request..." indica token errado

