import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SecurityContextType {
  logSecurityEvent: (eventType: string, eventData?: any) => Promise<void>;
  isSecureEnvironment: boolean;
  rateLimitCheck: (key: string, maxRequests?: number) => boolean;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const SecurityProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [isSecureEnvironment, setIsSecureEnvironment] = useState(true);

  useEffect(() => {
    // Verificar se estamos em ambiente seguro (HTTPS)
    const isHttps = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    setIsSecureEnvironment(isHttps);

    if (!isHttps && process.env.NODE_ENV === 'production') {
      console.warn('⚠️ Aplicação executando em ambiente inseguro (HTTP)');
    }
  }, []);

  const logSecurityEvent = async (eventType: string, eventData?: any) => {
    try {
      // Only log if user is authenticated
      if (!user) return;
      
      await supabase.rpc('log_security_event', {
        event_type_param: eventType,
        event_data_param: eventData || {},
        user_id_param: user.id
      });
    } catch (error) {
      console.error('Erro ao registrar evento de segurança:', error);
    }
  };

  const rateLimitCheck = (key: string, maxRequests: number = 10): boolean => {
    if (typeof window === 'undefined') return true;
    
    const now = Date.now();
    const windowMs = 60000; // 1 minuto
    const windowStart = now - windowMs;
    
    const storageKey = `rate_limit_${key}`;
    const attempts = JSON.parse(localStorage.getItem(storageKey) || '[]') as number[];
    
    // Remove tentativas antigas
    const recentAttempts = attempts.filter(timestamp => timestamp > windowStart);
    
    if (recentAttempts.length >= maxRequests) {
      logSecurityEvent('rate_limit_exceeded', { key, attempts: recentAttempts.length });
      return false;
    }
    
    // Adiciona nova tentativa
    recentAttempts.push(now);
    localStorage.setItem(storageKey, JSON.stringify(recentAttempts));
    
    return true;
  };

  return (
    <SecurityContext.Provider 
      value={{ 
        logSecurityEvent, 
        isSecureEnvironment, 
        rateLimitCheck 
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};