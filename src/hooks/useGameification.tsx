import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: any;
  earned_at?: string;
}

interface ModuleProgress {
  module_name: string;
  sessions_completed: number;
  avg_score: number;
  mastery_level: number;
  total_time_spent: number;
  streak_count: number;
  last_activity: string;
}

export function useGameification() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [moduleProgress, setModuleProgress] = useState<ModuleProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUserBadges = async () => {
    if (!profile?.user_id) return;

    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', profile.user_id)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      setBadges(data || []);
    } catch (error) {
      console.error('Error loading badges:', error);
      setBadges([]);
    }
  };

  const loadModuleProgress = async () => {
    if (!profile?.user_id) return;

    try {
      const { data, error } = await supabase
        .from('user_module_progress')
        .select('*')
        .eq('user_id', profile.user_id)
        .order('last_activity', { ascending: false });

      if (error) throw error;
      setModuleProgress(data || []);
    } catch (error) {
      console.error('Error loading module progress:', error);
      setModuleProgress([]);
    }
  };

  const updateModuleProgress = async (moduleName: string, score: number, timeSpent: number) => {
    if (!profile?.user_id) return;

    try {
      // Call the database function
      const { error } = await supabase.rpc('update_module_progress', {
        p_user_id: profile.user_id,
        p_module_name: moduleName,
        p_score: score,
        p_time_spent: timeSpent
      });

      if (error) throw error;

      // Check for new badges
      const { data: newBadges, error: badgeError } = await supabase.rpc('check_and_award_badges', {
        p_user_id: profile.user_id,
        p_module_name: moduleName
      });

      if (badgeError) throw badgeError;

      // Show badge notifications
      if (newBadges && Array.isArray(newBadges) && newBadges.length > 0) {
        newBadges.forEach((badge: any) => {
          toast({
            title: "🏆 Novo Badge Conquistado!",
            description: `${badge.name}: ${badge.description}`,
          });
        });
      }

      // Update global strategist level
      await updateStrategistLevel();

      // Reload data
      await Promise.all([loadUserBadges(), loadModuleProgress()]);

    } catch (error) {
      console.error('Error updating module progress:', error);
      // Show fallback toast notification
      toast({
        title: "Progresso registrado!",
        description: `Score: ${score} em ${moduleName}`,
      });
    }
  };

  const updateStrategistLevel = async () => {
    if (!profile?.user_id) return;

    try {
      const { data: progressData } = await supabase
        .from('user_module_progress')
        .select('sessions_completed, avg_score')
        .eq('user_id', profile.user_id);

      if (progressData) {
        const totalSessions = progressData.reduce((sum, p) => sum + p.sessions_completed, 0);
        const avgScore = progressData.length > 0 
          ? progressData.reduce((sum, p) => sum + p.avg_score, 0) / progressData.length 
          : 0;
        
        const totalPoints = Math.round(totalSessions * avgScore);
        
        let level = 1;
        let title = 'Analista Júnior';
        
        if (totalPoints >= 500) {
          level = 5; title = 'Estrategista Master';
        } else if (totalPoints >= 300) {
          level = 4; title = 'Estrategista Sênior';
        } else if (totalPoints >= 150) {
          level = 3; title = 'Analista Sênior';
        } else if (totalPoints >= 50) {
          level = 2; title = 'Analista Pleno';
        }

        const { error } = await supabase
          .from('profiles')
          .update({
            strategist_level: level,
            total_points: totalPoints,
            strategist_title: title
          })
          .eq('user_id', profile.user_id);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating strategist level:', error);
    }
  };

  const getMasteryLevel = (moduleName: string): string => {
    const progress = moduleProgress.find(p => p.module_name === moduleName);
    if (!progress) return 'Iniciante';

    const levels = [
      { min: 0, max: 24, name: 'Iniciante' },
      { min: 25, max: 49, name: 'Aprendiz' },
      { min: 50, max: 74, name: 'Competente' },
      { min: 75, max: 89, name: 'Proficiente' },
      { min: 90, max: 100, name: 'Especialista' }
    ];

    const level = levels.find(l => progress.mastery_level >= l.min && progress.mastery_level <= l.max);
    return level?.name || 'Iniciante';
  };

  const getOverallStats = () => {
    const totalSessions = moduleProgress.reduce((sum, p) => sum + p.sessions_completed, 0);
    const avgScore = moduleProgress.length > 0 
      ? moduleProgress.reduce((sum, p) => sum + p.avg_score, 0) / moduleProgress.length 
      : 0;
    const totalTime = moduleProgress.reduce((sum, p) => sum + p.total_time_spent, 0);
    const maxStreak = Math.max(...moduleProgress.map(p => p.streak_count), 0);

    return {
      totalSessions,
      avgScore: Math.round(avgScore),
      totalTime: Math.round(totalTime / 60), // Convert to minutes
      maxStreak,
      badgeCount: badges.length
    };
  };

  const getNextSuggestedModule = () => {
    // Order 3: Updated categorization - Arsenal vs Dojo tools
    const modulesByCategory = {
      dojos: ['interview-dojo', 'erp-simulator', 'spreadsheet-arena', 'bsc-strategic'],
      arsenalTools: ['resume-analyzer', 'communication-lab'] // These give fixed points, not performance scores
    };

    // Find least completed dojo
    const dojoProgress = modulesByCategory.dojos.map(module => {
      const progress = moduleProgress.find(p => p.module_name === module);
      return { module, sessions: progress?.sessions_completed || 0 };
    });

    const leastCompletedDojo = dojoProgress.sort((a, b) => a.sessions - b.sessions)[0];
    
    return {
      module: leastCompletedDojo?.module || 'career-gps',
      reason: (!leastCompletedDojo || leastCompletedDojo.sessions === 0) ? 'Módulo ainda não explorado' : 'Continue desenvolvendo esta habilidade'
    };
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadUserBadges(), loadModuleProgress()]);
      setLoading(false);
    };

    if (profile?.user_id) {
      loadData();
    }
  }, [profile?.user_id]);

  return {
    badges,
    moduleProgress,
    loading,
    updateModuleProgress,
// Fix typo in return statement
getMasteryLevel,
    getOverallStats,
    getNextSuggestedModule,
    refreshData: () => Promise.all([loadUserBadges(), loadModuleProgress()])
  };
}