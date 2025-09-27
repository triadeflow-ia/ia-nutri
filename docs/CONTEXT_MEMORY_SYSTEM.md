# 🧠 Sistema Avançado de Contexto e Memória

## 📋 Visão Geral

O sistema de contexto e memória oferece capacidades avançadas de compreensão contextual, aprendizado automático e gerenciamento de privacidade para o bot WhatsApp.

## 🎯 Funcionalidades Implementadas

### ✅ **Context Manager**
- Memória de curto prazo (conversa atual)
- Memória de longo prazo (preferências, histórico)
- Detecção de mudança de assunto
- Resumo automático de conversas longas

### ✅ **Comandos de Contexto**
- `/contexto` - Mostra o que bot entende da conversa
- `/esquecer` - Limpa contexto atual
- `/lembrar [info]` - Salva informação importante
- `/minhas_notas` - Lista coisas que pediu para lembrar

### ✅ **Referências Inteligentes**
- "Como eu disse antes" → bot busca no contexto
- "Aquele restaurante" → bot identifica qual
- "Faça de novo" → repete última ação

### ✅ **Perfil Evolutivo**
- Aprende preferências automaticamente
- Sugere baseado em padrões de uso
- Adapta tom de conversa
- Antecipa necessidades

### ✅ **Controles de Privacidade**
- Níveis de privacidade configuráveis
- Opt-out completo
- Conformidade com LGPD
- Exportação de dados

## 🔧 Estrutura do Sistema

### **ContextManager (Gerenciador de Contexto)**

```javascript
// services/contextManager.js
class ContextManager {
  constructor() {
    this.shortTermMemory = new Map(); // Memória de curto prazo
    this.longTermMemory = new Map(); // Memória de longo prazo
    this.conversationSummaries = new Map(); // Resumos de conversas
    this.topicChanges = new Map(); // Detecção de mudança de assunto
    this.userProfiles = new Map(); // Perfis evolutivos
  }
}
```

### **ContextCommands (Comandos de Contexto)**

```javascript
// services/contextCommands.js
class ContextCommands {
  constructor() {
    this.commands = new Map();
    this.initializeCommands();
  }
}
```

### **SmartReferences (Referências Inteligentes)**

```javascript
// services/smartReferences.js
class SmartReferences {
  constructor() {
    this.referencePatterns = new Map();
    this.contextualMappings = new Map();
    this.actionHistory = new Map();
  }
}
```

### **EvolutionaryProfile (Perfil Evolutivo)**

```javascript
// services/evolutionaryProfile.js
class EvolutionaryProfile {
  constructor() {
    this.userProfiles = new Map();
    this.learningModels = new Map();
    this.adaptationRules = new Map();
  }
}
```

### **PrivacyManager (Gerenciador de Privacidade)**

```javascript
// services/privacyManager.js
class PrivacyManager {
  constructor() {
    this.privacySettings = new Map();
    this.optOutUsers = new Set();
    this.dataRetentionPolicies = new Map();
  }
}
```

## 🧠 Context Manager

### **Funcionalidades Principais**

#### 1. **Memória de Curto Prazo**
- Armazena mensagens da conversa atual
- Máximo de 50 mensagens por usuário
- Limpeza automática quando necessário

#### 2. **Memória de Longo Prazo**
- Armazena preferências e histórico
- Retenção configurável (7-90 dias)
- Categorização automática

#### 3. **Detecção de Mudança de Assunto**
- Análise de similaridade entre tópicos
- Threshold configurável (0.7)
- Registro de mudanças com timestamp

#### 4. **Resumo Automático**
- Ativado após 100 mensagens
- Extração de pontos-chave
- Análise de sentimento
- Identificação de ações pendentes

### **Exemplo de Uso**

```javascript
// Adicionar mensagem ao contexto
await contextManager.addMessage(phoneNumber, 'Olá, como você está?', 'text', {
  profileName: 'João',
  phoneNumberId: 'phone_123'
});

// Obter contexto atual
const context = await contextManager.getCurrentContext(phoneNumber);

// Salvar informação importante
await contextManager.saveImportantInfo(phoneNumber, 'Prefiro respostas curtas', 'preference');

// Buscar informações salvas
const info = await contextManager.getImportantInfo(phoneNumber);
```

## 💬 Comandos de Contexto

