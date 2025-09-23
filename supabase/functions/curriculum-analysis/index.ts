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

    const prompt = `
    Você é um especialista em análise de currículos e recrutamento. Analise o currículo fornecido e forneça uma análise detalhada.

    CURRÍCULO:
    ${curriculum_text}

    ${job_description ? `\nDESCRIÇÃO DA VAGA (para comparação):
    ${job_description}` : ''}

    Forneça uma análise estruturada seguindo EXATAMENTE este formato JSON:

    {
      "overall_score": (número de 0 a 100),
      "summary": "Resumo geral do currículo em 2-3 frases",
      "strengths": ["ponto forte 1", "ponto forte 2", "ponto forte 3"],
      "weaknesses": ["ponto fraco 1", "ponto fraco 2", "ponto fraco 3"],
      "impact_analysis": {
        "current_descriptions": ["descrição atual 1", "descrição atual 2"],
        "improved_descriptions": ["versão melhorada usando STAR 1", "versão melhorada usando STAR 2"]
      },
      "keyword_analysis": {
        "missing_keywords": ["palavra-chave 1", "palavra-chave 2"],
        "present_keywords": ["palavra-chave presente 1", "palavra-chave presente 2"],
        "ats_score": (número de 0 a 100)
      },
      "improvement_suggestions": [
        "Sugestão específica 1",
        "Sugestão específica 2", 
        "Sugestão específica 3"
      ]
    }

    Seja específico, construtivo e foque em melhorias acionáveis.
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
            content: 'You are an expert resume analyst. Always respond with valid JSON following the exact structure requested.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
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