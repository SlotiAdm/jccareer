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
    const { challenge_type, user_formula, user_approach, challenge_data, user_id } = await req.json();
    
    if (!challenge_type) {
      throw new Error('Tipo de desafio é obrigatório');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Spreadsheet arena challenge:', challenge_type);

    // Pre-defined challenges
    const challenges = {
      'formula_calculation': {
        description: 'Você tem uma tabela de vendas por região e produto. Precisa calcular a média de vendas por região, excluindo o produto "Beta".',
        sample_data: 'Região | Produto | Vendas\nNorte | Alpha | 1500\nNorte | Beta | 800\nSul | Alpha | 2000\nSul | Beta | 1200\nNorte | Gamma | 1800',
        expected_formula: '=AVERAGEIFS(C:C, A:A, "Norte", B:B, "<>Beta")'
      },
      'pivot_analysis': {
        description: 'Crie uma tabela dinâmica para analisar vendas por trimestre e categoria de produto.',
        sample_data: 'Data | Categoria | Vendas\n2024-01-15 | Eletrônicos | 5000\n2024-02-20 | Roupas | 3000\n2024-04-10 | Eletrônicos | 7000',
        expected_approach: 'Usar Tabela Dinâmica com Data agrupada por trimestre nas linhas, Categoria nas colunas, e Soma de Vendas nos valores'
      },
      'conditional_formatting': {
        description: 'Configure formatação condicional para destacar vendas abaixo da meta (5000) em vermelho e acima em verde.',
        sample_data: 'Vendedor | Meta | Realizado\nJoão | 5000 | 4500\nMaria | 5000 | 6200\nPedro | 5000 | 5100',
        expected_approach: 'Formatação condicional na coluna Realizado: <5000 = vermelho, >=5000 = verde'
      }
    };

    const currentChallenge = challenges[challenge_type as keyof typeof challenges];
    
    if (!currentChallenge) {
      throw new Error('Tipo de desafio inválido');
    }

    const prompt = `
    Você é um especialista em Excel/Google Sheets. Analise o desafio apresentado e a resposta do usuário.

    DESAFIO:
    ${currentChallenge.description}

    DADOS DE EXEMPLO:
    ${currentChallenge.sample_data}

    ${user_formula ? `FÓRMULA DO USUÁRIO: ${user_formula}` : ''}
    ${user_approach ? `ABORDAGEM DO USUÁRIO: ${user_approach}` : ''}

    Forneça uma análise completa seguindo EXATAMENTE este formato JSON:

    {
      "challenge_overview": {
        "difficulty": (1-5),
        "main_concepts": ["conceito 1", "conceito 2", "conceito 3"],
        "tools_needed": ["ferramenta 1", "ferramenta 2"]
      },
      "correct_solution": {
        "formula": "${currentChallenge.expected_formula || 'N/A'}",
        "approach": "${currentChallenge.expected_approach || 'Usar fórmulas avançadas'}",
        "step_by_step": [
          "passo 1 detalhado",
          "passo 2 detalhado",
          "passo 3 detalhado"
        ],
        "alternative_methods": ["método alternativo 1", "método alternativo 2"]
      },
      ${user_formula || user_approach ? `"user_evaluation": {
        "accuracy_score": (0-100),
        "correct_elements": ["elemento correto 1", "elemento correto 2"],
        "errors_found": ["erro 1", "erro 2"],
        "efficiency_rating": (1-5),
        "improvements": ["melhoria 1", "melhoria 2"]
      },` : ''}
      "formula_explanation": {
        "function_breakdown": {
          "main_function": "função principal usada",
          "parameters": ["parâmetro 1: explicação", "parâmetro 2: explicação"],
          "logic": "lógica por trás da fórmula"
        },
        "common_mistakes": ["erro comum 1", "erro comum 2"],
        "best_practices": ["prática 1", "prática 2"]
      },
      "practical_tips": [
        "dica prática 1",
        "dica prática 2", 
        "dica prática 3"
      ],
      "next_level_challenges": [
        "desafio mais avançado 1",
        "desafio mais avançado 2"
      ]
    }

    Seja detalhado na explicação das fórmulas e foque em ensinar os conceitos por trás da solução.
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
            content: 'You are an expert in Excel and Google Sheets with deep knowledge of formulas, pivot tables, and data analysis. Always respond with valid JSON following the exact structure requested.' 
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

    // Add challenge info to response
    analysis.challenge_info = currentChallenge;

    // Save simulation session
    if (user_id) {
      const { data: moduleData } = await supabase
        .from('training_modules')
        .select('id')
        .eq('name', 'spreadsheet_arena')
        .single();

      if (moduleData) {
        await supabase
          .from('simulation_sessions')
          .insert({
            user_id,
            module_id: moduleData.id,
            session_type: `spreadsheet_${challenge_type}`,
            input_data: { challenge_type, user_formula, user_approach, challenge_data },
            ai_response: analysis,
            score: analysis.user_evaluation?.accuracy_score || null,
            completed: true
          });
      }
    }

    console.log('Spreadsheet arena completed successfully');

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in spreadsheet-arena function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});