### **Comandos Disponíveis**

#### `/contexto`
```
🧠 *Contexto da Conversa*

📊 *Informações Gerais:*
• ID da Conversa: conv_1234567890_abc123
• Mensagens: 15
• Última Atividade: 15/12/2024 14:30:25

🎯 *Tópico Atual:* nutrição

💬 *Mensagens Recentes:*
1. [14:30:25] Olá, como você está?
2. [14:29:45] Vamos falar sobre nutrição
3. [14:29:15] Preciso de dicas de exercício

🔄 *Mudanças de Tópico:*
• 14:29:45: geral → nutrição

📝 *Resumo da Conversa:*
Conversa sobre: nutrição, exercício
Pontos importantes:
• Preciso de dicas de exercício
• Interesse em nutrição

👤 *Seu Perfil:*
• Interesses: nutrição, exercício
• Comunicação: Educada
• Preferências: text

*Use /esquecer para limpar o contexto atual*
```

#### `/esquecer`
```
🧹 *Contexto Limpo!*

✅ O contexto da conversa foi limpo com sucesso.
🆕 Nova conversa iniciada: conv_1234567890_def456

*Agora posso começar do zero!* 🚀
```

#### `/lembrar [info]`
```
💾 *Informação Salva!*

✅ Salvei: "Prefiro respostas curtas"
📁 Categoria: preference
🆔 ID: 1234567890.123

*Use /minhas_notas para ver todas as informações salvas*
```

#### `/minhas_notas`
```
📝 *Suas Notas Salvas*

📊 Total: 3 informações

*Informações salvas:*

1. [15/12/2024 14:30:25] Prefiro respostas curtas
   📁 preference | 🆔 1234567890.123

2. [15/12/2024 14:25:10] Gosto de dicas de nutrição
   📁 interest | 🆔 1234567890.122

3. [15/12/2024 14:20:05] Uso o bot principalmente pela manhã
   📁 behavior | 🆔 1234567890.121

*Use /lembrar "nova info" para adicionar mais*
```

#### `/privacidade [nivel]`
```
🔒 *Configurações de Privacidade*

📊 *Nível Atual:* standard

⚙️ *Opções Disponíveis:*
• baixo - Menos privacidade, mais personalização
• padrao - Privacidade equilibrada
• alto - Máxima privacidade

*Use /privacidade [nivel] para alterar*
```

#### `/buscar [termo]`
```
🔍 *Resultados da Busca*

🔎 Termo: "respostas"
📊 Encontrados: 2 resultados

*Resultados encontrados:*

1. [15/12/2024 14:30:25] Prefiro respostas curtas
   🎯 Confiança: 100% | Tipo: direct

2. [15/12/2024 14:25:10] Gosto de respostas detalhadas
   🎯 Confiança: 80% | Tipo: contextual

*Use /lembrar "nova info" para adicionar mais*
```

## 🔗 Referências Inteligentes

### **Tipos de Referências**

#### 1. **Referências Temporais**
- "Como eu disse antes" → Busca declarações anteriores
- "No início" → Busca início da conversa
- "Mais cedo" → Busca mensagens do dia
- "Ontem" → Busca mensagens de ontem

#### 2. **Referências Espaciais**
- "Aquele lugar" → Identifica local mencionado
- "O restaurante" → Identifica restaurante específico
- "A loja" → Identifica loja mencionada
- "O produto" → Identifica produto específico

#### 3. **Referências de Ação**
- "Faça de novo" → Repete última ação
- "Repita" → Repete última ação
- "Execute novamente" → Repete última ação
- "Tente novamente" → Retry da última ação

#### 4. **Referências de Quantidade**
- "A mesma quantidade" → Busca quantidades mencionadas
- "O mesmo valor" → Busca valores mencionados
- "Como da última vez" → Busca última quantidade
- "Igual ao anterior" → Busca quantidade anterior

### **Exemplo de Resposta**

```
🔗 *Referência Inteligente Detectada*

💬 *Declaração Anterior:*
Você se refere a: "Prefiro respostas curtas"

🔄 *Repetir Ação:*
Vou repetir: Criar lembrete para 15min
*Ação:* /lembrete
*Parâmetros:* 15min, fazer café

🏢 *Referência de Entidade:*
Você se refere a: "Aquele restaurante italiano"

💡 *Sugestões:*
• Quer que eu detalhe mais sobre isso?
• Posso explicar melhor esse ponto?
• Quer que eu execute a ação novamente?

*Continue a conversa normalmente!*
```

