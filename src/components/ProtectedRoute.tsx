import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Zap } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresActiveSubscription?: boolean;
}

export const ProtectedRoute = ({ 
  children, 
  requiresActiveSubscription = false 
}: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [accessStatus, setAccessStatus] = useState<string>('loading');

  useEffect(() => {
    const checkAccess = async () => {
      if (!loading && user && profile) {
        try {
          const { data: status } = await supabase.rpc('check_trial_status', {
            user_id_param: user.id
          });
          setAccessStatus(status || 'inactive');
        } catch (error) {
          console.error('Error checking access:', error);
          setAccessStatus('inactive');
        }
      }
    };

    if (!loading) {
      if (!user) {
        navigate("/auth");
        return;
      }
      
      if (requiresActiveSubscription) {
        checkAccess();
      } else {
        setAccessStatus('active');
      }
    }
  }, [user, profile, loading, navigate, requiresActiveSubscription]);

  if (loading || accessStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-terminal-light to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-terminal-text">Carregando O Terminal...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Se requer assinatura mas não tem acesso
  if (requiresActiveSubscription && !['active', 'trial', 'free'].includes(accessStatus)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-terminal-light to-white p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-primary" />
            </div>
            <CardTitle>Acesso Limitado</CardTitle>
            <CardDescription>
              {accessStatus === 'expired' 
                ? 'Seu período de teste expirou. Assine para continuar usando o Terminal.'
                : 'Você já usou suas sessões gratuitas. Assine para acesso ilimitado.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-terminal-light p-4 rounded-lg">
              <h4 className="font-semibold text-terminal-text mb-2">Com a assinatura você terá:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Acesso ilimitado a todos os módulos</li>
                <li>• Simulações avançadas de IA</li>
                <li>• Relatórios detalhados de progresso</li>
                <li>• Suporte prioritário</li>
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={() => navigate("/dashboard")}
                className="w-full"
              >
                Dashboard
              </Button>
              <Button 
                onClick={() => navigate("/checkout")}
                className="w-full gap-2"
              >
                <Zap className="w-4 h-4" />
                Assinar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};