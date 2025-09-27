# 🤖 Sistema de Comandos Completo

## 📋 Visão Geral

O sistema de comandos implementado oferece controle total sobre o bot através de comandos estruturados, com parser inteligente, aliases, validação de parâmetros e sugestões contextuais.

## 🎯 Funcionalidades Implementadas

### ✅ **Parser de Comandos Inteligente**
- Suporte a prefixos `/` e `!`
- Parser de parâmetros com aspas
- Validação automática de sintaxe
- Detecção de comandos vs mensagens normais

### ✅ **Sistema de Aliases**
- Múltiplos aliases por comando
- Suporte a comandos em português e inglês
- Aliases intuitivos (`/ajuda` = `/help` = `/?`)

### ✅ **Comandos Essenciais**
- **/start** - Onboarding do usuário
- **/ajuda** - Menu interativo de ajuda
- **/comandos** - Lista todos os comandos
- **/perfil** - Gerenciar perfil do usuário
- **/config** - Configurações pessoais
- **/sobre** - Informações do bot
- **/contato** - Falar com humano
- **/reset** - Limpar contexto da conversa
- **/exportar** - Baixar dados (LGPD)
- **/deletar** - Apagar todos os dados (LGPD)

### ✅ **Comandos Avançados**
- **/lembrete** - Criar lembretes personalizados
- **/assinar** - Assinar planos premium
- **/vozconfig** - Configurar preferências de voz

### ✅ **Sugestões Contextuais**
- Detecção automática de contexto
- Sugestões baseadas em palavras-chave
- Comandos relevantes para cada situação

### ✅ **Sistema de Help Dinâmico**
- Categorias organizadas
- Help específico por categoria
- Comandos agrupados por funcionalidade

## 🔧 Estrutura do Sistema

### **CommandHandler (Classe Principal)**

```javascript
// services/commandHandler.js
class CommandHandler {
  constructor() {
    this.commands = new Map();
    this.aliases = new Map();
    this.permissions = new Map();
    this.contextualSuggestions = new Map();
    this.helpCategories = new Map();
  }
}
```

### **UserDataService (Gerenciamento de Dados)**

```javascript
// services/userDataService.js
class UserDataService {
  async getUserData(phoneNumber)
  async saveUserData(phoneNumber, userData)
  async createReminder(phoneNumber, reminderData)
  async exportUserData(phoneNumber)
  async deleteUserData(phoneNumber)
}
```

## 📊 Comandos Disponíveis

### **🤖 Comandos Gerais**

| Comando | Aliases | Descrição | Parâmetros |
|---------|---------|-----------|------------|
| `/start` | `/inicio`, `/começar` | Onboarding do usuário | - |
| `/ajuda` | `/help`, `/?`, `/socorro` | Menu de ajuda | `[categoria]` |
| `/comandos` | `/commands`, `/lista` | Lista todos os comandos | - |
| `/sobre` | `/about`, `/info` | Informações do bot | - |

### **👤 Comandos de Usuário**

| Comando | Aliases | Descrição | Parâmetros |
|---------|---------|-----------|------------|
| `/perfil` | `/profile`, `/me` | Gerenciar perfil | `[ação]` |
| `/config` | `/configurar`, `/settings` | Configurações | `[opção]` |
| `/reset` | `/limpar`, `/clear` | Limpar contexto | - |
| `/exportar` | `/export`, `/dados` | Baixar dados (LGPD) | - |
| `/deletar` | `/delete`, `/apagar` | Apagar dados (LGPD) | - |

### **⏰ Comandos de Produtividade**

| Comando | Aliases | Descrição | Parâmetros |
|---------|---------|-----------|------------|
| `/lembrete` | `/reminder`, `/lembrar` | Criar lembrete | `<tempo>` `<mensagem>` |

### **💳 Comandos Financeiros**

| Comando | Aliases | Descrição | Parâmetros |
|---------|---------|-----------|------------|
| `/assinar` | `/subscribe`, `/premium`, `/pagar` | Assinar plano | - |

### **🎤 Comandos de Áudio**

| Comando | Aliases | Descrição | Parâmetros |
|---------|---------|-----------|------------|
| `/vozconfig` | `/voiceconfig`, `/voz` | Configurar voz | - |

### **🆘 Comandos de Suporte**

| Comando | Aliases | Descrição | Parâmetros |
|---------|---------|-----------|------------|
| `/contato` | `/contact`, `/suporte`, `/support` | Falar com humano | - |

