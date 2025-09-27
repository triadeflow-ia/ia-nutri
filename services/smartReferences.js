// services/smartReferences.js
// Sistema de referências inteligentes

import { ErrorFactory, ErrorUtils } from '../utils/errors.js';
import logger from '../config/logger.js';
import contextManager from './contextManager.js';
import * as whatsappService from './whatsappService.js';
import { config } from '../config/index.js';

class SmartReferences {
  constructor() {
    this.referencePatterns = new Map();
    this.contextualMappings = new Map();
    this.actionHistory = new Map();
    
    this.initializeReferencePatterns();
    this.initializeContextualMappings();
  }

  /**
   * Inicializar padrões de referência
   */
  initializeReferencePatterns() {
    // Padrões de referência temporal
    this.referencePatterns.set('temporal', [
      { pattern: /como eu disse/i, type: 'previous_statement', confidence: 0.9 },
      { pattern: /antes eu falei/i, type: 'previous_statement', confidence: 0.9 },
      { pattern: /no início/i, type: 'conversation_start', confidence: 0.8 },
      { pattern: /mais cedo/i, type: 'earlier_today', confidence: 0.7 },
      { pattern: /ontem/i, type: 'yesterday', confidence: 0.8 },
      { pattern: /na semana passada/i, type: 'last_week', confidence: 0.7 }
    ]);

    // Padrões de referência espacial
    this.referencePatterns.set('spatial', [
      { pattern: /aquele lugar/i, type: 'location', confidence: 0.8 },
      { pattern: /o restaurante/i, type: 'restaurant', confidence: 0.9 },
      { pattern: /a loja/i, type: 'store', confidence: 0.8 },
      { pattern: /o produto/i, type: 'product', confidence: 0.8 },
      { pattern: /o serviço/i, type: 'service', confidence: 0.8 }
    ]);

    // Padrões de referência de ação
    this.referencePatterns.set('action', [
      { pattern: /faça de novo/i, type: 'repeat_action', confidence: 0.9 },
      { pattern: /repita/i, type: 'repeat_action', confidence: 0.9 },
      { pattern: /execute novamente/i, type: 'repeat_action', confidence: 0.8 },
      { pattern: /refaça/i, type: 'repeat_action', confidence: 0.8 },
      { pattern: /tente novamente/i, type: 'retry_action', confidence: 0.7 }
    ]);

    // Padrões de referência de pessoa
    this.referencePatterns.set('person', [
      { pattern: /ele disse/i, type: 'third_party_statement', confidence: 0.8 },
      { pattern: /ela mencionou/i, type: 'third_party_statement', confidence: 0.8 },
      { pattern: /o médico/i, type: 'doctor', confidence: 0.9 },
      { pattern: /o nutricionista/i, type: 'nutritionist', confidence: 0.9 },
      { pattern: /o personal/i, type: 'trainer', confidence: 0.8 }
    ]);

    // Padrões de referência de quantidade
    this.referencePatterns.set('quantity', [
      { pattern: /a mesma quantidade/i, type: 'same_quantity', confidence: 0.8 },
      { pattern: /o mesmo valor/i, type: 'same_value', confidence: 0.8 },
      { pattern: /como da última vez/i, type: 'last_time', confidence: 0.7 },
      { pattern: /igual ao anterior/i, type: 'previous_equal', confidence: 0.7 }
    ]);

    // Padrões de referência de tempo
    this.referencePatterns.set('time', [
      { pattern: /no mesmo horário/i, type: 'same_time', confidence: 0.8 },
      { pattern: /como sempre/i, type: 'usual_time', confidence: 0.7 },
      { pattern: /todo dia/i, type: 'daily', confidence: 0.8 },
      { pattern: /semanalmente/i, type: 'weekly', confidence: 0.8 }
    ]);
  }

