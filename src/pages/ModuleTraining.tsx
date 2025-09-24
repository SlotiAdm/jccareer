import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTrialAccess } from "@/hooks/useTrialAccess";
import { useProgressTracking } from "@/hooks/useProgressTracking";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { ModuleInterface } from "@/components/ModuleInterface";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, CheckCircle, Clock, FileText, MessageSquare, Presentation, Database, Table, Target, Navigation, ArrowLeft, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TrainingModule {
  id: string;
  name: string;
  title: string;
  description: string;
  icon: string;
  difficulty_level: number;
  estimated_time_minutes: number;
  points_reward: number;
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  score?: number;
  feedback?: string;
}

export default function ModuleTraining() {
  const { moduleName } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const trialAccess = useTrialAccess();
  const { updateProgress } = useProgressTracking();
  const { toast } = useToast();
  
  const [module, setModule] = useState<TrainingModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [canAccess, setCanAccess] = useState(false);
  const [showInterface, setShowInterface] = useState(true);

  const getIcon = (iconName: string) => {
    const icons = {
      FileText,
      MessageSquare,
      Presentation,
      Database,
      Table,
      Target,
      Navigation
    };
    return icons[iconName as keyof typeof icons] || FileText;
  };

  const getFunctionName = (moduleName: string): string => {
    const functionMap: { [key: string]: string } = {
      'curriculum_analysis': 'curriculum-analysis',
      'communication_lab': 'communication-lab',
      'erp_simulator': 'erp-simulator',
      'spreadsheet_arena': 'spreadsheet-arena',
      'bsc_strategic': 'bsc-strategic',
      'career_gps': 'career-gps'
    };
    return functionMap[moduleName] || moduleName;
  };

  const getWelcomeMessage = (module: TrainingModule): string => {
    const messages = {
      'curriculum_analysis': 'Olá! Sou seu assistente de análise curricular. Vou ajudá-lo a otimizar seu currículo para conseguir mais entrevistas.',
      'communication_lab': 'Bem-vindo ao Laboratório de Comunicação! Vamos praticar suas habilidades de comunicação corporativa.',
      'erp_simulator': 'Bem-vindo ao Simulador ERP! Aqui você vai dominar os principais sistemas de gestão empresarial.',
      'spreadsheet_arena': 'Olá! Bem-vindo à Arena de Planilhas! Vamos aprimorar suas habilidades em Excel e análise de dados.',
      'bsc_strategic': 'Bem-vindo ao BSC Estratégico! Vamos construir indicadores de performance e dashboards estratégicos.',
      'career_gps': 'Olá! Sou seu GPS de Carreira. Vamos planejar sua trajetória profissional de forma estratégica.'
    };
    return messages[module.name as keyof typeof messages] || `Bem-vindo ao módulo ${module.title}!`;
  };

  useEffect(() => {
    const fetchModule = async () => {
      if (!moduleName) return;
      
      try {
        setLoading(true);
        
        // Verificar acesso
        const hasAccess = trialAccess.canAccessModule();
        setCanAccess(hasAccess);
        
        const { data: moduleData, error } = await supabase
          .from('training_modules')
          .select('*')
          .eq('name', moduleName)
          .eq('is_active', true)
          .single();

        if (error) throw error;
        
  const startSimulation = async (data: any) => {
    if (!module || !user || !canAccess) return;
    
    const canUseSession = await trialAccess.useSession();
    if (!canUseSession) {
      toast({
        title: "Limite atingido",
        description: "Faça upgrade para continuar usando o Terminal.",
        variant: "destructive"
      });
      navigate('/checkout');
      return;
    }

    try {
      setSimulationRunning(true);

      const functionName = getFunctionName(module.name);
      
      // Preparar dados baseado no tipo de módulo
      let requestBody: any = { ...data, user_id: user.id };

      const { data: responseData, error } = await supabase.functions.invoke(functionName, {
        body: requestBody
      });

      if (error) throw error;

      setResult(responseData);
      setShowInterface(false);

      await updateProgress({
        moduleId: module.id,
        score: responseData.analysis?.overall_score || 85,
        completionData: { result: responseData }
      });

      toast({
        title: "Simulação concluída!",
        description: "Confira os resultados abaixo.",
      });

    } catch (error) {
      console.error('Error running simulation:', error);
      toast({
        title: "Erro na simulação", 
        description: "Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSimulationRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-terminal-light">
        <Sidebar />
        <div className="flex-1 lg:ml-64 flex items-center justify-center pt-16 lg:pt-0">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-terminal-text">Carregando módulo...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="flex h-screen bg-terminal-light">
        <Sidebar />
        <div className="flex-1 lg:ml-64 flex items-center justify-center p-8 pt-20 lg:pt-8">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle>Acesso Restrito</CardTitle>
              <CardDescription>
                {trialAccess.getRemainingInfo().message}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => navigate('/dashboard')}>
                  Dashboard
                </Button>
                <Button onClick={() => navigate('/checkout')}>
                  Fazer Upgrade
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const IconComponent = module ? getIcon(module.icon) : FileText;

  return (
    <div className="flex h-screen bg-terminal-light">
      <Sidebar />
      
      <main className="flex-1 lg:ml-64 overflow-hidden pt-16 lg:pt-0">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="border-b bg-white p-6">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/dashboard')}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              
              {module && (
                <>
                  <div className="p-2 rounded-lg bg-primary/10">
                    <IconComponent className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-terminal-text">{module.title}</h1>
                    <p className="text-muted-foreground">{module.description}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
          {/* Module Interface or Results */}
          <div className="h-full flex flex-col">
            <ScrollArea className="flex-1 p-6">
              <div className="max-w-4xl mx-auto">
                {showInterface ? (
                  <ModuleInterface
                    moduleName={module.name}
                    onSubmit={startSimulation}
                    isLoading={simulationRunning}
                  />
                ) : result ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Resultados da Simulação</CardTitle>
                      <CardDescription>
                        Análise completa com feedback detalhado
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg overflow-auto">
                        {JSON.stringify(result, null, 2)}
                      </pre>
                      <Button 
                        onClick={() => {
                          setShowInterface(true);
                          setResult(null);
                        }} 
                        className="mt-4"
                      >
                        Nova Simulação
                      </Button>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            </ScrollArea>
          </div>
          </div>
        </div>
      </main>
    </div>
  );
}