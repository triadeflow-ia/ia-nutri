# 🏠 Sistema de Menus Interativos para WhatsApp

## 📋 Visão Geral

O sistema de menus interativos oferece uma experiência de navegação intuitiva e divertida para usuários do WhatsApp, com onboarding personalizado, gamificação e menus contextuais inteligentes.

## 🎯 Funcionalidades Implementadas

### ✅ **Menu Builder**
- Menus numerados (Digite 1, 2, 3...)
- Menus com emojis como opções
- Navegação (voltar, menu principal)
- Breadcrumb (Você está em: Menu > Configurações > Voz)

### ✅ **Onboarding Interativo**
- Boas vindas personalizadas
- Escolha de preferências (texto vs áudio)
- Tutorial interativo dos comandos
- Configuração inicial (nome, preferências)
- Primeiro comando guiado

### ✅ **Menus Contextuais**
- Menu principal com 6 opções
- Sub-menus inteligentes baseados no contexto
- Navegação hierárquica
- Breadcrumbs para orientação

### ✅ **Gamificação**
- XP por usar comandos novos
- Achievements (primeira imagem, 7 dias seguidos, etc)
- Ranking de usuários ativos
- Recompensas (features exclusivas)

## 🔧 Estrutura do Sistema

### **MenuBuilder (Classe Principal)**

```javascript
// services/menuBuilder.js
class MenuBuilder {
  constructor() {
    this.menus = new Map();
    this.userStates = new Map();
    this.breadcrumbs = new Map();
    this.menuHistory = new Map();
  }
}
```

### **OnboardingService (Onboarding Interativo)**

```javascript
// services/onboardingService.js
class OnboardingService {
  constructor() {
    this.onboardingSteps = new Map();
    this.userProgress = new Map();
    this.tutorialSteps = new Map();
  }
}
```

### **GamificationService (Sistema de Gamificação)**

```javascript
// services/gamificationService.js
class GamificationService {
  constructor() {
    this.achievements = new Map();
    this.xpRewards = new Map();
    this.userStats = new Map();
    this.leaderboards = new Map();
  }
}
```

## 🏠 Menus Disponíveis

### **Menu Principal**
```
🏠 *Menu Principal*
Escolha uma opção:

1️⃣ Comandos úteis
2️⃣ Configurações  
3️⃣ Ajuda
4️⃣ Assinar Premium
5️⃣ Meu Perfil
6️⃣ Estatísticas

Digite o número da opção ou use /menu para voltar ao início
```

### **Menu de Comandos**
```
⚡ *Comandos Úteis*
Escolha uma categoria:

1️⃣ Produtividade
2️⃣ Nutrição
3️⃣ Áudio/Voz
4️⃣ Dados/LGPD
0️⃣ Voltar

Digite o número da opção
```

### **Menu de Configurações**
```
⚙️ *Configurações*
Configure suas preferências:

1️⃣ Configurar Voz
2️⃣ Notificações
3️⃣ Privacidade
4️⃣ Atalhos
0️⃣ Voltar

Digite o número da opção
```

### **Menu de Ajuda**
```
🆘 *Ajuda*
Como posso te ajudar?

1️⃣ Tutorial
2️⃣ Perguntas Frequentes
3️⃣ Falar com Humano
4️⃣ Lista de Comandos
0️⃣ Voltar

Digite o número da opção
```

### **Menu de Premium**
```
💎 *Assinar Premium*
Escolha seu plano:

1️⃣ Básico - R$ 9,90/mês
2️⃣ Pro - R$ 19,90/mês
3️⃣ Premium - R$ 39,90/mês
4️⃣ Ver Benefícios
0️⃣ Voltar

Digite o número da opção
```

## 🎓 Fluxo de Onboarding

### **Etapa 1: Boas-vindas**
```
🎉 *Bem-vindo ao IA Atendimento Bot!*
Olá! Sou seu assistente virtual especializado em nutrição e bem-estar. Vamos configurar sua experiência personalizada!

1️⃣ Começar Configuração
2️⃣ Pular Configuração

Digite o número da opção
```

### **Etapa 2: Preferências**
```
⚙️ *Configuração de Preferências*
Como você prefere receber as respostas?

1️⃣ Apenas Texto
2️⃣ Texto + Áudio
0️⃣ Voltar

Digite o número da opção
```

### **Etapa 3: Nome**
```
👤 *Seu Nome*
Qual é o seu nome? (opcional)

1️⃣ Pular
0️⃣ Voltar

Digite seu nome ou o número da opção
```

### **Etapa 4: Tutorial**
```
📚 *Tutorial Interativo*
Vamos aprender os comandos principais!

1️⃣ Começar Tutorial
2️⃣ Pular Tutorial
0️⃣ Voltar

Digite o número da opção
```

### **Etapa 5: Primeiro Comando**
```
🎯 *Primeiro Comando*
Vamos testar seu primeiro comando!

1️⃣ Ver Ajuda
2️⃣ Ver Perfil
3️⃣ Ver Menu
0️⃣ Voltar

Digite o número da opção
```

