export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export const ERROR_CODES = {
  // Authentication
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_INVALID: 'AUTH_INVALID',
  
  // Access Control
  ACCESS_DENIED: 'ACCESS_DENIED',
  TRIAL_EXPIRED: 'TRIAL_EXPIRED',
  SUBSCRIPTION_REQUIRED: 'SUBSCRIPTION_REQUIRED',
  
  // Module Errors
  MODULE_NOT_FOUND: 'MODULE_NOT_FOUND',
  MODULE_INACTIVE: 'MODULE_INACTIVE',
  
  // API Errors
  API_ERROR: 'API_ERROR',
  RATE_LIMIT: 'RATE_LIMIT',
  TIMEOUT: 'TIMEOUT',
  
  // Data Errors
  INVALID_INPUT: 'INVALID_INPUT',
  DATA_NOT_FOUND: 'DATA_NOT_FOUND',
  
  // Unknown
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.AUTH_REQUIRED]: 'É necessário fazer login para acessar esta funcionalidade.',
  [ERROR_CODES.AUTH_INVALID]: 'Sessão expirada. Faça login novamente.',
  [ERROR_CODES.ACCESS_DENIED]: 'Você não tem permissão para acessar este recurso.',
  [ERROR_CODES.TRIAL_EXPIRED]: 'Seu período de teste expirou. Faça upgrade para continuar.',
  [ERROR_CODES.SUBSCRIPTION_REQUIRED]: 'Esta funcionalidade requer uma assinatura ativa.',
  [ERROR_CODES.MODULE_NOT_FOUND]: 'Módulo não encontrado ou indisponível.',
  [ERROR_CODES.MODULE_INACTIVE]: 'Este módulo está temporariamente indisponível.',
  [ERROR_CODES.API_ERROR]: 'Erro interno do servidor. Tente novamente em instantes.',
  [ERROR_CODES.RATE_LIMIT]: 'Muitas tentativas. Aguarde um momento e tente novamente.',
  [ERROR_CODES.TIMEOUT]: 'Tempo limite excedido. Verifique sua conexão.',
  [ERROR_CODES.INVALID_INPUT]: 'Dados inválidos. Verifique as informações fornecidas.',
  [ERROR_CODES.DATA_NOT_FOUND]: 'Dados não encontrados.',
  [ERROR_CODES.UNKNOWN_ERROR]: 'Erro inesperado. Tente novamente.',
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
  
  if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
    return new BussulaError(ERROR_CODES.AUTH_INVALID);
  }
  
  if (errorMessage.includes('forbidden') || errorMessage.includes('403')) {
    return new BussulaError(ERROR_CODES.ACCESS_DENIED);
  }
  
  if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
    return new BussulaError(ERROR_CODES.RATE_LIMIT);
  }
  
  if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
    return new BussulaError(ERROR_CODES.TIMEOUT);
  }
  
  if (errorMessage.includes('not found') || errorMessage.includes('404')) {
    return new BussulaError(ERROR_CODES.DATA_NOT_FOUND);
  }

  // Erro genérico
  return new BussulaError(ERROR_CODES.UNKNOWN_ERROR, errorMessage, error);
};

export const getErrorMessage = (error: any): string => {
  const bussulaError = handleApiError(error);
  return bussulaError.message;
};