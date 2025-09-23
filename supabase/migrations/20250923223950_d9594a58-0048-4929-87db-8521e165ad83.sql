-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  cpf_cnpj TEXT,
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled')),
  subscription_plan TEXT CHECK (subscription_plan IN ('monthly', 'annual')),
  subscription_start_date TIMESTAMP WITH TIME ZONE,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  hotmart_transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create course_modules table
CREATE TABLE public.course_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create course_lessons table
CREATE TABLE public.course_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  content TEXT,
  materials_url TEXT,
  order_index INTEGER NOT NULL,
  duration_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_lesson_progress table
CREATE TABLE public.user_lesson_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Create intelligence_flow_posts table
CREATE TABLE public.intelligence_flow_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  author TEXT DEFAULT 'Terminal Team',
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intelligence_flow_posts ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create policies for course modules (readable by authenticated users with active subscription)
CREATE POLICY "Active subscribers can view course modules" 
ON public.course_modules 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.subscription_status = 'active'
  )
);

-- Create policies for course lessons (readable by authenticated users with active subscription)
CREATE POLICY "Active subscribers can view course lessons" 
ON public.course_lessons 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.subscription_status = 'active'
  )
);

-- Create policies for user lesson progress
CREATE POLICY "Users can view their own lesson progress" 
ON public.user_lesson_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lesson progress" 
ON public.user_lesson_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lesson progress" 
ON public.user_lesson_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create policies for intelligence flow posts (readable by authenticated users with active subscription)
CREATE POLICY "Active subscribers can view intelligence flow posts" 
ON public.intelligence_flow_posts 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.subscription_status = 'active'
  )
);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_intelligence_flow_posts_updated_at
  BEFORE UPDATE ON public.intelligence_flow_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to automatically create profile for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert sample course modules and lessons
INSERT INTO public.course_modules (title, description, order_index) VALUES
('Fundamentos da Análise Estratégica', 'Base conceitual para análise corporativa eficaz', 1),
('Frameworks de Decisão', 'Metodologias práticas para tomada de decisão', 2),
('Análise de Dados e KPIs', 'Como extrair insights acionáveis dos dados', 3),
('Comunicação Executiva', 'Apresentação de análises para liderança', 4);

-- Insert sample lessons for Module 1
INSERT INTO public.course_lessons (module_id, title, description, video_url, order_index, duration_minutes) 
SELECT 
  id,
  'Introdução à Análise Estratégica',
  'Conceitos fundamentais e importância da análise estratégica no ambiente corporativo',
  'https://example.com/video1',
  1,
  25
FROM public.course_modules WHERE title = 'Fundamentos da Análise Estratégica';

INSERT INTO public.course_lessons (module_id, title, description, video_url, order_index, duration_minutes) 
SELECT 
  id,
  'Pensamento Analítico vs Operacional',
  'Diferenças práticas entre abordagens analíticas e operacionais',
  'https://example.com/video2',
  2,
  30
FROM public.course_modules WHERE title = 'Fundamentos da Análise Estratégica';

-- Insert sample intelligence flow posts
INSERT INTO public.intelligence_flow_posts (title, content, excerpt) VALUES
('Análise: Tendências do Mercado Tech Q4 2024', 
'O mercado de tecnologia no último trimestre de 2024 apresentou movimentos significativos que todo analista deve compreender...

## Principais Destaques

1. **Crescimento da IA Generativa**: O investimento em soluções de IA generativa cresceu 340% comparado ao mesmo período do ano anterior.

2. **Consolidação no Setor SaaS**: Observamos uma onda de fusões e aquisições, com empresas menores sendo absorvidas por players maiores.

3. **Mudança nos Padrões de Consumo**: A preferência por soluções híbridas (cloud + on-premise) aumentou 67%.

## Framework de Análise

Para analisar essas tendências, recomendo aplicar o framework PESTEL:

- **Político**: Regulamentações de IA em discussão
- **Econômico**: Taxa de juros impactando investimentos
- **Social**: Mudança na força de trabalho
- **Tecnológico**: Avanços em processamento
- **Ecológico**: Sustentabilidade em data centers
- **Legal**: Compliance de dados

## Próximos Passos

1. Monitore os earnings calls das big techs
2. Acompanhe regulamentações emergentes
3. Analise impacto nos seus KPIs atuais',
'Análise completa das principais tendências do mercado tech no Q4 2024, com framework prático para aplicação imediata.'),

('Framework: Como Estruturar Análises de Viabilidade', 
'Toda decisão estratégica precisa de uma análise de viabilidade sólida. Aqui está o framework que uso...

## Estrutura Base

### 1. Definição do Problema
- Qual é exatamente a questão?
- Por que ela é importante agora?
- Quais são os custos de não agir?

### 2. Cenários Possíveis
**Cenário Otimista**: Tudo dá certo
**Cenário Realista**: Condições normais
**Cenário Pessimista**: Principais riscos se materializam

### 3. Critérios de Avaliação
- **Financeiro**: ROI, payback, VPL
- **Estratégico**: Alinhamento com objetivos
- **Operacional**: Capacidade de execução
- **Risco**: Probabilidade e impacto

### 4. Matriz de Decisão
Crie uma tabela ponderando cada critério...

## Exemplo Prático

Vamos aplicar esse framework na análise de uma expansão internacional:

**Problema**: Empresa quer expandir para México
**Prazo**: Decisão em 30 dias
**Budget**: $2M disponíveis

[Continua com exemplo completo...]',
'Framework prático para estruturar análises de viabilidade com exemplo aplicado de expansão internacional.');