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
    const { scenario, user_text, user_id } = await req.json();
    
    if (!scenario || !user_text) {
      throw new Error('Cenário e texto são obrigatórios');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Communication lab analysis for scenario:', scenario);

    const scenarios = {
      'email_to_director': 'Escrever um e-mail para um diretor pedindo recursos',
      'negative_results_presentation': 'Estruturar um slide para apresentar resultados negativos',
      'client_proposal': 'Redigir uma proposta para cliente',
      'team_feedback': 'Dar feedback construtivo para equipe',
      'project_update': 'Comunicar atualização de projeto para stakeholders'
    };

    const scenarioDescription = scenarios[scenario as keyof typeof scenarios] || scenario;

    const prompt = `
    Você é um consultor de comunicação corporativa. Analise o texto fornecido para o cenário específico e forneça uma versão melhorada.

    CENÁRIO: ${scenarioDescription}

    TEXTO ORIGINAL:
    ${user_text}

    Forneça uma análise completa seguindo EXATAMENTE este formato JSON:

    {
      "original_analysis": {
        "clarity_score": (0-100),
        "persuasion_score": (0-100),
        "professionalism_score": (0-100),
        "structure_score": (0-100),
        "main_issues": ["problema 1", "problema 2", "problema 3"]
      },
      "improved_version": "versão completamente reescrita do texto, aplicando princípios de comunicação estratégica",
      "key_improvements": [
        {
          "aspect": "Clareza",
          "change": "explicação da mudança feita",
          "reason": "por que essa mudança melhora a comunicação"
        },
        {
          "aspect": "Estrutura",
          "change": "explicação da mudança feita", 
          "reason": "por que essa mudança melhora a comunicação"
        },
        {
          "aspect": "Persuasão",
          "change": "explicação da mudança feita",
          "reason": "por que essa mudança melhora a comunicação"
        }
      ],
      "communication_principles": [
        "Princípio 1 aplicado",
        "Princípio 2 aplicado",
        "Princípio 3 aplicado"
      ],
      "overall_score": (0-100),
      "next_steps": ["próximo passo 1", "próximo passo 2"]
    }

    Seja específico, prático e foque em melhorias que aumentem o impacto da comunicação.
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
            content: 'You are an expert corporate communication consultant. Always respond with valid JSON following the exact structure requested.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
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
        .eq('name', 'communication_lab')
        .single();

      if (moduleData) {
        await supabase
          .from('simulation_sessions')
          .insert({
            user_id,
            module_id: moduleData.id,
            session_type: `communication_${scenario}`,
            input_data: { scenario, user_text },
            ai_response: analysis,
            score: analysis.overall_score,
            completed: true
          });
      }
    }

    console.log('Communication lab analysis completed successfully');

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in communication-lab function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});