  /**
   * Inicializar mapeamentos contextuais
   */
  initializeContextualMappings() {
    // Mapeamentos de entidades
    this.contextualMappings.set('restaurant', [
      'restaurante', 'lanchonete', 'café', 'bar', 'pizzaria', 'hamburgueria'
    ]);
    
    this.contextualMappings.set('product', [
      'produto', 'item', 'mercadoria', 'artigo', 'coisa'
    ]);
    
    this.contextualMappings.set('service', [
      'serviço', 'atendimento', 'suporte', 'ajuda', 'assistência'
    ]);
    
    this.contextualMappings.set('location', [
      'lugar', 'local', 'endereço', 'endereco', 'onde'
    ]);
    
    this.contextualMappings.set('time', [
      'horário', 'hora', 'momento', 'quando', 'tempo'
    ]);
  }

  /**
   * Processar referências inteligentes
   */
  async processSmartReferences(phoneNumber, message, phoneNumberId, res) {
    try {
      const references = await this.detectReferences(phoneNumber, message);
      
      if (references.length === 0) {
        return { hasReferences: false };
      }

      // Processar cada referência encontrada
      const processedReferences = [];
      
      for (const reference of references) {
        const processedRef = await this.processReference(phoneNumber, reference, message);
        if (processedRef) {
          processedReferences.push(processedRef);
        }
      }

      if (processedReferences.length === 0) {
        return { hasReferences: false };
      }

      // Gerar resposta baseada nas referências
      const response = await this.generateReferenceResponse(phoneNumber, processedReferences, message);
      
      if (response) {
        await whatsappService.sendSplitReply(
          phoneNumberId,
          config.whatsapp.graphApiToken,
          res.locals.recipientNumber || phoneNumber,
          response,
          res
        );
        
        return { hasReferences: true, response: response };
      }

      return { hasReferences: false };

    } catch (error) {
      ErrorUtils.logError(error, {
        phoneNumber: phoneNumber?.replace(/\d(?=\d{4})/g, '*'),
        message: message,
        operation: 'processSmartReferences'
      });
      return { hasReferences: false };
    }
  }

  /**
   * Detectar referências na mensagem
   */
  async detectReferences(phoneNumber, message) {
    const references = [];
    const messageLower = message.toLowerCase();
    
    // Verificar cada categoria de padrões
    for (const [category, patterns] of this.referencePatterns.entries()) {
      for (const patternData of patterns) {
        const match = messageLower.match(patternData.pattern);
        
        if (match) {
          references.push({
            category: category,
            type: patternData.type,
            confidence: patternData.confidence,
            match: match[0],
            fullMatch: match,
            position: match.index
          });
        }
      }
    }
    
    // Ordenar por confiança e posição
    references.sort((a, b) => {
      if (a.confidence !== b.confidence) {
        return b.confidence - a.confidence;
      }
      return a.position - b.position;
    });
    
    return references;
  }

  /**
   * Processar referência específica
   */
  async processReference(phoneNumber, reference, message) {
    try {
      const context = await contextManager.getCurrentContext(phoneNumber);
      
      if (!context) {
        return null;
      }

      switch (reference.type) {
        case 'previous_statement':
          return await this.processPreviousStatement(phoneNumber, reference, context);
        
        case 'repeat_action':
          return await this.processRepeatAction(phoneNumber, reference, context);
        
        case 'location':
        case 'restaurant':
        case 'product':
        case 'service':
          return await this.processEntityReference(phoneNumber, reference, context);
        
        case 'same_quantity':
        case 'same_value':
          return await this.processQuantityReference(phoneNumber, reference, context);
        
        case 'same_time':
        case 'usual_time':
          return await this.processTimeReference(phoneNumber, reference, context);
        
        default:
          return await this.processGenericReference(phoneNumber, reference, context);
      }
      
    } catch (error) {
      logger.error('Error processing reference', { error: error.message, phoneNumber, reference });
      return null;
    }
  }

