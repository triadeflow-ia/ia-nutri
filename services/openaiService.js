// services\openaiService.js

import { openai } from '../config/openai.js';
import { config } from '../config/index.js';
import * as searchService from './searchService.js';
import fs from 'fs';

// Mapa para controlar operações simultâneas em threads
let runningOperations = {};

export async function createThread(formattedMessage, phoneNumber) {
  return await openai.beta.threads.create({
    messages: [{ role: "user", content: formattedMessage }],
    metadata: { phoneNumber: phoneNumber }
  });
}

export async function createThreadWithSummary(phoneNumber, summarizedContext) {
  return await openai.beta.threads.create({
    messages: [
      { role: "user", content: "Esta é uma continuação da conversa anterior. Aqui está o resumo do contexto até agora:" },
      { role: "user", content: summarizedContext }
    ],
    metadata: { phoneNumber: phoneNumber }
  });
}

export async function deleteThread(threadId) {
  return await openai.beta.threads.delete(threadId);
}

export async function addMessageToThread(threadId, content) {
  return await openai.beta.threads.messages.create(threadId, {
    role: "user",
    content: content
  });
}

export async function addMessageWithRetry(threadId, message, maxRetries = 3, delay = 3000) {
  if (runningOperations[threadId]) {
    console.log(`Operação já em execução para o thread ${threadId}, aguardando...`);
    await runningOperations[threadId];
  }

  let resolveOperation;
  runningOperations[threadId] = new Promise(resolve => {
    resolveOperation = resolve;
  });

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await waitUntilNoActiveRun(threadId);
      await openai.beta.threads.messages.create(threadId, {
        role: "user",
        content: message
      });
      console.log(`Mensagem adicionada com sucesso ao thread ${threadId} na tentativa ${attempt}.`);
      resolveOperation();
      delete runningOperations[threadId];
      return;
    } catch (error) {
      console.error(`Erro ao adicionar mensagem ao thread ${threadId} na tentativa ${attempt}: ${error.message}`);
      if (attempt < maxRetries) {
        console.log(`Tentando novamente em ${delay / 1000} segundos...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        resolveOperation();
        delete runningOperations[threadId];
        throw new Error(`Falha ao adicionar mensagem ao thread ${threadId} após ${maxRetries} tentativas.`);
      }
    }
  }
}

export async function waitUntilNoActiveRun(threadId, maxRetries = 10, delay = 3000) {
  let retries = 0;
  let runActive = await isRunActive(threadId);

  while (runActive && retries < maxRetries) {
    console.log(`Run ainda ativo para o thread ${threadId}. Aguardando...`);
    await new Promise(resolve => setTimeout(resolve, delay));
    runActive = await isRunActive(threadId);
    retries++;
  }

  if (runActive) {
    console.warn(`Run ainda ativo após ${retries} tentativas para o thread ${threadId}.`);
    throw new Error(`Não foi possível adicionar mensagens ao thread ${threadId} devido a um run ativo.`);
  }

  console.log(`Nenhum run ativo encontrado para o thread ${threadId}. Continuando...`);
}

export async function isRunActive(threadId) {
  const runs = await openai.beta.threads.runs.list(threadId);
  return runs.data.some(run => run.status === 'queued' || run.status === 'in_progress');
}

export async function getTokenUsage(threadId) {
  try {
    const runsResponse = await openai.beta.threads.runs.list(threadId);
    let totalTokens = 0;

    for (const run of runsResponse.data) {
      if (run.usage && run.usage.total_tokens) {
        totalTokens += run.usage.total_tokens;
      }
    }

    console.log(`Total de tokens usados no thread ${threadId}: ${totalTokens}`);
    return totalTokens;
  } catch (error) {
    console.error(`Erro ao obter o uso de tokens para o thread ${threadId}:`, error);
    throw error;
  }
}

export async function summarizeContext(threadId) {
  try {
    const messagesResponse = await openai.beta.threads.messages.list(threadId);
    const contextMessages = messagesResponse.data.map(msg => ({
      role: msg.role,
      content: msg.content[0].text.value
    }));

    const summaryResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "user", content: "Resuma a conversa de forma objetiva enfatizando os pontos mais importantes." },
        ...contextMessages
      ],
      max_tokens: 4000
    });

    console.log("Resumo do contexto gerado com sucesso.");
    return summaryResponse.choices[0].message.content.trim();
  } catch (error) {
    console.error("Erro ao resumir o contexto:", error);
    throw error;
  }
}

export async function runAssistant(threadId, whatsappData) {
  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: config.openai.assistantId
  });
  
  const completedRun = await waitForRunCompletion(threadId, run.id, whatsappData);
  const messagesResponse = await openai.beta.threads.messages.list(threadId);
  const assistantResponse = messagesResponse.data.find(m => m.role === 'assistant').content[0].text.value;
  
  return assistantResponse;
}

async function waitForRunCompletion(threadId, runId, whatsappData, maxRetries = 15, delay = 2000) {
  let retries = 0;
  let run;
  
  while (retries < maxRetries) {
    try {
      run = await openai.beta.threads.runs.retrieve(threadId, runId);
      
      if (run.status === 'completed') {
        console.log(`Run ${runId} completed successfully.`);
        return run;
      } else if (run.status === 'requires_action') {
        await handleRequiredAction(threadId, runId, run, whatsappData);
      } else if (run.status === 'failed') {
        console.error(`Run ${runId} failed with error:`, run.last_error);
        throw new Error(`Run failed: ${run.last_error?.message || 'Unknown error'}`);
      }
      
      console.log(`Attempt ${retries}: status of run is ${run?.status}`);
      
    } catch (error) {
      console.error("Error during run retrieval:", error);
      if (error.code === 'ECONNRESET' || error.message.includes('socket hang up')) {
        console.log("Network issue, retrying...");
      } else {
        throw error;
      }
    }
    
    retries++;
    await new Promise(resolve => setTimeout(resolve, delay * retries));
  }
  
  throw new Error(`Run ${runId} not completed after ${maxRetries} attempts`);
}

async function handleRequiredAction(threadId, runId, run, whatsappData) {
  const toolCall = run.required_action.submit_tool_outputs.tool_calls[0];
  console.log("Tool call function name:", toolCall.function.name);
  
  try {
    let result;
    const args = JSON.parse(toolCall.function.arguments);
    console.log("Tool call arguments:", args);

    switch (toolCall.function.name) {
      case 'search_web_info':
        result = await searchService.searchWebInfo(args.query);
        break;

      case 'get_images_info':
        result = await searchService.getImagesInfo(
          args.query, 
          args.count || 3,
          whatsappData.phoneNumberId,
          whatsappData.recipientNumber
        );
        break;

      default:
        console.warn(`Unknown function called: ${toolCall.function.name}`);
        result = {
          status: "error",
          message: "Função desconhecida chamada.",
          function: toolCall.function.name
        };
    }

    await openai.beta.threads.runs.submitToolOutputs(threadId, runId, {
      tool_outputs: [{
        tool_call_id: toolCall.id,
        output: JSON.stringify(result)
      }]
    });

  } catch (toolError) {
    console.error("Error processing tool call:", toolError);
    const errorResult = {
      status: "error",
      message: "Erro ao processar a chamada da ferramenta.",
      error: toolError.message
    };
    
    await openai.beta.threads.runs.submitToolOutputs(threadId, runId, {
      tool_outputs: [{
        tool_call_id: toolCall.id,
        output: JSON.stringify(errorResult)
      }]
    });
  }
}

export async function getOpenAIResponse(content) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "user", content: content }
      ],
      max_tokens: 2000
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error getting OpenAI response:", error);
    throw error;
  }
}

export async function describeImage(imagePath, caption) {
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  
  const messages = [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": `Responda com base na foto enviada e na legenda. A legenda fornecida pelo usuário é: ${caption}`
        },
        {
          "type": "image_url",
          "image_url": {
            "url": `data:image/jpeg;base64,${base64Image}`
          }
        }
      ]
    }
  ];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      max_tokens: 2000
    });
    console.log("Image description result:", response.choices[0].message.content);
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error describing image:", error);
    throw error;
  }
}