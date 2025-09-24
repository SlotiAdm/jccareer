-- Fix security warning: Update functions with proper search_path
CREATE OR REPLACE FUNCTION public.check_and_deduct_tokens(
  p_user_id uuid,
  p_token_cost integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_balance integer;
  is_admin boolean;
BEGIN
  -- Check if user is admin (infinite tokens)
  SELECT is_admin INTO is_admin
  FROM public.profiles
  WHERE user_id = p_user_id;
  
  IF is_admin THEN
    RETURN TRUE;
  END IF;
  
  -- Get current token balance
  SELECT token_balance INTO current_balance
  FROM public.profiles
  WHERE user_id = p_user_id;
  
  -- Check if user has enough tokens
  IF current_balance >= p_token_cost THEN
    -- Deduct tokens
    UPDATE public.profiles
    SET token_balance = token_balance - p_token_cost
    WHERE user_id = p_user_id;
    
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_api_cost(
  p_user_id uuid,
  p_module_name text,
  p_prompt_tokens integer,
  p_completion_tokens integer,
  p_model_used text DEFAULT 'gpt-4o-mini'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  total_tokens integer;
  estimated_cost numeric;
BEGIN
  total_tokens := p_prompt_tokens + p_completion_tokens;
  
  -- Calculate estimated cost (approximate rates for gpt-4o-mini)
  estimated_cost := (p_prompt_tokens * 0.00015 + p_completion_tokens * 0.0002) / 1000;
  
  INSERT INTO public.api_cost_logs (
    user_id,
    module_name,
    prompt_tokens,
    completion_tokens,
    total_tokens,
    estimated_cost,
    model_used
  ) VALUES (
    p_user_id,
    p_module_name,
    p_prompt_tokens,
    p_completion_tokens,
    total_tokens,
    estimated_cost,
    p_model_used
  );
END;
$$;