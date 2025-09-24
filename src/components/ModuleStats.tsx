import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Clock, Target } from "lucide-react";

interface ModuleStats {
  module_id: string;
  sessions_count: number;
  best_score: number;
  average_score: number;
  total_time: number;
  last_session: string;
}

interface Props {
  moduleId: string;
}

export default function ModuleStats({ moduleId }: Props) {
  const { profile } = useAuth();
  const [stats, setStats] = useState<ModuleStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!profile?.user_id || !moduleId) return;

      try {
        const { data: sessions } = await supabase
          .from('simulation_sessions')
          .select('score, duration_seconds, created_at')
          .eq('user_id', profile.user_id)
          .eq('module_id', moduleId)
          .eq('completed', true);

        if (sessions && sessions.length > 0) {
          const scores = sessions.map(s => s.score).filter(s => s !== null);
          const totalTime = sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
          
          setStats({
            module_id: moduleId,
            sessions_count: sessions.length,
            best_score: Math.max(...scores),
            average_score: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
            total_time: totalTime,
            last_session: sessions[0]?.created_at || ''
          });
        }
      } catch (error) {
        console.error('Error fetching module stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [profile?.user_id, moduleId]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="h-20">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Trophy className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>Complete seu primeiro exercício para ver suas estatísticas</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}min`;
    return `${minutes}min`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Check if this is communication-lab module to hide time metric
  const isCommunicationLab = moduleId === 'communication-lab' || moduleId === 'communication_lab';
  
  return (
    <div className={`grid gap-4 mb-6 ${isCommunicationLab ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-2 md:grid-cols-4'}`}>
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 font-medium">Sessões</p>
              <p className="text-lg font-bold text-blue-900">{stats.sessions_count}</p>
            </div>
            <Target className="h-5 w-5 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-green-100">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-600 font-medium">Melhor Score</p>
              <p className={`text-lg font-bold ${getScoreColor(stats.best_score)}`}>
                {stats.best_score}/100
              </p>
            </div>
            <Trophy className="h-5 w-5 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-600 font-medium">Média</p>
              <p className={`text-lg font-bold ${getScoreColor(stats.average_score)}`}>
                {stats.average_score}/100
              </p>
            </div>
            <Star className="h-5 w-5 text-purple-600" />
          </div>
        </CardContent>
      </Card>

      {/* Hide time metric for Communication Lab */}
      {!isCommunicationLab && (
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-orange-600 font-medium">Tempo Total</p>
                <p className="text-lg font-bold text-orange-900">
                  {formatTime(stats.total_time)}
                </p>
              </div>
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}