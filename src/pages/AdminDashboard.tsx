import React from 'react';
import { Sidebar } from "@/components/Sidebar";
import { SecurityDashboard } from "@/components/admin/SecurityDashboard";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

const AdminDashboard: React.FC = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen bg-terminal-light">
        <Sidebar />
        <div className="flex-1 lg:ml-64 flex items-center justify-center pt-16 lg:pt-0">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!profile?.is_admin) {
    return (
      <div className="flex h-screen bg-terminal-light">
        <Sidebar />
        <div className="flex-1 lg:ml-64 flex items-center justify-center p-8 pt-20 lg:pt-8">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar o painel administrativo.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-terminal-light">
      <Sidebar />
      
      <main className="flex-1 lg:ml-64 overflow-y-auto pt-16 lg:pt-0">
        <SecurityDashboard />
      </main>
    </div>
  );
};

export default AdminDashboard;