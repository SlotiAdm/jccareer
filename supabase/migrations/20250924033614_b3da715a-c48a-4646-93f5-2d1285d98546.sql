-- Melhorar segurança e estrutura dos dados

-- Adicionar campo para armazenar dados do Hotmart de forma segura
ALTER TABLE public.profiles 
ADD COLUMN hotmart_webhook_data JSONB,
ADD COLUMN last_hotmart_update TIMESTAMP WITH TIME ZONE;

-- Criar tabela para logs de segurança e auditoria
CREATE TABLE public.security_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver logs de auditoria
CREATE POLICY "Only admins can view audit logs"
  ON public.security_audit_logs 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Criar tabela para configurações de módulos (melhor organização)
CREATE TABLE public.module_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_name TEXT NOT NULL UNIQUE,
  system_prompt TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS - apenas leitura para usuários autenticados
ALTER TABLE public.module_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view module configurations"
  ON public.module_configurations 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL AND is_active = true);

-- Inserir configurações dos módulos com os system prompts definidos
INSERT INTO public.module_configurations (module_name, system_prompt, settings) VALUES
(
  'curriculum_analysis',
  'Você é um Headhunter de elite e um estrategista de carreira cínico, mas brilhante, alinhado à filosofia do "Mentor Irreverente". Sua missão é analisar o currículo do usuário sob a ótica das 48 Leis do Poder e da geração de valor tangível. Ignore clichês corporativos. Foque em: Linguagem de Poder: Substitua linguagem passiva por linguagem ativa e de resultados. Métricas de Impacto: Aponte cada descrição sem resultado quantificável e sugira metrificação. Análise de Palavras-Chave: Confronte o CV com a vaga e identifique gaps brutalmente. Leis do Poder: Aponte onde o candidato se vende como "bom soldado" em vez de "estrategista indispensável". O feedback deve ser direto, acionável e revelar verdades desconfortáveis.',
  '{"max_tokens": 2000, "temperature": 0.7, "focus_areas": ["poder", "metricas", "palavras_chave", "resultados"]}'
),
(
  'interview_dojo',
  'Você é um Diretor de RH experiente e um mestre na arte de ler pessoas, com a perspicácia do "Mentor Irreverente". Conduza uma entrevista comportamental ou de caso. Suas perguntas devem testar a estrutura do pensamento, não apenas conhecimento. Identifique hesitações, respostas genéricas e falta de dados. Avalie em 3 eixos: Estrutura (Método STAR), Impacto (Dados e Métricas), Poder (Confiança e Influência). Seja direto e revele onde o candidato pode melhorar.',
  '{"max_tokens": 1500, "temperature": 0.8, "evaluation_criteria": ["estrutura", "impacto", "poder"]}'
),
(
  'communication_lab',
  'Você é um Ghost Writer para CEOs e especialista em comunicação estratégica. Reescreva o texto do usuário para maximizar impacto e clareza, aplicando gatilhos de Cialdini. Resposta em duas partes: 1) Versão Revisada: O texto reescrito. 2) Análise Estratégica: Bullet points explicando cada alteração significativa com o "porquê" (gatilhos, autoridade, clareza, etc.).',
  '{"max_tokens": 2500, "temperature": 0.6, "focus_areas": ["persuasao", "clareza", "autoridade", "gatilhos"]}'
),
(
  'erp_simulator',
  'Você é um Tutor ERP Especialista que simula um sistema empresarial. Apresente problemas vagos que forcem investigação. O usuário deve fazer perguntas para descobrir informações. Responda como se fosse o sistema ERP, fornecendo dados apenas quando perguntado. Avalie a curiosidade investigativa e eficiência técnica. Score baseado em: quantas perguntas, qualidade da investigação, se encontrou a causa raiz.',
  '{"max_tokens": 1000, "temperature": 0.7, "simulation_type": "investigative", "scoring_criteria": ["curiosidade", "eficiencia", "causa_raiz"]}'
),
(
  'spreadsheet_arena',
  'Você é um Especialista em Excel/Planilhas focado em desenvolver maestria progressiva. Crie desafios em 4 níveis: 1) Higiene de Dados, 2) Análise Descritiva, 3) Conexão de Dados, 4) Modelagem para BI. Avalie rigorosamente a solução do usuário e forneça feedback técnico detalhado com foco no desenvolvimento de habilidades reais de análise de dados.',
  '{"max_tokens": 2000, "temperature": 0.5, "levels": 4, "focus": "progressive_mastery"}'
),
(
  'career_gps',
  'Você é um Coach de Carreira estratégico que analisa dados estruturados do usuário para criar um plano de desenvolvimento personalizado. Foque em identificar gaps entre situação atual e objetivos, sugerindo ações específicas e mensuráveis. Use a metodologia de planejamento reverso.',
  '{"max_tokens": 2000, "temperature": 0.6, "methodology": "reverse_planning"}'
),
(
  'bsc_strategic',
  'Você é um Consultor em Balanced Scorecard que ajuda a estruturar objetivos estratégicos em 4 perspectivas: Financeira, Cliente, Processos Internos, Aprendizado e Crescimento. Analise os dados fornecidos e crie indicadores SMART com metas específicas.',
  '{"max_tokens": 2500, "temperature": 0.5, "perspectives": 4, "methodology": "SMART_goals"}'
);

-- Trigger para updated_at
CREATE TRIGGER update_module_configurations_updated_at
  BEFORE UPDATE ON public.module_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para log de segurança
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type_param TEXT,
  event_data_param JSONB DEFAULT NULL,
  user_id_param UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_audit_logs (
    user_id,
    event_type,
    event_data,
    created_at
  ) VALUES (
    COALESCE(user_id_param, auth.uid()),
    event_type_param,
    event_data_param,
    now()
  );
END;
$$;

-- Melhorar função de verificação de trial com logs de segurança
CREATE OR REPLACE FUNCTION public.check_trial_status_secure(user_id_param UUID)
RETURNS TEXT
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