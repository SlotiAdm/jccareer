-- Corrigir avisos de segurança do linter

-- 1. Corrigir search_path nas funções existentes
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id UUID,
  p_module_name TEXT,
  p_limit_per_hour INTEGER DEFAULT 20
) RETURNS BOOLEAN AS $$
DECLARE
  usage_count INTEGER;
BEGIN
  -- Contar chamadas na última hora
  SELECT COUNT(*) INTO usage_count
  FROM public.user_api_usage
  WHERE user_id = p_user_id 
    AND module_name = p_module_name
    AND created_at > (now() - INTERVAL '1 hour');
  
  -- Log da verificação de rate limit
  PERFORM public.log_security_event(
    'rate_limit_check',
    jsonb_build_object(
      'module_name', p_module_name,
      'usage_count', usage_count,
      'limit', p_limit_per_hour,
      'allowed', usage_count < p_limit_per_hour
    ),
    p_user_id
  );
  
  RETURN usage_count < p_limit_per_hour;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.log_api_usage(
  p_user_id UUID,
  p_module_name TEXT,
  p_function_name TEXT,
  p_input_tokens INTEGER DEFAULT 0,
  p_output_tokens INTEGER DEFAULT 0,
  p_cost_estimate NUMERIC DEFAULT 0.0
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_api_usage (
    user_id,
    module_name,
    function_name,
    input_tokens,
    output_tokens,
    cost_estimate,
    created_at
  ) VALUES (
    p_user_id,
    p_module_name,
    p_function_name,
    p_input_tokens,
    p_output_tokens,
    p_cost_estimate,
    now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;