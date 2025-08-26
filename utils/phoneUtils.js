// utils\phoneUtils.js

export function normalizePhoneNumber(phone) {
  if (!phone) return '';

  let normalizedPhone = phone.replace(/\D/g, '');

  // Remove código do país (55 para Brasil)
  if (normalizedPhone.startsWith('55')) {
    normalizedPhone = normalizedPhone.slice(2);
    
    // Adiciona o 9 para números de celular antigos (10 dígitos)
    if (normalizedPhone.length === 10) {
      const ddd = normalizedPhone.slice(0, 2);
      const restOfNumber = normalizedPhone.slice(2);
      normalizedPhone = `${ddd}9${restOfNumber}`;
    }
  }

  return normalizedPhone;
}

export function formatPhoneForWhatsApp(phone) {
  const normalized = normalizePhoneNumber(phone);
  
  // Adiciona o código do país se não estiver presente
  if (!normalized.startsWith('55')) {
    return `55${normalized}`;
  }
  
  return normalized;
}

export function validatePhoneNumber(phone) {
  const normalized = normalizePhoneNumber(phone);
  
  // Validação para números brasileiros
  // Formato: DDD (2 dígitos) + 9 + número (8 dígitos) = 11 dígitos
  const brazilianMobilePattern = /^\d{2}9\d{8}$/;
  
  // Formato para telefone fixo: DDD (2 dígitos) + número (8 dígitos) = 10 dígitos
  const brazilianLandlinePattern = /^\d{2}\d{8}$/;
  
  return {
    isValid: brazilianMobilePattern.test(normalized) || brazilianLandlinePattern.test(normalized),
    normalized: normalized,
    isMobile: brazilianMobilePattern.test(normalized),
    isLandline: brazilianLandlinePattern.test(normalized)
  };
}

export function extractDDD(phone) {
  const normalized = normalizePhoneNumber(phone);
  
  if (normalized.length >= 2) {
    return normalized.slice(0, 2);
  }
  
  return null;
}

export function getStateByDDD(ddd) {
  const dddMap = {
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
  
  return dddMap[ddd] || 'Desconhecido';
}

export function maskPhoneNumber(phone) {
  const normalized = normalizePhoneNumber(phone);
  
  if (normalized.length === 11) {
    // Formato: (XX) 9XXXX-XXXX
    return `(${normalized.slice(0, 2)}) ${normalized.slice(2, 7)}-${normalized.slice(7)}`;
  } else if (normalized.length === 10) {
    // Formato: (XX) XXXX-XXXX
    return `(${normalized.slice(0, 2)}) ${normalized.slice(2, 6)}-${normalized.slice(6)}`;
  }
  
  return phone;
}