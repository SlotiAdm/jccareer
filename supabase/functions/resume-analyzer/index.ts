import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { originalResume, jobDescription, user_id } = await req.json();

    if (!originalResume || !jobDescription) {
      throw new Error('Currículo original e descrição da vaga são obrigatórios');
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key não configurada');
    }

    // Prompt especializado para análise de currículo
    const prompt = `Você é um 'Recruiter-AI' de elite. Sua missão é receber um currículo bruto e a descrição de uma vaga-alvo e sintetizar um novo currículo otimizado.

CURRÍCULO ORIGINAL:
${originalResume}

DESCRIÇÃO DA VAGA ALVO:
${jobDescription}

Sua análise deve ser baseada em três pilares:

1. **Metodologia STAR**: Reescreva cada ponto de experiência profissional para refletir Situação-Tarefa-Ação-Resultado, quantificando o impacto sempre que possível.

2. **Otimização ATS**: Analise a descrição da vaga, extraia as 10-15 palavras-chave e competências mais importantes e garanta que elas estejam naturalmente integradas no novo currículo.

3. **Melhores Práticas de Mercado**: Aplique as regras de um currículo moderno: um resumo de impacto no topo, ordem cronológica inversa, clareza, objetividade e uso de verbos de ação.

Retorne APENAS um JSON válido no seguinte formato:
{
  "optimizedResume": "CURRÍCULO COMPLETO REESCRITO AQUI, formatado em seções claras: RESUMO EXECUTIVO, EXPERIÊNCIA PROFISSIONAL, FORMAÇÃO, COMPETÊNCIAS TÉCNICAS, IDIOMAS (se aplicável)",
  "improvementNotes": {
    "keywordOptimization": ["lista das palavras-chave adicionadas/otimizadas"],
    "starMethodology": ["lista das experiências reescritas usando STAR"],
    "structuralChanges": ["lista das principais mudanças estruturais"],
    "atsOptimizations": ["lista das otimizações para ATS"]
  },
  "score": 85
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Você é um especialista em recrutamento e otimização de currículos. Sempre responda apenas com JSON válido.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1600,
          temperature: 0.7,
        }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro da OpenAI:', errorData);
      throw new Error(`Erro da OpenAI: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    let analysisResult;
    try {
      analysisResult = JSON.parse(content);
    } catch (parseError) {
      console.error('Erro ao parsear JSON:', content);
      throw new Error('Resposta da IA inválida');
    }

    // Salvar no banco se user_id fornecido
    if (user_id) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase
        .from('generated_resumes')
        .insert({
          user_id,
          original_resume: originalResume,
          job_description: jobDescription,
          generated_resume: analysisResult.optimizedResume,
          improvements_notes: analysisResult.improvementNotes
        });

      // Salvar na sessão de simulação
      await supabase
        .from('simulation_sessions')
        .insert({
          user_id,
          module_id: '00000000-0000-0000-0000-000000000001', // ID fixo para raio-x
          session_type: 'resume_analysis',
          input_data: {
            original_resume: originalResume,
            job_description: jobDescription
          },
          ai_response: analysisResult,
          score: analysisResult.score || null
        });
    }

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro no analisador de currículo:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});