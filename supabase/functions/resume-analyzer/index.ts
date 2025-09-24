import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResumeAnalysisRequest {
  action: "analyze" | "generate";
  originalResume: string;
  jobDescription?: string;
  previousAnalysis?: any;
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
    if (!requestData.action || !['analyze', 'generate'].includes(requestData.action)) {
      return new Response(JSON.stringify({ 
        error: 'Ação inválida. Use "analyze" ou "generate".' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    // Token system - check and deduct tokens BEFORE calling OpenAI
    const tokenCost = requestData.action === 'analyze' ? 80 : 120; // Different costs for different actions
    
    if (user) {
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
    }

    let prompt: string;
    
    if (requestData.action === 'analyze') {
      prompt = `Você é um 'Recruiter-AI' de elite especializado em diagnóstico de currículos. Analise o currículo fornecido e forneça um diagnóstico detalhado.

CURRÍCULO ORIGINAL:
${requestData.originalResume}

${requestData.jobDescription ? `DESCRIÇÃO DA VAGA ALVO:\n${requestData.jobDescription}` : 'ANÁLISE GERAL (sem vaga específica)'}

Faça uma análise CRÍTICA e ESTRATÉGICA do currículo atual, identificando:

1. **Pontos Fortes**: O que já está bem estruturado
2. **Gaps Críticos**: O que está faltando ou mal posicionado
3. **Oportunidades ATS**: Palavras-chave e formatação para sistemas automatizados
4. **Impacto STAR**: Onde aplicar Situação-Tarefa-Ação-Resultado

Retorne APENAS um JSON válido:
{
  "diagnosis": "Texto corrido com análise completa e detalhada do currículo, incluindo pontos fortes, fracos e oportunidades de melhoria. Seja específico e prático.",
  "keyInsights": [
    "Insight 1 sobre formatação ou estrutura",
    "Insight 2 sobre conteúdo ou palavras-chave", 
    "Insight 3 sobre experiências ou competências",
    "Insight 4 sobre adequação à vaga"
  ],
  "score": 65
}`;
    } else {
      prompt = `Você é um 'Recruiter-AI' de elite. Use a análise anterior para gerar um currículo otimizado.

CURRÍCULO ORIGINAL:
${requestData.originalResume}

${requestData.jobDescription ? `DESCRIÇÃO DA VAGA ALVO:\n${requestData.jobDescription}` : 'ANÁLISE GERAL (sem vaga específica)'}

${requestData.previousAnalysis ? `ANÁLISE ANTERIOR:\n${JSON.stringify(requestData.previousAnalysis)}` : ''}

Baseado na análise, reescreva o currículo aplicando:

1. **Metodologia STAR**: Experiências com Situação-Tarefa-Ação-Resultado quantificado
2. **Otimização ATS**: Palavras-chave estratégicas integradas naturalmente  
3. **Melhores Práticas**: Resumo executivo, ordem cronológica inversa, verbos de ação

Retorne APENAS um JSON válido:
{
  "optimizedResume": "CURRÍCULO COMPLETO REESCRITO, formatado profissionalmente com seções claras: RESUMO EXECUTIVO, EXPERIÊNCIA PROFISSIONAL, FORMAÇÃO, COMPETÊNCIAS TÉCNICAS, IDIOMAS (se aplicável)",
  "improvementNotes": {
    "keywordOptimization": ["palavras-chave adicionadas/otimizadas"],
    "starMethodology": ["experiências reescritas usando STAR"],
    "structuralChanges": ["mudanças estruturais principais"],
    "atsOptimizations": ["otimizações para ATS aplicadas"]
  },
  "score": 90
}`;
    }

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
        max_tokens: requestData.action === 'analyze' ? 1500 : 2500,
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

    // Save results and log API usage
    try {
      // Save to generated_resumes only if generating optimized resume
      if (requestData.action === 'generate' && analysisResult.optimizedResume) {
        await supabase
          .from('generated_resumes')
          .insert({
            user_id: user.id,
            original_resume: requestData.originalResume,
            job_description: requestData.jobDescription || null,
            generated_resume: analysisResult.optimizedResume,
            improvements_notes: analysisResult.improvementNotes
          });
      }

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
            session_type: requestData.action === 'analyze' ? 'resume_analysis' : 'resume_generation',
            input_data: {
              action: requestData.action,
              original_resume: requestData.originalResume,
              job_description: requestData.jobDescription
            },
            ai_response: analysisResult,
            feedback: requestData.action === 'analyze' ? analysisResult.diagnosis : `Currículo otimizado gerado com score ${analysisResult.score}`,
            score: analysisResult.score || null,
            completed: true
          });
      }

      // Log API cost with proper token usage
      if (data.usage) {
        await supabase.rpc('log_api_cost', {
          p_user_id: user.id,
          p_module_name: 'resume_analyzer',
          p_prompt_tokens: data.usage.prompt_tokens,
          p_completion_tokens: data.usage.completion_tokens
        });
      }
    } catch (saveError) {
      console.error('Error saving results:', saveError);
      // Continue without throwing error
    }

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