### **Etapa 6: Conclusão**
```
🎉 *Configuração Concluída!*
Perfeito! Sua conta está configurada e pronta para uso.

1️⃣ Ver Menu Principal
2️⃣ Fazer Tutorial
3️⃣ Começar a Usar

Digite o número da opção
```

## 🎮 Sistema de Gamificação

### **Sistema de XP**
| Ação | XP |
|------|-----|
| Mensagem | 1 |
| Comando | 2 |
| Comando Natural | 3 |
| Upload de Imagem | 5 |
| Upload de Áudio | 5 |
| Lembrete Criado | 3 |
| Tarefa Completa | 2 |
| Atalho Criado | 4 |
| Menu Usado | 1 |
| Tutorial Completo | 10 |
| Onboarding Completo | 15 |

### **Sistema de Níveis**
```javascript
// Fórmula: nível = floor(sqrt(xp / 100)) + 1
Nível 1: 0-99 XP
Nível 2: 100-399 XP
Nível 3: 400-899 XP
Nível 4: 900-1599 XP
Nível 5: 1600-2499 XP
```

### **Achievements Disponíveis**

#### **Primeira Vez**
- **Primeira Mensagem** (10 XP) - Enviou sua primeira mensagem
- **Primeiro Comando** (15 XP) - Usou seu primeiro comando
- **Primeira Imagem** (20 XP) - Enviou sua primeira imagem
- **Primeiro Áudio** (20 XP) - Enviou seu primeiro áudio

#### **Frequência**
- **Usuário Diário** (50 XP) - Usou o bot por 7 dias seguidos
- **Usuário Semanal** (100 XP) - Usou o bot por 4 semanas seguidas
- **Usuário Mensal** (200 XP) - Usou o bot por 3 meses seguidos

#### **Comandos**
- **Mestre dos Comandos** (75 XP) - Usou 10 comandos diferentes
- **Falante Natural** (60 XP) - Usou 20 comandos em linguagem natural
- **Criador de Atalhos** (40 XP) - Criou 5 atalhos personalizados

#### **Produtividade**
- **Mestre dos Lembretes** (50 XP) - Criou 10 lembretes
- **Completador de Tarefas** (60 XP) - Completou 20 tarefas
- **Usuário de Timer** (30 XP) - Usou o timer 15 vezes

#### **Especiais**
- **Adotante Antecipado** (100 XP) - Foi um dos primeiros 100 usuários
- **Testador Beta** (80 XP) - Testou funcionalidades beta
- **Doador de Feedback** (25 XP) - Deu feedback construtivo

### **Recompensas por Nível**
- **Nível 5**: Atalho Personalizado
- **Nível 10**: Temas Personalizados
- **Nível 15**: Comandos Avançados
- **Nível 20**: Estatísticas Detalhadas
- **Nível 25**: Suporte Prioritário

## 🧪 Como Testar

### **1. Teste Automático Completo**

```bash
# Executar todos os testes
npm run test:menus

# Ou diretamente
node scripts/test-menus.js
```

### **2. Teste por Componente**

```bash
# Testar menu builder
node scripts/test-menus.js menus

# Testar onboarding service
node scripts/test-menus.js onboarding

# Testar gamification service
node scripts/test-menus.js gamification

# Testar processamento de entrada
node scripts/test-menus.js input

# Testar navegação de menus
node scripts/test-menus.js navigation

# Testar sistema de gamificação
node scripts/test-menus.js gamification-system

# Testar integração completa
node scripts/test-menus.js integration

# Testar breadcrumbs
node scripts/test-menus.js breadcrumbs
```

### **3. Teste Manual via WhatsApp**

```bash
# Comandos de menu
/menu
1
2
3
0

# Comandos de onboarding
/start
1
2
João Silva
1
1

# Comandos de gamificação
/estatísticas
/ranking
/achievements
```

## 📊 Exemplos de Uso

### **1. Navegação de Menu**

```javascript
// Mostrar menu principal
await menuBuilder.showMainMenu(phoneNumber, profileName, phoneNumberId, res);

// Processar entrada do usuário
const result = await menuBuilder.processMenuInput(
  { text: { body: '1' } },
  phoneNumber,
  profileName,
  phoneNumberId,
  res
);
```

### **2. Onboarding**

```javascript
// Iniciar onboarding
await onboardingService.startOnboarding(phoneNumber, profileName, phoneNumberId, res);

// Processar entrada do onboarding
const result = await onboardingService.processOnboardingInput(
  { text: { body: '1' } },
  phoneNumber,
  profileName,
  phoneNumberId,
  res
);
```

### **3. Gamificação**

```javascript
// Adicionar XP
const xpResult = await gamificationService.addXP(phoneNumber, 'command');

// Obter estatísticas do usuário
const userStats = await gamificationService.getUserStats(phoneNumber);

// Obter leaderboard
const leaderboard = await gamificationService.getLeaderboard(10);
```

### **4. Integração Completa**

