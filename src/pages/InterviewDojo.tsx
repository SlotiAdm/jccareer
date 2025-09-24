import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, MessageSquare, Send, Bot, User, Clock, Target, Star } from "lucide-react";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  role: 'interviewer' | 'candidate';
  message: string;
  timestamp: Date;
}

interface InterviewFeedback {
  overall_score: number;
  strengths: string[];
  improvements: string[];
  star_method_usage: number;
  clarity_score: number;
}

export default function InterviewDojo() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [interviewType, setInterviewType] = useState<'behavioral' | 'technical' | 'case_study'>('behavioral');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [interviewEnded, setInterviewEnded] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const startInterview = async () => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('interview-dojo', {
        body: {
          action: 'start_interview',
          interview_type: interviewType,
          user_id: profile?.user_id
        }
      });

      if (error) {
        const message = (data as any)?.error || error.message || 'Erro ao iniciar entrevista';
        throw new Error(message);
      }

      setSessionId(data.session_id);
      setInterviewStarted(true);
      setQuestionCount(1);
      
      setChatMessages([{
        role: 'interviewer',
        message: data.interviewer_message,
        timestamp: new Date()
      }]);

      toast({
        title: "Entrevista iniciada!",
        description: "Responda com naturalidade e seja específico.",
      });
      } catch (error: any) {
        console.error('Error:', error);
        toast({
          title: "Erro ao iniciar entrevista",
          description: error?.message || "Alta demanda no momento. Tente novamente em instantes.",
          variant: "destructive",
        });
    } finally {
      setIsProcessing(false);
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || isProcessing || !sessionId) return;

    const userMessage = currentMessage;
    setCurrentMessage("");
    
    // Add user message to chat
    setChatMessages(prev => [...prev, {
      role: 'candidate',
      message: userMessage,
      timestamp: new Date()
    }]);

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('interview-dojo', {
        body: {
          action: 'continue_interview',
          session_id: sessionId,
          user_answer: userMessage,
          user_id: profile?.user_id
        }
      });

      if (error) {
        const message = (data as any)?.error || error.message || 'Erro ao enviar resposta';
        throw new Error(message);
      }

      // Add interviewer response
      setChatMessages(prev => [...prev, {
        role: 'interviewer',
        message: data.interviewer_message,
        timestamp: new Date()
      }]);

      setQuestionCount(data.question_number);

      // Check if interview ended
      if (data.interview_stage === 'closing') {
        setInterviewEnded(true);
        setFeedback(data.feedback);
        toast({
          title: "Entrevista concluída!",
          description: "Confira seu feedback detalhado abaixo.",
        });
      }

    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Erro no envio",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetInterview = () => {
    setInterviewStarted(false);
    setInterviewEnded(false);
    setChatMessages([]);
    setFeedback(null);
    setSessionId(null);
    setQuestionCount(0);
  };

  const getInterviewTypeInfo = () => {
    const types = {
      behavioral: {
        title: "Entrevista Comportamental",
        description: "Focada em experiências passadas usando metodologia STAR",
        icon: "🧠",
        color: "bg-blue-500"
      },
      technical: {
        title: "Entrevista Técnica", 
        description: "Avalia conhecimentos específicos e habilidades técnicas",
        icon: "⚙️",
        color: "bg-green-500"
      },
      case_study: {
        title: "Estudo de Caso",
        description: "Apresenta problemas de negócio para análise estruturada",
        icon: "📊",
        color: "bg-purple-500"
      }
    };
    return types[interviewType];
  };

  if (!interviewStarted) {
    const typeInfo = getInterviewTypeInfo();
    
    return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 lg:ml-64 overflow-y-auto pt-16 lg:pt-8">
          <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-6">
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Dashboard
              </Button>
              
              <div className="flex items-center gap-4 mb-4">
                <MessageSquare className="h-12 w-12 text-primary" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Dojo de Entrevistas</h1>
                  <p className="text-gray-600">Treine para entrevistas em um ambiente seguro</p>
                </div>
              </div>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Escolha o Tipo de Entrevista</CardTitle>
                <CardDescription>
                  Selecione o formato que você quer praticar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  {(['behavioral', 'technical', 'case_study'] as const).map((type) => {
                    const info = {
                      behavioral: { title: "Comportamental", desc: "Experiências passadas", icon: "🧠" },
                      technical: { title: "Técnica", desc: "Conhecimentos específicos", icon: "⚙️" },
                      case_study: { title: "Estudo de Caso", desc: "Análise de problemas", icon: "📊" }
                    };
                    
                    return (
                      <div
                        key={type}
                        onClick={() => setInterviewType(type)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          interviewType === type 
                            ? 'border-primary bg-primary/5 shadow-md' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-2">{info[type].icon}</div>
                          <h3 className="font-semibold text-gray-900">{info[type].title}</h3>
                          <p className="text-sm text-gray-600">{info[type].desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-2xl">{typeInfo.icon}</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{typeInfo.title}</h3>
                      <p className="text-sm text-gray-600">{typeInfo.description}</p>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>15-20 minutos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      <span>3-4 perguntas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-primary" />
                      <span>Feedback detalhado</span>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={startInterview}
                  disabled={isProcessing}
                  className="w-full"
                  size="lg"
                >
                  {isProcessing ? "Preparando..." : "Iniciar Entrevista"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 lg:ml-64 flex flex-col pt-16 lg:pt-0">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                size="sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <span className="font-semibold">{getInterviewTypeInfo().title}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {!interviewEnded && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Pergunta {questionCount}/4</span>
                  <Progress value={(questionCount / 4) * 100} className="w-20 h-2" />
                </div>
              )}
              
              <Button
                onClick={resetInterview}
                variant="outline"
                size="sm"
              >
                Nova Entrevista
              </Button>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatMessages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-3 ${msg.role === 'candidate' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'interviewer' ? 'bg-primary text-white' : 'bg-gray-200'
              }`}>
                {msg.role === 'interviewer' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>
              
              <div className={`flex-1 max-w-2xl ${msg.role === 'candidate' ? 'text-right' : ''}`}>
                <div className={`inline-block p-3 rounded-lg ${
                  msg.role === 'interviewer' 
                    ? 'bg-white border border-gray-200' 
                    : 'bg-primary text-white'
                }`}>
                  <p className="whitespace-pre-line">{msg.message}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {msg.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          
          {isProcessing && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Feedback Section */}
        {feedback && (
          <div className="p-4 bg-white border-t border-gray-200">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Feedback da Entrevista
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-1">
                      {feedback.overall_score}/100
                    </div>
                    <p className="text-sm text-gray-600">Score Geral</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-1">
                      {feedback.star_method_usage}/100
                    </div>
                    <p className="text-sm text-gray-600">Método STAR</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-1">
                      {feedback.clarity_score}/100
                    </div>
                    <p className="text-sm text-gray-600">Clareza</p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <h4 className="font-semibold text-green-700 mb-2">✅ Pontos Fortes</h4>
                    <ul className="space-y-1">
                      {feedback.strengths.map((strength, index) => (
                        <li key={index} className="text-sm text-gray-700">• {strength}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-orange-700 mb-2">🎯 Oportunidades</h4>
                    <ul className="space-y-1">
                      {feedback.improvements.map((improvement, index) => (
                        <li key={index} className="text-sm text-gray-700">• {improvement}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Input Area */}
        {!interviewEnded && (
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex gap-2">
              <div className="flex-1">
                <Textarea
                  placeholder="Digite sua resposta aqui... (Enter para enviar, Shift+Enter para nova linha)"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isProcessing}
                  rows={2}
                  className="resize-none"
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <Button
                  onClick={sendMessage}
                  disabled={!currentMessage.trim() || isProcessing}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
                
                <VoiceRecorder
                  onTranscription={(text) => setCurrentMessage(prev => prev + (prev ? ' ' : '') + text)}
                  disabled={isProcessing}
                />
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
              <span>💡 Dica: Use o método STAR (Situação, Tarefa, Ação, Resultado)</span>
              <span>{currentMessage.length}/500</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}