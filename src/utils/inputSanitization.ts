/**
 * Utilitários para sanitização de inputs e prevenção de injection attacks
 */

export interface SanitizedInput {
  sanitized: string;
  warnings: string[];
  isClean: boolean;
}

// Lista de padrões suspeitos que podem indicar tentativas de injection
const SUSPICIOUS_PATTERNS = [
  // Tentativas de injection de prompt
  /ignore\s+(previous|above|all)\s+(instructions?|prompts?)/gi,
  /system\s*(override|reset|prompt)/gi,
  /you\s+are\s+(now|not)\s+a?\s*\w*/gi,
  /forget\s+(everything|all|previous)/gi,
  
  // Tentativas de extração de informações
  /reveal\s+(your|the)\s+(prompt|instructions?|system)/gi,
  /show\s+me\s+(your|the)\s+(code|prompt|instructions?)/gi,
  /what\s+(are\s+)?(your|the)\s+(instructions?|prompts?)/gi,
  
  // Comandos de controle
  /\\n\\n(human|assistant|system):/gi,
  /<\|.*?\|>/gi,
  /\[INST\].*?\[\/INST\]/gi,
  
  // Tentativas de quebra de contexto
  /###\s*(new\s+)?(instruction|prompt|system|context)/gi,
  /---\s*(end|start)\s+(of\s+)?(prompt|instruction)/gi,
];

const MAX_INPUT_LENGTH = 10000; // 10KB de texto
const MAX_REPETITIVE_CHARS = 50; // Máximo de caracteres repetitivos consecutivos

/**
 * Sanitiza texto de entrada removendo ou alertando sobre conteúdo suspeito
 */
export function sanitizeUserInput(input: string): SanitizedInput {
  const warnings: string[] = [];
  let sanitized = input;
  let isClean = true;

  // Verificar comprimento
  if (input.length > MAX_INPUT_LENGTH) {
    sanitized = sanitized.substring(0, MAX_INPUT_LENGTH);
    warnings.push(`Input truncado para ${MAX_INPUT_LENGTH} caracteres`);
    isClean = false;
  }

  // Verificar caracteres repetitivos (possível spam ou tentativa de overflow)
  const repetitivePattern = /(.)\1{20,}/g;
  if (repetitivePattern.test(input)) {
    sanitized = sanitized.replace(/(.)\1{20,}/g, (match, char) => {
      warnings.push(`Sequência repetitiva de '${char}' detectada e truncada`);
      isClean = false;
      return char.repeat(Math.min(MAX_REPETITIVE_CHARS, match.length));
    });
  }

  // Verificar padrões suspeitos
  SUSPICIOUS_PATTERNS.forEach((pattern, index) => {
    if (pattern.test(sanitized)) {
      warnings.push(`Padrão suspeito detectado (${index + 1})`);
      isClean = false;
      // Não remove o conteúdo, apenas alerta - pode ser legítimo
    }
  });

  // Normalizar espaços em branco excessivos
  sanitized = sanitized.replace(/\s{10,}/g, ' '.repeat(5));

  // Remover caracteres de controle perigosos (exceto quebras de linha e tabs normais)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return {
    sanitized: sanitized.trim(),
    warnings,
    isClean
  };
}

/**
 * Valida e sanitiza dados estruturados (JSON)
 */
export function sanitizeStructuredInput(data: any, maxDepth: number = 10): any {
  if (maxDepth <= 0) {
    throw new Error('Estrutura de dados muito profunda');
  }

  if (typeof data === 'string') {
    const result = sanitizeUserInput(data);
    if (!result.isClean) {
      console.warn('Input suspeito detectado:', result.warnings);
    }
    return result.sanitized;
  }

  if (Array.isArray(data)) {
    if (data.length > 100) {
      throw new Error('Array muito grande');
    }
    return data.map(item => sanitizeStructuredInput(item, maxDepth - 1));
  }

  if (data && typeof data === 'object') {
    const keys = Object.keys(data);
    if (keys.length > 50) {
      throw new Error('Objeto com muitas propriedades');
    }

    const sanitized: any = {};
    keys.forEach(key => {
      if (typeof key === 'string' && key.length < 100) {
        sanitized[key] = sanitizeStructuredInput(data[key], maxDepth - 1);
      }
    });
    return sanitized;
  }

  return data;
}

/**
 * Extrai métricas de segurança do input para logging
 */
export function getInputSecurityMetrics(input: string): {
  length: number;
  suspiciousPatterns: number;
  repetitiveChars: number;
  specialChars: number;
} {
  const suspiciousPatterns = SUSPICIOUS_PATTERNS.filter(pattern => 
    pattern.test(input)
  ).length;

  const repetitiveChars = (input.match(/(.)\1{5,}/g) || []).length;
  const specialChars = (input.match(/[^\w\s\-.,!?()]/g) || []).length;

  return {
    length: input.length,
    suspiciousPatterns,
    repetitiveChars,
    specialChars
  };
}