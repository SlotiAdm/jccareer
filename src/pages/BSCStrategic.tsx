import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { DollarSign, Users, Settings, BookOpen, ArrowRight, Target, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface BSCData {
  financial: {
    objectives: string[];
    goals: string[];
  };
  customers: {
    clients: string[];
    value_delivery: string[];
  };
  processes: {
    skills: string[];
    habits: string[];
  };
  learning: {
    courses: string[];
    books: string[];
    mentorships: string[];
  };
}

export default function BSCStrategic() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [bscData, setBscData] = useState<BSCData>({
    financial: { objectives: [], goals: [] },
    customers: { clients: [], value_delivery: [] },
    processes: { skills: [], habits: [] },
    learning: { courses: [], books: [], mentorships: [] }
  });
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Form states
  const [financialInput, setFinancialInput] = useState("");
  const [clientsInput, setClientsInput] = useState("");
  const [valueInput, setValueInput] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [habitsInput, setHabitsInput] = useState("");
  const [coursesInput, setCoursesInput] = useState("");
  const [booksInput, setBooksInput] = useState("");
  const [mentorshipsInput, setMentorshipsInput] = useState("");

  useEffect(() => {
    document.title = "BSC Estratégico de Carreira - BussulaC";
  }, []);

  const addToList = (category: keyof BSCData, subcategory: string, value: string, setter: Function) => {
    if (value.trim()) {
      setBscData(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          [subcategory]: [...(prev[category] as any)[subcategory], value.trim()]
        }
      }));
      setter("");
    }
  };

  const removeFromList = (category: keyof BSCData, subcategory: string, index: number) => {
    setBscData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [subcategory]: (prev[category] as any)[subcategory].filter((_: any, i: number) => i !== index)
      }
    }));
  };

  const generateBSC = async () => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('bsc-strategic', {
        body: {
          company_info: `Perfil Pessoal de Carreira - Usuario: ${user?.email}`,
          strategic_objectives: {
            financial: bscData.financial,
            customers: bscData.customers,
            processes: bscData.processes,
            learning: bscData.learning
          },
          user_id: user?.id
        }
      });

      if (error) {
        const message = (data as any)?.error || error.message || 'Erro ao gerar BSC';
        throw new Error(message);
      }

      setResult(data);
      
      // Salvar no perfil de carreira
      await supabase
        .from('career_profiles')
        .update({
          bsc_financial: bscData.financial,
          bsc_customers: bscData.customers,
          bsc_processes: bscData.processes,
          bsc_learning: bscData.learning
        })
        .eq('user_id', user?.id);

      toast({
        title: "BSC gerado com sucesso!",
        description: "Seu Balanced Scorecard de carreira foi criado.",
      });
    } catch (error) {
      console.error('Erro ao gerar BSC:', error);
      toast({
        title: "Erro ao gerar BSC",
        description: "Não foi possível gerar seu BSC. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return bscData.financial.objectives.length > 0 || bscData.financial.goals.length > 0;
      case 2:
        return bscData.customers.clients.length > 0 || bscData.customers.value_delivery.length > 0;
      case 3:
        return bscData.processes.skills.length > 0 || bscData.processes.habits.length > 0;
      case 4:
        return bscData.learning.courses.length > 0 || bscData.learning.books.length > 0 || bscData.learning.mentorships.length > 0;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                1. Perspectiva Financeira
              </CardTitle>
              <CardDescription>
                Quais são seus objetivos financeiros e de patrimônio?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Objetivos Financeiros</label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Ex: Salário de R$ 15.000 em 2 anos"
                    value={financialInput}
                    onChange={(e) => setFinancialInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addToList('financial', 'objectives', financialInput, setFinancialInput)}
                  />
                  <Button 
                    onClick={() => addToList('financial', 'objectives', financialInput, setFinancialInput)}
                    disabled={!financialInput.trim()}
                  >
                    Adicionar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {bscData.financial.objectives.map((obj, index) => (
                    <Badge key={index} variant="outline" className="cursor-pointer" 
                           onClick={() => removeFromList('financial', 'objectives', index)}>
                      {obj} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                2. Perspectiva dos Clientes
              </CardTitle>
              <CardDescription>
                Quem são seus 'clientes' e que valor eles precisam que você entregue?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Seus "Clientes" (gestor, pares, mercado)</label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Ex: Meu gestor direto, Equipe de vendas"
                    value={clientsInput}
                    onChange={(e) => setClientsInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addToList('customers', 'clients', clientsInput, setClientsInput)}
                  />
                  <Button 
                    onClick={() => addToList('customers', 'clients', clientsInput, setClientsInput)}
                    disabled={!clientsInput.trim()}
                  >
                    Adicionar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {bscData.customers.clients.map((client, index) => (
                    <Badge key={index} variant="outline" className="cursor-pointer"
                           onClick={() => removeFromList('customers', 'clients', index)}>
                      {client} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Valor que você deve entregar</label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Ex: Ser visto como especialista em BI"
                    value={valueInput}
                    onChange={(e) => setValueInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addToList('customers', 'value_delivery', valueInput, setValueInput)}
                  />
                  <Button 
                    onClick={() => addToList('customers', 'value_delivery', valueInput, setValueInput)}
                    disabled={!valueInput.trim()}
                  >
                    Adicionar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {bscData.customers.value_delivery.map((value, index) => (
                    <Badge key={index} variant="outline" className="cursor-pointer"
                           onClick={() => removeFromList('customers', 'value_delivery', index)}>
                      {value} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-orange-600" />
                3. Processos Internos
              </CardTitle>
              <CardDescription>
                Quais habilidades e hábitos você precisa dominar?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Habilidades a dominar</label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Ex: Dominar Power BI, Melhorar oratória"
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addToList('processes', 'skills', skillsInput, setSkillsInput)}
                  />
                  <Button 
                    onClick={() => addToList('processes', 'skills', skillsInput, setSkillsInput)}
                    disabled={!skillsInput.trim()}
                  >
                    Adicionar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {bscData.processes.skills.map((skill, index) => (
                    <Badge key={index} variant="outline" className="cursor-pointer"
                           onClick={() => removeFromList('processes', 'skills', index)}>
                      {skill} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Hábitos a desenvolver</label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Ex: Fazer networking, Estudar 1h por dia"
                    value={habitsInput}
                    onChange={(e) => setHabitsInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addToList('processes', 'habits', habitsInput, setHabitsInput)}
                  />
                  <Button 
                    onClick={() => addToList('processes', 'habits', habitsInput, setHabitsInput)}
                    disabled={!habitsInput.trim()}
                  >
                    Adicionar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {bscData.processes.habits.map((habit, index) => (
                    <Badge key={index} variant="outline" className="cursor-pointer"
                           onClick={() => removeFromList('processes', 'habits', index)}>
                      {habit} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-purple-600" />
                4. Aprendizado e Crescimento
              </CardTitle>
              <CardDescription>
                O que você precisa aprender? Que cursos, livros, mentorias?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Cursos</label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Ex: Formação Analista Estratégico"
                    value={coursesInput}
                    onChange={(e) => setCoursesInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addToList('learning', 'courses', coursesInput, setCoursesInput)}
                  />
                  <Button 
                    onClick={() => addToList('learning', 'courses', coursesInput, setCoursesInput)}
                    disabled={!coursesInput.trim()}
                  >
                    Adicionar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {bscData.learning.courses.map((course, index) => (
                    <Badge key={index} variant="outline" className="cursor-pointer"
                           onClick={() => removeFromList('learning', 'courses', index)}>
                      {course} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Livros</label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Ex: 1 livro por mês sobre liderança"
                    value={booksInput}
                    onChange={(e) => setBooksInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addToList('learning', 'books', booksInput, setBooksInput)}
                  />
                  <Button 
                    onClick={() => addToList('learning', 'books', booksInput, setBooksInput)}
                    disabled={!booksInput.trim()}
                  >
                    Adicionar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {bscData.learning.books.map((book, index) => (
                    <Badge key={index} variant="outline" className="cursor-pointer"
                           onClick={() => removeFromList('learning', 'books', index)}>
                      {book} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Mentorias</label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Ex: Mentoria com líder sênior da área"
                    value={mentorshipsInput}
                    onChange={(e) => setMentorshipsInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addToList('learning', 'mentorships', mentorshipsInput, setMentorshipsInput)}
                  />
                  <Button 
                    onClick={() => addToList('learning', 'mentorships', mentorshipsInput, setMentorshipsInput)}
                    disabled={!mentorshipsInput.trim()}
                  >
                    Adicionar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {bscData.learning.mentorships.map((mentorship, index) => (
                    <Badge key={index} variant="outline" className="cursor-pointer"
                           onClick={() => removeFromList('learning', 'mentorships', index)}>
                      {mentorship} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  if (result) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 lg:ml-64 overflow-y-auto pt-16 lg:pt-8">
          <div className="max-w-6xl mx-auto p-6">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-6 w-6 text-primary" />
                  Seu BSC Estratégico de Carreira
                </CardTitle>
                <CardDescription>
                  Plano estratégico para sua carreira construído com disciplina empresarial
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Render BSC dashboard here */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Perspectivas do BSC</h3>
                    {/* Add BSC visualization components */}
                  </div>
                </div>
                
                <div className="mt-6 text-center">
                  <Button onClick={() => setResult(null)} variant="outline">
                    Editar BSC
                  </Button>
                </div>
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
      <main className="flex-1 lg:ml-64 overflow-y-auto pt-16 lg:pt-8">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <Card className="mb-6 border-l-4 border-l-primary">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">BSC Estratégico de Carreira</CardTitle>
                  <CardDescription className="text-lg mt-1">
                    Construir um plano estratégico para sua carreira com a mesma disciplina que uma empresa usa para planejar seu futuro.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Progress */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium">Progresso do Wizard</span>
                <span className="text-sm text-muted-foreground">{currentStep} de 4</span>
              </div>
              <Progress value={(currentStep / 4) * 100} className="mb-4" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Financeiro</span>
                <span>Clientes</span>
                <span>Processos</span>
                <span>Aprendizado</span>
              </div>
            </CardContent>
          </Card>

          {/* Step Content */}
          {renderStepContent()}

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(prev => prev - 1)}
              disabled={currentStep === 1}
            >
              Voltar
            </Button>

            {currentStep < 4 ? (
              <Button
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={!canProceed()}
              >
                Próximo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={generateBSC}
                disabled={isLoading || !canProceed()}
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Gerando BSC...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Gerar meu BSC Estratégico
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}