import { useCallback } from "react";
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
    if (!profile?.user_id) return;

    try {
      // Record module completion
      const { error: completionError } = await supabase
        .from('user_module_completions')
        .insert({
          user_id: profile.user_id,
          module_id: data.moduleId,
          points_earned: data.pointsEarned || calculatePoints(data.score),
          completion_data: data.completionData
        });

      if (completionError) throw completionError;

      // Update user progress
      const { data: currentProgress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', profile.user_id)
        .single();

      if (currentProgress) {
        const newTotalPoints = currentProgress.total_points + (data.pointsEarned || calculatePoints(data.score));
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

        // Show level up notification
        if (newLevel > currentProgress.proficiency_level) {
          toast({
            title: "🎉 Level Up!",
            description: `Parabéns! Você alcançou o nível ${newLevel}!`,
          });
        }

        toast({
          title: "Progresso atualizado!",
          description: `+${data.pointsEarned || calculatePoints(data.score)} pontos adicionados`,
        });
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar seu progresso",
        variant: "destructive",
      });
    }
  }, [profile?.user_id, toast]);

  const calculatePoints = (score: number): number => {
    // Base points + bonus for high scores
    const basePoints = Math.floor(score * 10);
    const bonus = score >= 90 ? 200 : score >= 80 ? 100 : score >= 70 ? 50 : 0;
    return basePoints + bonus;
  };

  const calculateLevel = (totalPoints: number): number => {
    if (totalPoints >= 20000) return 5; // Expert
    if (totalPoints >= 10000) return 4; // Avançado
    if (totalPoints >= 5000) return 3;  // Intermediário
    if (totalPoints >= 2500) return 2;  // Básico
    return 1; // Iniciante
  };

  return { updateProgress };
};