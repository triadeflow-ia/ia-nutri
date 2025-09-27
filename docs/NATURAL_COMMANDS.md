# 🧠 Sistema de Comandos em Linguagem Natural

## 📋 Visão Geral

O sistema de comandos em linguagem natural permite que os usuários interajam com o bot usando linguagem cotidiana, detectando intenções, padrões conversacionais e comandos de produtividade automaticamente.

## 🎯 Funcionalidades Implementadas

### ✅ **Detecção de Intenções**
- Reconhecimento automático de intenções do usuário
- Mapeamento para comandos estruturados
- Confiança baseada em padrões de texto
- Contexto específico para cada intenção

### ✅ **Comandos Conversacionais**
- Saudações personalizadas com dicas do dia
- Respostas educadas para agradecimentos
- Despedidas com resumo do dia
- Elogios e frustrações

### ✅ **Comandos de Produtividade**
- Agenda e compromissos do dia
- Resumo da conversa e estatísticas
- Lista de tarefas pendentes
- Timers personalizados

### ✅ **Atalhos Personalizados**
- Criação de atalhos customizados
- Compartilhamento entre usuários
- Busca e sugestões inteligentes
- Estatísticas de uso

### ✅ **Sugestões Inteligentes**
- Baseadas no horário do dia
- Baseadas no histórico de uso
- Contextuais e relevantes

## 🔧 Estrutura do Sistema

### **NaturalCommands (Classe Principal)**

```javascript
// services/naturalCommands.js
class NaturalCommands {
  constructor() {
    this.intentPatterns = new Map();
    this.conversationalPatterns = new Map();
    this.productivityCommands = new Map();
    this.customShortcuts = new Map();
    this.userUsageStats = new Map();
    this.smartSuggestions = new Map();
  }
}
```

### **ShortcutService (Gerenciamento de Atalhos)**

```javascript
// services/shortcutService.js
class ShortcutService {
  async createShortcut(phoneNumber, shortcut, command, description)
  async editShortcut(phoneNumber, shortcut, command, description)
  async removeShortcut(phoneNumber, shortcut)
  async listUserShortcuts(phoneNumber)
  async shareShortcut(phoneNumber, shortcut, targetPhoneNumber)
}
```

## 🧠 Detecção de Intenções

### **Intenções Suportadas**

| Intenção | Padrões | Comando | Confiança |
|----------|---------|---------|-----------|
| **Ajuda** | "me ajuda", "não entendo", "como funciona" | `/ajuda` | 0.9 |
| **Preço** | "quanto custa", "qual o preço", "valor" | `/assinar` | 0.85 |
| **Cancelar** | "cancela minha conta", "quero cancelar" | `/deletar` | 0.9 |
| **Perfil** | "meu perfil", "minhas informações" | `/perfil` | 0.8 |
| **Contato** | "falar com humano", "suporte" | `/contato` | 0.85 |
| **Lembrete** | "lembrete", "lembrar", "agendar" | `/lembrete` | 0.8 |
| **Voz** | "configurar voz", "áudio", "voz" | `/vozconfig` | 0.8 |
| **Dados** | "meus dados", "privacidade", "lgpd" | `/exportar` | 0.85 |

### **Exemplos de Uso**

```javascript
// Input: "me ajuda"
// Output: Detecta intenção 'help' → executa /ajuda

// Input: "quanto custa para assinar"
// Output: Detecta intenção 'pricing' → executa /assinar

// Input: "cancela minha conta"
// Output: Detecta intenção 'cancel' → executa /deletar
```

## 💬 Comandos Conversacionais

### **Saudações**

```javascript
// Input: "bom dia"
// Output: Saudação personalizada + dica do dia + sugestões

// Input: "boa tarde"
// Output: Saudação vespertina + dica do dia + sugestões

// Input: "boa noite"
// Output: Saudação noturna + dica do dia + sugestões
```

### **Agradecimentos**

```javascript
// Input: "obrigado"
// Output: Resposta educada + sugestão aleatória

// Input: "muito obrigado"
// Output: Resposta enfática + sugestão aleatória

// Input: "valeu"
// Output: Resposta informal + sugestão aleatória
```

### **Despedidas**

```javascript
// Input: "tchau"
// Output: Despedida + resumo do dia + estatísticas

// Input: "até logo"
// Output: Despedida formal + resumo do dia + estatísticas
```

### **Elogios e Frustrações**

```javascript
// Input: "muito bom"
// Output: Resposta positiva + motivação

// Input: "não funciona"
// Output: Resposta de suporte + opções de ajuda
```

## ⏰ Comandos de Produtividade

### **Agenda**

```javascript
// Input: "agenda" ou "hoje"
// Output: Lista de compromissos do dia

// Input: "compromissos"
// Output: Lista de compromissos do dia
```

### **Resumo**

```javascript
// Input: "resumo"
// Output: Estatísticas da conversa + lembretes ativos + preferências

// Input: "resumir conversa"
// Output: Resumo completo da conversa
```

### **Tarefas**

```javascript
// Input: "tarefas"
// Output: Lista de tarefas pendentes

// Input: "lista de pendências"
// Output: Lista de pendências
```

