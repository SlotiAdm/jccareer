import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { sanitizeUserInput } from '@/utils/inputSanitization';

interface AiModuleOptions {
  moduleName: string;
  functionName: string;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export function useAiModule({ moduleName, functionName, onSuccess, onError }: AiModuleOptions) {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: any) => {
      // Sanitize input data
      const sanitizedData = Object.keys(data).reduce((acc, key) => {
        if (typeof data[key] === 'string') {
          const sanitized = sanitizeUserInput(data[key]);
          if (!sanitized.isClean) {
            console.warn(`Input sanitization warnings for ${key}:`, sanitized.warnings);
          }
          acc[key] = sanitized.sanitized;
        } else {
          acc[key] = data[key];
        }
        return acc;
      }, {} as any);

      const { data: result, error } = await supabase.functions.invoke(functionName, {
        body: sanitizedData,
      });

      if (error) {
        throw error;
      }

      return result;
    },
    onSuccess: (data) => {
      if (onSuccess) {
        onSuccess(data);
      }
    },
    onError: (error: any) => {
      console.error(`Error in ${moduleName}:`, error);
      
      // Handle specific error types
      let errorMessage = 'Erro interno. Tente novamente.';
      
      if (error?.message?.includes('Rate limit exceeded') || error?.status === 429) {
        errorMessage = 'Você excedeu o limite de chamadas por hora. Tente novamente mais tarde.';
      } else if (error?.message?.includes('insufficient_quota')) {
        errorMessage = 'Cota da API esgotada. Entre em contato com o suporte.';
      } else if (error?.message?.includes('TRIAL_EXPIRED')) {
        errorMessage = 'Seu período de teste expirou. Faça upgrade para continuar.';
      } else if (error?.message?.includes('ACCESS_DENIED')) {
        errorMessage = 'Acesso negado. Verifique sua assinatura.';
      }

      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });

      if (onError) {
        onError(error);
      }
    },
  });
}