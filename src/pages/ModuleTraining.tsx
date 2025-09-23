import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Upload, FileText, MessageSquare, Presentation, Database, Table, Target, Navigation, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TrainingModule {
  id: string;
  name: string;
  title: string;
  description: string;
  icon: string;
  difficulty_level: number;
  estimated_time_minutes: number;
  points_reward: number;
}

export default function ModuleTraining() {
  const { moduleName } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [module, setModule] = useState<TrainingModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  // Form states for different modules
  const [curriculumText, setCurriculumText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [interviewType, setInterviewType] = useState("behavioral");
  const [communicationScenario, setCommunicationScenario] = useState("email_to_director");
  const [communicationText, setCommunicationText] = useState("");
  const [careerHistory, setCareerHistory] = useState("");
  const [skills, setSkills] = useState("");
  const [longTermGoal, setLongTermGoal] = useState("");
  const [timelineYears, setTimelineYears] = useState(3);
  
  // New states for additional modules
  const [businessProblem, setBusinessProblem] = useState("");
  const [userSolution, setUserSolution] = useState("");
  const [challengeType, setChallengeType] = useState("formula_calculation");
  const [userFormula, setUserFormula] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [strategicObjectives, setStrategicObjectives] = useState("");

  const getIcon = (iconName: string) => {
    const icons = {
      FileText,
      MessageSquare,
      Presentation,
      Database,
      Table,
      Target,
      Navigation
    };
    return icons[iconName as keyof typeof icons] || FileText;
  };

  useEffect(() => {
    const fetchModule = async () => {
      try {
        const { data: moduleData } = await supabase
          .from('training_modules')
          .select('*')
          .eq('name', moduleName)
          .eq('is_active', true)
          .single();

        if (moduleData) {
          setModule(moduleData);
        } else {
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error fetching module:', error);
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (moduleName) {
      fetchModule();
    }
  }, [moduleName, navigate]);

  const handleCurriculumAnalysis = async () => {
    if (!curriculumText) {
      toast({
        title: "Erro",
        description: "Por favor, insira o texto do currículo",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('curriculum-analysis', {
        body: {
          curriculum_text: curriculumText,
          job_description: jobDescription,
          user_id: profile?.user_id
        }
      });

      if (error) throw error;
      
      setResult(data.analysis);
      toast({
        title: "Análise concluída!",
        description: "Seu currículo foi analisado com sucesso.",
      });
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Erro na análise",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCommunicationAnalysis = async () => {
    if (!communicationText) {
      toast({
        title: "Erro",
        description: "Por favor, insira o texto para análise",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('communication-lab', {
        body: {
          scenario: communicationScenario,
          user_text: communicationText,
          user_id: profile?.user_id
        }
      });

      if (error) throw error;
      
      setResult(data.analysis);
      toast({
        title: "Análise concluída!",
        description: "Seu texto foi analisado e melhorado.",
      });
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Erro na análise",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCareerAnalysis = async () => {
    if (!careerHistory || !longTermGoal) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o histórico de carreira e objetivo",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('career-gps', {
        body: {
          career_history: careerHistory,
          skills,
          long_term_goal: longTermGoal,
          timeline_years: timelineYears,
          user_id: profile?.user_id
        }
      });

      if (error) throw error;
      
      setResult(data.analysis);
      toast({
        title: "Análise concluída!",
        description: "Seu plano de carreira foi gerado.",
      });
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Erro na análise",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleERPSimulation = async () => {
    if (!businessProblem) {
      toast({
        title: "Erro",
        description: "Por favor, descreva o problema de negócio",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('erp-simulator', {
        body: {
          business_problem: businessProblem,
          user_solution: userSolution,
          user_id: profile?.user_id
        }
      });

      if (error) throw error;
      
      setResult(data.analysis);
      toast({
        title: "Simulação concluída!",
        description: "Análise de ERP gerada com sucesso.",
      });
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Erro na simulação",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleSpreadsheetChallenge = async () => {
    if (!userFormula) {
      toast({
        title: "Erro",
        description: "Por favor, insira sua fórmula ou abordagem",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('spreadsheet-arena', {
        body: {
          challenge_type: challengeType,
          user_formula: userFormula,
          user_approach: userFormula,
          user_id: profile?.user_id
        }
      });

      if (error) throw error;
      
      setResult(data.analysis);
      toast({
        title: "Desafio concluído!",
        description: "Sua solução foi avaliada.",
      });
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Erro na avaliação",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleBSCCreation = async () => {
    if (!strategicObjectives) {
      toast({
        title: "Erro",
        description: "Por favor, descreva os objetivos estratégicos",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('bsc-strategic', {
        body: {
          company_info: {
            name: companyName || 'Empresa',
            industry: industry || 'Geral'
          },
          strategic_objectives: strategicObjectives,
          user_id: profile?.user_id
        }
      });

      if (error) throw error;
      
      setResult(data.analysis);
      toast({
        title: "BSC criado!",
        description: "Seu Balanced Scorecard foi gerado.",
      });
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Erro na criação",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const renderModuleInterface = () => {
    if (!module) return null;

    switch (module.name) {
      case 'curriculum_analysis':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="curriculum">Texto do Currículo *</Label>
                <Textarea
                  id="curriculum"
                  placeholder="Cole aqui o texto completo do seu currículo..."
                  value={curriculumText}
                  onChange={(e) => setCurriculumText(e.target.value)}
                  rows={8}
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label htmlFor="job-desc">Descrição da Vaga (Opcional)</Label>
                <Textarea
                  id="job-desc"
                  placeholder="Cole a descrição da vaga para análise comparativa..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={4}
                  className="mt-2"
                />
              </div>
            </div>

            <Button 
              onClick={handleCurriculumAnalysis}
              disabled={processing || !curriculumText}
              className="w-full"
              size="lg"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analisando...
                </>
              ) : (
                'Analisar Currículo'
              )}
            </Button>
          </div>
        );

      case 'communication_lab':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="scenario">Cenário</Label>
                <select
                  id="scenario"
                  value={communicationScenario}
                  onChange={(e) => setCommunicationScenario(e.target.value)}
                  className="mt-2 w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="email_to_director">E-mail para diretor pedindo recursos</option>
                  <option value="negative_results_presentation">Apresentar resultados negativos</option>
                  <option value="client_proposal">Proposta para cliente</option>
                  <option value="team_feedback">Feedback para equipe</option>
                  <option value="project_update">Atualização de projeto</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="text">Seu Texto *</Label>
                <Textarea
                  id="text"
                  placeholder="Escreva aqui o texto que deseja analisar e melhorar..."
                  value={communicationText}
                  onChange={(e) => setCommunicationText(e.target.value)}
                  rows={8}
                  className="mt-2"
                />
              </div>
            </div>

            <Button 
              onClick={handleCommunicationAnalysis}
              disabled={processing || !communicationText}
              className="w-full"
              size="lg"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analisando...
                </>
              ) : (
                'Analisar Comunicação'
              )}
            </Button>
          </div>
        );

      case 'career_gps':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="career-history">Histórico de Carreira *</Label>
                <Textarea
                  id="career-history"
                  placeholder="Descreva sua trajetória profissional: cargos, empresas, principais conquistas..."
                  value={careerHistory}
                  onChange={(e) => setCareerHistory(e.target.value)}
                  rows={6}
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label htmlFor="skills">Competências Atuais</Label>
                <Textarea
                  id="skills"
                  placeholder="Liste suas principais competências técnicas e comportamentais..."
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  rows={4}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="goal">Objetivo de Longo Prazo *</Label>
                <Input
                  id="goal"
                  placeholder="Ex: Tornar-me Gerente de Estratégia"
                  value={longTermGoal}
                  onChange={(e) => setLongTermGoal(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="timeline">Prazo (anos)</Label>
                <Input
                  id="timeline"
                  type="number"
                  min="1"
                  max="10"
                  value={timelineYears}
                  onChange={(e) => setTimelineYears(parseInt(e.target.value))}
                  className="mt-2"
                />
              </div>
            </div>

            <Button 
              onClick={handleCareerAnalysis}
              disabled={processing || !careerHistory || !longTermGoal}
              className="w-full"
              size="lg"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analisando...
                </>
              ) : (
                'Gerar Plano de Carreira'
              )}
            </Button>
          </div>
        );

      case 'erp_simulator':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-blue-900 mb-2">Cenário de Negócio</h4>
              <p className="text-blue-800 text-sm">
                Você é um analista e precisa extrair informações de um ERP para resolver problemas de negócio.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="business-problem">Problema de Negócio *</Label>
                <Textarea
                  id="business-problem"
                  placeholder="Ex: Preciso gerar um relatório de vendas do último trimestre por região, excluindo devoluções..."
                  value={businessProblem}
                  onChange={(e) => setBusinessProblem(e.target.value)}
                  rows={6}
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label htmlFor="user-solution">Sua Abordagem (Opcional)</Label>
                <Textarea
                  id="user-solution"
                  placeholder="Descreva como você resolveria este problema no ERP..."
                  value={userSolution}
                  onChange={(e) => setUserSolution(e.target.value)}
                  rows={4}
                  className="mt-2"
                />
              </div>
            </div>

            <Button 
              onClick={handleERPSimulation}
              disabled={processing || !businessProblem}
              className="w-full"
              size="lg"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analisando...
                </>
              ) : (
                'Simular ERP'
              )}
            </Button>
          </div>
        );

      case 'spreadsheet_arena':
        return (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-green-900 mb-2">Arena de Desafios</h4>
              <p className="text-green-800 text-sm">
                Escolha um desafio e mostre suas habilidades em planilhas!
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="challenge-type">Tipo de Desafio</Label>
                <select
                  id="challenge-type"
                  value={challengeType}
                  onChange={(e) => setChallengeType(e.target.value)}
                  className="mt-2 w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="formula_calculation">Cálculo com Fórmulas</option>
                  <option value="pivot_analysis">Análise com Tabela Dinâmica</option>
                  <option value="conditional_formatting">Formatação Condicional</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="user-formula">Sua Fórmula/Abordagem *</Label>
                <Textarea
                  id="user-formula"
                  placeholder="Ex: =AVERAGEIFS(C:C, A:A, 'Norte', B:B, '<>Beta') ou descreva sua abordagem..."
                  value={userFormula}
                  onChange={(e) => setUserFormula(e.target.value)}
                  rows={4}
                  className="mt-2"
                />
              </div>
            </div>

            <Button 
              onClick={handleSpreadsheetChallenge}
              disabled={processing || !userFormula}
              className="w-full"
              size="lg"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analisando...
                </>
              ) : (
                'Avaliar Solução'
              )}
            </Button>
          </div>
        );

      case 'bsc_strategic':
        return (
          <div className="space-y-6">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-purple-900 mb-2">Balanced Scorecard</h4>
              <p className="text-purple-800 text-sm">
                Vamos criar um BSC completo para sua empresa com as 4 perspectivas estratégicas.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="company-name">Nome da Empresa</Label>
                <Input
                  id="company-name"
                  placeholder="Ex: TechCorp Soluções"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="industry">Setor de Atuação</Label>
                <Input
                  id="industry"
                  placeholder="Ex: Tecnologia, Varejo, Consultoria..."
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label htmlFor="strategic-objectives">Objetivos Estratégicos *</Label>
                <Textarea
                  id="strategic-objectives"
                  placeholder="Descreva os principais objetivos estratégicos da empresa: crescimento, rentabilidade, satisfação do cliente, inovação..."
                  value={strategicObjectives}
                  onChange={(e) => setStrategicObjectives(e.target.value)}
                  rows={6}
                  className="mt-2"
                />
              </div>
            </div>

            <Button 
              onClick={handleBSCCreation}
              disabled={processing || !strategicObjectives}
              className="w-full"
              size="lg"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando BSC...
                </>
              ) : (
                'Gerar Balanced Scorecard'
              )}
            </Button>
          </div>
        );
    }
  };

  const renderResults = () => {
    if (!result) return null;

    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Resultado da Análise</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="details">Detalhes</TabsTrigger>
              <TabsTrigger value="actions">Próximos Passos</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              {module?.name === 'curriculum_analysis' && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl font-bold text-primary">{result.overall_score}/100</span>
                    <Badge className="bg-blue-100 text-blue-800">Score Geral</Badge>
                  </div>
                  <p className="text-gray-700">{result.summary}</p>
                </div>
              )}
              
              {module?.name === 'communication_lab' && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl font-bold text-primary">{result.overall_score}/100</span>
                    <Badge className="bg-green-100 text-green-800">Score de Comunicação</Badge>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Versão Melhorada:</h4>
                    <p className="text-gray-700 whitespace-pre-line">{result.improved_version}</p>
                  </div>
                </div>
              )}
              
              {module?.name === 'career_gps' && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl font-bold text-primary">{result.success_probability}/100</span>
                    <Badge className="bg-purple-100 text-purple-800">Probabilidade de Sucesso</Badge>
                  </div>
                  <p className="text-gray-700">{result.action_plan?.long_term_strategy}</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="details" className="space-y-4">
              <div className="space-y-4">
                {JSON.stringify(result, null, 2).split('\n').slice(0, 20).map((line, index) => (
                  <p key={index} className="text-sm font-mono text-gray-600">{line}</p>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="actions" className="space-y-4">
              <div className="space-y-3">
                {result.improvement_suggestions?.map((suggestion: string, index: number) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm">
                      {index + 1}
                    </span>
                    <p className="text-gray-700">{suggestion}</p>
                  </div>
                )) || result.key_recommendations?.map((rec: string, index: number) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm">
                      {index + 1}
                    </span>
                    <p className="text-gray-700">{rec}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 ml-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 ml-64 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Módulo não encontrado</h2>
            <Button onClick={() => navigate('/dashboard')}>
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const IconComponent = getIcon(module.icon);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 ml-64 overflow-y-auto">
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
              <IconComponent className="h-12 w-12 text-primary" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{module.title}</h1>
                <p className="text-gray-600">{module.description}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Badge className="bg-blue-100 text-blue-800">
                Nível {module.difficulty_level}
              </Badge>
              <Badge variant="outline">
                {module.estimated_time_minutes} min
              </Badge>
              <Badge className="bg-yellow-100 text-yellow-800">
                {module.points_reward} pontos
              </Badge>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Simulação Interativa</CardTitle>
              <CardDescription>
                Complete os campos abaixo para iniciar sua simulação com IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderModuleInterface()}
            </CardContent>
          </Card>

          {renderResults()}
        </div>
      </main>
    </div>
  );
}