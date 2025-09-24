-- Fix ambiguous variable/column name in token function and qualify columns
CREATE OR REPLACE FUNCTION public.check_and_deduct_tokens(p_user_id uuid, p_token_cost integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_current_balance integer;
  v_is_admin boolean;
BEGIN
  -- Check if user is admin (infinite tokens)
  SELECT p.is_admin INTO v_is_admin
  FROM public.profiles p
  WHERE p.user_id = p_user_id;
  
  IF COALESCE(v_is_admin, FALSE) THEN
    RETURN TRUE;
  END IF;
  
  -- Get current token balance
  SELECT p.token_balance INTO v_current_balance
  FROM public.profiles p
  WHERE p.user_id = p_user_id;
  
  -- If profile not found, deny by default
  IF v_current_balance IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user has enough tokens
  IF v_current_balance >= p_token_cost THEN
    -- Deduct tokens
    UPDATE public.profiles p
    SET token_balance = p.token_balance - p_token_cost
    WHERE p.user_id = p_user_id;
    
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$function$;