## 🧪 Como Testar

### **1. Teste Automático Completo**

```bash
# Executar todos os testes
npm run test:commands

# Ou diretamente
node scripts/test-commands.js
```

### **2. Teste por Componente**

```bash
# Testar parser de comandos
node scripts/test-commands.js parser

# Testar aliases
node scripts/test-commands.js aliases

# Testar sugestões contextuais
node scripts/test-commands.js suggestions

# Testar categorias de ajuda
node scripts/test-commands.js categories

# Testar validação de parâmetros
node scripts/test-commands.js validation

# Testar processamento de comandos
node scripts/test-commands.js processing

# Testar estatísticas
node scripts/test-commands.js stats

# Testar userDataService
node scripts/test-commands.js userdata
```

### **3. Teste Manual via WhatsApp**

```bash
# Comandos básicos
/start
/ajuda
/comandos
/sobre

# Comandos com parâmetros
/ajuda geral
/ajuda usuario
/ajuda audio

# Comandos de lembrete
/lembrete 10min "tomar remédio"
/lembrete 1h "reunião importante"
/lembrete 2d "aniversário da mãe"

# Comandos de perfil
/perfil
/perfil editar
/perfil configurar

# Comandos de configuração
/config
/config voz
/config lembretes

# Aliases
!help
/?
/inicio
/começar
```

## 📈 Exemplos de Uso

### **1. Comando Básico**

```javascript
// Input: /start
// Output: Mensagem de boas-vindas com onboarding

const result = await commandHandler.processCommand(
  { text: { body: '/start' } },
  '+5511999999999',
  'João Silva',
  'phone_id',
  res
);
```

### **2. Comando com Parâmetros**

```javascript
// Input: /lembrete 10min "tomar remédio"
// Output: Lembrete criado com confirmação

const result = await commandHandler.processCommand(
  { text: { body: '/lembrete 10min "tomar remédio"' } },
  '+5511999999999',
  'João Silva',
  'phone_id',
  res
);
```

### **3. Comando com Alias**

```javascript
// Input: !help
// Output: Menu de ajuda (mesmo que /ajuda)

const result = await commandHandler.processCommand(
  { text: { body: '!help' } },
  '+5511999999999',
  'João Silva',
  'phone_id',
  res
);
```

### **4. Sugestões Contextuais**

```javascript
// Input: "Não entendo como funciona"
// Output: Sugestões: /ajuda, /comandos, /sobre

const suggestions = commandHandler.getContextualSuggestions({
  text: { body: 'Não entendo como funciona' }
});
// Retorna: ['/ajuda', '/comandos', '/sobre']
```

### **5. Help Dinâmico**

```javascript
// Input: /ajuda geral
// Output: Apenas comandos da categoria geral

const result = await commandHandler.processCommand(
  { text: { body: '/ajuda geral' } },
  '+5511999999999',
  'João Silva',
  'phone_id',
  res
);
```

## 🔍 Parser de Comandos

### **Sintaxe Suportada**

```bash
# Comandos simples
/start
/ajuda
/comandos

# Comandos com parâmetros
/ajuda geral
/perfil editar
/config voz

# Comandos com parâmetros entre aspas
/lembrete 10min "tomar remédio"
/lembrete 1h "reunião importante"

# Aliases
!help
/?
/inicio
/começar
```

### **Validação de Parâmetros**

```javascript
// Comando com parâmetros obrigatórios
const commandInfo = {
  name: 'lembrete',
  parameters: [
    { name: 'tempo', required: true, type: 'string' },
    { name: 'mensagem', required: true, type: 'string' }
  ]
};

// Validação automática
commandHandler.validateParameters(commandInfo, {
  0: '10min',
  1: 'tomar remédio'
});
```

## 💡 Sugestões Contextuais

### **Palavras-chave Detectadas**

| Contexto | Palavras-chave | Sugestões |
|----------|----------------|-----------|
| Confusão | 'não entendo', 'confuso', 'perdido' | `/ajuda`, `/comandos`, `/sobre` |
| Pagamento | 'pagar', 'preço', 'custo', 'assinatura' | `/assinar`, `/sobre` |
| Áudio | 'áudio', 'voz', 'falar', 'ouvir' | `/vozconfig`, `/ajuda audio` |
| Imagem | 'imagem', 'foto', 'fotografia' | `/ajuda imagem` |
| Dados | 'dados', 'privacidade', 'lgpd' | `/exportar`, `/deletar`, `/perfil` |

### **Implementação**

