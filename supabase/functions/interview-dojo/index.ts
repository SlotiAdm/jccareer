import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InterviewRequest {
  action: 'start_interview' | 'continue_interview';
  interview_type: 'behavioral' | 'technical' | 'case_study';
  user_answer?: string;
  session_id?: string;
  experience_level?: string;
  target_role?: string;
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
        p_module_name: 'interview_dojo',
        p_limit_per_hour: 15
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

    const requestData: InterviewRequest = await req.json();
    console.log('Interview dojo action:', requestData.action, 'Type:', requestData.interview_type);

    // Input validation
    if (!requestData.action || !['start_interview', 'continue_interview'].includes(requestData.action)) {
      return new Response(JSON.stringify({ 
        error: 'Ação inválida' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (requestData.action === 'start_interview') {
      return await startInterview(requestData, openAIApiKey, supabase, user.id);
    } else if (requestData.action === 'continue_interview') {
      return await continueInterview(requestData, openAIApiKey, supabase, user.id);
    }

    return new Response(JSON.stringify({ error: 'Ação não implementada' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in interview-dojo function:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro interno do servidor. Tente novamente.' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function startInterview(request: InterviewRequest, apiKey: string, supabase: any, userId: string) {
  const interviewTypes = {
    behavioral: 'entrevista comportamental focada em experiências passadas usando método STAR',
    technical: 'entrevista técnica para avaliar conhecimentos e habilidades específicas',
    case_study: 'estudo de caso para avaliar capacidade analítica e resolução de problemas'
  };

  const levelDescriptions = {
    junior: 'nível júnior (0-2 anos de experiência)',
    pleno: 'nível pleno (3-5 anos de experiência)', 
    senior: 'nível senior (6+ anos de experiência)'
  };

  const systemPrompt = `Você é um recrutador experiente e rigoroso conduzindo uma entrevista de emprego em português brasileiro. Faça perguntas relevantes, específicas e progressivamente mais desafiadoras. Seja profissional, mas humano.`;

  const prompt = `
CONTEXTO DA ENTREVISTA:
- Tipo: ${interviewTypes[request.interview_type as keyof typeof interviewTypes]}
- Nível do candidato: ${levelDescriptions[request.experience_level as keyof typeof levelDescriptions] || 'não especificado'}
${request.target_role ? `- Cargo desejado: ${request.target_role}` : ''}

Inicie a entrevista de forma profissional e natural. Faça UMA pergunta por vez, específica para o contexto.

Para entrevista comportamental: foque em situações passadas usando método STAR (Situação, Tarefa, Ação, Resultado)
Para entrevista técnica: faça perguntas sobre conhecimentos e habilidades específicas do nível
Para estudo de caso: apresente um problema de negócio realista para análise

Seja cordial mas profissional. Ajuste a dificuldade ao nível de experiência informado.

Responda em JSON:
{
  "interviewer_message": "sua pergunta/comentário aqui",
  "question_number": 1,
  "interview_stage": "opening"
}
`;

  console.log('Starting interview with OpenAI...');
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: 600,
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('OpenAI API error:', response.status, errorData);
    
    if (response.status === 429) {
      throw new Error('Muitas requisições. Tente novamente em alguns minutos.');
    }
    throw new Error(`Erro da API OpenAI: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Resposta inválida da API OpenAI');
  }

  let result;
  try {
    result = JSON.parse(data.choices[0].message.content);
  } catch (parseError) {
    console.error('Error parsing OpenAI response:', data.choices[0].message.content);
    throw new Error('Resposta da IA inválida');
  }

  // Create new session
  const { data: moduleData } = await supabase
    .from('training_modules')
    .select('id')
    .eq('name', 'interview_dojo')
    .single();

  let sessionId = null;
  if (moduleData) {
    const { data: sessionData } = await supabase
      .from('simulation_sessions')
      .insert({
        user_id: userId,
        module_id: moduleData.id,
        session_type: `interview_${request.interview_type}`,
        input_data: { 
          interview_type: request.interview_type, 
          experience_level: request.experience_level, 
          target_role: request.target_role,
          questions: [result.interviewer_message], 
          answers: [] 
        },
        completed: false
      })
      .select('id')
      .single();
    
    sessionId = sessionData?.id;
  }

  // Log API usage
  await supabase.rpc('log_api_usage', {
    p_user_id: userId,
    p_module_name: 'interview_dojo',
    p_function_name: 'start_interview',
    p_input_tokens: data.usage?.prompt_tokens || 0,
    p_output_tokens: data.usage?.completion_tokens || 0,
    p_cost_estimate: ((data.usage?.prompt_tokens || 0) * 0.00015 + (data.usage?.completion_tokens || 0) * 0.0002) / 1000
  });

  return new Response(JSON.stringify({ 
    ...result, 
    session_id: sessionId,
    interview_type: request.interview_type 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function continueInterview(request: InterviewRequest, apiKey: string, supabase: any, userId: string) {
  if (!request.session_id || !request.user_answer) {
    throw new Error('Session ID e resposta são obrigatórios');
  }

  if (request.user_answer.trim().length < 10) {
    return new Response(JSON.stringify({ 
      error: 'Resposta muito curta. Mínimo 10 caracteres.' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (request.user_answer.length > 2000) {
    return new Response(JSON.stringify({ 
      error: 'Resposta muito longa. Máximo 2000 caracteres.' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Get session data
  const { data: sessionData } = await supabase
    .from('simulation_sessions')
    .select('input_data, ai_response')
    .eq('id', request.session_id)
    .single();

  if (!sessionData) {
    throw new Error('Sessão não encontrada');
  }

  const currentData = sessionData?.input_data || { questions: [], answers: [] };
  const questionCount = currentData.questions?.length || 0;

  let prompt;
  if (questionCount < 3) {
    // Continue with more questions
    prompt = `
Contexto: Você está conduzindo uma entrevista em português brasileiro. 

Pergunta anterior: ${currentData.questions?.[currentData.questions.length - 1] || 'Pergunta inicial'}
Resposta do candidato: ${request.user_answer}

Analise brevemente a resposta e faça a próxima pergunta relevante para o tipo de entrevista.

Responda em JSON:
{
  "interviewer_message": "seu comentário e próxima pergunta",
  "question_number": ${questionCount + 1},
  "interview_stage": "ongoing"
}
`;
  } else {
    // End interview and provide feedback
    prompt = `
Contexto: Esta é uma simulação de entrevista que está terminando.

Histórico das perguntas e respostas:
${currentData.questions?.map((q: string, i: number) => 
  `P${i+1}: ${q}\nR${i+1}: ${currentData.answers?.[i] || ''}`
).join('\n\n')}

Última resposta: ${request.user_answer}

Forneça um feedback final detalhado sobre o desempenho do candidato em português brasileiro.

Responda em JSON:
{
  "interviewer_message": "feedback final detalhado",
  "question_number": ${questionCount + 1},
  "interview_stage": "closing",
  "feedback": {
    "overall_score": (0-100),
    "strengths": ["ponto forte 1", "ponto forte 2"],
    "improvements": ["melhoria 1", "melhoria 2"],
    "star_method_usage": (0-100),
    "clarity_score": (0-100)
  }
}
`;
  }

  console.log('Continuing interview with OpenAI...');
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a professional interviewer providing constructive feedback in Portuguese. Always respond with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 800,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('OpenAI API error:', response.status, errorData);
    
    if (response.status === 429) {
      throw new Error('Muitas requisições. Tente novamente em alguns minutos.');
    }
    throw new Error(`Erro da API OpenAI: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Resposta inválida da API OpenAI');
  }

  let result;
  try {
    result = JSON.parse(data.choices[0].message.content);
  } catch (parseError) {
    console.error('Error parsing OpenAI response:', data.choices[0].message.content);
    throw new Error('Resposta da IA inválida');
  }

  // Update session data
  const updatedQuestions = [...(currentData.questions || [])];
  const updatedAnswers = [...(currentData.answers || []), request.user_answer];
  
  if (result.interview_stage !== 'closing') {
    updatedQuestions.push(result.interviewer_message);
  }

  const updateData = {
    input_data: {
      ...currentData,
      questions: updatedQuestions,
      answers: updatedAnswers
    },
    ai_response: result,
    completed: result.interview_stage === 'closing',
    score: result.feedback?.overall_score || null
  };

  await supabase
    .from('simulation_sessions')
    .update(updateData)
    .eq('id', request.session_id);

  // Log API usage
  await supabase.rpc('log_api_usage', {
    p_user_id: userId,
    p_module_name: 'interview_dojo',
    p_function_name: 'continue_interview',
    p_input_tokens: data.usage?.prompt_tokens || 0,
    p_output_tokens: data.usage?.completion_tokens || 0,
    p_cost_estimate: ((data.usage?.prompt_tokens || 0) * 0.00015 + (data.usage?.completion_tokens || 0) * 0.0002) / 1000
  });

  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}