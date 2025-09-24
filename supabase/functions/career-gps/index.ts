import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { career_history, skills, long_term_goal, timeline_years, user_id } = await req.json();
    
    if (!career_history || !long_term_goal) {
      throw new Error('Histórico de carreira e objetivo são obrigatórios');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Career GPS analysis for goal:', long_term_goal);

    const prompt = `
    Você é um consultor de carreira sênior especializado em análise de trajetórias profissionais. Analise o perfil fornecido e crie um plano de desenvolvimento estratégico.

    HISTÓRICO DE CARREIRA:
    ${career_history}

    COMPETÊNCIAS ATUAIS:
    ${skills || 'Não informado'}

    OBJETIVO DE LONGO PRAZO:
    ${long_term_goal}

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
        temperature: 0.7,
        max_tokens: 3000,
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
            input_data: { career_history, skills, long_term_goal, timeline_years },
            ai_response: analysis,
            score: analysis.success_probability,
            completed: true
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