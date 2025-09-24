import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para sanitização de input
function sanitizeInput(input: string): { sanitized: string; warnings: string[] } {
  const warnings: string[] = [];
  let sanitized = input;
  
  // Truncar se muito longo (10KB)
  if (input.length > 10000) {
    sanitized = sanitized.substring(0, 10000);
    warnings.push('Input truncado para 10KB');
  }
  
  // Detectar padrões suspeitos de injection
  const suspiciousPatterns = [
    /ignore\s+(previous|above|all)\s+(instructions?|prompts?)/gi,
    /system\s*(override|reset|prompt)/gi,
    /you\s+are\s+(now|not)\s+a?\s*\w*/gi,
    /forget\s+(everything|all|previous)/gi,
  ];
  
  suspiciousPatterns.forEach((pattern, index) => {
    if (pattern.test(sanitized)) {
      warnings.push(`Padrão suspeito detectado (${index + 1})`);
    }
  });
  
  // Remover caracteres de controle
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  return { sanitized: sanitized.trim(), warnings };
}

// Função para verificar rate limit
async function checkRateLimit(supabase: any, userId: string, moduleName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_user_id: userId,
      p_module_name: moduleName,
      p_limit_per_hour: 20
    });
    
    if (error) {
      console.error('Erro ao verificar rate limit:', error);
      return false; // Em caso de erro, bloqueia por segurança
    }
    
    return data === true;
  } catch (error) {
    console.error('Erro ao verificar rate limit:', error);
    return false;
  }
}

