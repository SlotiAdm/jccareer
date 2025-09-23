import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Star, Trophy, Clock, ExternalLink, FileText, MessageSquare, Presentation, Database, Table, Target, Navigation } from "lucide-react";
import { Link } from "react-router-dom";

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
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [completedModules, setCompletedModules] = useState<string[]>([]);
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
    const fetchDashboardData = async () => {
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

        // Fetch user progress
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', profile?.user_id)
          .single();

        if (progressData) {
          setUserProgress(progressData);
        }

        // Fetch completed modules
        const { data: completionsData } = await supabase
          .from('user_module_completions')
          .select('module_id')
          .eq('user_id', profile?.user_id);

        if (completionsData) {
          setCompletedModules(completionsData.map(c => c.module_id));
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (profile?.user_id) {
      fetchDashboardData();
    }
  }, [profile]);

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

  const proficiencyLevel = getProficiencyLevel(userProgress?.total_points || 0);
  const progressToNext = userProgress?.total_points || 0;
  const nextLevelThreshold = proficiencyLevel.max === Infinity ? progressToNext : proficiencyLevel.max + 1;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 ml-64 overflow-y-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Bem-vindo ao Terminal, {profile?.full_name || 'Analista'}
            </h1>
            <p className="text-gray-600">
              Seu centro de simulação para desenvolvimento estratégico
            </p>
          </div>

          {/* Progress Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Nível de Proficiência
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className={`${proficiencyLevel.color} text-white`}>
                      {proficiencyLevel.name}
                    </Badge>
                    <span className="text-sm font-medium">{progressToNext} pts</span>
                  </div>
                  {proficiencyLevel.max !== Infinity && (
                    <Progress 
                      value={(progressToNext / nextLevelThreshold) * 100} 
                      className="h-2"
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-blue-500" />
                  Módulos Concluídos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {userProgress?.modules_completed || 0}/{modules.length}
                </div>
                <p className="text-sm text-gray-600">
                  {Math.round(((userProgress?.modules_completed || 0) / modules.length) * 100)}% concluído
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-500" />
                  Simulações Realizadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {userProgress?.simulations_completed || 0}
                </div>
                <p className="text-sm text-gray-600">
                  Total de sessões
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status da Assinatura</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="default" className="bg-green-100 text-green-800 mb-2">
                  {profile?.subscription_status === 'active' ? 'Ativa' : 'Inativa'}
                </Badge>
                <p className="text-sm text-gray-600">
                  Plano: {profile?.subscription_plan === 'annual' ? 'Anual' : 'Mensal'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Training Modules Grid */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Módulos de Treinamento
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((module) => {
                const IconComponent = getIcon(module.icon);
                const isCompleted = completedModules.includes(module.id);
                
                return (
                  <Card key={module.id} className={`transition-all hover:shadow-lg cursor-pointer ${
                    isCompleted ? 'ring-2 ring-green-500 bg-green-50' : ''
                  }`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <IconComponent className={`h-8 w-8 ${
                          isCompleted ? 'text-green-600' : 'text-primary'
                        }`} />
                        <div className="flex gap-2">
                          <Badge className={getDifficultyColor(module.difficulty_level)} variant="outline">
                            Nível {module.difficulty_level}
                          </Badge>
                          {isCompleted && (
                            <Badge className="bg-green-100 text-green-800">
                              Concluído
                            </Badge>
                          )}
                        </div>
                      </div>
                      <CardTitle className="text-lg">{module.title}</CardTitle>
                      <CardDescription>{module.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          {module.estimated_time_minutes} min
                        </div>
                        <div className="flex items-center gap-1 text-sm text-yellow-600">
                          <Star className="h-4 w-4" />
                          {module.points_reward} pts
                        </div>
                      </div>
                      
                <Link to={`/module/${module.name}`}>
                  <Button className="w-full" variant={isCompleted ? "outline" : "default"}>
                    {module.name === 'interview_dojo' ? (
                      <Link to="/interview-dojo" className="w-full">
                        <Button className="w-full" variant={isCompleted ? "outline" : "default"}>
                          {isCompleted ? 'Refazer Simulação' : 'Iniciar Simulação'}
                        </Button>
                      </Link>
                    ) : (
                      <Button className="w-full" variant={isCompleted ? "outline" : "default"}>
                        {isCompleted ? 'Refazer Simulação' : 'Iniciar Simulação'}
                      </Button>
                    )}
                  </Button>
                </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Bonus Course Access */}
          <Card>
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