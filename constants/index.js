// constants\index.js
// Limites e configurações
export const LIMITS = {
  MAX_MESSAGE_LENGTH: 1000,
  MAX_TOKENS_PER_THREAD: 1000000,
  MAX_AUDIO_SIZE_MB: 25,
  MAX_IMAGE_SIZE_MB: 16,
  MAX_PDF_SIZE_MB: 100,
  MESSAGE_BUFFER_TIMEOUT: 4000,
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutos
  RATE_LIMIT_MAX_REQUESTS: 100,
  TYPING_DELAY: 2000,
  MESSAGE_SPLIT_DELAY: 800
};

// Configurações de retry
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 3000,
  RUN_CHECK_MAX_RETRIES: 10,
  RUN_CHECK_DELAY: 3000,
  RUN_COMPLETION_MAX_RETRIES: 15,
  RUN_COMPLETION_DELAY: 2000
};

// URLs da API
export const API_URLS = {
  GRAPH_API_BASE: 'https://graph.facebook.com/v19.0',
  BING_SEARCH: 'https://api.bing.microsoft.com/v7.0/search',
  BING_IMAGES: 'https://api.bing.microsoft.com/v7.0/images/search',
  BING_NEWS: 'https://api.bing.microsoft.com/v7.0/news/search'
};

// Tipos de mensagem suportados
export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  DOCUMENT: 'document',
  AUDIO: 'audio',
  VIDEO: 'video',
  LOCATION: 'location',
  CONTACTS: 'contacts',
  STICKER: 'sticker'
};

// Status de execução
export const RUN_STATUS = {
  QUEUED: 'queued',
  IN_PROGRESS: 'in_progress',
  REQUIRES_ACTION: 'requires_action',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLING: 'cancelling',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired'
};

// Comandos especiais
export const COMMANDS = {
  DELETE_THREAD: 'apagar thread_id'
};

// Mensagens padrão
export const DEFAULT_MESSAGES = {
  PROCESSING_IMAGE: "Recebi sua foto. Por favor, aguarde alguns instantes enquanto eu analiso! 🕵🔍",
  PROCESSING_PDF: "Um momento, vou analisar o documento enviado.🕵🏻‍♂️🔍",
  PDF_ANALYZED: "Documento analisado, já podemos falar sobre ele.",
  THREAD_DELETED: "Thread ID apagado com sucesso.",
  NO_THREAD_FOUND: "Nenhum thread ID encontrado para apagar.",
  DUPLICATE_MESSAGE: "Mensagem duplicada ignorada.",
  DELAY_MESSAGE: "Hmm, só um instante...",
  ERROR_MESSAGE: "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.",
  AUDIO_ERROR: "Desculpe, por enquanto não consigo ouvir seu áudio, poderia escrever?",
  RATE_LIMIT_MESSAGE: "Muitas solicitações criadas a partir deste dispositivo, por favor, tente novamente após 15 minutos",
  MESSAGE_TOO_LONG: "Mensagem muito longa"
};

// Configurações de voz para TTS
export const VOICE_CONFIG = {
  DEFAULT_VOICE: 'onyx',
  MODEL: 'tts-1',
  RESPONSE_FORMAT: 'opus'
};

// Configurações de transcrição
export const TRANSCRIPTION_CONFIG = {
  MODEL: 'whisper-1',
  RESPONSE_FORMAT: 'json',
  LANGUAGE: 'pt'
};

// Configurações de modelos OpenAI
export const OPENAI_MODELS = {
  CHAT: 'gpt-4o',
  VISION: 'gpt-4o',
  TRANSCRIPTION: 'whisper-1',
  TTS: 'tts-1'
};

// Timezone padrão
export const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

// Extensões de arquivo válidas
export const VALID_EXTENSIONS = {
  AUDIO: ['.ogg', '.mp3', '.aac', '.m4a', '.amr', '.opus'],
  IMAGE: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'],
  DOCUMENT: ['.pdf']
};

// Mapeamento de DDDs brasileiros
export const DDD_MAP = {
  '11': 'São Paulo',
  '12': 'São Paulo',
  '13': 'São Paulo',
  '14': 'São Paulo',
  '15': 'São Paulo',
  '16': 'São Paulo',
  '17': 'São Paulo',
  '18': 'São Paulo',
  '19': 'São Paulo',
  '21': 'Rio de Janeiro',
  '22': 'Rio de Janeiro',
  '24': 'Rio de Janeiro',
  '27': 'Espírito Santo',
  '28': 'Espírito Santo',
  '31': 'Minas Gerais',
  '32': 'Minas Gerais',
  '33': 'Minas Gerais',
  '34': 'Minas Gerais',
  '35': 'Minas Gerais',
  '37': 'Minas Gerais',
  '38': 'Minas Gerais',
  '41': 'Paraná',
  '42': 'Paraná',
  '43': 'Paraná',
  '44': 'Paraná',
  '45': 'Paraná',
  '46': 'Paraná',
  '47': 'Santa Catarina',
  '48': 'Santa Catarina',
  '49': 'Santa Catarina',
  '51': 'Rio Grande do Sul',
  '53': 'Rio Grande do Sul',
  '54': 'Rio Grande do Sul',
  '55': 'Rio Grande do Sul',
  '61': 'Distrito Federal',
  '62': 'Goiás',
  '63': 'Tocantins',
  '64': 'Goiás',
  '65': 'Mato Grosso',
  '66': 'Mato Grosso',
  '67': 'Mato Grosso do Sul',
  '68': 'Acre',
  '69': 'Rondônia',
  '71': 'Bahia',
  '73': 'Bahia',
  '74': 'Bahia',
  '75': 'Bahia',
  '77': 'Bahia',
  '79': 'Sergipe',
  '81': 'Pernambuco',
  '82': 'Alagoas',
  '83': 'Paraíba',
  '84': 'Rio Grande do Norte',
  '85': 'Ceará',
  '86': 'Piauí',
  '87': 'Pernambuco',
  '88': 'Ceará',
  '89': 'Piauí',
  '91': 'Pará',
  '92': 'Amazonas',
  '93': 'Pará',
  '94': 'Pará',
  '95': 'Roraima',
  '96': 'Amapá',
  '97': 'Amazonas',
  '98': 'Maranhão',
  '99': 'Maranhão'
};