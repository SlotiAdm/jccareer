export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Códigos de erro padronizados
export const ERROR_CODES = {
  // Autenticação e Acesso
  UNAUTHORIZED: 'UNAUTHORIZED',
  ACCESS_DENIED: 'ACCESS_DENIED',
  TRIAL_EXPIRED: 'TRIAL_EXPIRED',
  SUBSCRIPTION_REQUIRED: 'SUBSCRIPTION_REQUIRED',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Módulos
  MODULE_NOT_FOUND: 'MODULE_NOT_FOUND',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // API Externa
  OPENAI_QUOTA_EXCEEDED: 'OPENAI_QUOTA_EXCEEDED',
  OPENAI_ERROR: 'OPENAI_ERROR',
  
  // Dados
  INVALID_FILE_FORMAT: 'INVALID_FILE_FORMAT',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  
  // Legacy support
  AUTH_REQUIRED: 'UNAUTHORIZED',
  AUTH_INVALID: 'UNAUTHORIZED',
  MODULE_INACTIVE: 'MODULE_NOT_FOUND',
  API_ERROR: 'OPENAI_ERROR',
  RATE_LIMIT: 'RATE_LIMIT_EXCEEDED',
  TIMEOUT: 'OPENAI_ERROR',
  DATA_NOT_FOUND: 'MODULE_NOT_FOUND',
  UNKNOWN_ERROR: 'OPENAI_ERROR',
} as const;

export const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: 'Você precisa estar logado para acessar este recurso.',
  ACCESS_DENIED: 'Acesso negado. Verifique suas permissões.',
  TRIAL_EXPIRED: 'Seu período de teste expirou. Faça upgrade para continuar.',
  SUBSCRIPTION_REQUIRED: 'Esta funcionalidade requer uma assinatura ativa.',
  RATE_LIMIT_EXCEEDED: 'Você excedeu o limite de uso. Tente novamente em alguns minutos.',
  MODULE_NOT_FOUND: 'Módulo não encontrado ou indisponível.',
  INVALID_INPUT: 'Os dados fornecidos são inválidos.',
  OPENAI_QUOTA_EXCEEDED: 'Limite de uso da IA atingido. Tente novamente mais tarde.',
  OPENAI_ERROR: 'Erro no serviço de IA. Tente novamente.',
  INVALID_FILE_FORMAT: 'Formato de arquivo não suportado.',
  FILE_TOO_LARGE: 'Arquivo muito grande. Limite máximo: 10MB.',
  
  // Legacy mappings
  AUTH_REQUIRED: 'É necessário fazer login para acessar esta funcionalidade.',
  AUTH_INVALID: 'Sessão expirada. Faça login novamente.',
  MODULE_INACTIVE: 'Este módulo está temporariamente indisponível.',
  API_ERROR: 'Erro interno do servidor. Tente novamente em instantes.',
  RATE_LIMIT: 'Muitas tentativas. Aguarde um momento e tente novamente.',
  TIMEOUT: 'Tempo limite excedido. Verifique sua conexão.',
  DATA_NOT_FOUND: 'Dados não encontrados.',
  UNKNOWN_ERROR: 'Erro inesperado. Tente novamente.',
};

export class BussulaError extends Error {
  public code: string;
  public details?: any;

  constructor(code: string, message?: string, details?: any) {
    super(message || ERROR_MESSAGES[code] || ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR]);
    this.code = code;
    this.details = details;
    this.name = 'BussulaError';
  }
}

export const handleApiError = (error: any): BussulaError => {
  console.error('API Error:', error);

  // Se já é uma BussulaError, retorna como está
  if (error instanceof BussulaError) {
    return error;
  }

  // Se tem estrutura de erro padrão da API
  if (error?.code && ERROR_MESSAGES[error.code]) {
    return new BussulaError(error.code, error.message, error.details);
  }

  // Verifica mensagens de erro conhecidas
  const errorMessage = error?.message || error?.toString() || '';
  
  if (errorMessage.includes('insufficient_quota') || errorMessage.includes('quota')) {
    return new BussulaError('OPENAI_QUOTA_EXCEEDED');
  }
  
  if (errorMessage.includes('Rate limit') || error?.status === 429) {
    return new BussulaError('RATE_LIMIT_EXCEEDED');
  }
  
  if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
    return new BussulaError('UNAUTHORIZED');
  }
  
  if (errorMessage.includes('forbidden') || errorMessage.includes('403')) {
    return new BussulaError('ACCESS_DENIED');
  }
  
  if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
    return new BussulaError('OPENAI_ERROR', errorMessage);
  }
  
  if (errorMessage.includes('not found') || errorMessage.includes('404')) {
    return new BussulaError('MODULE_NOT_FOUND');
  }

  // Erro genérico
  return new BussulaError('OPENAI_ERROR', errorMessage, error);
};

export const getErrorMessage = (error: any): string => {
  const bussulaError = handleApiError(error);
  return bussulaError.message;
};