-- Create RPC functions for gamification system

-- Function to update module progress
CREATE OR REPLACE FUNCTION public.update_module_progress(
  p_user_id UUID,
  p_module_name TEXT,
  p_score INTEGER,
  p_time_spent INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_progress RECORD;
  new_avg_score NUMERIC;
  new_mastery_level INTEGER;
  new_streak INTEGER;
BEGIN
  -- Get current progress
  SELECT * INTO current_progress
  FROM user_module_progress
  WHERE user_id = p_user_id AND module_name = p_module_name;

  IF NOT FOUND THEN
    -- Insert new progress record
    INSERT INTO user_module_progress (
      user_id,
      module_name,
      sessions_completed,
      avg_score,
      mastery_level,
      total_time_spent,
      streak_count,
      last_activity
    ) VALUES (
      p_user_id,
      p_module_name,
      1,
      p_score,
      LEAST(p_score, 100),
      p_time_spent,
      1,
      now()
    );
  ELSE
    -- Calculate new averages
    new_avg_score := ((current_progress.avg_score * current_progress.sessions_completed) + p_score) / (current_progress.sessions_completed + 1);
    new_mastery_level := LEAST(new_avg_score::INTEGER, 100);
    
    -- Update streak (consecutive days of activity)
    IF DATE(current_progress.last_activity) = CURRENT_DATE - INTERVAL '1 day' THEN
      new_streak := current_progress.streak_count + 1;
    ELSIF DATE(current_progress.last_activity) = CURRENT_DATE THEN
      new_streak := current_progress.streak_count;
    ELSE
      new_streak := 1;
    END IF;

    -- Update progress
    UPDATE user_module_progress SET
      sessions_completed = sessions_completed + 1,
      avg_score = new_avg_score,
      mastery_level = new_mastery_level,
      total_time_spent = total_time_spent + p_time_spent,
      streak_count = new_streak,
      last_activity = now()
    WHERE user_id = p_user_id AND module_name = p_module_name;
  END IF;

  -- Update overall user progress
  UPDATE user_progress SET
    simulations_completed = simulations_completed + 1,
    last_activity_at = now()
  WHERE user_id = p_user_id;
END;
$$;

-- Function to check and award badges
CREATE OR REPLACE FUNCTION public.check_and_award_badges(
  p_user_id UUID,
  p_module_name TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_badges JSON := '[]'::JSON;
  user_stats RECORD;
  module_stats RECORD;
  badge_record RECORD;
BEGIN
  -- Get user stats
  SELECT 
    COUNT(*) as total_sessions,
    AVG(avg_score) as overall_avg_score,
    MAX(streak_count) as max_streak
  INTO user_stats
  FROM user_module_progress
  WHERE user_id = p_user_id;

  -- Get module-specific stats
  SELECT * INTO module_stats
  FROM user_module_progress
  WHERE user_id = p_user_id AND module_name = p_module_name;

  -- Check for "First Steps" badge (first completed session)
  IF user_stats.total_sessions = 1 THEN
    INSERT INTO user_badges (user_id, name, description, icon, criteria)
    VALUES (p_user_id, 'Primeiros Passos', 'Complete sua primeira sessão', 'star', '{"sessions": 1}')
    ON CONFLICT (user_id, name) DO NOTHING;
    
    SELECT jsonb_build_object('name', 'Primeiros Passos', 'description', 'Complete sua primeira sessão', 'icon', 'star') INTO badge_record;
    new_badges := new_badges || jsonb_build_array(badge_record);
  END IF;

  -- Check for "Dedicated" badge (10 sessions)
  IF user_stats.total_sessions = 10 THEN
    INSERT INTO user_badges (user_id, name, description, icon, criteria)
    VALUES (p_user_id, 'Dedicado', 'Complete 10 sessões de treinamento', 'target', '{"sessions": 10}')
    ON CONFLICT (user_id, name) DO NOTHING;
    
    SELECT jsonb_build_object('name', 'Dedicado', 'description', 'Complete 10 sessões de treinamento', 'icon', 'target') INTO badge_record;
    new_badges := new_badges || jsonb_build_array(badge_record);
  END IF;

  -- Check for "Expert" badge (high average score)
  IF user_stats.overall_avg_score >= 85 AND user_stats.total_sessions >= 5 THEN
    INSERT INTO user_badges (user_id, name, description, icon, criteria)
    VALUES (p_user_id, 'Especialista', 'Mantenha média acima de 85 pontos', 'trophy', '{"avg_score": 85, "min_sessions": 5}')
    ON CONFLICT (user_id, name) DO NOTHING;
    
    SELECT jsonb_build_object('name', 'Especialista', 'description', 'Mantenha média acima de 85 pontos', 'icon', 'trophy') INTO badge_record;
    new_badges := new_badges || jsonb_build_array(badge_record);
  END IF;

  -- Check for "Streak Master" badge (7-day streak)
  IF user_stats.max_streak >= 7 THEN
    INSERT INTO user_badges (user_id, name, description, icon, criteria)
    VALUES (p_user_id, 'Mestre da Sequência', 'Mantenha uma sequência de 7 dias', 'zap', '{"streak": 7}')
    ON CONFLICT (user_id, name) DO NOTHING;
    
    SELECT jsonb_build_object('name', 'Mestre da Sequência', 'description', 'Mantenha uma sequência de 7 dias', 'icon', 'zap') INTO badge_record;
    new_badges := new_badges || jsonb_build_array(badge_record);
  END IF;

  -- Check for module mastery badge (90+ mastery level)
  IF module_stats.mastery_level >= 90 THEN
    INSERT INTO user_badges (user_id, name, description, icon, criteria)
    VALUES (p_user_id, 'Domínio ' || INITCAP(p_module_name), 'Alcance 90+ de domínio em ' || p_module_name, 'trophy', jsonb_build_object('module', p_module_name, 'mastery_level', 90))
    ON CONFLICT (user_id, name) DO NOTHING;
    
    SELECT jsonb_build_object('name', 'Domínio ' || INITCAP(p_module_name), 'description', 'Alcance 90+ de domínio em ' || p_module_name, 'icon', 'trophy') INTO badge_record;
    new_badges := new_badges || jsonb_build_array(badge_record);
  END IF;

  RETURN new_badges;
END;
$$;