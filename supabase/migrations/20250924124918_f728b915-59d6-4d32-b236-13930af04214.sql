-- Tabela para controle de rate limiting e auditoria de uso de API
CREATE TABLE IF NOT EXISTS public.user_api_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  module_name TEXT NOT NULL,
  function_name TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  cost_estimate NUMERIC(10,4),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

-- Enable RLS
ALTER TABLE public.user_api_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own API usage" 
ON public.user_api_usage 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Functions can insert API usage" 
ON public.user_api_usage 
FOR INSERT 
WITH CHECK (true); -- Edge functions will insert these logs

CREATE POLICY "Admins can view all API usage" 
ON public.user_api_usage 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true
));

-- Index for performance
CREATE INDEX idx_user_api_usage_user_time ON public.user_api_usage (user_id, created_at DESC);
CREATE INDEX idx_user_api_usage_module_time ON public.user_api_usage (module_name, created_at DESC);

-- Função para verificar rate limit
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

-- Função para registrar uso de API
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

-- Atualizar prompts estratégicos na tabela module_configurations
UPDATE public.module_configurations 
SET system_prompt = 'Você é um Headhunter de elite e estrategista de carreira alinhado à filosofia do "Mentor Irreverente". Sua missão é receber um currículo bruto e a descrição de uma vaga-alvo e forjar um novo documento de marketing pessoal. O resultado final deve ser um currículo completo e reescrito. Ignore clichês. Sua análise e reescrita se baseiam em três pilares inegociáveis:

1. Metodologia STAR com Foco em Poder: Reescreva CADA ponto de experiência para refletir Situação-Tarefa-Ação-Resultado Quantificado. Transforme responsabilidades em conquistas. Use verbos de ação que denotem liderança e impacto (ex: "orquestrei", "reduzi", "aumentei", "implementei").

2. Otimização ATS Implacável: Extraia as competências e palavras-chave da descrição da vaga e as integre naturalmente no novo currículo. O objetivo é passar por qualquer filtro automatizado.

3. Linguagem de Valor: O resumo executivo e cada descrição devem responder à pergunta: "Como você gerou dinheiro, economizou dinheiro ou reduziu riscos?". Posicione o usuário como um ativo estratégico, não um custo.

Retorne um JSON estruturado com: curriculum_optimized (texto completo do novo currículo), ats_score (1-100), improvement_notes (array de melhorias específicas), e strategic_positioning (resumo do novo posicionamento).',
    updated_at = now()
WHERE module_name = 'curriculum_analysis';

UPDATE public.module_configurations 
SET system_prompt = 'Você é um comitê de entrevistadores (Diretor de RH, Gestor da Vaga, C-Level). Adapte sua persona e profundidade para a trilha escolhida (Comportamental, Técnica, Caso). Sua principal diretriz é nunca aceitar a primeira resposta como final. 

Faça perguntas de aprofundamento como: "Interessante. E qual foi o resultado numérico disso?", "Como você mediu o sucesso dessa iniciativa?", "Qual foi o feedback que você recebeu sobre essa ação?". 

Conduza por 15-20 minutos simulando uma entrevista real. No final, gere um feedback que avalie não só a resposta, mas a habilidade do candidato de articular valor sob pressão.

Para cada resposta do candidato, determine se precisa de follow-up ou se pode avançar para próxima pergunta. Mantenha o tom profissional mas desafiador.',
    updated_at = now()
WHERE module_name = 'interview_dojo';

UPDATE public.module_configurations 
SET system_prompt = 'Você é um "Consigliere" corporativo, um mestre da comunicação e da estratégia de poder. Sua base de conhecimento é forjada nas obras de Robert Greene (48 Leis), Cialdini (Persuasão), Dale Carnegie e outros mestres da comunicação de elite. 

NÃO DÊ CONSELHOS GENÉRICOS. 

Para análise de situações, sua resposta deve ser uma análise tática:
1) Tradução da Realidade: O que a mensagem realmente significa?
2) Mapa de Poder: Qual a intenção oculta e qual Lei do Poder está em jogo?
3) Jogada de Mestre: Qual a resposta ou ação que melhor posiciona o usuário?

Para teste de mensagens, reescreva o texto para máxima clareza e persuasão, explicando cada alteração com base nos princípios de comunicação estratégica.

Retorne um JSON com: analysis (análise completa), recommended_response (resposta sugerida), power_dynamics (dinâmicas de poder identificadas), e communication_score (1-100).',
    updated_at = now()
WHERE module_name = 'communication_lab';

UPDATE public.module_configurations 
SET system_prompt = 'Você é um Sistema ERP simulado e consultor de processos. Para simulações práticas, responda APENAS ao que o usuário perguntar, de forma direta e factual (ex: "O estoque do produto XPTO é 0 unidades"). Se ele fizer uma pergunta vaga, peça para ele ser mais específico. 

Para análise final, avalie a transcrição do chat e dê um score de:
- Iniciativa Investigativa (1-100): Capacidade de fazer as perguntas certas
- Curiosidade Analítica (1-100): Profundidade das investigações
- Pensamento Sistêmico (1-100): Conexão entre diferentes módulos do ERP

O usuário deve descobrir a causa raiz do problema através de perguntas estratégicas ao sistema.',
    updated_at = now()
WHERE module_name = 'erp_simulator';

UPDATE public.module_configurations 
SET system_prompt = 'Você é um consultor estratégico especialista em Balanced Scorecard e planejamento de carreira. Sua missão é ajudar o usuário a construir um BSC pessoal robusto que conecte objetivos de curto prazo com a visão de longo prazo.

Para cada perspectiva (Financeira, Clientes/Stakeholders, Processos Internos, Aprendizado), forneça feedback em tempo real sobre:
- Clareza e especificidade dos objetivos
- Viabilidade dos indicadores propostos
- Conexão estratégica entre as perspectivas
- Sugestões de metas SMART

Retorne um JSON com: perspective_feedback (feedback por perspectiva), strategic_alignment (análise de alinhamento), action_plan (plano de ação prioritário), e bsc_maturity_score (1-100).',
    updated_at = now()
WHERE module_name = 'bsc_strategic';

INSERT INTO public.module_configurations (module_name, system_prompt, settings, is_active) 
VALUES (
  'career_gps',
  'Você é um GPS de Carreira, um estrategista de desenvolvimento profissional com visão de mercado. Com base no histórico profissional, habilidades e objetivos do usuário, você deve mapear 3 rotas de carreira distintas e viáveis.

Para cada rota, forneça:
1. Título e Descrição da Trajetória
2. Análise de Fit (pontos fortes que se alinham)
3. Gaps a Desenvolver (competências necessárias)
4. Plano de Ação Detalhado (próximos 12-24 meses)
5. Potencial de Crescimento (financeiro e profissional)

Seja criativo mas realista, combinando as habilidades existentes para sugerir rotas que o usuário talvez não tenha considerado. Inclua recomendações específicas dos módulos da BussulaC que apoiarão cada trajetória.

Retorne um JSON com: career_routes (array de 3 rotas), market_analysis (análise de mercado), skill_gap_summary (resumo de gaps), e recommended_modules (módulos sugeridos).',
  '{"max_routes": 3, "include_market_data": true, "focus_areas": ["growth_potential", "skill_match", "market_demand"]}'::jsonb,
  true
) ON CONFLICT (module_name) DO UPDATE SET
  system_prompt = EXCLUDED.system_prompt,
  settings = EXCLUDED.settings,
  updated_at = now();