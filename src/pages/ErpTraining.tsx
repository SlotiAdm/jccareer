import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  BookOpen, 
  Database, 
  Monitor, 
  CheckCircle, 
  XCircle, 
  Trophy,
  ChevronRight,
  Target,
  Zap,
  Brain
} from "lucide-react";

interface ERPModule {
  name: string;
  description: string;
  icon: any;
  color: string;
}

interface Mission {
  id: number;
  title: string;
  description: string;
  correctPath: string[];
  currentPath: string[];
  completed: boolean;
  attempts: number;
}

const erpModules: ERPModule[] = [
  { name: "Financeiro", description: "Contas a pagar, receber, fluxo de caixa", icon: "💰", color: "bg-green-500" },
  { name: "Vendas", description: "Pedidos, clientes, comissões", icon: "📊", color: "bg-blue-500" },
  { name: "Estoque", description: "Produtos, movimentações, inventário", icon: "📦", color: "bg-orange-500" },
  { name: "Compras", description: "Fornecedores, cotações, pedidos", icon: "🛒", color: "bg-purple-500" },
  { name: "RH", description: "Colaboradores, folha, ponto", icon: "👥", color: "bg-pink-500" }
];

const quizQuestions = [
  {
    question: "O que significa ERP?",
    options: ["Enterprise Resource Planning", "Electronic Resource Program", "Enterprise Report Planning"],
    correct: 0
  },
  {
    question: "Qual a principal vantagem de um sistema ERP?",
    options: ["Redução de custos", "Integração de dados", "Interface bonita"],
    correct: 1
  }
];

const dbTables = [
  { name: "clientes", fields: ["id", "nome", "email", "estado"] },
  { name: "produtos", fields: ["id", "nome", "preco", "categoria"] },
  { name: "pedidos", fields: ["id", "cliente_id", "data", "total"] },
  { name: "itens_pedido", fields: ["id", "pedido_id", "produto_id", "quantidade"] }
];

