// services\searchService.js

import axios from "axios";
import { config } from '../config/index.js';

export async function searchWebInfo(query) {
  try {
    const baseUrl = "https://api.bing.microsoft.com/v7.0/search";
    const params = new URLSearchParams({
      q: query,
      count: 5,
      mkt: "pt-BR",
      responseFilter: "Webpages",
      safeSearch: "Moderate"
    });

    const url = `${baseUrl}?${params.toString()}`;
    
    const axiosConfig = {
      headers: {
        'Ocp-Apim-Subscription-Key': config.bing.apiKey,
        'Accept': 'application/json'
      },
      validateStatus: function (status) {
        return status < 500;
      }
    };

    const response = await axios.get(url, axiosConfig);

    if (response.status === 401 || response.status === 403) {
      console.error("Erro de autenticação na API do Bing:", response.status, response.statusText);
      return {
        messaging_product: "whatsapp",
        search_results: {
          status: "error",
          message: "Erro de autenticação na API de busca",
          error: response.statusText
        }
      };
    }

    const webpages = response.data.webPages?.value || [];

    if (!webpages.length) {
      return {
        messaging_product: "whatsapp",
        search_results: {
          status: "no_results",
          message: "Não foram encontrados resultados relevantes."
        }
      };
    }

    let description = `Resultados para "${query}":\n\n`;
    webpages.forEach((page, index) => {
      const title = page.name || "Título indisponível";
      const snippet = page.snippet || "Sem descrição disponível";
      
      description += `${index + 1}. ${title}\n${snippet}\n\n`;
    });

    return {
      messaging_product: "whatsapp",
      search_results: {
        status: "success",
        query: query,
        content: description,
        raw_results: webpages
      }
    };

  } catch (error) {
    console.error("Erro na pesquisa do Bing:", error);
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.error("Erro de autenticação - verifique a chave da API");
      return {
        messaging_product: "whatsapp",
        search_results: {
          status: "error",
          message: "Erro de autenticação na API de busca. Por favor, verifique a configuração.",
          error: "API key error"
        }
      };
    }

    return {
      messaging_product: "whatsapp",
      search_results: {
        status: "error",
        message: "Erro ao realizar a pesquisa",
        error: error.message
      }
    };
  }
}

export async function getImagesInfo(query, count = 3, phoneNumberId, recipientNumber) {
  try {
    const baseUrl = "https://api.bing.microsoft.com/v7.0/images/search";
    const params = new URLSearchParams({
      q: query,
      count: Math.min(count, 3),
      mkt: "pt-BR",
      safeSearch: "Moderate",
    });

    const url = `${baseUrl}?${params.toString()}`;
    const headers = {
      'Ocp-Apim-Subscription-Key': config.bing.apiKey,
      'Accept': 'application/json'
    };

    const response = await axios.get(url, { headers });
    
    if (!response.data.value || response.data.value.length === 0) {
      return {
        messaging_product: "whatsapp",
        images_results: {
          status: "no_results",
          message: "Não foram encontradas imagens para sua busca."
        }
      };
    }

    // Preparar a resposta com as imagens
    const images = response.data.value.map(img => ({
      url: img.contentUrl,
      thumbnailUrl: img.thumbnailUrl,
      name: img.name,
      title: img.title || img.name
    }));

    // Enviar cada imagem diretamente
    for (const image of images) {
      try {
        // Baixar a imagem
        const imageResponse = await axios({
          method: 'get',
          url: image.url,
          responseType: 'arraybuffer',
          timeout: 5000
        });

        // Preparar mensagem de imagem
        const json = {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: recipientNumber,
          type: "image",
          image: {
            caption: image.title,
            link: image.url
          }
        };

        // Enviar para WhatsApp
        await axios({
          method: 'POST',
          url: `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
          headers: {
            'Authorization': `Bearer ${config.whatsapp.graphApiToken}`,
            'Content-Type': 'application/json'
          },
          data: json
        });

      } catch (error) {
        console.error(`Erro ao processar imagem: ${error.message}`);
      }
    }

    return {
      messaging_product: "whatsapp",
      images_results: {
        status: "success",
        message: `${images.length} imagens enviadas com sucesso.`,
        query: query
      }
    };

  } catch (error) {
    console.error("Erro na busca de imagens:", error);
    return {
      messaging_product: "whatsapp",
      images_results: {
        status: "error",
        message: "Ocorreu um erro ao buscar as imagens.",
        error: error.message
      }
    };
  }
}

export async function searchNews(query, freshness = "Day") {
  try {
    const baseUrl = "https://api.bing.microsoft.com/v7.0/news/search";
    const params = new URLSearchParams({
      q: query,
      count: 5,
      mkt: "pt-BR",
      freshness: freshness,
      safeSearch: "Moderate"
    });

    const url = `${baseUrl}?${params.toString()}`;
    
    const axiosConfig = {
      headers: {
        'Ocp-Apim-Subscription-Key': config.bing.apiKey,
        'Accept': 'application/json'
      }
    };

    const response = await axios.get(url, axiosConfig);
    const newsItems = response.data.value || [];

    if (!newsItems.length) {
      return {
        status: "no_results",
        message: "Não foram encontradas notícias recentes."
      };
    }

    let description = `Notícias sobre "${query}":\n\n`;
    newsItems.forEach((item, index) => {
      const title = item.name || "Título indisponível";
      const source = item.provider?.[0]?.name || "Fonte desconhecida";
      const date = new Date(item.datePublished).toLocaleDateString('pt-BR');
      const snippet = item.description || "Sem descrição disponível";
      
      description += `${index + 1}. ${title}\n`;
      description += `Fonte: ${source} - ${date}\n`;
      description += `${snippet}\n\n`;
    });

    return {
      status: "success",
      query: query,
      content: description,
      raw_results: newsItems
    };

  } catch (error) {
    console.error("Erro na busca de notícias:", error);
    return {
      status: "error",
      message: "Erro ao buscar notícias",
      error: error.message
    };
  }
}