### **Timer**

```javascript
// Input: "timer 15min"
// Output: Timer de 15 minutos criado

// Input: "cronômetro 1h"
// Output: Timer de 1 hora criado

// Input: "alarme 30min fazer café"
// Output: Timer de 30 minutos com descrição
```

## ⚡ Atalhos Personalizados

### **Criar Atalho**

```bash
# Comando estruturado
/atalho add "café" "/lembrete 15min fazer café"

# Comando natural
"criar atalho café para lembrete de 15min fazer café"
```

### **Gerenciar Atalhos**

```bash
# Listar atalhos
/atalho list

# Buscar atalhos
/atalho search "café"

# Editar atalho
/atalho edit "café" "/lembrete 20min fazer café"

# Remover atalho
/atalho remove "café"

# Compartilhar atalho
/atalho share "café" "+5511999999999"

# Estatísticas
/atalho stats

# Ajuda
/atalho help
```

### **Atalhos Globais**

| Atalho | Comando | Descrição |
|--------|---------|-----------|
| `café` | `/lembrete 15min "fazer café"` | Lembrete para café |
| `água` | `/lembrete 1h "beber água"` | Lembrete para água |
| `medicamento` | `/lembrete 8h "tomar medicamento"` | Lembrete para medicamento |
| `exercício` | `/lembrete 18h "fazer exercício"` | Lembrete para exercício |
| `reunião` | `/lembrete 30min "reunião importante"` | Lembrete para reunião |
| `voz` | `/vozconfig` | Configurar voz |
| `perfil` | `/perfil` | Ver perfil |
| `ajuda` | `/ajuda` | Menu de ajuda |
| `agenda` | `/agenda` | Ver agenda |
| `hoje` | `/agenda` | Ver agenda de hoje |
| `resumo` | `/resumo` | Ver resumo |
| `tarefas` | `/tarefas` | Ver tarefas |

## 🤖 Sugestões Inteligentes

### **Baseadas no Horário**

```javascript
// Manhã (6h-12h)
['/agenda', '/tarefas', '/lembrete']

// Tarde (12h-18h)
['/resumo', '/tarefas', '/agenda']

// Noite (18h-6h)
['/resumo', '/tarefas', '/timer']
```

### **Baseadas no Uso**

```javascript
// Comandos mais usados pelo usuário
['/ajuda', '/perfil', '/config']

// Comandos recentes
['/lembrete', '/agenda', '/resumo']
```

### **Contextuais**

```javascript
// Se usuário está confuso
['/ajuda', '/comandos', '/sobre']

// Se mencionou pagamento
['/assinar', '/sobre']

// Se mandou áudio
['/vozconfig', '/ajuda audio']
```

## 🧪 Como Testar

### **1. Teste Automático Completo**

```bash
# Executar todos os testes
npm run test:natural

# Ou diretamente
node scripts/test-natural-commands.js
```

### **2. Teste por Componente**

```bash
# Testar detecção de intenções
node scripts/test-natural-commands.js intents

# Testar padrões conversacionais
node scripts/test-natural-commands.js conversational

# Testar comandos de produtividade
node scripts/test-natural-commands.js productivity

# Testar atalhos personalizados
node scripts/test-natural-commands.js shortcuts

# Testar sugestões inteligentes
node scripts/test-natural-commands.js suggestions

# Testar processamento de mensagens
node scripts/test-natural-commands.js processing

# Testar templates de atalhos
node scripts/test-natural-commands.js templates

# Testar validação de comandos
node scripts/test-natural-commands.js validation

# Testar ajuda de atalhos
node scripts/test-natural-commands.js help
```

### **3. Teste Manual via WhatsApp**

```bash
# Comandos de intenção
"me ajuda"
"quanto custa"
"cancela minha conta"
"meu perfil"
"falar com humano"

# Comandos conversacionais
"bom dia"
"obrigado"
"tchau"
"muito bom"
"não funciona"

# Comandos de produtividade
"agenda"
"hoje"
"resumo"
"tarefas"
"timer 15min"

# Atalhos personalizados
"café"
"água"
"medicamento"
"exercício"
"reunião"
```

## 📊 Exemplos de Uso

### **1. Detecção de Intenção**

```javascript
// Input: "me ajuda"
const intent = naturalCommands.detectIntent("me ajuda");
// Output: { name: 'help', command: '/ajuda', confidence: 0.9 }

// Processar mensagem natural
const result = await naturalCommands.processNaturalMessage(
  { text: { body: "me ajuda" } },
  '+5511999999999',
  'João Silva',
  'phone_id',
  res
);
// Output: { isNatural: true, handled: true, intent: 'help' }
```

### **2. Comando Conversacional**

```javascript
// Input: "bom dia"
const conversational = naturalCommands.detectConversational("bom dia");
// Output: { name: 'greeting', handler: handleGreeting, context: 'greeting' }

// Processar saudação
const result = await naturalCommands.processNaturalMessage(
  { text: { body: "bom dia" } },
  '+5511999999999',
  'João Silva',
  'phone_id',
  res
);
// Output: Saudação personalizada + dica do dia + sugestões
```

