import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

function sanitizeStructuredInput(data: any): any {
  if (typeof data === 'string') {
    return sanitizeUserInput(data).sanitized;
  } else if (Array.isArray(data)) {
    return data.slice(0, 10).map(sanitizeStructuredInput);
  } else if (data && typeof data === 'object') {
    const sanitized: any = {};
    const keys = Object.keys(data).slice(0, 20);
    for (const key of keys) {
      sanitized[key] = sanitizeStructuredInput(data[key]);
    }
    return sanitized;
  }
  return data;
}

interface BSCRequest {
  company_info: any;
  strategic_objectives: any;
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

    // Token system - check and deduct tokens BEFORE calling OpenAI
    const tokenCost = 150; // Token cost for BSC Strategic
    
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

    let requestData: BSCRequest;
    try {
      requestData = await req.json();
      console.log('BSC Strategic analysis request for user:', user.id, 'Request size:', JSON.stringify(requestData).length);
    } catch (parseError) {
      console.error('Erro ao parsear JSON da requisição:', parseError);
      return new Response(JSON.stringify({ 
        error: 'Dados da requisição inválidos. Verifique o formato.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (!requestData.company_info || !requestData.strategic_objectives) {
      return new Response(JSON.stringify({ 
        error: 'Informações da empresa e objetivos estratégicos são obrigatórios' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sanitize inputs
    const sanitizedCompanyInfo = sanitizeStructuredInput(requestData.company_info);
    const sanitizedObjectives = sanitizeStructuredInput(requestData.strategic_objectives);

    console.log('BSC Strategic creation for company:', sanitizedCompanyInfo.name);

    const prompt = `
Você é um consultor estratégico especializado em Balanced Scorecard (BSC). Ajude a criar um BSC completo e bem estruturado em português brasileiro.

INFORMAÇÕES DA EMPRESA:
${JSON.stringify(sanitizedCompanyInfo, null, 2)}

OBJETIVOS ESTRATÉGICOS INICIAIS:
${JSON.stringify(sanitizedObjectives, null, 2)}

Forneça um Balanced Scorecard completo seguindo EXATAMENTE este formato JSON:

{
  "bsc_overview": {
    "company_name": "${sanitizedCompanyInfo.name || 'Empresa'}",
    "industry": "setor identificado",
    "strategic_focus": "foco estratégico principal",
    "time_horizon": "horizonte temporal recomendado"
  },
  "financial_perspective": {
    "title": "Perspectiva Financeira",
    "description": "Objetivos relacionados ao desempenho financeiro",
    "objectives": [
      {
        "objective": "objetivo financeiro 1",
        "description": "descrição detalhada",
        "kpis": [
          {
            "name": "nome do KPI",
            "measurement": "como medir",
            "target": "meta sugerida",
            "frequency": "frequência de medição"
          }
        ],
        "initiatives": ["iniciativa 1", "iniciativa 2"]
      }
    ]
  },
  "customer_perspective": {
    "title": "Perspectiva do Cliente",
    "description": "Objetivos relacionados à satisfação e valor para clientes",
    "objectives": [
      {
        "objective": "objetivo do cliente 1",
        "description": "descrição detalhada",
        "kpis": [
          {
            "name": "nome do KPI",
            "measurement": "como medir",
            "target": "meta sugerida",
            "frequency": "frequência de medição"
          }
        ],
        "initiatives": ["iniciativa 1", "iniciativa 2"]
      }
    ]
  },
  "internal_processes_perspective": {
    "title": "Perspectiva dos Processos Internos",
    "description": "Objetivos relacionados à eficiência operacional",
    "objectives": [
      {
        "objective": "objetivo de processo 1",
        "description": "descrição detalhada",
        "kpis": [
          {
            "name": "nome do KPI",
            "measurement": "como medir",
            "target": "meta sugerida",
            "frequency": "frequência de medição"
          }
        ],
        "initiatives": ["iniciativa 1", "iniciativa 2"]
      }
    ]
  },
  "learning_growth_perspective": {
    "title": "Perspectiva de Aprendizado e Crescimento",
    "description": "Objetivos relacionados ao capital humano e organizacional",
    "objectives": [
      {
        "objective": "objetivo de aprendizado 1",
        "description": "descrição detalhada",
        "kpis": [
          {
            "name": "nome do KPI",
            "measurement": "como medir",
            "target": "meta sugerida",
            "frequency": "frequência de medição"
          }
        ],
        "initiatives": ["iniciativa 1", "iniciativa 2"]
      }
    ]
  },
  "strategic_alignment": {
    "cause_effect_relationships": [
      {
        "from_perspective": "perspectiva origem",
        "to_perspective": "perspectiva destino",
        "relationship": "descrição da relação causal"
      }
    ],
    "alignment_score": (0-100),
    "alignment_notes": "notas sobre o alinhamento estratégico"
  },
  "implementation_roadmap": {
    "phase_1": {
      "duration": "prazo",
      "focus": "foco principal",
      "key_actions": ["ação 1", "ação 2"]
    },
    "phase_2": {
      "duration": "prazo", 
      "focus": "foco principal",
      "key_actions": ["ação 1", "ação 2"]
    },
    "phase_3": {
      "duration": "prazo",
      "focus": "foco principal", 
      "key_actions": ["ação 1", "ação 2"]
    }
  },
  "success_factors": [
    "fator crítico 1",
    "fator crítico 2",
    "fator crítico 3"
  ],
  "recommendations": [
    "recomendação 1",
    "recomendação 2",
    "recomendação 3"
  ]
}

Garanta que o BSC seja coerente, com objetivos interconectados entre as perspectivas e KPIs mensuráveis.
`;

    console.log('Calling OpenAI API for BSC generation...');
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
            content: 'Você é um consultor estratégico com profunda expertise em metodologia Balanced Scorecard. Sempre responda com JSON válido seguindo exatamente a estrutura solicitada em português brasileiro.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 3000,
        temperature: 0.7,
      }),
    });

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
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Resposta inválida da API OpenAI');
    }
    
    const analysisText = data.choices[0].message.content;
    
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (e) {
      console.error('Failed to parse JSON:', analysisText);
      return new Response(JSON.stringify({ 
        error: 'Erro ao processar resposta da IA. Tente novamente.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Save simulation session
    try {
      const { data: moduleData } = await supabase
        .from('training_modules')
        .select('id')
        .eq('name', 'bsc_strategic')
        .single();

      if (moduleData) {
        await supabase
          .from('simulation_sessions')
          .insert({
            user_id: user.id,
            module_id: moduleData.id,
            session_type: 'bsc_creation',
            input_data: { company_info: sanitizedCompanyInfo, strategic_objectives: sanitizedObjectives },
            ai_response: analysis,
            score: analysis.strategic_alignment?.alignment_score || null,
            completed: true
          });
      }
    } catch (saveError) {
      console.error('Error saving session:', saveError);
      // Continue without throwing error
    }

    // Log API cost with proper token usage
    if (data.usage) {
      await supabase.rpc('log_api_cost', {
        p_user_id: user.id,
        p_module_name: 'bsc_strategic',
        p_prompt_tokens: data.usage.prompt_tokens,
        p_completion_tokens: data.usage.completion_tokens
      });
    }

    console.log('BSC Strategic completed successfully');

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('ERRO DETALHADO NA EDGE FUNCTION bsc-strategic:', {
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