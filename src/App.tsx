import React, { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Confirmation = lazy(() => import("./pages/Confirmation"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const ModuleTraining = lazy(() => import("./pages/ModuleTraining"));
const InterviewDojo = lazy(() => import("./pages/InterviewDojo"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const SpreadsheetArenaPage = lazy(() => import("./pages/SpreadsheetArenaPage"));
const ErpSimulator = lazy(() => import("./pages/ErpSimulator"));
const ErpTraining = lazy(() => import("./pages/ErpTraining"));
const ResumeAnalyzer = lazy(() => import("./pages/ResumeAnalyzer"));
const CommunicationLab = lazy(() => import("./pages/CommunicationLab"));
const BSCStrategic = lazy(() => import("./pages/BSCStrategic"));

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
        <ErrorBoundary>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={
              <div className="flex h-screen items-center justify-center bg-terminal-light">
                <LoadingSpinner size="lg" text="Carregando aplicação..." />
              </div>
            }>
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
            
            {/* Admin Dashboard */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminDashboard />
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
            <Route 
              path="/spreadsheet-arena" 
              element={
                <ProtectedRoute requiresActiveSubscription>
                  <SpreadsheetArenaPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/erp-simulator" 
              element={
                <ProtectedRoute requiresActiveSubscription>
                  <ErpSimulator />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/erp-training" 
              element={
                <ProtectedRoute requiresActiveSubscription>
                  <ErpTraining />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/resume-analyzer" 
              element={
                <ProtectedRoute requiresActiveSubscription>
                  <ResumeAnalyzer />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/communication-lab" 
              element={
                <ProtectedRoute requiresActiveSubscription>
                  <CommunicationLab />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/bsc-strategic" 
              element={
                <ProtectedRoute requiresActiveSubscription>
                  <BSCStrategic />
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
            </Suspense>
        </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
