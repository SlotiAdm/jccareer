import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

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

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/auth");
        return;
      }
      
      if (requiresActiveSubscription && profile?.subscription_status !== 'active') {
        navigate("/");
        return;
      }
    }
  }, [user, profile, loading, navigate, requiresActiveSubscription]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requiresActiveSubscription && profile?.subscription_status !== 'active') {
    return null;
  }

  return <>{children}</>;
};