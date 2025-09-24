/**
 * Utilitários para validação e sanitização de inputs seguindo as diretrizes de segurança
 */

// Lista de palavras e padrões suspeitos para prevenir ataques
const SUSPICIOUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /eval\s*\(/gi,
  /expression\s*\(/gi,
  /vbscript:/gi,
  /data:.*base64/gi,
];

const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
  /('|(\\')|(--)|(\s*(;|,)\s*))/gi,
  /\b(OR|AND)\b.*[=<>]/gi,
];

/**
 * Sanitiza entrada de texto removendo caracteres perigosos
 */
export const sanitizeText = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  // Remove caracteres de controle
  let sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Remove HTML/JavaScript perigoso
  SUSPICIOUS_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  // Limita o tamanho
  return sanitized.substring(0, 10000); // Limite de 10k caracteres
};

/**
 * Valida se o texto contém padrões suspeitos
 */
export const validateInput = (input: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!input || typeof input !== 'string') {
    return { isValid: false, errors: ['Input inválido'] };
  }
  
  // Verifica padrões XSS
  SUSPICIOUS_PATTERNS.forEach(pattern => {
    if (pattern.test(input)) {
      errors.push('Conteúdo potencialmente perigoso detectado');
    }
  });
  
  // Verifica padrões SQL Injection
  SQL_INJECTION_PATTERNS.forEach(pattern => {
    if (pattern.test(input)) {
      errors.push('Padrão de SQL injection detectado');
    }
  });
  
  // Verifica tamanho
  if (input.length > 10000) {
    errors.push('Texto muito longo');
  }
  
  if (input.length < 10) {
    errors.push('Texto muito curto para análise');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Sanitiza dados de currículo especificamente
 */
export const sanitizeCurriculumData = (data: any): any => {
  if (!data || typeof data !== 'object') return {};
  
  const sanitized: any = {};
  
  // Sanitiza campos de texto
  if (data.curriculum_text) {
    sanitized.curriculum_text = sanitizeText(data.curriculum_text);
  }
  
  if (data.job_description) {
    sanitized.job_description = sanitizeText(data.job_description);
  }
  
  // Limita outros campos
  Object.keys(data).forEach(key => {
    if (typeof data[key] === 'string' && !sanitized[key]) {
      sanitized[key] = sanitizeText(data[key]);
    } else if (typeof data[key] === 'number') {
      sanitized[key] = Math.max(0, Math.min(1000, data[key])); // Limita números
    } else if (typeof data[key] === 'boolean') {
      sanitized[key] = Boolean(data[key]);
    }
  });
  
  return sanitized;
};

/**
 * Gera hash seguro para logs (sem expor dados sensíveis)
 */
export const generateSecureHash = (data: string): string => {
  // Simple hash para não expor dados reais nos logs
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
};

/**
 * Verifica se o email é válido
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length < 255;
};

/**
 * Rate limiting simples baseado em localStorage
 */
export const checkRateLimit = (key: string, maxRequests: number = 10, windowMs: number = 60000): boolean => {
  if (typeof window === 'undefined') return true; // Server-side
  
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Recupera tentativas anteriores
  const attempts = JSON.parse(localStorage.getItem(`rate_limit_${key}`) || '[]') as number[];
  
  // Remove tentativas antigas
  const recentAttempts = attempts.filter(timestamp => timestamp > windowStart);
  
  // Verifica se excedeu o limite
  if (recentAttempts.length >= maxRequests) {
    return false;
  }
  
  // Adiciona nova tentativa
  recentAttempts.push(now);
  localStorage.setItem(`rate_limit_${key}`, JSON.stringify(recentAttempts));
  
  return true;
};