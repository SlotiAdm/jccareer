import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Checkout from "./pages/Checkout";
import Confirmation from "./pages/Confirmation";
import Dashboard from "./pages/Dashboard";
import ModuleTraining from "./pages/ModuleTraining";
import InterviewDojo from "./pages/InterviewDojo";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import SpreadsheetArenaPage from "./pages/SpreadsheetArenaPage";
import ErpSimulator from "./pages/ErpSimulator";

// Configurar QueryClient com otimizações de performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos (antes era cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/confirmation" element={<Confirmation />} />
            
            {/* Dashboard com proteção flexível */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Módulos com verificação de acesso */}
            <Route 
              path="/training/:moduleName" 
              element={
                <ProtectedRoute requiresActiveSubscription>
                  <ModuleTraining />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/interview-dojo" 
              element={
                <ProtectedRoute requiresActiveSubscription>
                  <InterviewDojo />
                </ProtectedRoute>
              } 
            />
            
            {/* Settings sempre acessível para usuários logados */}
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } 
            />
            
            {/* Rotas de compatibilidade */}
            <Route path="/module/:moduleName" element={<ModuleTraining />} />
            
            {/* 404 catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