  /**
   * Processar referência a declaração anterior
   */
  async processPreviousStatement(phoneNumber, reference, context) {
    const recentMessages = context.recentMessages || [];
    
    if (recentMessages.length === 0) {
      return {
        type: 'previous_statement',
        found: false,
        message: 'Não encontrei declarações anteriores para referenciar.'
      };
    }
    
    // Buscar mensagens relevantes
    const relevantMessages = recentMessages
      .filter(msg => msg.content && msg.content.length > 10)
      .slice(-5); // Últimas 5 mensagens relevantes
    
    if (relevantMessages.length === 0) {
      return {
        type: 'previous_statement',
        found: false,
        message: 'Não encontrei mensagens anteriores relevantes.'
      };
    }
    
    // Retornar a mensagem mais recente
    const lastMessage = relevantMessages[relevantMessages.length - 1];
    
    return {
      type: 'previous_statement',
      found: true,
      message: `Você se refere a: "${lastMessage.content}"`,
      originalMessage: lastMessage.content,
      timestamp: lastMessage.timestamp
    };
  }

  /**
   * Processar referência a ação repetida
   */
  async processRepeatAction(phoneNumber, reference, context) {
    const actionHistory = this.actionHistory.get(phoneNumber) || [];
    
    if (actionHistory.length === 0) {
      return {
        type: 'repeat_action',
        found: false,
        message: 'Não encontrei ações anteriores para repetir.'
      };
    }
    
    // Buscar a última ação executada
    const lastAction = actionHistory[actionHistory.length - 1];
    
    return {
      type: 'repeat_action',
      found: true,
      message: `Vou repetir: ${lastAction.description}`,
      action: lastAction.action,
      parameters: lastAction.parameters,
      timestamp: lastAction.timestamp
    };
  }

  /**
   * Processar referência a entidade
   */
  async processEntityReference(phoneNumber, reference, context) {
    const entityType = reference.type;
    const entityMappings = this.contextualMappings.get(entityType) || [];
    
    // Buscar entidades mencionadas anteriormente
    const allMessages = [...(context.recentMessages || []), ...(context.longTerm || [])];
    
    const entityMentions = allMessages
      .filter(msg => {
        const content = msg.content.toLowerCase();
        return entityMappings.some(mapping => content.includes(mapping));
      })
      .slice(-3); // Últimas 3 menções
    
    if (entityMentions.length === 0) {
      return {
        type: 'entity_reference',
        found: false,
        message: `Não encontrei referências anteriores a ${entityType}.`
      };
    }
    
    // Retornar a menção mais recente
    const lastMention = entityMentions[entityMentions.length - 1];
    
    return {
      type: 'entity_reference',
      found: true,
      message: `Você se refere a: "${lastMention.content}"`,
      entityType: entityType,
      originalMessage: lastMention.content,
      timestamp: lastMention.timestamp
    };
  }

  /**
   * Processar referência de quantidade
   */
  async processQuantityReference(phoneNumber, reference, context) {
    const allMessages = [...(context.recentMessages || []), ...(context.longTerm || [])];
    
    // Buscar menções de quantidades
    const quantityMentions = allMessages
      .filter(msg => {
        const content = msg.content.toLowerCase();
        return /\d+/.test(content) && (
          content.includes('grama') || 
          content.includes('kg') || 
          content.includes('ml') || 
          content.includes('litro') ||
          content.includes('unidade') ||
          content.includes('porção')
        );
      })
      .slice(-3);
    
    if (quantityMentions.length === 0) {
      return {
        type: 'quantity_reference',
        found: false,
        message: 'Não encontrei quantidades mencionadas anteriormente.'
      };
    }
    
    const lastQuantity = quantityMentions[quantityMentions.length - 1];
    
    return {
      type: 'quantity_reference',
      found: true,
      message: `Você se refere à quantidade: "${lastQuantity.content}"`,
      originalMessage: lastQuantity.content,
      timestamp: lastQuantity.timestamp
    };
  }

