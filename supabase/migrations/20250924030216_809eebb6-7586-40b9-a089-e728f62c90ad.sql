-- Corrigir search_path das funções para segurança
CREATE OR REPLACE FUNCTION public.start_user_trial(user_id_param uuid)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    trial_start_date = now(),
    trial_end_date = now() + interval '7 days',
    subscription_status = 'trial'
  WHERE user_id = user_id_param AND trial_start_date IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_trial_status(user_id_param uuid)
RETURNS text 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = 'public'
AS $$
DECLARE
  profile_data record;
BEGIN
  SELECT * INTO profile_data 
  FROM public.profiles 
  WHERE user_id = user_id_param;
  
  -- Se é admin, sempre ativo
  IF profile_data.is_admin THEN
    RETURN 'active';
  END IF;
  
  -- Se tem assinatura ativa
  IF profile_data.subscription_status = 'active' THEN
    RETURN 'active';
  END IF;
  
  -- Se está em trial
  IF profile_data.subscription_status = 'trial' AND profile_data.trial_end_date > now() THEN
    RETURN 'trial';
  END IF;
  
  -- Se trial expirou
  IF profile_data.trial_end_date IS NOT NULL AND profile_data.trial_end_date < now() THEN
    UPDATE public.profiles 
    SET subscription_status = 'expired'
    WHERE user_id = user_id_param;
    RETURN 'expired';
  END IF;
  
  -- Se pode usar sessões gratuitas
  IF profile_data.free_sessions_used < profile_data.free_sessions_limit THEN
    RETURN 'free';
  END IF;
  
  RETURN 'inactive';
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_free_session(user_id_param uuid)
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = 'public'
AS $$
DECLARE
  current_used integer;
  session_limit integer;
BEGIN
  SELECT free_sessions_used, free_sessions_limit 
  INTO current_used, session_limit
  FROM public.profiles 
  WHERE user_id = user_id_param;
  
  IF current_used < session_limit THEN
    UPDATE public.profiles 
    SET free_sessions_used = free_sessions_used + 1
    WHERE user_id = user_id_param;
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;