import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Search, Send, Loader2, Brain, Target, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function CommunicationLab() {
  const [situationText, setSituationText] = useState("");
  const [messageText, setMessageText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("analyze");
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    document.title = "Laboratório de Comunicação - BussulaC";
  }, []);

  const analyzeSituation = async () => {
    if (!situationText.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, descreva a situação que deseja analisar.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('communication-lab', {
        body: {
          scenario: 'situation_analysis',
          user_text: situationText.trim(),
          user_id: user?.id
        }
      });

      if (error) {
        const message = (data as any)?.error || error.message || 'Erro na análise';
        throw new Error(message);
      }

      setAnalysisResult(data);
      toast({
        title: "Análise concluída!",
        description: "Sua situação foi analisada pelo estrategista de comunicação.",
      });
    } catch (error: any) {
      console.error('Erro na análise:', error);
      toast({
        title: "Erro na análise",
        description: error?.message || "Alta demanda no momento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeMessage = async () => {
    if (!messageText.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, escreva a mensagem que deseja testar.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('communication-lab', {
        body: {
          scenario: 'message_analysis',
          user_text: messageText.trim(),
          user_id: user?.id
        }
      });

      if (error) {
        const message = (data as any)?.error || error.message || 'Erro na análise';
        throw new Error(message);
      }

      setAnalysisResult(data);
      toast({
        title: "Análise concluída!",
        description: "Sua mensagem foi analisada pelo estrategista de comunicação.",
      });
    } catch (error: any) {
      console.error('Erro na análise:', error);
      toast({
        title: "Erro na análise",
        description: error?.message || "Alta demanda no momento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetAnalysis = () => {
    setAnalysisResult(null);
    setSituationText("");
    setMessageText("");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 lg:ml-64 overflow-y-auto pt-16 lg:pt-8">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <Card className="mb-6 border-l-4 border-l-primary">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Laboratório de Comunicação</CardTitle>
                  <CardDescription className="text-lg mt-1">
                    Ter um estrategista de comunicação de plantão para analisar suas interações e preparar mensagens de alto impacto.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          {!analysisResult ? (
            <Card>
              <CardContent className="p-6">
                <Tabs defaultValue="analyze" onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="analyze" className="flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Analisar uma Situação
                    </TabsTrigger>
                    <TabsTrigger value="test" className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Testar minha Mensagem
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="analyze">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Descreva a Situação</h3>
                        <p className="text-muted-foreground mb-4">
                          Cole aqui a situação que deseja analisar: um e-mail recebido, feedback do gestor, mensagem de um colega, etc.
                        </p>
                        <Textarea
                          placeholder="Exemplo: 'Recebi este e-mail do meu gestor: Preciso falar com você sobre o projeto X. Podemos conversar amanhã?' - O que isso realmente significa?"
                          value={situationText}
                          onChange={(e) => setSituationText(e.target.value)}
                          className="min-h-[200px] resize-none"
                        />
                      </div>

                      <Button
                        onClick={analyzeSituation}
                        disabled={isLoading || !situationText.trim()}
                        className="w-full"
                        size="lg"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Analisando situação...
                          </>
                        ) : (
                          <>
                            <Brain className="mr-2 h-5 w-5" />
                            Analisar Situação
                          </>
                        )}
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="test">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Sua Mensagem</h3>
                        <p className="text-muted-foreground mb-4">
                          Escreva aqui a mensagem que deseja testar: e-mail, apresentação, resposta, etc.
                        </p>
                        <Textarea
                          placeholder="Digite aqui a mensagem que deseja testar. Pode ser um e-mail para o gestor, uma apresentação, uma resposta a um feedback, etc."
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          className="min-h-[200px] resize-none"
                        />
                      </div>

                      <Button
                        onClick={analyzeMessage}
                        disabled={isLoading || !messageText.trim()}
                        className="w-full"
                        size="lg"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Analisando mensagem...
                          </>
                        ) : (
                          <>
                            <Target className="mr-2 h-5 w-5" />
                            Analisar Mensagem
                          </>
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Analysis Result */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    Análise do Consigliere Corporativo
                  </CardTitle>
                  <CardDescription>
                    {activeTab === "analyze" ? "Análise da situação apresentada" : "Feedback sobre sua mensagem"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {analysisResult.reality_translation && (
                    <div className="p-4 bg-blue-50 border-l-4 border-l-blue-500 rounded-r-lg">
                      <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        Tradução da Realidade
                      </h4>
                      <p className="text-blue-800">{analysisResult.reality_translation}</p>
                    </div>
                  )}

                  {analysisResult.risk_opportunity_analysis && (
                    <div className="p-4 bg-amber-50 border-l-4 border-l-amber-500 rounded-r-lg">
                      <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Análise de Risco/Oportunidade
                      </h4>
                      <p className="text-amber-800">{analysisResult.risk_opportunity_analysis}</p>
                    </div>
                  )}

                  {analysisResult.strategic_response && (
                    <div className="p-4 bg-green-50 border-l-4 border-l-green-500 rounded-r-lg">
                      <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Sugestão de Resposta Estratégica
                      </h4>
                      <p className="text-green-800 whitespace-pre-wrap">{analysisResult.strategic_response}</p>
                    </div>
                  )}

                  {analysisResult.clarity_score && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{analysisResult.clarity_score}%</div>
                        <p className="text-sm text-muted-foreground">Clareza</p>
                      </div>
                      {analysisResult.tone_score && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">{analysisResult.tone_score}%</div>
                          <p className="text-sm text-muted-foreground">Tom</p>
                        </div>
                      )}
                      {analysisResult.persuasion_score && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">{analysisResult.persuasion_score}%</div>
                          <p className="text-sm text-muted-foreground">Persuasão</p>
                        </div>
                      )}
                      {analysisResult.overall_score && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">{analysisResult.overall_score}%</div>
                          <p className="text-sm text-muted-foreground">Geral</p>
                        </div>
                      )}
                    </div>
                  )}

                  {analysisResult.optimization_suggestions && (
                    <div className="p-4 bg-purple-50 border-l-4 border-l-purple-500 rounded-r-lg">
                      <h4 className="font-semibold text-purple-900 mb-2">💡 Sugestões de Otimização</h4>
                      <div className="text-purple-800 whitespace-pre-wrap">
                        {analysisResult.optimization_suggestions}
                      </div>
                    </div>
                  )}

                  {analysisResult.power_principles && analysisResult.power_principles.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">📚 Princípios Aplicados</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.power_principles.map((principle: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {principle}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="lg:col-span-2 text-center">
                <Button onClick={resetAnalysis} variant="outline" size="lg">
                  Nova Análise
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}