  /**
   * Processar referência de tempo
   */
  async processTimeReference(phoneNumber, reference, context) {
    const allMessages = [...(context.recentMessages || []), ...(context.longTerm || [])];
    
    // Buscar menções de horários
    const timeMentions = allMessages
      .filter(msg => {
        const content = msg.content.toLowerCase();
        return /\d{1,2}[:h]\d{2}/.test(content) || 
               content.includes('hora') || 
               content.includes('horário') ||
               content.includes('manhã') ||
               content.includes('tarde') ||
               content.includes('noite');
      })
      .slice(-3);
    
    if (timeMentions.length === 0) {
      return {
        type: 'time_reference',
        found: false,
        message: 'Não encontrei horários mencionados anteriormente.'
      };
    }
    
    const lastTime = timeMentions[timeMentions.length - 1];
    
    return {
      type: 'time_reference',
      found: true,
      message: `Você se refere ao horário: "${lastTime.content}"`,
      originalMessage: lastTime.content,
      timestamp: lastTime.timestamp
    };
  }

  /**
   * Processar referência genérica
   */
  async processGenericReference(phoneNumber, reference, context) {
    // Buscar mensagens que contenham palavras similares
    const allMessages = [...(context.recentMessages || []), ...(context.longTerm || [])];
    
    const similarMessages = allMessages
      .filter(msg => {
        const content = msg.content.toLowerCase();
        const referenceWords = reference.match.toLowerCase().split(' ');
        return referenceWords.some(word => content.includes(word));
      })
      .slice(-3);
    
    if (similarMessages.length === 0) {
      return {
        type: 'generic_reference',
        found: false,
        message: 'Não encontrei referências relacionadas.'
      };
    }
    
    const lastSimilar = similarMessages[similarMessages.length - 1];
    
    return {
      type: 'generic_reference',
      found: true,
      message: `Você se refere a: "${lastSimilar.content}"`,
      originalMessage: lastSimilar.content,
      timestamp: lastSimilar.timestamp
    };
  }

  /**
   * Gerar resposta baseada nas referências
   */
  async generateReferenceResponse(phoneNumber, processedReferences, originalMessage) {
    try {
      let response = `🔗 *Referência Inteligente Detectada*\n\n`;
      
      // Agrupar referências por tipo
      const groupedReferences = this.groupReferencesByType(processedReferences);
      
      // Processar cada grupo
      for (const [type, references] of groupedReferences.entries()) {
        if (references.length === 0) continue;
        
        const reference = references[0]; // Usar a primeira referência do grupo
        
        switch (type) {
          case 'previous_statement':
            response += `💬 *Declaração Anterior:*\n`;
            response += `${reference.message}\n\n`;
            break;
          
          case 'repeat_action':
            response += `🔄 *Repetir Ação:*\n`;
            response += `${reference.message}\n\n`;
            if (reference.action) {
              response += `*Ação:* ${reference.action}\n`;
              if (reference.parameters) {
                response += `*Parâmetros:* ${reference.parameters.join(', ')}\n`;
              }
              response += `\n`;
            }
            break;
          
          case 'entity_reference':
            response += `🏢 *Referência de Entidade:*\n`;
            response += `${reference.message}\n\n`;
            break;
          
          case 'quantity_reference':
            response += `📊 *Referência de Quantidade:*\n`;
            response += `${reference.message}\n\n`;
            break;
          
          case 'time_reference':
            response += `⏰ *Referência de Tempo:*\n`;
            response += `${reference.message}\n\n`;
            break;
          
          default:
            response += `🔍 *Referência Relacionada:*\n`;
            response += `${reference.message}\n\n`;
        }
      }
      
      // Adicionar sugestões baseadas no contexto
      const suggestions = await this.generateContextualSuggestions(phoneNumber, processedReferences);
      if (suggestions.length > 0) {
        response += `💡 *Sugestões:*\n`;
        suggestions.forEach(suggestion => {
          response += `• ${suggestion}\n`;
        });
        response += `\n`;
      }
      
      response += `*Continue a conversa normalmente!*`;
      
      return response;
      
    } catch (error) {
      logger.error('Error generating reference response', { error: error.message, phoneNumber });
      return null;
    }
  }

