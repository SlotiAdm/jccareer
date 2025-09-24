import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TrialData {
  status: 'active' | 'trial' | 'free' | 'expired' | 'inactive' | 'loading';
  freeSessionsUsed: number;
  freeSessionsLimit: number;
  trialEndDate?: Date;
  isAdmin: boolean;
}

export const useTrialAccess = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [trialData, setTrialData] = useState<TrialData>({
    status: 'loading',
    freeSessionsUsed: 0,
    freeSessionsLimit: 3,
    isAdmin: false
  });

const checkAccessStatus = useCallback(async () => {
    if (!user) return;

    try {
      // Buscar dados do perfil e status do trial com logs de segurança
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Determinar status de acesso
      let status: TrialData['status'] = 'inactive';
      
      if (profileData.is_admin) {
        status = 'active';
      } else if (profileData.subscription_status === 'active') {
        status = 'active';
      } else if (profileData.subscription_status === 'trial' && 
                 new Date(profileData.trial_end_date) > new Date()) {
        status = 'trial';
      } else if (profileData.trial_end_date && 
                 new Date(profileData.trial_end_date) < new Date()) {
        // Atualizar status expirado
        await supabase
          .from('profiles')
          .update({ subscription_status: 'expired' })
          .eq('user_id', user.id);
        status = 'expired';
      } else if (profileData.free_sessions_used < profileData.free_sessions_limit) {
        status = 'free';
      }

      setTrialData(prev => ({
        ...prev,
        status,
        freeSessionsUsed: profileData.free_sessions_used || 0,
        freeSessionsLimit: profileData.free_sessions_limit || 3,
        trialEndDate: profileData.trial_end_date ? new Date(profileData.trial_end_date) : undefined,
        isAdmin: profileData.is_admin || false
      }));

      // Log de acesso para auditoria
      await supabase.rpc('log_security_event', {
        event_type_param: 'access_check',
        event_data_param: { status, user_id: user.id },
        user_id_param: user.id
      });

    } catch (error) {
      console.error('Error checking trial access:', error);
      setTrialData(prev => ({ ...prev, status: 'inactive' }));
    }
  }, [user]);

  const canAccessModule = useCallback((requiresPaid: boolean = true): boolean => {
    if (trialData.isAdmin) return true;
    if (!requiresPaid) return true;
    return ['active', 'trial', 'free'].includes(trialData.status);
  }, [trialData]);

const useSession = useCallback(async (): Promise<boolean> => {
    if (!user || trialData.isAdmin) return true;
    
    // Se tem assinatura ativa ou trial, não consome sessão gratuita
    if (['active', 'trial'].includes(trialData.status)) {
      // Log da utilização sem consumir sessão
      await supabase.rpc('log_security_event', {
        event_type_param: 'session_access',
        event_data_param: { 
          type: 'premium_access', 
          status: trialData.status 
        },
        user_id_param: user.id
      });
      return true;
    }

    // Se pode usar sessão gratuita
    if (trialData.status === 'free') {
      try {
        const { data: canUse } = await supabase.rpc('increment_free_session', {
          user_id_param: user.id
        });

        if (canUse) {
          setTrialData(prev => ({
            ...prev,
            freeSessionsUsed: prev.freeSessionsUsed + 1
          }));

          // Log da sessão consumida
          await supabase.rpc('log_security_event', {
            event_type_param: 'free_session_used',
            event_data_param: { 
              sessions_remaining: trialData.freeSessionsLimit - trialData.freeSessionsUsed - 1
            },
            user_id_param: user.id
          });

          const remaining = trialData.freeSessionsLimit - trialData.freeSessionsUsed - 1;
          if (remaining <= 1) {
            toast({
              title: "Sessões gratuitas acabando",
              description: `Você tem ${remaining} sessão${remaining !== 1 ? 'ões' : ''} gratuita${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''}`,
              variant: "destructive"
            });
          }

          return true;
        }
      } catch (error) {
        console.error('Error using session:', error);
      }
    }

    return false;
  }, [user, trialData, toast]);

  const getRemainingInfo = useCallback(() => {
    if (trialData.isAdmin) return { type: 'admin', message: 'Acesso administrativo' };
    
    if (trialData.status === 'active') {
      return { type: 'active', message: 'Acesso ilimitado' };
    }
    
    if (trialData.status === 'trial' && trialData.trialEndDate) {
      const daysLeft = Math.ceil((trialData.trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return { 
        type: 'trial', 
        message: `Trial: ${daysLeft} dia${daysLeft !== 1 ? 's' : ''} restante${daysLeft !== 1 ? 's' : ''}` 
      };
    }
    
    if (trialData.status === 'free') {
      const remaining = trialData.freeSessionsLimit - trialData.freeSessionsUsed;
      return { 
        type: 'free', 
        message: `${remaining} sessão${remaining !== 1 ? 'ões' : ''} gratuita${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''}` 
      };
    }
    
    return { type: 'expired', message: 'Acesso expirado' };
  }, [trialData]);

  useEffect(() => {
    if (user) {
      checkAccessStatus();
    }
  }, [user, checkAccessStatus]);

  return {
    ...trialData,
    canAccessModule,
    useSession,
    getRemainingInfo,
    refreshStatus: checkAccessStatus
  };
};