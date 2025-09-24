-- Corrigir funções SECURITY DEFINER existentes que não têm search_path definido
-- Baseado no resultado da consulta anterior, vou atualizar todas as funções SECURITY DEFINER

-- Função handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );

  -- Iniciar trial automaticamente
  PERFORM public.start_user_trial(NEW.id);
  
  INSERT INTO public.user_progress (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$function$;

-- Função start_user_trial
CREATE OR REPLACE FUNCTION public.start_user_trial(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.profiles 
  SET 
    trial_start_date = now(),
    trial_end_date = now() + interval '7 days',
    subscription_status = 'trial'
  WHERE user_id = user_id_param AND trial_start_date IS NULL;
END;
$function$;

-- Função handle_new_user_progress
CREATE OR REPLACE FUNCTION public.handle_new_user_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.user_progress (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$function$;

-- Função check_trial_status
CREATE OR REPLACE FUNCTION public.check_trial_status(user_id_param uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- Função increment_free_session
CREATE OR REPLACE FUNCTION public.increment_free_session(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- Função check_trial_status_secure
CREATE OR REPLACE FUNCTION public.check_trial_status_secure(user_id_param uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  profile_data record;
  result_status text;
BEGIN
  SELECT * INTO profile_data 
  FROM public.profiles 
  WHERE user_id = user_id_param;
  
  IF NOT FOUND THEN
    PERFORM public.log_security_event('access_denied', '{"reason": "profile_not_found"}', user_id_param);
    RETURN 'inactive';
  END IF;
  
  -- Se é admin, sempre ativo
  IF profile_data.is_admin THEN
    result_status := 'active';
  -- Se tem assinatura ativa
  ELSIF profile_data.subscription_status = 'active' THEN
    result_status := 'active';
  -- Se está em trial
  ELSIF profile_data.subscription_status = 'trial' AND profile_data.trial_end_date > now() THEN
    result_status := 'trial';
  -- Se trial expirou
  ELSIF profile_data.trial_end_date IS NOT NULL AND profile_data.trial_end_date < now() THEN
    UPDATE public.profiles 
    SET subscription_status = 'expired'
    WHERE user_id = user_id_param;
    result_status := 'expired';
  -- Se pode usar sessões gratuitas
  ELSIF profile_data.free_sessions_used < profile_data.free_sessions_limit THEN
    result_status := 'free';
  ELSE
    result_status := 'inactive';
  END IF;
  
  -- Log do acesso
  PERFORM public.log_security_event(
    'access_check', 
    jsonb_build_object('status', result_status, 'user_id', user_id_param),
    user_id_param
  );
  
  RETURN result_status;
END;
$function$;

-- Função create_career_profile
CREATE OR REPLACE FUNCTION public.create_career_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.career_profiles (user_id, full_name)
  VALUES (
    NEW.user_id,
    NEW.full_name
  );
  RETURN NEW;
END;
$function$;