  /**
   * Agrupar referências por tipo
   */
  groupReferencesByType(references) {
    const grouped = new Map();
    
    for (const reference of references) {
      const type = reference.type;
      if (!grouped.has(type)) {
        grouped.set(type, []);
      }
      grouped.get(type).push(reference);
    }
    
    return grouped;
  }

  /**
   * Gerar sugestões contextuais
   */
  async generateContextualSuggestions(phoneNumber, references) {
    const suggestions = [];
    
    for (const reference of references) {
      switch (reference.type) {
        case 'previous_statement':
          suggestions.push('Quer que eu detalhe mais sobre isso?');
          suggestions.push('Posso explicar melhor esse ponto?');
          break;
        
        case 'repeat_action':
          suggestions.push('Quer que eu execute a ação novamente?');
          suggestions.push('Posso modificar algum parâmetro?');
          break;
        
        case 'entity_reference':
          suggestions.push('Quer mais informações sobre isso?');
          suggestions.push('Posso ajudar com algo relacionado?');
          break;
        
        case 'quantity_reference':
          suggestions.push('Quer ajustar a quantidade?');
          suggestions.push('Posso calcular o equivalente?');
          break;
        
        case 'time_reference':
          suggestions.push('Quer agendar para esse horário?');
          suggestions.push('Posso criar um lembrete?');
          break;
      }
    }
    
    return suggestions.slice(0, 3); // Máximo 3 sugestões
  }

  /**
   * Registrar ação executada
   */
  recordAction(phoneNumber, action, parameters, description) {
    if (!this.actionHistory.has(phoneNumber)) {
      this.actionHistory.set(phoneNumber, []);
    }
    
    const actionRecord = {
      action: action,
      parameters: parameters,
      description: description,
      timestamp: new Date().toISOString()
    };
    
    const history = this.actionHistory.get(phoneNumber);
    history.push(actionRecord);
    
    // Manter apenas as últimas 10 ações
    if (history.length > 10) {
      history.splice(0, history.length - 10);
    }
    
    this.actionHistory.set(phoneNumber, history);
  }

  /**
   * Obter histórico de ações
   */
  getActionHistory(phoneNumber) {
    return this.actionHistory.get(phoneNumber) || [];
  }

  /**
   * Limpar histórico de ações
   */
  clearActionHistory(phoneNumber) {
    this.actionHistory.delete(phoneNumber);
  }

  /**
   * Obter estatísticas de referências
   */
  getReferenceStats() {
    const stats = {
      totalPatterns: 0,
      activeUsers: this.actionHistory.size,
      totalActions: 0
    };
    
    // Contar padrões
    for (const patterns of this.referencePatterns.values()) {
      stats.totalPatterns += patterns.length;
    }
    
    // Contar ações
    for (const history of this.actionHistory.values()) {
      stats.totalActions += history.length;
    }
    
    return stats;
  }

  /**
   * Adicionar novo padrão de referência
   */
  addReferencePattern(category, pattern, type, confidence = 0.8) {
    if (!this.referencePatterns.has(category)) {
      this.referencePatterns.set(category, []);
    }
    
    const patterns = this.referencePatterns.get(category);
    patterns.push({ pattern, type, confidence });
    
    this.referencePatterns.set(category, patterns);
  }

  /**
   * Adicionar novo mapeamento contextual
   */
  addContextualMapping(entityType, mappings) {
    this.contextualMappings.set(entityType, mappings);
  }

  /**
   * Obter todos os padrões de referência
   */
  getAllReferencePatterns() {
    const allPatterns = [];
    
    for (const [category, patterns] of this.referencePatterns.entries()) {
      allPatterns.push({
        category: category,
        patterns: patterns
      });
    }
    
    return allPatterns;
  }

  /**
   * Obter todos os mapeamentos contextuais
   */
  getAllContextualMappings() {
    const allMappings = [];
    
    for (const [entityType, mappings] of this.contextualMappings.entries()) {
      allMappings.push({
        entityType: entityType,
        mappings: mappings
      });
    }
    
    return allMappings;
  }
}

// Instância singleton
const smartReferences = new SmartReferences();

export default smartReferences;

