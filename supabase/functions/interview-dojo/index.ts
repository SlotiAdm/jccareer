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
    const { action, interview_type, user_answer, session_id, user_id } = await req.json();
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Interview dojo action:', action, 'Type:', interview_type);

    if (action === 'start_interview') {
      // Start new interview session
      const interviewTypes = {
        behavioral: 'entrevista comportamental focada em experiências passadas',
        technical: 'entrevista técnica para avaliar conhecimentos específicos',
        case_study: 'estudo de caso para avaliar capacidade analítica'
      };

      const prompt = `
      Você é um recrutador experiente conduzindo uma ${interviewTypes[interview_type as keyof typeof interviewTypes]}. 

      Inicie a entrevista de forma profissional e natural. Faça UMA pergunta por vez, específica para o tipo de entrevista escolhido.

      Para entrevista comportamental: foque em situações passadas usando método STAR
      Para entrevista técnica: faça perguntas sobre conhecimentos e habilidades específicas
      Para estudo de caso: apresente um problema de negócio para análise

      Seja cordial mas profissional. Não faça mais de uma pergunta por resposta.
      
      Responda em JSON:
      {
        "interviewer_message": "sua pergunta/comentário aqui",
        "question_number": 1,
        "interview_stage": "opening"
      }
      `;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
          messages: [
            { role: 'system', content: 'You are a professional interviewer. Always respond with valid JSON.' },
            { role: 'user', content: prompt }
          ],
        max_completion_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Resposta inválida da API OpenAI');
      }

      const result = JSON.parse(data.choices[0].message.content);

      // Create new session
      const { data: moduleData } = await supabase
        .from('training_modules')
        .select('id')
        .eq('name', 'interview_dojo')
        .single();

      let sessionId = null;
      if (moduleData && user_id) {
        const { data: sessionData } = await supabase
          .from('simulation_sessions')
          .insert({
            user_id,
            module_id: moduleData.id,
            session_type: `interview_${interview_type}`,
            input_data: { interview_type, questions: [], answers: [] },
            completed: false
          })
          .select('id')
          .single();
        
        sessionId = sessionData?.id;
      }

      return new Response(JSON.stringify({ 
        ...result, 
        session_id: sessionId,
        interview_type 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'continue_interview') {
      // Continue existing interview
      if (!session_id || !user_answer) {
        throw new Error('Session ID e resposta são obrigatórios');
      }

      // Get session data
      const { data: sessionData } = await supabase
        .from('simulation_sessions')
        .select('input_data, ai_response')
        .eq('id', session_id)
        .single();

      const currentData = sessionData?.input_data || { questions: [], answers: [] };
      const questionCount = currentData.questions?.length || 0;

      let prompt;
      if (questionCount < 3) {
        // Continue with more questions
        prompt = `
        Contexto: Você está conduzindo uma entrevista. 
        
        Pergunta anterior: ${currentData.questions?.[currentData.questions.length - 1] || 'Pergunta inicial'}
        Resposta do candidato: ${user_answer}

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
        
        Última resposta: ${user_answer}

        Forneça um feedback final detalhado sobre o desempenho do candidato.
        
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

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5-mini-2025-08-07',
          messages: [
            { role: 'system', content: 'You are a professional interviewer providing constructive feedback. Always respond with valid JSON.' },
            { role: 'user', content: prompt }
          ],
          max_completion_tokens: 600,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Resposta inválida da API OpenAI');
      }

      const result = JSON.parse(data.choices[0].message.content);

      // Update session data
      const updatedQuestions = [...(currentData.questions || [])];
      const updatedAnswers = [...(currentData.answers || []), user_answer];
      
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
        .eq('id', session_id);

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Ação inválida');

  } catch (error) {
    console.error('Error in interview-dojo function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});