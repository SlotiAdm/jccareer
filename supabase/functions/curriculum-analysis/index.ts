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
    const { curriculum_text, job_description = '', user_id } = await req.json();
    
    if (!curriculum_text) {
      throw new Error('Texto do currículo é obrigatório');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    ${curriculum_text}

    ${job_description ? `DESCRIÇÃO DA VAGA DE INTERESSE: ${job_description}` : ''}

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
        .eq('name', 'curriculum_analysis')
        .single();

      if (moduleData) {
        await supabase
          .from('simulation_sessions')
          .insert({
            user_id,
            module_id: moduleData.id,
            session_type: 'curriculum_analysis',
            input_data: { curriculum_text, job_description },
            ai_response: analysis,
            score: analysis.overall_score,
            completed: true
          });
      }
    }

    console.log('Curriculum analysis completed successfully');

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in curriculum-analysis function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});