export default function ErpTraining() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [currentStage, setCurrentStage] = useState<'theory' | 'architecture' | 'simulation'>("theory");
  const [quizAnswers, setQuizAnswers] = useState<number[]>(new Array(quizQuestions.length).fill(-1));
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [architectureComplete, setArchitectureComplete] = useState(false);
  
  const [missions] = useState<Mission[]>([
    {
      id: 1,
      title: "Relatório de Vendas por Período",
      description: "Exporte o relatório de vendas do Q3 em formato CSV",
      correctPath: ["Vendas", "Relatórios", "Vendas por Período"],
      currentPath: [],
      completed: false,
      attempts: 0
    },
    {
      id: 2,
      title: "Consulta de Estoque",
      description: "Verifique o estoque atual do produto 'Notebook Dell'",
      correctPath: ["Estoque", "Consultas", "Posição de Estoque"],
      currentPath: [],
      completed: false,
      attempts: 0
    }
  ]);
  
  const [currentMission, setCurrentMission] = useState(0);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [missionStatus, setMissionStatus] = useState<'active' | 'success' | 'error'>('active');

  useEffect(() => {
    document.title = "Treinamento ERP - BussulaC";
  }, []);

  const handleQuizAnswer = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...quizAnswers];
    newAnswers[questionIndex] = answerIndex;
    setQuizAnswers(newAnswers);
  };

  const submitQuiz = () => {
    const score = quizAnswers.reduce((acc, answer, index) => {
      return acc + (answer === quizQuestions[index].correct ? 1 : 0);
    }, 0);
    
    const percentage = Math.round((score / quizQuestions.length) * 100);
    setQuizScore(percentage);
    
    if (percentage >= 70) {
      toast({
        title: "Parabéns!",
        description: `Você acertou ${score}/${quizQuestions.length} questões (${percentage}%)`,
      });
      setTimeout(() => setCurrentStage('architecture'), 1000);
    } else {
      toast({
        title: "Tente novamente",
        description: `Você precisa de pelo menos 70% para avançar (${percentage}%)`,
        variant: "destructive",
      });
    }
  };

  const handleTableSelection = (tableName: string) => {
    if (selectedTables.includes(tableName)) {
      setSelectedTables(selectedTables.filter(t => t !== tableName));
    } else {
      setSelectedTables([...selectedTables, tableName]);
    }
  };

  const checkArchitectureAnswer = () => {
    const correctTables = ["clientes", "pedidos"];
    const isCorrect = correctTables.every(table => selectedTables.includes(table)) &&
                     selectedTables.length === correctTables.length;
    
    if (isCorrect) {
      setArchitectureComplete(true);
      toast({
        title: "Correto!",
        description: "Você identificou as tabelas necessárias para o relatório.",
      });
      setTimeout(() => setCurrentStage('simulation'), 1000);
    } else {
      toast({
        title: "Tente novamente",
        description: "Pense em quais dados você precisa para um relatório de vendas por estado...",
        variant: "destructive",
      });
    }
  };

  const handleMenuClick = (menuItem: string) => {
    const newPath = [...currentPath, menuItem];
    setCurrentPath(newPath);
    
    const mission = missions[currentMission];
    const pathMatches = newPath.every((item, index) => item === mission.correctPath[index]);
    
    if (pathMatches && newPath.length === mission.correctPath.length) {
      setMissionStatus('success');
      toast({
        title: "Missão Concluída!",
        description: "Você encontrou o caminho correto!",
      });
      
      setTimeout(() => {
        if (currentMission < missions.length - 1) {
          setCurrentMission(currentMission + 1);
          setCurrentPath([]);
          setMissionStatus('active');
        }
      }, 2000);
    } else if (!pathMatches) {
      setMissionStatus('error');
      toast({
        title: "Caminho Incorreto",
        description: "Tente outro caminho...",
        variant: "destructive",
      });
      
      setTimeout(() => {
        setCurrentPath([]);
        setMissionStatus('active');
      }, 1500);
    }
  };

  const renderTheoryStage = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Etapa 1: Teoria - O que é um ERP?
          </CardTitle>
          <CardDescription>
            Entenda os conceitos fundamentais antes de partir para a prática
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed">
              Um <strong>ERP (Enterprise Resource Planning)</strong> é um sistema que integra 
              todos os processos de uma empresa em uma única plataforma. Imagine uma empresa 
              como um corpo humano - cada órgão (departamento) precisa se comunicar com os outros 
              para funcionar perfeitamente.
            </p>
            
            <h3 className="text-lg font-semibold mt-4 mb-2">Módulos Principais:</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {erpModules.map((module, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="text-2xl">{module.icon}</div>
                  <div>
                    <h4 className="font-medium">{module.name}</h4>
                    <p className="text-sm text-gray-600">{module.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Quiz */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-4">Quiz de Verificação:</h3>
            {quizQuestions.map((q, qIndex) => (
              <div key={qIndex} className="mb-4">
                <p className="font-medium mb-2">{q.question}</p>
                {q.options.map((option, oIndex) => (
                  <label key={oIndex} className="flex items-center gap-2 mb-1">
                    <input
                      type="radio"
                      name={`question-${qIndex}`}
                      checked={quizAnswers[qIndex] === oIndex}
                      onChange={() => handleQuizAnswer(qIndex, oIndex)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            ))}
            
            <Button 
              onClick={submitQuiz}
              disabled={quizAnswers.some(a => a === -1)}
              className="mt-4"
            >
              Verificar Respostas
            </Button>
            
            {quizScore !== null && (
              <div className="mt-4 p-3 rounded-lg bg-blue-50">
                <p className="font-medium">
                  Resultado: {quizScore}%
                  {quizScore >= 70 ? " - Aprovado! 🎉" : " - Precisa de 70% para avançar"}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderArchitectureStage = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Etapa 2: Arquitetura de Dados
          </CardTitle>
          <CardDescription>
            Entenda como os dados se conectam em um ERP
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">🎯 Desafio:</h3>
            <p className="text-sm">
              Para criar um relatório de <strong>"vendas por estado"</strong>, 
              quais tabelas você precisaria conectar? Selecione as tabelas necessárias:
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            {dbTables.map((table) => (
              <div
                key={table.name}
                onClick={() => handleTableSelection(table.name)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedTables.includes(table.name)
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h4 className="font-semibold mb-2">{table.name}</h4>
                <div className="text-xs space-y-1">
                  {table.fields.map((field) => (
                    <div key={field} className="text-gray-600">• {field}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {selectedTables.length > 0 && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium mb-2">Tabelas selecionadas:</p>
              <div className="flex gap-2 flex-wrap">
                {selectedTables.map((table) => (
                  <Badge key={table} variant="secondary">{table}</Badge>
                ))}
              </div>
            </div>
          )}
          
          <Button 
            onClick={checkArchitectureAnswer}
            disabled={selectedTables.length === 0}
            className="w-full"
          >
            Verificar Resposta
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderSimulationStage = () => (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Menu ERP Simulado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Sistema ERP
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {['Vendas', 'Estoque', 'Financeiro', 'Compras', 'RH'].map((menu) => (
              <div key={menu} className="border rounded">
                <Button
                  variant="ghost"
                  className="w-full justify-between"
                  onClick={() => handleMenuClick(menu)}
                  disabled={missionStatus !== 'active'}
                >
                  {menu}
                  <ChevronRight className="h-4 w-4" />
                </Button>
                
                {currentPath.includes(menu) && menu === 'Vendas' && (
                  <div className="ml-4 border-l border-gray-200 pl-4 py-2 space-y-1">
                    {['Pedidos', 'Relatórios', 'Clientes'].map((submenu) => (
                      <Button
                        key={submenu}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleMenuClick(submenu)}
                        disabled={missionStatus !== 'active'}
                      >
                        {submenu}
                      </Button>
                    ))}
                  </div>
                )}
                
                {currentPath.includes('Relatórios') && currentPath.includes('Vendas') && menu === 'Vendas' && (
                  <div className="ml-8 border-l border-gray-200 pl-4 py-2 space-y-1">
                    {['Vendas por Período', 'Vendas por Produto', 'Comissões'].map((item) => (
                      <Button
                        key={item}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-xs"
                        onClick={() => handleMenuClick(item)}
                        disabled={missionStatus !== 'active'}
                      >
                        {item}
                      </Button>
                    ))}
                  </div>
                )}
                
                {currentPath.includes(menu) && menu === 'Estoque' && (
                  <div className="ml-4 border-l border-gray-200 pl-4 py-2 space-y-1">
                    {['Produtos', 'Consultas', 'Movimentações'].map((submenu) => (
                      <Button
                        key={submenu}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleMenuClick(submenu)}
                        disabled={missionStatus !== 'active'}
                      >
                        {submenu}
                      </Button>
                    ))}
                  </div>
                )}
                
                {currentPath.includes('Consultas') && currentPath.includes('Estoque') && menu === 'Estoque' && (
                  <div className="ml-8 border-l border-gray-200 pl-4 py-2 space-y-1">
                    {['Posição de Estoque', 'Histórico', 'Inventário'].map((item) => (
                      <Button
                        key={item}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-xs"
                        onClick={() => handleMenuClick(item)}
                        disabled={missionStatus !== 'active'}
                      >
                        {item}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Status da navegação */}
          <div className="mt-4 p-3 rounded-lg bg-gray-50">
            <p className="text-sm font-medium mb-1">Caminho atual:</p>
            <div className="flex items-center gap-1 text-sm">
              {currentPath.length > 0 ? (
                currentPath.map((item, index) => (
                  <span key={index} className="flex items-center gap-1">
                    {index > 0 && <ChevronRight className="h-3 w-3" />}
                    <Badge variant="outline" className="text-xs">{item}</Badge>
                  </span>
                ))
              ) : (
                <span className="text-gray-500">Selecione um menu...</span>
              )}
            </div>
          </div>
          
          {/* Status da missão */}
          {missionStatus === 'success' && (
            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Missão Concluída!</span>
              </div>
            </div>
          )}
          
          {missionStatus === 'error' && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">Caminho incorreto!</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Painel de Missões */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Missões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {missions.map((mission, index) => (
              <div
                key={mission.id}
                className={`p-4 border rounded-lg ${
                  index === currentMission ? 'border-primary bg-primary/5' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">Missão {mission.id}</h4>
                  {mission.completed ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : index === currentMission ? (
                    <Badge variant="secondary" className="text-xs">Ativa</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">Aguardando</Badge>
                  )}
                </div>
                <h5 className="font-medium mb-1">{mission.title}</h5>
                <p className="text-sm text-gray-600">{mission.description}</p>
                
                {index === currentMission && (
                  <div className="mt-3 p-2 bg-blue-50 rounded text-xs">
                    <strong>Dica:</strong> Navegue pelo menu à esquerda para encontrar o caminho correto
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800">Progresso</span>
            </div>
            <Progress 
              value={(missions.filter(m => m.completed).length / missions.length) * 100} 
              className="mb-2" 
            />
            <p className="text-xs text-green-700">
              {missions.filter(m => m.completed).length} de {missions.length} missões completas
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 lg:ml-64 overflow-y-auto pt-16 lg:pt-8">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Treinamento ERP</h1>
            <p className="text-gray-600 mb-4">
              Domine o sistema que integra toda a empresa em 3 etapas práticas
            </p>
            
            {/* Progress indicator */}
            <div className="flex items-center gap-4 mb-6">
              {[
                { stage: 'theory', label: 'Teoria', icon: BookOpen },
                { stage: 'architecture', label: 'Arquitetura', icon: Database },
                { stage: 'simulation', label: 'Simulação', icon: Monitor }
              ].map((item, index) => {
                const Icon = item.icon;
                const isActive = currentStage === item.stage;
                const isCompleted = 
                  (item.stage === 'theory' && (quizScore ?? 0) >= 70) ||
                  (item.stage === 'architecture' && architectureComplete) ||
                  (item.stage === 'simulation' && missions.every(m => m.completed));
                
                return (
                  <div key={item.stage} className="flex items-center gap-2">
                    <div className={`p-2 rounded-full ${
                      isCompleted ? 'bg-green-500 text-white' :
                      isActive ? 'bg-primary text-white' : 
                      'bg-gray-200 text-gray-600'
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className={`text-sm font-medium ${
                      isActive ? 'text-primary' : 'text-gray-600'
                    }`}>
                      {item.label}
                    </span>
                    {index < 2 && <ChevronRight className="h-4 w-4 text-gray-400" />}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Content based on current stage */}
          {currentStage === 'theory' && renderTheoryStage()}
          {currentStage === 'architecture' && renderArchitectureStage()}
          {currentStage === 'simulation' && renderSimulationStage()}
        </div>
      </main>
    </div>
  );
}