```javascript
// Processar mensagem com todos os sistemas
const message = { text: { body: '1' } };

// 1. Verificar se é entrada de menu
const menuResult = await menuBuilder.processMenuInput(message, phoneNumber, profileName, phoneNumberId, res);
if (menuResult.isMenu) return;

// 2. Verificar se é entrada de onboarding
const onboardingResult = await onboardingService.processOnboardingInput(message, phoneNumber, profileName, phoneNumberId, res);
if (onboardingResult.isOnboarding) return;

// 3. Processar comando normal
const commandResult = await commandHandler.processCommand(message, phoneNumber, profileName, phoneNumberId, res);
if (commandResult.isCommand) {
  // Adicionar XP
  await gamificationService.addXP(phoneNumber, 'command');
  return;
}
```

## 🔍 Navegação de Menus

### **Estrutura Hierárquica**
```
Menu Principal
├── Comandos Úteis
│   ├── Produtividade
│   ├── Nutrição
│   ├── Áudio/Voz
│   └── Dados/LGPD
├── Configurações
│   ├── Configurar Voz
│   ├── Notificações
│   ├── Privacidade
│   └── Atalhos
├── Ajuda
│   ├── Tutorial
│   ├── Perguntas Frequentes
│   ├── Falar com Humano
│   └── Lista de Comandos
├── Assinar Premium
│   ├── Básico
│   ├── Pro
│   ├── Premium
│   └── Ver Benefícios
├── Meu Perfil
└── Estatísticas
```

### **Breadcrumbs**
```
📍 Você está em: Menu Principal > Comandos Úteis > Produtividade
```

### **Comandos de Navegação**
- **Números (1-9)**: Selecionar opção
- **0**: Voltar
- **/menu**: Menu principal
- **voltar**: Voltar
- **back**: Voltar

## 🎯 Gamificação Avançada

### **Sistema de Raridade**
- **Common** (Comum): Fácil de conseguir
- **Uncommon** (Incomum): Moderadamente difícil
- **Rare** (Raro): Difícil de conseguir
- **Epic** (Épico): Muito difícil
- **Legendary** (Lendário): Extremamente raro

### **Categorias de Achievements**
- **first_time**: Primeira vez
- **frequency**: Frequência de uso
- **commands**: Comandos
- **productivity**: Produtividade
- **special**: Especiais

### **Sistema de Ranking**
- Baseado em XP total
- Atualizado em tempo real
- Top 10, 50, 100 usuários
- Ranking por categoria

## 🔧 Configuração

### **Adicionar Novo Menu**

```javascript
// Adicionar menu personalizado
menuBuilder.addCustomMenu('novo_menu', {
  id: 'novo_menu',
  title: '🆕 *Novo Menu*',
  description: 'Descrição do menu',
  options: [
    { id: 'opcao1', text: '1️⃣ Opção 1', emoji: '⭐', action: 'navigate', target: 'menu_alvo' },
    { id: 'opcao2', text: '2️⃣ Opção 2', emoji: '🌟', action: 'command', target: '/comando' }
  ],
  footer: 'Digite o número da opção'
});
```

### **Adicionar Nova Etapa de Onboarding**

```javascript
// Adicionar etapa personalizada
onboardingService.addOnboardingStep('nova_etapa', {
  id: 'nova_etapa',
  title: '🆕 *Nova Etapa*',
  message: 'Mensagem da etapa',
  options: [
    { id: 'next', text: '1️⃣ Próximo', emoji: '➡️', action: 'next', target: 'proxima_etapa' }
  ],
  footer: 'Digite o número da opção'
});
```

### **Adicionar Novo Achievement**

```javascript
// Adicionar achievement personalizado
gamificationService.addAchievement('novo_achievement', {
  id: 'novo_achievement',
  name: 'Novo Achievement',
  description: 'Descrição do achievement',
  emoji: '🏆',
  xp: 50,
  rarity: 'rare',
  category: 'special'
});
```

## 📈 Monitoramento

### **Logs de Menus**

```javascript
// Logs são gerados automaticamente
logger.info('Menu displayed', {
  menuId: 'main',
  phoneNumber: '+5511999999999',
  action: 'navigate'
});
```

### **Logs de Onboarding**

```javascript
// Logs são gerados automaticamente
logger.info('Onboarding step completed', {
  stepId: 'welcome',
  phoneNumber: '+5511999999999',
  progress: 25
});
```

### **Logs de Gamificação**

```javascript
// Logs são gerados automaticamente
logger.info('XP added', {
  phoneNumber: '+5511999999999',
  action: 'command',
  xpAdded: 2,
  totalXP: 150,
  level: 2
});
```

### **Estatísticas Gerais**

```javascript
// Obter estatísticas de menus
const menuStats = menuBuilder.getMenuStats();

// Obter estatísticas de onboarding
const onboardingStats = onboardingService.getOnboardingStats();

// Obter estatísticas de gamificação
const gamificationStats = gamificationService.getGeneralStats();
```

## 🚀 Próximos Passos

1. **Execute os testes** para verificar funcionamento
2. **Teste os menus** via WhatsApp
3. **Configure onboarding** personalizado
4. **Monitore a gamificação** e ajuste recompensas
5. **Otimize a experiência** baseado no uso

---

**Última atualização:** $(date)
**Versão:** 2.0.0
**Status:** ✅ Implementado e Testado

