-- Order 4: Token System Implementation
-- Add token_balance column to profiles table
ALTER TABLE public.profiles ADD COLUMN token_balance integer DEFAULT 1200;

-- Order 5: API Cost Logging System
-- Create api_cost_logs table for monitoring
CREATE TABLE public.api_cost_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  module_name text NOT NULL,
  prompt_tokens integer NOT NULL DEFAULT 0,
  completion_tokens integer NOT NULL DEFAULT 0,
  total_tokens integer NOT NULL DEFAULT 0,
  estimated_cost numeric DEFAULT 0.0,
  model_used text DEFAULT 'gpt-4o-mini'
);

-- Enable RLS for api_cost_logs
ALTER TABLE public.api_cost_logs ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own API cost logs
CREATE POLICY "Users can view their own API cost logs"
ON public.api_cost_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Policy for admins to view all API cost logs
CREATE POLICY "Admins can view all API cost logs"
ON public.api_cost_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Policy for functions to insert API cost logs
CREATE POLICY "Functions can insert API cost logs"
ON public.api_cost_logs
FOR INSERT
WITH CHECK (true);

-- Create function to check and deduct tokens
CREATE OR REPLACE FUNCTION public.check_and_deduct_tokens(
  p_user_id uuid,
  p_token_cost integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Create function to log API costs
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
SET search_path = public
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