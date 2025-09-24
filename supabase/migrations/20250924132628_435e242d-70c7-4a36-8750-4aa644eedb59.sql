-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view their own API usage" ON public.user_api_usage;
DROP POLICY IF EXISTS "Functions can insert API usage" ON public.user_api_usage;
DROP POLICY IF EXISTS "Admins can view all API usage" ON public.user_api_usage;

-- Policies para user_api_usage
CREATE POLICY "Users can view their own API usage" 
ON public.user_api_usage 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Functions can insert API usage" 
ON public.user_api_usage 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all API usage" 
ON public.user_api_usage 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true
));

-- Tabela de badges do usuário (se não existir)
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  criteria JSONB NOT NULL DEFAULT '{}',
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Enable RLS para badges
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Policies para badges
CREATE POLICY "Users can view their own badges" 
ON public.user_badges 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Functions can insert badges" 
ON public.user_badges 
FOR INSERT 
WITH CHECK (true);

-- Tabela de progresso por módulo (se não existir)
CREATE TABLE IF NOT EXISTS public.user_module_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  module_name TEXT NOT NULL,
  sessions_completed INTEGER DEFAULT 0,
  avg_score NUMERIC DEFAULT 0,
  mastery_level INTEGER DEFAULT 0,
  total_time_spent INTEGER DEFAULT 0, -- em segundos
  streak_count INTEGER DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_name)
);

-- Enable RLS para progresso de módulos
ALTER TABLE public.user_module_progress ENABLE ROW LEVEL SECURITY;

-- Policies para progresso de módulos
CREATE POLICY "Users can view their own module progress" 
ON public.user_module_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Functions can manage module progress" 
ON public.user_module_progress 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Adicionar nível global de estrategista à tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS strategist_level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS strategist_title TEXT DEFAULT 'Analista Júnior';