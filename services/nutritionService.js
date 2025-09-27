// services/nutritionService.js

import axios from 'axios';
import * as redisService from './redisService.js';

// Configurações
const CACHE_TTL = 86400; // 24 horas em segundos
const API_TIMEOUT = 10000; // 10 segundos

// APIs de nutrição disponíveis
const NUTRITION_APIS = {
  USDA: {
    name: 'USDA FoodData Central',
    baseUrl: 'https://api.nal.usda.gov/fdc/v1',
    apiKey: process.env.USDA_API_KEY
  },
  EDAMAM: {
    name: 'Edamam Food Database',
    baseUrl: 'https://api.edamam.com/api/food-database/v2',
    appId: process.env.EDAMAM_APP_ID,
    appKey: process.env.EDAMAM_APP_KEY
  }
};

/**
 * Busca informações nutricionais de um alimento
 * @param {string} foodName - Nome do alimento
 * @param {object} options - Opções de busca
 * @returns {Promise<object>} Informações nutricionais
 */
export async function searchFood(foodName, options = {}) {
  const { 
    useCache = true, 
    source = 'USDA',
    quantity = 100,
    unit = 'g' 
  } = options;

  // Normalizar nome do alimento para cache
  const normalizedName = foodName.toLowerCase().trim();
  const cacheKey = `nutrition:${source}:${normalizedName}:${quantity}${unit}`;

  // Verificar cache primeiro
  if (useCache) {
    const cachedData = await redisService.getCache(cacheKey);
    if (cachedData) {
      console.log(`Dados nutricionais encontrados no cache para: ${foodName}`);
      return {
        ...cachedData,
        fromCache: true
      };
    }
  }

  // Buscar dados da API
  try {
    let nutritionData;
    
    switch (source) {
      case 'USDA':
        nutritionData = await searchUSDA(normalizedName, quantity, unit);
        break;
      case 'EDAMAM':
        nutritionData = await searchEdamam(normalizedName, quantity, unit);
        break;
      default:
        throw new Error(`Fonte de dados não suportada: ${source}`);
    }

    // Validar e normalizar dados nutricionais
    const normalizedData = normalizeNutritionData(nutritionData, foodName, quantity, unit);

    // Salvar no cache
    if (useCache && normalizedData) {
      await redisService.setCache(cacheKey, normalizedData, CACHE_TTL);
      console.log(`Dados nutricionais salvos no cache para: ${foodName}`);
    }

    return {
      ...normalizedData,
      fromCache: false
    };

  } catch (error) {
    console.error(`Erro ao buscar dados nutricionais para ${foodName}:`, error);
    throw new NutritionError(`Não foi possível obter dados nutricionais para ${foodName}`, error);
  }
}

/**
 * Busca na API do USDA
 */
async function searchUSDA(foodName, quantity, unit) {
  const { baseUrl, apiKey } = NUTRITION_APIS.USDA;
  
  if (!apiKey) {
    throw new Error('USDA_API_KEY não configurada');
  }

  // Primeiro, buscar o alimento
  const searchResponse = await axios.get(`${baseUrl}/foods/search`, {
    params: {
      query: foodName,
      api_key: apiKey,
      limit: 5
    },
    timeout: API_TIMEOUT
  });

  if (!searchResponse.data.foods || searchResponse.data.foods.length === 0) {
    throw new Error('Alimento não encontrado na base USDA');
  }

  // Pegar o primeiro resultado
  const food = searchResponse.data.foods[0];
  
  // Buscar detalhes nutricionais
  const detailsResponse = await axios.get(`${baseUrl}/food/${food.fdcId}`, {
    params: { api_key: apiKey },
    timeout: API_TIMEOUT
  });

  return detailsResponse.data;
}

/**
 * Busca na API do Edamam
 */
async function searchEdamam(foodName, quantity, unit) {
  const { baseUrl, appId, appKey } = NUTRITION_APIS.EDAMAM;
  
  if (!appId || !appKey) {
    throw new Error('EDAMAM_APP_ID ou EDAMAM_APP_KEY não configuradas');
  }

  const response = await axios.get(`${baseUrl}/parser`, {
    params: {
      app_id: appId,
      app_key: appKey,
      ingr: `${quantity} ${unit} ${foodName}`,
      'nutrition-type': 'logging'
    },
    timeout: API_TIMEOUT
  });

  if (!response.data.parsed || response.data.parsed.length === 0) {
    throw new Error('Alimento não encontrado na base Edamam');
  }

  return response.data.parsed[0];
}

/**
 * Normaliza dados nutricionais de diferentes APIs
 */