## 🧬 Perfil Evolutivo

### **Modelos de Aprendizado**

#### 1. **Modelo de Preferências**
- Estilo de comunicação
- Tópicos de interesse
- Preferências de tempo
- Padrões de interação

#### 2. **Modelo de Comportamento**
- Uso de comandos
- Tempo de resposta
- Padrões de erro
- Padrões de sucesso

#### 3. **Modelo de Contexto**
- Tópicos de conversa
- Duração da sessão
- Frequência de interação
- Mudanças de contexto

### **Regras de Adaptação**

#### 1. **Adaptações de Tom**
- Linguagem formal vs casual
- Nível de formalidade
- Tom de ajuda
- Adaptação ao feedback

#### 2. **Adaptações de Conteúdo**
- Priorização de tópicos
- Otimização para voz
- Comprimento das respostas
- Tipo de conteúdo

#### 3. **Adaptações de Timing**
- Horários de pico
- Duração das sessões
- Frequência de uso
- Padrões temporais

### **Exemplo de Perfil Evolutivo**

```javascript
{
  phoneNumber: "+5511999999999",
  createdAt: "2024-12-15T14:30:25.000Z",
  lastUpdated: "2024-12-15T14:30:25.000Z",
  version: "1.0",
  
  learnedPreferences: {
    communicationStyle: "formal",
    formalityLevel: 0.8,
    responseLength: "medium",
    topicInterests: ["nutrição", "exercício"],
    timePreferences: {
      "9": 5,
      "14": 3,
      "18": 2
    }
  },
  
  learnedBehavior: {
    commandUsage: {
      "lembrete": 15,
      "agenda": 8,
      "ajuda": 5
    },
    responseTime: 1200,
    adaptationLevel: 0.85
  },
  
  evolutionMetrics: {
    learningRate: 0.9,
    adaptationScore: 0.85,
    predictionAccuracy: 0.8,
    userSatisfaction: 0.9,
    evolutionStage: "expert"
  }
}
```

## 🔒 Controles de Privacidade

### **Níveis de Privacidade**

#### 1. **Baixo**
- Retenção: 90 dias
- Aprendizado: Ativo
- Compartilhamento: Ativo
- Rastreamento: Completo

#### 2. **Padrão**
- Retenção: 30 dias
- Aprendizado: Ativo
- Compartilhamento: Inativo
- Rastreamento: Básico

#### 3. **Alto**
- Retenção: 7 dias
- Aprendizado: Inativo
- Compartilhamento: Inativo
- Rastreamento: Mínimo

### **Conformidade LGPD**

#### 1. **Princípios Aplicados**
- Finalidade: Uso específico e legítimo
- Adequação: Dados apropriados para finalidade
- Necessidade: Dados mínimos necessários
- Livre acesso: Usuário pode acessar seus dados
- Qualidade: Dados exatos e atualizados
- Transparência: Informações claras sobre uso
- Segurança: Proteção adequada dos dados
- Prevenção: Medidas para evitar danos
- Não discriminação: Uso não discriminatório
- Responsabilização: Demonstração de conformidade

#### 2. **Direitos do Usuário**
- Confirmação de existência de tratamento
- Acesso aos dados
- Correção de dados incompletos
- Anonimização, bloqueio ou eliminação
- Portabilidade dos dados
- Eliminação dos dados
- Informações sobre compartilhamento
- Informações sobre possibilidade de não consentir

### **Exemplo de Configuração de Privacidade**

```javascript
{
  privacyLevel: "standard",
  dataRetention: 30,
  learningEnabled: true,
  profileSharing: false,
  contextTracking: true,
  behaviorAnalysis: true,
  dataExport: true,
  dataDeletion: "on_request"
}
```

## 🧪 Como Testar

### **1. Teste Automático Completo**

```bash
# Executar todos os testes
npm run test:context

# Ou diretamente
node scripts/test-context-system.js
```

### **2. Teste por Componente**

