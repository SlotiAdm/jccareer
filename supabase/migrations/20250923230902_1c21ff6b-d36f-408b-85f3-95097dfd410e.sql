-- Drop old tables that aren't needed for the new architecture
DROP TABLE IF EXISTS public.intelligence_flow_posts CASCADE;
DROP TABLE IF EXISTS public.course_modules CASCADE;
DROP TABLE IF EXISTS public.course_lessons CASCADE;
DROP TABLE IF EXISTS public.user_lesson_progress CASCADE;

-- Create new tables for the simulation platform architecture
CREATE TABLE public.training_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  estimated_time_minutes INTEGER DEFAULT 30,
  points_reward INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user progress tracking table
CREATE TABLE public.user_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  proficiency_level INTEGER DEFAULT 1,
  modules_completed INTEGER DEFAULT 0,
  simulations_completed INTEGER DEFAULT 0,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create module completion tracking
CREATE TABLE public.user_module_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.training_modules(id) ON DELETE CASCADE,
  points_earned INTEGER DEFAULT 0,
  completion_data JSONB, -- Store module-specific completion data
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_id)
);

-- Create simulation sessions table for detailed tracking
CREATE TABLE public.simulation_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.training_modules(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL, -- 'curriculum_analysis', 'interview_simulation', etc.
  input_data JSONB, -- Store user inputs
  ai_response JSONB, -- Store AI responses and analysis
  score INTEGER, -- Optional scoring for the session
  feedback TEXT,
  duration_seconds INTEGER,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_module_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for training modules (readable by all authenticated users)
CREATE POLICY "Authenticated users can view training modules" 
ON public.training_modules 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_active = true);

-- Create policies for user progress
CREATE POLICY "Users can view their own progress" 
ON public.user_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" 
ON public.user_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" 
ON public.user_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create policies for module completions
CREATE POLICY "Users can view their own module completions" 
ON public.user_module_completions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own module completions" 
ON public.user_module_completions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own module completions" 
ON public.user_module_completions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create policies for simulation sessions
CREATE POLICY "Users can view their own simulation sessions" 
ON public.simulation_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own simulation sessions" 
ON public.simulation_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own simulation sessions" 
ON public.simulation_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_simulation_sessions_updated_at
  BEFORE UPDATE ON public.simulation_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create user progress when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user_progress()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_progress (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update the existing user creation trigger to also create progress
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  
  INSERT INTO public.user_progress (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert the 7 training modules
INSERT INTO public.training_modules (name, title, description, icon, difficulty_level, estimated_time_minutes, points_reward, order_index) VALUES
('curriculum_analysis', 'Raio-X de Currículo', 'Receba um diagnóstico completo e acionável do seu currículo com análises de impacto, palavras-chave e sugestões de melhoria.', 'FileText', 2, 20, 150, 1),
('interview_dojo', 'Dojo de Entrevistas', 'Treine para entrevistas em um ambiente seguro com simulações realistas e feedback detalhado da IA.', 'MessageSquare', 3, 30, 200, 2),
('communication_lab', 'Laboratório de Comunicação', 'Desenvolva habilidades de comunicação estratégica com análise de e-mails e apresentações.', 'PresentationChart', 2, 25, 175, 3),
('erp_simulator', 'Simulador de ERP', 'Entenda a lógica de sistemas ERP através de cenários práticos e problemas de negócio.', 'Database', 4, 40, 250, 4),
('spreadsheet_arena', 'Arena de Planilhas', 'Teste e aprimore sua proficiência em Excel/Sheets com desafios práticos.', 'Table', 3, 35, 200, 5),
('bsc_strategic', 'BSC Estratégico', 'Aprenda a montar um Balanced Scorecard completo com orientação da IA.', 'Target', 4, 45, 300, 6),
('career_gps', 'GPS de Carreira', 'Analise sua trajetória e planeje os próximos passos com benchmarking de mercado.', 'Navigation', 3, 30, 175, 7);