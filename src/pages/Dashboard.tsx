import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Star, Trophy, Clock, ExternalLink, FileText, MessageSquare, Presentation, Database, Table, Target, Navigation } from "lucide-react";
import { Link } from "react-router-dom";
import ProgressTracker from "@/components/ProgressTracker";
import SessionHistory from "@/components/SessionHistory";

interface TrainingModule {
  id: string;
  name: string;
  title: string;
  description: string;
  icon: string;
  difficulty_level: number;
  estimated_time_minutes: number;
  points_reward: number;
  order_index: number;
}

interface UserProgress {
  total_points: number;
  proficiency_level: number;
  modules_completed: number;
  simulations_completed: number;
}

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [loading, setLoading] = useState(true);

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
    const fetchModules = async () => {
      try {
        // Fetch training modules
        const { data: modulesData } = await supabase
          .from('training_modules')
          .select('*')
          .eq('is_active', true)
          .order('order_index');

        if (modulesData) {
          setModules(modulesData);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, []);

  const getProficiencyLevel = (points: number) => {
    const levels = [
      { min: 0, max: 499, name: "Iniciante", color: "bg-gray-400" },
      { min: 500, max: 999, name: "Desenvolvendo", color: "bg-blue-400" },
      { min: 1000, max: 1999, name: "Competente", color: "bg-green-400" },
      { min: 2000, max: 3499, name: "Proficiente", color: "bg-yellow-400" },
      { min: 3500, max: Infinity, name: "Especialista", color: "bg-purple-400" }
    ];
    
    return levels.find(level => points >= level.min && points <= level.max) || levels[0];
  };

  const getDifficultyColor = (level: number) => {
    const colors = {
      1: "bg-green-100 text-green-800",
      2: "bg-blue-100 text-blue-800", 
      3: "bg-yellow-100 text-yellow-800",
      4: "bg-orange-100 text-orange-800",
      5: "bg-red-100 text-red-800"
    };
    return colors[level as keyof typeof colors] || colors[1];
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 ml-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 ml-64 overflow-y-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Bem-vindo de volta, {profile?.full_name}!
            </h1>
            <p className="text-gray-600 mb-6">
              Continue seu treinamento estratégico no Terminal
            </p>
          </div>

          {/* Progress Tracker Component */}
          <ProgressTracker />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Training Modules */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Módulos de Treinamento</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {modules.map((module) => {
                  const IconComponent = getIcon(module.icon);
                  return (
                    <Card key={module.id} className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-primary/20">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <IconComponent className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-2">{module.title}</h3>
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{module.description}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>🎯 Nível {module.difficulty_level}</span>
                                <span>⏱️ {module.estimated_time_minutes}min</span>
                                <span>💎 {module.points_reward}pts</span>
                              </div>
                            </div>
                            <Button 
                              className="w-full mt-4" 
                              onClick={() => {
                                if (module.name === 'interview_dojo') {
                                  navigate('/interview-dojo');
                                } else {
                                  navigate(`/training/${module.name}`);
                                }
                              }}
                            >
                              Iniciar Módulo
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Session History */}
            <div className="lg:col-span-1">
              <SessionHistory />
            </div>
          </div>

          {/* Bonus Course Access */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5 text-primary" />
                BÔNUS: Formação Analista Estratégico
              </CardTitle>
              <CardDescription>
                Acesse seu curso completo na Hotmart
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 mb-2">
                    Curso completo com 4 módulos práticos disponível na área de membros da Hotmart.
                  </p>
                  <Badge variant="outline">Incluído na sua assinatura</Badge>
                </div>
                <Button className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Acessar na Hotmart
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}