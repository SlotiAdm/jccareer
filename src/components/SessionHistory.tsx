import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, MessageSquare, Presentation, Database, Table, Target, Navigation, Clock, Star } from "lucide-react";

interface SimulationSession {
  id: string;
  session_type: string;
  score: number;
  ai_response: any;
  input_data: any;
  feedback: string;
  completed: boolean;
  created_at: string;
  duration_seconds: number;
  module_id: string;
}

interface TrainingModule {
  id: string;
  name: string;
  title: string;
  icon: string;
}

export default function SessionHistory() {
  const { profile } = useAuth();
  const [sessions, setSessions] = useState<SimulationSession[]>([]);
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<SimulationSession | null>(null);

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

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.user_id) return;

      try {
        // Fetch modules first
        const { data: modulesData } = await supabase
          .from('training_modules')
          .select('id, name, title, icon')
          .eq('is_active', true);

        if (modulesData) {
          setModules(modulesData);
        }

        // Fetch user sessions
        const { data: sessionsData } = await supabase
          .from('simulation_sessions')
          .select('*')
          .eq('user_id', profile.user_id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (sessionsData) {
          setSessions(sessionsData);
        }
      } catch (error) {
        console.error('Error fetching session history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile?.user_id]);

  const getModuleInfo = (moduleId: string) => {
    return modules.find(m => m.id === moduleId);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}min` : `${seconds}s`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Sessões</CardTitle>
          <CardDescription>
            Suas simulações e análises aparecerão aqui
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Nenhuma sessão encontrada</p>
            <p className="text-sm">Complete seu primeiro módulo para ver o histórico</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Sessões</CardTitle>
        <CardDescription>
          Suas últimas {sessions.length} simulações e análises
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="list" className="w-full">
          <TabsList>
            <TabsTrigger value="list">Lista</TabsTrigger>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list" className="space-y-3 mt-4">
            {sessions.map((session) => {
              const moduleInfo = getModuleInfo(session.module_id);
              const IconComponent = moduleInfo ? getIcon(moduleInfo.icon) : Clock;
              
              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedSession(session)}
                >
                  <div className="flex items-center gap-3">
                    <IconComponent className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">
                        {moduleInfo?.title || session.session_type}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(session.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {session.duration_seconds && (
                      <Badge variant="outline">
                        {formatDuration(session.duration_seconds)}
                      </Badge>
                    )}
                    {session.score && (
                      <Badge className={getScoreColor(session.score)}>
                        {session.score}/100
                      </Badge>
                    )}
                    <Badge variant={session.completed ? "default" : "secondary"}>
                      {session.completed ? "Concluído" : "Pendente"}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </TabsContent>
          
          <TabsContent value="details" className="mt-4">
            {selectedSession ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Detalhes da Sessão
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium">Tipo:</span>
                        <p>{selectedSession.session_type}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Score:</span>
                        <p>{selectedSession.score || 'N/A'}/100</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Data:</span>
                        <p>{new Date(selectedSession.created_at).toLocaleString('pt-BR')}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Status:</span>
                        <p>{selectedSession.completed ? 'Concluído' : 'Pendente'}</p>
                      </div>
                    </div>
                    
                    {selectedSession.feedback && (
                      <div>
                        <span className="text-sm font-medium">Feedback:</span>
                        <p className="mt-1 text-gray-700">{selectedSession.feedback}</p>
                      </div>
                    )}
                    
                    {selectedSession.ai_response && (
                      <div>
                        <span className="text-sm font-medium">Resultado da IA:</span>
                        <pre className="mt-1 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-64">
                          {JSON.stringify(selectedSession.ai_response, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Selecione uma sessão da lista para ver os detalhes</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}