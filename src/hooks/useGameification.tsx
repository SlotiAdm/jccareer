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
      const { data: badgesData, error } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', profile.user_id)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      setBadges(badgesData || []);
    } catch (error) {
      console.error('Error loading badges:', error);
    }
  };

  const loadModuleProgress = async () => {
    if (!profile?.user_id) return;

    try {
      const { data: progressData, error } = await supabase
        .from('user_module_progress')
        .select('*')
        .eq('user_id', profile.user_id);

      if (error) throw error;
      setModuleProgress(progressData || []);
    } catch (error) {
      console.error('Error loading module progress:', error);
    }
  };

  const updateModuleProgress = async (moduleName: string, score: number, timeSpent: number) => {
    if (!profile?.user_id) return;

    try {
      // Update module progress
      const { error: progressError } = await supabase.rpc('update_module_progress', {
        p_user_id: profile.user_id,
        p_module_name: moduleName,
        p_score: score,
        p_time_spent: timeSpent
      });

      if (progressError) throw progressError;

      // Check for new badges
      const { data: newBadges, error: badgeError } = await supabase.rpc('check_and_award_badges', {
        p_user_id: profile.user_id,
        p_module_name: moduleName
      });

      if (badgeError) throw badgeError;

      // Show badge notifications
      if (newBadges && newBadges.length > 0) {
        newBadges.forEach((badge: Badge) => {
          toast({
            title: "🏆 Nova Badge!",
            description: `Você conquistou: ${badge.name}`,
            duration: 5000,
          });
        });
      }

      // Reload data
      await Promise.all([loadUserBadges(), loadModuleProgress()]);

    } catch (error) {
      console.error('Error updating module progress:', error);
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
    getMasteryLevel,
    getOverallStats,
    refreshData: () => Promise.all([loadUserBadges(), loadModuleProgress()])
  };
}