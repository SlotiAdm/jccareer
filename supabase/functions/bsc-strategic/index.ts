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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { company_info, strategic_objectives, user_id } = await req.json();
    
    if (!company_info || !strategic_objectives) {
      throw new Error('Informações da empresa e objetivos estratégicos são obrigatórios');
    }

    // Sanitize inputs
    const sanitizedCompanyInfo = sanitizeStructuredInput(company_info);
    const sanitizedObjectives = sanitizeStructuredInput(strategic_objectives);

    // Rate limiting check
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (user_id) {
      const { data: rateLimitCheck } = await supabase.rpc('check_rate_limit', {
        p_user_id: user_id,
        p_module_name: 'bsc_strategic',
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

    console.log('BSC Strategic creation for company:', sanitizedCompanyInfo.name);

    const prompt = `
    Você é um consultor estratégico especializado em Balanced Scorecard (BSC). Ajude a criar um BSC completo e bem estruturado.

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
            content: 'You are a strategic management consultant with deep expertise in Balanced Scorecard methodology. Always respond with valid JSON following the exact structure requested.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2200,
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
        .eq('name', 'bsc_strategic')
        .single();

      if (moduleData) {
        await supabase
          .from('simulation_sessions')
          .insert({
            user_id,
            module_id: moduleData.id,
            session_type: 'bsc_creation',
            input_data: { company_info: sanitizedCompanyInfo, strategic_objectives: sanitizedObjectives },
            ai_response: analysis,
            score: analysis.strategic_alignment?.alignment_score || null,
            completed: true
          });
      }
    }

    console.log('BSC Strategic completed successfully');

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in bsc-strategic function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});