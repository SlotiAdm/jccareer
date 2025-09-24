import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResumeAnalysisRequest {
  originalResume: string;
  jobDescription?: string;
  user_id?: string;
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

    // Rate limiting check
    const { data: rateLimitData, error: rateLimitError } = await supabase
      .rpc('check_rate_limit', {
        p_user_id: user.id,
        p_module_name: 'resume_analyzer',
        p_limit_per_hour: 10
      });

    if (rateLimitError || !rateLimitData) {
      console.error('Rate limit check failed:', rateLimitError);
      return new Response(JSON.stringify({ 
        error: 'Limite de uso excedido. Tente novamente em uma hora.' 
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let requestData: ResumeAnalysisRequest;
    try {
      requestData = await req.json();
      console.log('Resume analysis request for user:', user.id, 'Request size:', JSON.stringify(requestData).length);
    } catch (parseError) {
      console.error('Erro ao parsear JSON da requisição:', parseError);
      return new Response(JSON.stringify({ 
        error: 'Dados da requisição inválidos. Verifique o formato.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Input validation
    if (!requestData.originalResume || requestData.originalResume.trim().length < 50) {
      return new Response(JSON.stringify({ 
        error: 'Currículo deve ter pelo menos 50 caracteres' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (requestData.originalResume.length > 15000) {
      return new Response(JSON.stringify({ 
        error: 'Currículo muito longo. Máximo 15.000 caracteres.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = `Você é um 'Recruiter-AI' de elite. Sua missão é receber um currículo bruto e a descrição de uma vaga-alvo e sintetizar um novo currículo otimizado.

CURRÍCULO ORIGINAL:
${requestData.originalResume}

${requestData.jobDescription ? `DESCRIÇÃO DA VAGA ALVO:\n${requestData.jobDescription}` : 'ANÁLISE GERAL (sem vaga específica)'}

Sua análise deve ser baseada em três pilares:

1. **Metodologia STAR**: Reescreva cada ponto de experiência profissional para refletir Situação-Tarefa-Ação-Resultado, quantificando o impacto sempre que possível.

2. **Otimização ATS**: ${requestData.jobDescription ? 'Analise a descrição da vaga, extraia as 10-15 palavras-chave e competências mais importantes e garanta que elas estejam naturalmente integradas no novo currículo.' : 'Identifique palavras-chave relevantes para a área e garanta que estejam presentes no currículo.'}

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

    console.log('Calling OpenAI API...');
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
            content: 'Você é um especialista em recrutamento e otimização de currículos. Sempre responda apenas com JSON válido em português brasileiro.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2500,
        temperature: 0.7,
      }),
    });

    console.log('OpenAI Response status:', response.status, 'OK:', response.ok);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      
      if (response.status === 401) {
        return new Response(JSON.stringify({ 
          error: 'Erro de autenticação da API. Entre em contato com o suporte.' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Muitas requisições. Tente novamente em alguns minutos.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ 
        error: 'Serviço temporariamente indisponível. Tente novamente.' 
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    let analysisResult;
    try {
      analysisResult = JSON.parse(content);
    } catch (parseError) {
      console.error('Erro ao parsear JSON:', content);
      return new Response(JSON.stringify({ 
        error: 'Resposta da IA inválida. Tente novamente.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Save results
    try {
      await supabase
        .from('generated_resumes')
        .insert({
          user_id: user.id,
          original_resume: requestData.originalResume,
          job_description: requestData.jobDescription || null,
          generated_resume: analysisResult.optimizedResume,
          improvements_notes: analysisResult.improvementNotes
        });

      // Get module ID for session tracking
      const { data: moduleData } = await supabase
        .from('training_modules')
        .select('id')
        .eq('name', 'resume_analyzer')
        .single();
      
      if (moduleData) {
        await supabase
          .from('simulation_sessions')
          .insert({
            user_id: user.id,
            module_id: moduleData.id,
            session_type: 'resume_analysis',
            input_data: {
              original_resume: requestData.originalResume,
              job_description: requestData.jobDescription
            },
            ai_response: analysisResult,
            score: analysisResult.score || null,
            completed: true
          });
      }
    } catch (saveError) {
      console.error('Error saving results:', saveError);
      // Continue without throwing error
    }

    // Log API usage
    await supabase.rpc('log_api_usage', {
      p_user_id: user.id,
      p_module_name: 'resume_analyzer',
      p_function_name: 'analyze_resume',
      p_input_tokens: data.usage?.prompt_tokens || 0,
      p_output_tokens: data.usage?.completion_tokens || 0,
      p_cost_estimate: ((data.usage?.prompt_tokens || 0) * 0.00015 + (data.usage?.completion_tokens || 0) * 0.0002) / 1000
    });

    console.log('Analysis completed successfully');
    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('ERRO DETALHADO NA EDGE FUNCTION resume-analyzer:', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString()
    });
    
    return new Response(JSON.stringify({ 
      error: 'Erro interno do servidor. Tente novamente.',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});