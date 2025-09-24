-- Criar tabela central do Perfil de Carreira
CREATE TABLE public.career_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Dados pessoais e profissionais
  full_name TEXT,
  current_position TEXT,
  current_company TEXT,
  current_salary DECIMAL(12,2),
  years_experience INTEGER,
  education_level TEXT,
  industry TEXT,
  location TEXT,
  
  -- Competências e habilidades
  hard_skills JSONB DEFAULT '[]'::jsonb,
  soft_skills JSONB DEFAULT '[]'::jsonb,
  certifications JSONB DEFAULT '[]'::jsonb,
  languages JSONB DEFAULT '[]'::jsonb,
  
  -- Histórico profissional
  work_history JSONB DEFAULT '[]'::jsonb,
  achievements JSONB DEFAULT '[]'::jsonb,
  
  -- Objetivos e metas
  career_goals JSONB DEFAULT '{}'::jsonb,
  salary_goals JSONB DEFAULT '{}'::jsonb,
  learning_goals JSONB DEFAULT '[]'::jsonb,
  
  -- BSC de Carreira
  bsc_financial JSONB DEFAULT '{}'::jsonb,
  bsc_customers JSONB DEFAULT '{}'::jsonb,
  bsc_processes JSONB DEFAULT '{}'::jsonb,
  bsc_learning JSONB DEFAULT '{}'::jsonb,
  
  -- GPS de Carreira
  career_analysis JSONB DEFAULT '{}'::jsonb,
  career_paths JSONB DEFAULT '[]'::jsonb,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.career_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own career profile" 
ON public.career_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own career profile" 
ON public.career_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own career profile" 
ON public.career_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_career_profiles_updated_at
BEFORE UPDATE ON public.career_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela para currículos gerados
CREATE TABLE public.generated_resumes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_resume TEXT,
  job_description TEXT NOT NULL,
  generated_resume TEXT NOT NULL,
  improvements_notes JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.generated_resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own generated resumes" 
ON public.generated_resumes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own generated resumes" 
ON public.generated_resumes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Tabela para comunicação analisada
CREATE TABLE public.communication_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('situation', 'message')),
  input_text TEXT NOT NULL,
  ai_analysis JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.communication_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own communication analysis" 
ON public.communication_analysis 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own communication analysis" 
ON public.communication_analysis 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Tabela para ERP simulation progress
CREATE TABLE public.erp_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN ('theory', 'architecture', 'practical')),
  stage_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  completed BOOLEAN DEFAULT false,
  score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.erp_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own ERP progress" 
ON public.erp_progress 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_erp_progress_updated_at
BEFORE UPDATE ON public.erp_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar perfil de carreira automaticamente
CREATE OR REPLACE FUNCTION public.create_career_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.career_profiles (user_id, full_name)
  VALUES (
    NEW.user_id,
    NEW.full_name
  );
  RETURN NEW;
END;
$$;

-- Trigger para criar perfil de carreira quando perfil é criado
CREATE TRIGGER create_career_profile_on_profile_insert
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.create_career_profile();