import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Input sanitization functions
function sanitizeUserInput(input: string): { sanitized: string; warnings: string[] } {
  const warnings: string[] = [];
  let sanitized = input;

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /ignore\s+(previous|all)\s+instructions/gi,
    /system\s*:?\s*you\s+are/gi,
    /<script[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(sanitized)) {
      warnings.push('Suspicious pattern detected');
      break;
    }
  }

  // Basic sanitization
  sanitized = sanitized.replace(/[<>]/g, '').substring(0, 5000);
  
  return { sanitized, warnings };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { business_problem, user_solution, user_id } = await req.json();
    
    if (!business_problem) {
      throw new Error('Problema de negócio é obrigatório');
    }

    // Sanitize inputs
    const sanitizedProblem = sanitizeUserInput(business_problem).sanitized;
    const sanitizedSolution = user_solution ? sanitizeUserInput(user_solution).sanitized : null;

    // Rate limiting check
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (user_id) {
      const { data: rateLimitCheck } = await supabase.rpc('check_rate_limit', {
        p_user_id: user_id,
        p_module_name: 'erp_simulator',
        p_limit_per_hour: 20
      });

      if (!rateLimitCheck) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('ERP simulation for problem:', sanitizedProblem.substring(0, 100));

    const prompt = `
    Você é um especialista em sistemas ERP e processos empresariais. Analise o problema de negócio apresentado e forneça orientação sobre como usar um ERP para solucioná-lo.

    PROBLEMA DE NEGÓCIO:
    ${sanitizedProblem}

    ${sanitizedSolution ? `\nSOLUÇÃO PROPOSTA PELO USUÁRIO:
    ${sanitizedSolution}` : ''}

    Forneça uma análise detalhada seguindo EXATAMENTE este formato JSON:

    {
      "problem_analysis": {
        "complexity_level": (1-5),
        "business_area": "área principal afetada (Vendas, Financeiro, Estoque, etc.)",
        "impact_assessment": "avaliação do impacto no negócio"
      },
      "erp_modules_needed": [
        {
          "module": "nome do módulo ERP",
          "purpose": "para que serve neste contexto",
          "priority": "alta/média/baixa"
        }
      ],
      "data_flow": {
        "input_data": ["tipo de dado 1", "tipo de dado 2"],
        "processing_steps": [
          "passo 1 do processamento",
          "passo 2 do processamento", 
          "passo 3 do processamento"
        ],
        "output_reports": ["relatório 1", "relatório 2"]
      },
      "solution_approach": {
        "correct_process": "descrição detalhada do processo correto",
        "key_integrations": ["integração 1", "integração 2"],
        "best_practices": ["prática 1", "prática 2", "prática 3"]
      },
      ${user_solution ? `"user_solution_feedback": {
        "accuracy_score": (0-100),
        "correct_aspects": ["aspecto correto 1", "aspecto correto 2"],
        "incorrect_aspects": ["aspecto incorreto 1", "aspecto incorreto 2"],
        "improvements": ["melhoria 1", "melhoria 2"]
      },` : ''}
      "practical_example": {
        "scenario": "exemplo prático similar",
        "step_by_step": ["passo 1", "passo 2", "passo 3"],
        "expected_outcome": "resultado esperado"
      },
      "learning_points": [
        "ponto de aprendizado 1",
        "ponto de aprendizado 2",
        "ponto de aprendizado 3"
      ]
    }

    Seja didático, preciso e foque na compreensão da lógica de integração de dados em ERPs.
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
              content: 'You are an expert ERP consultant and business process analyst. Always respond with valid JSON following the exact structure requested.' 
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
        .eq('name', 'erp_simulator')
        .single();

      if (moduleData) {
        await supabase
          .from('simulation_sessions')
          .insert({
            user_id,
            module_id: moduleData.id,
            session_type: 'erp_simulation',
            input_data: { business_problem: sanitizedProblem, user_solution: sanitizedSolution },
            ai_response: analysis,
            score: analysis.user_solution_feedback?.accuracy_score || null,
            completed: true
          });
      }
    }

    console.log('ERP simulation completed successfully');

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in erp-simulator function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});