```javascript
// Detectar contexto automaticamente
const suggestions = commandHandler.getContextualSuggestions(message);

// Adicionar sugestões à resposta
if (suggestions.length > 0) {
  const suggestionsText = suggestions.map(cmd => `/${cmd}`).join(', ');
  response += `\n\n💡 *Comandos úteis:* ${suggestionsText}`;
}
```

## 📚 Categorias de Help

### **Estrutura das Categorias**

```javascript
const helpCategories = {
  'geral': {
    name: 'Geral',
    emoji: '🤖',
    description: 'Comandos básicos do bot',
    commands: ['start', 'ajuda', 'comandos', 'sobre']
  },
  'usuario': {
    name: 'Usuário',
    emoji: '👤',
    description: 'Gerenciar perfil e dados',
    commands: ['perfil', 'config', 'reset', 'exportar', 'deletar']
  },
  'suporte': {
    name: 'Suporte',
    emoji: '🆘',
    description: 'Ajuda e contato',
    commands: ['contato', 'ajuda']
  },
  'produtividade': {
    name: 'Produtividade',
    emoji: '⏰',
    description: 'Ferramentas de produtividade',
    commands: ['lembrete']
  },
  'financeiro': {
    name: 'Financeiro',
    emoji: '💳',
    description: 'Assinaturas e pagamentos',
    commands: ['assinar']
  },
  'audio': {
    name: 'Áudio',
    emoji: '🎤',
    description: 'Configurações de voz',
    commands: ['vozconfig']
  }
};
```

### **Uso das Categorias**

```bash
# Help geral
/ajuda

# Help por categoria
/ajuda geral
/ajuda usuario
/ajuda suporte
/ajuda produtividade
/ajuda financeiro
/ajuda audio
/ajuda imagem
```

## 🔧 Configuração

### **Adicionar Novo Comando**

```javascript
// 1. Adicionar comando no initializeCommands()
this.commands.set('novocomando', {
  name: 'novocomando',
  aliases: ['alias1', 'alias2'],
  description: 'Descrição do comando',
  category: 'categoria',
  permission: 'user',
  handler: this.handleNovoComando.bind(this),
  parameters: [
    { name: 'param1', type: 'string', required: true, description: 'Descrição do parâmetro' }
  ]
});

// 2. Implementar handler
async handleNovoComando(parameters, phoneNumber, profileName, phoneNumberId, res) {
  // Lógica do comando
  return { success: true, message: 'Comando executado' };
}

// 3. Adicionar aliases
this.aliases.set('alias1', 'novocomando');
this.aliases.set('alias2', 'novocomando');
```

### **Adicionar Nova Categoria**

```javascript
// Adicionar categoria no initializeHelpCategories()
this.helpCategories.set('novacategoria', {
  name: 'Nova Categoria',
  emoji: '🆕',
  description: 'Descrição da categoria',
  commands: ['comando1', 'comando2']
});
```

### **Adicionar Sugestão Contextual**

```javascript
// Adicionar sugestão no initializeContextualSuggestions()
this.contextualSuggestions.set('novocontexto', {
  keywords: ['palavra1', 'palavra2', 'palavra3'],
  suggestions: ['/comando1', '/comando2']
});
```

## 📊 Monitoramento

### **Logs de Comandos**

```javascript
// Logs são gerados automaticamente
logger.info('Command executed', {
  command: 'start',
  parameters: {},
  phoneNumber: '+5511999999999',
  profileName: 'João Silva'
});
```

### **Estatísticas de Comandos**

```javascript
// Obter estatísticas
const stats = commandHandler.getCommandStats();
console.log({
  totalCommands: stats.totalCommands,
  totalAliases: stats.totalAliases,
  categories: stats.categories,
  contextualSuggestions: stats.contextualSuggestions
});
```

### **Dados do Usuário**

```javascript
// Obter dados do usuário
const userData = await userDataService.getUserData(phoneNumber);
console.log({
  messageCount: userData.messageCount,
  voiceEnabled: userData.voiceEnabled,
  reminders: userData.reminders.length
});
```

## 🚀 Próximos Passos

1. **Execute os testes** para verificar funcionamento
2. **Configure comandos personalizados** conforme sua necessidade
3. **Adicione novas categorias** de ajuda
4. **Monitore o uso** dos comandos
5. **Otimize sugestões contextuais** baseado no uso

---

**Última atualização:** $(date)
**Versão:** 2.0.0
**Status:** ✅ Implementado e Testado