### **3. Atalho Personalizado**

```javascript
// Criar atalho
const result = await shortcutService.createShortcut(
  '+5511999999999',
  'café',
  '/lembrete 15min "fazer café"',
  'Lembrete para fazer café'
);

// Detectar atalho
const shortcut = await shortcutService.getShortcut('+5511999999999', 'café');
// Output: { type: 'custom', command: '/lembrete 15min "fazer café"' }

// Processar atalho
const result = await naturalCommands.processNaturalMessage(
  { text: { body: "café" } },
  '+5511999999999',
  'João Silva',
  'phone_id',
  res
);
// Output: Executa comando do atalho automaticamente
```

### **4. Sugestões Inteligentes**

```javascript
// Obter sugestões
const suggestions = await naturalCommands.getSmartSuggestions(
  '+5511999999999',
  'agenda'
);

// Output: ['/agenda', '/tarefas', '/resumo']

// Processar sugestões
const result = await naturalCommands.processNaturalMessage(
  { text: { body: "agenda" } },
  '+5511999999999',
  'João Silva',
  'phone_id',
  res
);
// Output: Sugestões inteligentes baseadas no contexto
```

## 🔍 Padrões de Detecção

### **Intenções**

```javascript
// Padrões de ajuda
/me ajuda/i
/preciso de ajuda/i
/não sei como/i
/como funciona/i
/não entendi/i
/estou confuso/i

// Padrões de preço
/quanto custa/i
/qual o preço/i
/quanto é/i
/valor/i
/preço/i
/custo/i

// Padrões de cancelamento
/cancela minha conta/i
/quero cancelar/i
/cancelar/i
/parar/i
/sair/i
```

### **Conversacionais**

```javascript
// Saudações
/bom dia/i
/boa tarde/i
/boa noite/i
/olá/i
/oi/i
/hey/i

// Agradecimentos
/obrigado/i
/obrigada/i
/valeu/i
/thanks/i
/muito obrigado/i

// Despedidas
/tchau/i
/até logo/i
/até mais/i
/bye/i
/goodbye/i
```

### **Produtividade**

```javascript
// Agenda
/agenda/i
/hoje/i
/compromissos/i
/eventos/i

// Resumo
/resumo/i
/resumir/i
/sumário/i
/resumir conversa/i

// Tarefas
/tarefas/i
/todos/i
/lista/i
/pendências/i
/afazeres/i

// Timer
/timer/i
/cronômetro/i
/contador/i
/alarme/i
```

## 🔧 Configuração

### **Adicionar Nova Intenção**

```javascript
// Adicionar intenção no initializeIntentPatterns()
this.intentPatterns.set('nova_intencao', {
  patterns: [
    /padrão1/i,
    /padrão2/i,
    /padrão3/i
  ],
  command: '/comando',
  confidence: 0.8,
  context: 'contexto'
});
```

### **Adicionar Novo Padrão Conversacional**

```javascript
// Adicionar padrão no initializeConversationalPatterns()
this.conversationalPatterns.set('novo_padrao', {
  patterns: [
    /padrão1/i,
    /padrão2/i
  ],
  handler: this.handleNovoPadrao.bind(this),
  context: 'contexto'
});
```

### **Adicionar Novo Comando de Produtividade**

```javascript
// Adicionar comando no initializeProductivityCommands()
this.productivityCommands.set('novo_comando', {
  patterns: [/padrão/i],
  handler: this.handleNovoComando.bind(this)
});
```

## 📈 Monitoramento

### **Logs de Comandos Naturais**

```javascript
// Logs são gerados automaticamente
logger.info('Natural command processed', {
  intent: 'help',
  confidence: 0.9,
  phoneNumber: '+5511999999999',
  message: 'me ajuda'
});
```

### **Estatísticas de Uso**

```javascript
// Obter estatísticas de uso
const usageStats = naturalCommands.getUsageStats(phoneNumber);
console.log({
  '/ajuda': 5,
  '/perfil': 3,
  '/lembrete': 2
});

// Obter estatísticas gerais
const generalStats = naturalCommands.getGeneralStats();
console.log({
  totalUsers: 100,
  totalIntents: 8,
  totalConversational: 5,
  totalProductivity: 4
});
```

### **Estatísticas de Atalhos**

```javascript
// Obter estatísticas de atalhos
const shortcutStats = await shortcutService.getShortcutStats(phoneNumber);
console.log({
  totalShortcuts: 5,
  totalUsage: 25,
  mostUsed: [
    { shortcut: 'café', usageCount: 10 },
    { shortcut: 'água', usageCount: 8 }
  ]
});
```

## 🚀 Próximos Passos

1. **Execute os testes** para verificar funcionamento
2. **Teste os comandos naturais** via WhatsApp
3. **Configure atalhos personalizados** para seus usuários
4. **Monitore o uso** dos comandos naturais
5. **Otimize padrões** baseado no uso real

---

**Última atualização:** $(date)
**Versão:** 2.0.0
**Status:** ✅ Implementado e Testado

