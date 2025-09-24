import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Target, Clock } from "lucide-react";

interface UserProgress {
  total_points: number;
  modules_completed: number;
  simulations_completed: number;
  proficiency_level: number;
  last_activity_at: string;
}

interface ModuleCompletion {
  module_id: string;
  points_earned: number;
  completed_at: string;
  completion_data: any;
}

export default function ProgressTracker() {
  const { profile } = useAuth();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [completions, setCompletions] = useState<ModuleCompletion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!profile?.user_id) return;

      try {
        // Fetch user progress
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', profile.user_id)
          .single();

        if (progressData) {
          setProgress(progressData);
        }

        // Fetch module completions
        const { data: completionsData } = await supabase
          .from('user_module_completions')
          .select('*')
          .eq('user_id', profile.user_id)
          .order('completed_at', { ascending: false });

        if (completionsData) {
          setCompletions(completionsData);
        }
      } catch (error) {
        console.error('Error fetching progress:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [profile?.user_id]);

  const getProficiencyLabel = (level: number) => {
    const labels = {
      1: 'Iniciante',
      2: 'Básico',
      3: 'Intermediário',
      4: 'Avançado',
      5: 'Expert'
    };
    return labels[level as keyof typeof labels] || 'Iniciante';
  };

  const getNextLevelPoints = (level: number) => {
    const thresholds = [0, 1000, 2500, 5000, 10000, 20000];
    return thresholds[level] || 20000;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!progress) return null;

  const currentLevelPoints = getNextLevelPoints(progress.proficiency_level - 1);
  const nextLevelPoints = getNextLevelPoints(progress.proficiency_level);
  const progressToNext = ((progress.total_points - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100;

  return (
    <div className="space-y-6 mb-8">
      {/* Main Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Pontos Totais</p>
                <p className="text-2xl font-bold text-blue-900">{progress.total_points.toLocaleString()}</p>
              </div>
              <Trophy className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Nível</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-green-900">{progress.proficiency_level}</p>
                  <Badge variant="secondary" className="text-xs">
                    {getProficiencyLabel(progress.proficiency_level)}
                  </Badge>
                </div>
              </div>
              <Star className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Módulos</p>
                <p className="text-2xl font-bold text-purple-900">{progress.modules_completed}/7</p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Simulações</p>
                <p className="text-2xl font-bold text-orange-900">{progress.simulations_completed}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Level Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Progresso para Próximo Nível
          </CardTitle>
          <CardDescription>
            {progress.total_points.toLocaleString()} / {nextLevelPoints.toLocaleString()} pontos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={Math.min(progressToNext, 100)} className="h-3" />
          <p className="text-sm text-gray-600 mt-2">
            {Math.max(0, nextLevelPoints - progress.total_points).toLocaleString()} pontos para o nível {progress.proficiency_level + 1}
          </p>
        </CardContent>
      </Card>

      {/* Recent Completions */}
      {completions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Últimas Conquistas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completions.slice(0, 5).map((completion, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Módulo Concluído</p>
                    <p className="text-sm text-gray-600">
                      {new Date(completion.completed_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Badge variant="default">+{completion.points_earned} pts</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}