```bash
# Testar context manager
node scripts/test-context-system.js context

# Testar comandos de contexto
node scripts/test-context-system.js commands

# Testar referências inteligentes
node scripts/test-context-system.js references

# Testar perfil evolutivo
node scripts/test-context-system.js profile

# Testar gerenciador de privacidade
node scripts/test-context-system.js privacy

# Testar integração completa
node scripts/test-context-system.js integration

# Testar performance
node scripts/test-context-system.js performance
```

### **3. Teste Manual via WhatsApp**

```bash
# Comandos de contexto
/contexto
/esquecer
/lembrar "Prefiro respostas curtas"
/minhas_notas
/privacidade alto
/buscar "respostas"
/sugestoes

# Referências inteligentes
"Como eu disse antes"
"Faça de novo"
"Aquele restaurante"
"A mesma quantidade"
```

## 📊 Exemplos de Uso

### **1. Context Manager**

```javascript
// Adicionar mensagem ao contexto
await contextManager.addMessage(phoneNumber, 'Olá, como você está?', 'text', {
  profileName: 'João',
  phoneNumberId: 'phone_123'
});

// Obter contexto atual
const context = await contextManager.getCurrentContext(phoneNumber);

// Salvar informação importante
await contextManager.saveImportantInfo(phoneNumber, 'Prefiro respostas curtas', 'preference');

// Buscar informações salvas
const info = await contextManager.getImportantInfo(phoneNumber);
```

### **2. Referências Inteligentes**

```javascript
// Processar referências inteligentes
const result = await smartReferences.processSmartReferences(
  phoneNumber, 'Como eu disse antes', phoneNumberId, res
);

if (result.hasReferences) {
  // Referência detectada e processada
  console.log('Referência processada:', result.response);
}
```

### **3. Perfil Evolutivo**

```javascript
// Atualizar perfil evolutivo
await evolutionaryProfile.updateEvolutionaryProfile(phoneNumber, {
  type: 'message',
  data: {
    message: 'Olá, como você está?',
    response: 'Olá! Estou bem, obrigado!',
    responseTime: 1000
  },
  success: true,
  feedback: 5
});

// Gerar previsões
const predictions = await evolutionaryProfile.generatePredictions(phoneNumber);

// Obter sugestões personalizadas
const suggestions = await evolutionaryProfile.getPersonalizedSuggestions(phoneNumber);
```

### **4. Gerenciador de Privacidade**

```javascript
// Configurar privacidade
await privacyManager.setUserPrivacy(phoneNumber, 'high', {
  dataRetention: 7,
  learningEnabled: false
});

// Verificar conformidade LGPD
const compliance = await privacyManager.checkLGPDCompliance(phoneNumber);

// Exportar dados do usuário
const exportResult = await privacyManager.exportUserData(phoneNumber);

// Processar opt-out
const optOutResult = await privacyManager.processOptOut(phoneNumber, 'user_request');
```

## 🔍 Monitoramento

### **Logs de Contexto**

```javascript
// Logs são gerados automaticamente
logger.info('Message added to context', {
  phoneNumber: '+5511999999999',
  messageId: 'msg_1234567890',
  topicChange: true
});
```

### **Logs de Perfil Evolutivo**

```javascript
// Logs são gerados automaticamente
logger.info('Evolutionary profile updated', {
  phoneNumber: '+5511999999999',
  interactionType: 'message',
  success: true,
  adaptations: 2
});
```

### **Logs de Privacidade**

```javascript
// Logs são gerados automaticamente
logger.info('Privacy settings updated', {
  phoneNumber: '+5511999999999',
  privacyLevel: 'high',
  dataRetention: 7
});
```

### **Estatísticas Gerais**

```javascript
// Obter estatísticas de contexto
const contextStats = contextManager.getContextStats();

// Obter estatísticas de perfil evolutivo
const profileStats = evolutionaryProfile.getEvolutionaryStats();

// Obter estatísticas de privacidade
const privacyStats = privacyManager.getPrivacyStats();
```

## 🚀 Próximos Passos

1. **Execute os testes** para verificar funcionamento
2. **Teste os comandos** via WhatsApp
3. **Configure privacidade** personalizada
4. **Monitore o aprendizado** do perfil evolutivo
5. **Otimize as referências** baseado no uso

---

**Última atualização:** $(date)
**Versão:** 2.0.0
**Status:** ✅ Implementado e Testado