function normalizeNutritionData(rawData, foodName, quantity, unit) {
  // Estrutura padrão de nutrientes
  const nutrients = {
    calories: 0,
    protein: 0,
    carbohydrates: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    cholesterol: 0,
    saturatedFat: 0,
    transFat: 0,
    // Vitaminas
    vitaminA: 0,
    vitaminC: 0,
    vitaminD: 0,
    vitaminE: 0,
    vitaminK: 0,
    vitaminB12: 0,
    // Minerais
    calcium: 0,
    iron: 0,
    magnesium: 0,
    potassium: 0,
    zinc: 0
  };

  // TODO: Implementar parsing específico para cada API
  // Por enquanto, retorna estrutura básica com validação

  // Garantir que valores numéricos não sejam NaN
  const safeValue = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : Math.round(num * 100) / 100; // 2 casas decimais
  };

  // Exemplo de parsing genérico
  if (rawData.nutrients) {
    nutrients.calories = safeValue(rawData.nutrients.calories || rawData.nutrients.ENERC_KCAL);
    nutrients.protein = safeValue(rawData.nutrients.protein || rawData.nutrients.PROCNT);
    nutrients.carbohydrates = safeValue(rawData.nutrients.carbohydrates || rawData.nutrients.CHOCDF);
    nutrients.fat = safeValue(rawData.nutrients.fat || rawData.nutrients.FAT);
    nutrients.fiber = safeValue(rawData.nutrients.fiber || rawData.nutrients.FIBTG);
    nutrients.sugar = safeValue(rawData.nutrients.sugar || rawData.nutrients.SUGAR);
    nutrients.sodium = safeValue(rawData.nutrients.sodium || rawData.nutrients.NA);
  }

  return {
    food: foodName,
    quantity: safeValue(quantity),
    unit: unit,
    nutrients: nutrients,
    source: rawData.source || 'unknown',
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Calcula informações nutricionais para uma refeição completa
 * @param {Array} foods - Lista de alimentos com quantidades
 * @returns {Promise<object>} Nutrição total da refeição
 */
export async function calculateMealNutrition(foods) {
  const mealNutrition = {
    totalCalories: 0,
    totalProtein: 0,
    totalCarbohydrates: 0,
    totalFat: 0,
    totalFiber: 0,
    totalSugar: 0,
    totalSodium: 0,
    foods: []
  };

  // Buscar nutrição de cada alimento em paralelo
  const nutritionPromises = foods.map(food => 
    searchFood(food.name, { quantity: food.quantity, unit: food.unit })
      .catch(err => {
        console.error(`Erro ao buscar ${food.name}:`, err);
        return null;
      })
  );

  const nutritionResults = await Promise.all(nutritionPromises);

  // Somar nutrientes
  for (let i = 0; i < nutritionResults.length; i++) {
    const nutrition = nutritionResults[i];
    if (nutrition && nutrition.nutrients) {
      mealNutrition.totalCalories += nutrition.nutrients.calories || 0;
      mealNutrition.totalProtein += nutrition.nutrients.protein || 0;
      mealNutrition.totalCarbohydrates += nutrition.nutrients.carbohydrates || 0;
      mealNutrition.totalFat += nutrition.nutrients.fat || 0;
      mealNutrition.totalFiber += nutrition.nutrients.fiber || 0;
      mealNutrition.totalSugar += nutrition.nutrients.sugar || 0;
      mealNutrition.totalSodium += nutrition.nutrients.sodium || 0;
      
      mealNutrition.foods.push({
        ...foods[i],
        nutrition: nutrition
      });
    }
  }

  // Arredondar totais
  Object.keys(mealNutrition).forEach(key => {
    if (typeof mealNutrition[key] === 'number') {
      mealNutrition[key] = Math.round(mealNutrition[key] * 100) / 100;
    }
  });

  return mealNutrition;
}

/**
 * Limpa cache de nutrição antigo
 */
export async function cleanNutritionCache() {
  try {
    const stats = await redisService.getCacheStats();
    console.log('Estatísticas do cache de nutrição:', stats);
    
    // Implementar lógica de limpeza se necessário
    // Por enquanto, o Redis cuida da expiração via TTL
  } catch (error) {
    console.error('Erro ao limpar cache de nutrição:', error);
  }
}

/**
 * Classe de erro customizada para nutrição
 */
export class NutritionError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'NutritionError';
    this.originalError = originalError;
  }
}

/**
 * Deduplicador de buscas - evita múltiplas chamadas simultâneas para o mesmo alimento
 */
const searchQueue = new Map();

export async function searchFoodDeduplicated(foodName, options = {}) {
  const key = `${foodName}:${JSON.stringify(options)}`;
  
  // Se já tem uma busca em andamento, aguardar resultado
  if (searchQueue.has(key)) {
    console.log(`Busca duplicada detectada para ${foodName}, aguardando resultado...`);
    return await searchQueue.get(key);
  }
  
  // Criar nova busca
  const searchPromise = searchFood(foodName, options)
    .finally(() => {
      // Remover da fila após conclusão
      searchQueue.delete(key);
    });
  
  searchQueue.set(key, searchPromise);
  return await searchPromise;
}

