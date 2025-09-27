// Script para resetar memória de um usuário específico
import { redisClient } from './config/redis.js';
import { openai } from './config/openai.js';

const phoneNumber = '19983805908';

async function resetMemory() {
  try {
    console.log(`🔄 Resetando memória para o número: ${phoneNumber}`);
    
    // 1. Obter thread ID atual
    const threadId = await redisClient.get(`threadId:${phoneNumber}`);
    console.log(`Thread ID atual: ${threadId}`);
    
    // 2. Deletar thread ID do Redis
    await redisClient.del(`threadId:${phoneNumber}`);
    console.log('✅ Thread ID removido do Redis');
    
    // 3. Deletar thread da OpenAI se existir
    if (threadId) {
      try {
        await openai.beta.threads.del(threadId);
        console.log(`✅ Thread ${threadId} deletado da OpenAI`);
      } catch (error) {
        console.error('Erro ao deletar thread da OpenAI:', error.message);
      }
    }
    
    // 4. Limpar todas as conversações do número
    const conversationKeys = await redisClient.keys(`conversation:${phoneNumber}:*`);
    console.log(`Encontradas ${conversationKeys.length} conversações para limpar`);
    for (const key of conversationKeys) {
      await redisClient.del(key);
      console.log(`✅ Limpou: ${key}`);
    }
    
    // 5. Limpar mensagens individuais do número
    const messageKeys = await redisClient.keys(`message:*`);
    let deletedMessages = 0;
    for (const key of messageKeys) {
      const messageData = await redisClient.hGetAll(key);
      if (messageData.phoneNumber === phoneNumber) {
        await redisClient.del(key);
        deletedMessages++;
      }
    }
    console.log(`✅ Limpou ${deletedMessages} mensagens individuais`);
    
    // 6. Limpar estados temporários do número
    const tempKeys = await redisClient.keys(`temp:${phoneNumber}*`);
    for (const key of tempKeys) {
      await redisClient.del(key);
      console.log(`✅ Limpou estado temporário: ${key}`);
    }
    
    console.log(`🎉 Memória resetada com sucesso para ${phoneNumber}!`);
    console.log('Agora você pode começar uma conversa completamente nova.');
    
  } catch (error) {
    console.error(`❌ Erro ao resetar memória:`, error);
  } finally {
    // Fechar conexão Redis
    await redisClient.quit();
    process.exit(0);
  }
}

resetMemory();
