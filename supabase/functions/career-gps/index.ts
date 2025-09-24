import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input sanitization function
function sanitizeUserInput(input: string): { sanitized: string; warnings: string[] } {
  const warnings: string[] = [];
  let sanitized = input;

  // Remove potentially dangerous patterns
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi,
    /onclick\s*=/gi,
  ];

  dangerousPatterns.forEach(pattern => {
    if (pattern.test(sanitized)) {
      warnings.push('Suspicious content detected and removed');
      sanitized = sanitized.replace(pattern, '');
    }
  });

  // Limit length
  if (sanitized.length > 50000) {
    warnings.push('Input truncated to 50000 characters');
    sanitized = sanitized.substring(0, 50000);
  }

  return { sanitized, warnings };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!supabaseUrl || !supabaseKey || !openAIApiKey) {
      console.error('Missing environment variables');
      return new Response(JSON.stringify({ 
        error: 'Configuração do servidor incompleta' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { career_history, skills, long_term_goal, timeline_years } = await req.json();
    
    if (!career_history || !long_term_goal) {
      throw new Error('Histórico de carreira e objetivo são obrigatórios');
    }

    // Sanitize inputs
    const sanitizedCareerHistory = sanitizeUserInput(career_history);
    const sanitizedSkills = skills ? sanitizeUserInput(skills) : { sanitized: '', warnings: [] };
    const sanitizedGoal = sanitizeUserInput(long_term_goal);

    const allWarnings = [...sanitizedCareerHistory.warnings, ...sanitizedSkills.warnings, ...sanitizedGoal.warnings];
    if (allWarnings.length > 0) {
      console.warn('Input sanitization warnings:', allWarnings);
    }

    // Token system - check and deduct tokens BEFORE calling OpenAI
    const tokenCost = 130; // Token cost for career GPS
    
    const { data: hasTokens, error: tokenError } = await supabase.rpc('check_and_deduct_tokens', {
      p_user_id: user.id,
      p_token_cost: tokenCost
    });

    if (tokenError) {
      console.error('Token check error:', tokenError);
      return new Response(JSON.stringify({ 
        error: 'Erro interno. Tente novamente.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!hasTokens) {
      return new Response(JSON.stringify({ 
        error: 'Tokens insuficientes. Renove sua assinatura ou aguarde a renovação mensal.',
        errorCode: 'INSUFFICIENT_TOKENS'
      }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Career GPS analysis for goal:', sanitizedGoal.sanitized.substring(0, 100));

    const prompt = `
    Você é um consultor de carreira sênior especializado em análise de trajetórias profissionais. Analise o perfil fornecido e crie um plano de desenvolvimento estratégico.

    HISTÓRICO DE CARREIRA:
    ${sanitizedCareerHistory.sanitized}

    COMPETÊNCIAS ATUAIS:
    ${sanitizedSkills.sanitized || 'Não informado'}

    OBJETIVO DE LONGO PRAZO:
    ${sanitizedGoal.sanitized}

    PRAZO DESEJADO:
    ${timeline_years || 3} anos

    Forneça uma análise completa seguindo EXATAMENTE este formato JSON:

    {
      "career_analysis": {
        "current_level": "nível atual (ex: Analista Sênior, Coordenador, etc.)",
        "target_level": "nível desejado baseado no objetivo",
        "progression_feasibility": (0-100),
        "trajectory_alignment": (0-100)
      },
      "gap_analysis": {
        "skill_gaps": [
          {
            "skill": "competência faltante",
            "importance": "alta/média/baixa",
            "development_time": "tempo estimado para desenvolver"
          }
        ],
        "experience_gaps": [
          {
            "experience": "experiência faltante",
            "how_to_acquire": "como adquirir esta experiência",
            "timeline": "tempo estimado"
          }
        ],
        "network_gaps": ["tipo de conexão 1", "tipo de conexão 2"]
      },
      "action_plan": {
        "immediate_actions": [
          {
            "action": "ação específica",
            "deadline": "prazo",
            "impact": "alto/médio/baixo"
          }
        ],
        "medium_term_goals": [
          {
            "goal": "objetivo específico",
            "timeline": "prazo",
            "milestones": ["marco 1", "marco 2"]
          }
        ],
        "long_term_strategy": "estratégia geral para alcançar o objetivo"
      },
      "market_benchmarking": {
        "typical_progression": "trajetória típica para o objetivo",
        "average_timeline": "tempo médio de mercado",
        "success_factors": ["fator 1", "fator 2", "fator 3"],
        "market_trends": ["tendência 1", "tendência 2"]
      },
      "recommended_modules": [
        {
          "module": "módulo recomendado do Terminal",
          "reason": "por que ajudará no objetivo"
        }
      ],
      "success_probability": (0-100),
      "key_recommendations": ["recomendação 1", "recomendação 2", "recomendação 3"]
    }

    Seja específico, realista e base suas recomendações em práticas de mercado atuais.
    `;

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
            content: 'You are a senior career consultant with deep knowledge of corporate career progression. Always respond with valid JSON following the exact structure requested.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Resposta inválida da API OpenAI');
    }
    
    const analysisText = data.choices[0].message.content;
    
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (e) {
      console.error('Failed to parse JSON:', analysisText);
      throw new Error('Erro ao processar resposta da IA');
    }

    // Save simulation session
    if (user_id) {
      const { data: moduleData } = await supabase
        .from('training_modules')
        .select('id')
        .eq('name', 'career_gps')
        .single();

      if (moduleData) {
        await supabase
          .from('simulation_sessions')
          .insert({
            user_id,
            module_id: moduleData.id,
            session_type: 'career_planning',
            input_data: { 
              career_history: sanitizedCareerHistory.sanitized, 
              skills: sanitizedSkills.sanitized, 
              long_term_goal: sanitizedGoal.sanitized, 
              timeline_years 
            },
            ai_response: analysis,
            score: analysis.success_probability,
            completed: true
          });

        // Log API usage
        await supabase.rpc('log_api_usage', {
          p_user_id: user_id,
          p_module_name: 'career-gps',
          p_function_name: 'career_analysis'
        });
      }
    }

    console.log('Career GPS analysis completed successfully');

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in career-gps function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});