// Função para log de uso de API
async function logApiUsage(
  supabase: any, 
  userId: string, 
  moduleName: string, 
  functionName: string,
  inputTokens: number = 0,
  outputTokens: number = 0
): Promise<void> {
  try {
    const costEstimate = (inputTokens * 0.00001) + (outputTokens * 0.00003); // Estimativa de custo aproximada
    
    await supabase.rpc('log_api_usage', {
      p_user_id: userId,
      p_module_name: moduleName,
      p_function_name: functionName,
      p_input_tokens: inputTokens,
      p_output_tokens: outputTokens,
      p_cost_estimate: costEstimate
    });
  } catch (error) {
    console.error('Erro ao registrar uso da API:', error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { curriculum_text, job_description = '', user_id } = await req.json();
    
    if (!curriculum_text) {
      return new Response(
        JSON.stringify({ 
          error: 'Texto do currículo é obrigatório',
          code: 'INVALID_INPUT'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Sanitização de inputs
    const curriculumSanitized = sanitizeInput(curriculum_text);
    const jobDescSanitized = sanitizeInput(job_description);
    
    if (curriculumSanitized.warnings.length > 0 || jobDescSanitized.warnings.length > 0) {
      console.warn('Avisos de sanitização:', {
        curriculum: curriculumSanitized.warnings,
        jobDesc: jobDescSanitized.warnings,
        user_id
      });
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API key não configurada',
          code: 'API_CONFIG_ERROR'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar rate limit se user_id fornecido
    if (user_id) {
      const canProceed = await checkRateLimit(supabase, user_id, 'curriculum_analysis');
      if (!canProceed) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit excedido. Tente novamente em uma hora.',
            code: 'RATE_LIMIT_EXCEEDED'
          }),
          { 
            status: 429, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    console.log('Starting curriculum analysis for user:', user_id);

    // Buscar configuração do módulo
    const { data: moduleConfig } = await supabase
      .from('module_configurations')
      .select('system_prompt, settings')
      .eq('module_name', 'curriculum_analysis')
      .single();

    const systemPrompt = moduleConfig?.system_prompt || `
      Você é um Headhunter de elite e um estrategista de carreira cínico, mas brilhante, alinhado à filosofia do "Mentor Irreverente". 
      Sua missão é analisar o currículo do usuário sob a ótica das 48 Leis do Poder e da geração de valor tangível. 
      Ignore clichês corporativos. Foque em: Linguagem de Poder, Métricas de Impacto, Análise de Palavras-Chave e Leis do Poder.
    `;

    const settings = moduleConfig?.settings || {};
    const maxTokens = settings.max_tokens || 2000;

    const prompt = `
    ${systemPrompt}

    CURRÍCULO PARA ANÁLISE:
    ${curriculumSanitized.sanitized}

    ${jobDescSanitized.sanitized ? `DESCRIÇÃO DA VAGA DE INTERESSE: ${jobDescSanitized.sanitized}` : ''}

    Forneça uma análise completa seguindo EXATAMENTE este formato JSON:

    {
      "overall_score": (0-100),
      "mentor_verdict": "análise direta e sem filtros do Mentor Irreverente",
      "power_language_analysis": {
        "passive_expressions": ["expressão passiva encontrada 1", "expressão passiva 2"],
        "power_replacements": [
          {"weak": "fui responsável por", "strong": "liderei iniciativa que gerou"},
          {"weak": "participei de", "strong": "conduzi projeto que resultou em"}
        ],
        "impact_score": (0-100)
      },
      "metrics_audit": {
        "missing_metrics": ["área sem quantificação 1", "área sem quantificação 2"],
        "quantifiable_suggestions": [
          {"area": "vendas", "suggestion": "aumentei vendas em X% ou R$ Y"},
          {"area": "processos", "suggestion": "reduzi tempo de processo em X%"}
        ],
        "metrics_score": (0-100)
      },
      "keywords_gap_analysis": {
        "critical_missing": ["palavra-chave crítica 1", "palavra-chave crítica 2"],
        "present_keywords": ["palavra presente 1", "palavra presente 2"],
        "strategic_additions": ["adicionar como especialista em X", "enfatizar experiência com Y"],
        "ats_score": (0-100)
      },
      "power_laws_assessment": {
        "current_positioning": "como o candidato se posiciona atualmente",
        "law_violations": [
          {"law": "Lei 28: Seja Audacioso", "violation": "se vende como executor, não estrategista"},
          {"law": "Lei 11: Torne-se Indispensável", "violation": "não demonstra valor único"}
        ],
        "strategic_repositioning": "como se reposicionar estrategicamente",
        "authority_score": (0-100)
      },
      "brutal_feedback": [
        "verdade desconfortável 1 que precisa ser dita",
        "verdade desconfortável 2 sobre o mercado",
        "verdade desconfortável 3 sobre posicionamento"
      ],
      "action_plan": [
        {"priority": "alta", "action": "ação específica e mensurável", "timeline": "prazo"},
        {"priority": "média", "action": "ação específica", "timeline": "prazo"}
      ]
    }

    Seja direto, acionável e revele verdades que outros não têm coragem de dizer.
    `;

    // Estimar tokens para controle de custo
    const estimatedInputTokens = Math.ceil(prompt.length / 4); // Aproximação: 1 token = 4 caracteres

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'Você é o Mentor Irreverente, especialista em estratégia de carreira e análise brutal de currículos. Sempre responda com JSON válido seguindo exatamente a estrutura solicitada.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro da OpenAI API:', errorText);
      
      // Log do erro para auditoria
      if (user_id) {
        await logApiUsage(supabase, user_id, 'curriculum_analysis', 'curriculum-analysis-error', estimatedInputTokens, 0);
      }
      
      return new Response(
        JSON.stringify({ 
          error: response.status === 429 ? 'Rate limit da API excedido. Tente novamente em alguns minutos.' : 'Erro na análise do currículo',
          code: response.status === 429 ? 'OPENAI_RATE_LIMIT' : 'OPENAI_API_ERROR'
        }),
        { 
          status: response.status === 429 ? 429 : 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return new Response(
        JSON.stringify({ 
          error: 'Resposta inválida da OpenAI API',
          code: 'INVALID_AI_RESPONSE'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const analysisText = data.choices[0].message.content;
    
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (e) {
      console.error('Failed to parse JSON:', analysisText);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao processar resposta da IA',
          code: 'AI_PARSE_ERROR',
          rawResponse: analysisText.substring(0, 500) // Primeiros 500 chars para debug
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Log de uso bem-sucedido
    if (user_id) {
      const outputTokens = data.usage?.completion_tokens || Math.ceil(analysisText.length / 4);
      await logApiUsage(
        supabase, 
        user_id, 
        'curriculum_analysis', 
        'curriculum-analysis', 
        data.usage?.prompt_tokens || estimatedInputTokens,
        outputTokens
      );
    }

    // Save simulation session
    if (user_id) {
      try {
        const { data: moduleData } = await supabase
          .from('training_modules')
          .select('id')
          .eq('name', 'curriculum_analysis')
          .maybeSingle();

        if (moduleData) {
          await supabase
            .from('simulation_sessions')
            .insert({
              user_id,
              module_id: moduleData.id,
              session_type: 'curriculum_analysis',
              input_data: { 
                curriculum_text: curriculumSanitized.sanitized.substring(0, 1000), // Limitar tamanho armazenado
                job_description: jobDescSanitized.sanitized.substring(0, 500) 
              },
              ai_response: analysis,
              score: analysis.overall_score,
              completed: true
            });
        }
      } catch (sessionError) {
        console.error('Erro ao salvar sessão:', sessionError);
        // Não falha a requisição se não conseguir salvar a sessão
      }
    }

    console.log('Curriculum analysis completed successfully');

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in curriculum-analysis function:', error);
    
    // Log do erro para auditoria se possível
    const errorCode = error instanceof Error ? error.message.includes('rate limit') ? 'RATE_LIMIT' : 'GENERAL_ERROR' : 'UNKNOWN_ERROR';
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      code: errorCode
    }), {
      status: errorCode === 'RATE_LIMIT' ? 429 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});