import { useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CompletionData {
  moduleId: string;
  score: number;
  completionData?: any;
  pointsEarned?: number;
}

export const useProgressTracking = () => {
  const { profile } = useAuth();
  const { toast } = useToast();

  const updateProgress = useCallback(async (data: CompletionData) => {
    if (!profile?.user_id) return { success: false, error: 'Usuário não encontrado' };

    try {
      // Otimizar: usar transação para consistência
      const { error: completionError } = await supabase
        .from('user_module_completions')
        .insert({
          user_id: profile.user_id,
          module_id: data.moduleId,
          points_earned: data.pointsEarned || calculatePoints(data.score),
          completion_data: data.completionData
        });

      if (completionError) throw completionError;

      // Buscar progresso atual de forma eficiente
      const { data: currentProgress, error: progressError } = await supabase
        .from('user_progress')
        .select('total_points, proficiency_level, modules_completed, simulations_completed')
        .eq('user_id', profile.user_id)
        .single();

      if (progressError) throw progressError;

      if (currentProgress) {
        const pointsToAdd = data.pointsEarned || calculatePoints(data.score);
        const newTotalPoints = currentProgress.total_points + pointsToAdd;
        const newLevel = calculateLevel(newTotalPoints);
        
        const { error: updateError } = await supabase
          .from('user_progress')
          .update({
            total_points: newTotalPoints,
            proficiency_level: newLevel,
            modules_completed: currentProgress.modules_completed + 1,
            simulations_completed: currentProgress.simulations_completed + 1,
            last_activity_at: new Date().toISOString()
          })
          .eq('user_id', profile.user_id);

        if (updateError) throw updateError;

        // Mostrar notificação de level up
        if (newLevel > currentProgress.proficiency_level) {
          toast({
            title: "🎉 Level Up!",
            description: `Parabéns! Você alcançou o nível ${getLevelName(newLevel)}!`,
          });
        }

        toast({
          title: "Progresso atualizado!",
          description: `+${pointsToAdd} pontos adicionados`,
        });

        return { success: true, pointsEarned: pointsToAdd, newLevel };
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar seu progresso",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  }, [profile?.user_id, toast]);

  const calculatePoints = useMemo(() => (score: number): number => {
    // Sistema de pontuação aprimorado
    const basePoints = Math.floor(score * 10);
    const perfectBonus = score === 100 ? 500 : 0;
    const excellentBonus = score >= 90 ? 200 : 0;
    const goodBonus = score >= 80 ? 100 : score >= 70 ? 50 : 0;
    
    return basePoints + perfectBonus + excellentBonus + goodBonus;
  }, []);

  const calculateLevel = useMemo(() => (totalPoints: number): number => {
    if (totalPoints >= 50000) return 6; // Mestre
    if (totalPoints >= 25000) return 5; // Expert
    if (totalPoints >= 10000) return 4; // Avançado
    if (totalPoints >= 5000) return 3;  // Intermediário
    if (totalPoints >= 2500) return 2;  // Básico
    return 1; // Iniciante
  }, []);

  const getLevelName = useMemo(() => (level: number): string => {
    const levels = {
      1: "Iniciante",
      2: "Básico", 
      3: "Intermediário",
      4: "Avançado",
      5: "Expert",
      6: "Mestre"
    };
    return levels[level] || "Iniciante";
  }, []);

  const getPointsToNextLevel = useMemo(() => (currentPoints: number): number => {
    const thresholds = [0, 2500, 5000, 10000, 25000, 50000];
    const currentLevel = calculateLevel(currentPoints);
    
    if (currentLevel >= 6) return 0; // Max level
    
    return thresholds[currentLevel] - currentPoints;
  }, [calculateLevel]);

  return { 
    updateProgress,
    calculatePoints,
    calculateLevel,
    getLevelName,
    getPointsToNextLevel
  };
};