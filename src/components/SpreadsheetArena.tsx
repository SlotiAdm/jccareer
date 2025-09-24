import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Trophy, Target, Zap, Brain, PlayCircle } from 'lucide-react';
import SpreadsheetMiniSheet from './SpreadsheetMiniSheet';

const levels = [
  {
    id: 1,
    name: 'Higiene de Dados',
    description: 'Limpeza e organização de dados bagunçados',
    icon: <Target className="w-5 h-5" />,
    color: 'bg-green-500'
  },
  {
    id: 2,
    name: 'Análise Descritiva',
    description: 'Filtros, classificações e fórmulas intermediárias',
    icon: <Zap className="w-5 h-5" />,
    color: 'bg-blue-500'
  },
  {
    id: 3,
    name: 'Conexão de Dados',
    description: 'PROCV e cruzamento de informações',
    icon: <Brain className="w-5 h-5" />,
    color: 'bg-purple-500'
  },
  {
    id: 4,
    name: 'Modelagem para BI',
    description: 'Power Query e modelagem relacional',
    icon: <Trophy className="w-5 h-5" />,
    color: 'bg-orange-500'
  }
];

const challengeTypes = {
  'formula_calculation': 'Cálculo de Fórmulas Avançadas',
  'data_analysis': 'Análise e Limpeza de Dados',
  'pivot_tables': 'Tabelas Dinâmicas',
  'vlookup_hlookup': 'PROCV e PROCH',
  'conditional_formatting': 'Formatação Condicional',
  'charts_visualization': 'Gráficos e Visualização'
};

const challengeDescriptions: { [key: string]: string } = {
  'formula_calculation': 'Use fórmulas avançadas como SOMASES, CONT.SES para análises complexas',
  'data_analysis': 'Organize e limpe dados bagunçados, remova duplicatas e padronize formatos',
  'pivot_tables': 'Crie tabelas dinâmicas para resumir e analisar grandes volumes de dados',
  'vlookup_hlookup': 'Conecte dados entre planilhas usando PROCV e outras funções de busca',
  'conditional_formatting': 'Destaque automaticamente dados importantes com formatação condicional',
  'charts_visualization': 'Transforme dados em gráficos informativos e dashboards visuais'
};

interface SpreadsheetArenaProps {
  onComplete?: (score: number) => void;
}

export default function SpreadsheetArena({ onComplete }: SpreadsheetArenaProps) {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [selectedChallenge, setSelectedChallenge] = useState<string>('');
  const [userFormula, setUserFormula] = useState('');
  const [userApproach, setUserApproach] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('challenge');
  
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmitSolution = async (solutionData: { formula?: string; approach: string; file?: File }) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('spreadsheet-arena', {
        body: {
          challenge_type: selectedChallenge,
          user_formula: solutionData.formula || userFormula,
          user_approach: solutionData.approach,
          challenge_data: { level: currentLevel },
          user_id: user?.id
        }
      });

      if (error) throw error;

      setResults(data.analysis);
      setActiveTab('results');

      // Se há avaliação, mostrar pontuação
      if (data.analysis.user_evaluation?.accuracy_score) {
        const score = data.analysis.user_evaluation.accuracy_score;
        toast({
          title: `Pontuação: ${score}%`,
          description: `Nível de eficiência: ${data.analysis.user_evaluation.efficiency_rating}/5`,
        });
        
        onComplete?.(score);
      }

    } catch (error) {
      console.error('Error submitting solution:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar sua solução. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetChallenge = () => {
    setSelectedChallenge('');
    setUserFormula('');
    setUserApproach('');
    setResults(null);
    setActiveTab('challenge');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header com níveis */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Arena de Planilhas</h1>
        <p className="text-muted-foreground">
          Desenvolva maestria progressiva em análise de dados
        </p>
        
        {/* Progresso dos níveis */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          {levels.map((level) => (
            <Card 
              key={level.id}
              className={`cursor-pointer transition-all ${
                currentLevel >= level.id ? 'ring-2 ring-primary' : 'opacity-60'
              }`}
              onClick={() => setCurrentLevel(level.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-full ${level.color} text-white`}>
                    {level.icon}
                  </div>
                  <div>
                    <CardTitle className="text-sm">Nível {level.id}</CardTitle>
                    <CardDescription className="text-xs">{level.name}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">{level.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Interface principal */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="challenge">Desafio</TabsTrigger>
          <TabsTrigger value="results" disabled={!results}>Resultado</TabsTrigger>
        </TabsList>

        <TabsContent value="challenge" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Nível {currentLevel}: {levels[currentLevel - 1]?.name}</CardTitle>
              <CardDescription>
                {levels[currentLevel - 1]?.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Seleção do tipo de desafio */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Escolha o tipo de desafio:
                </label>
                <Select value={selectedChallenge} onValueChange={setSelectedChallenge}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um desafio" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(challengeTypes).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{value}</span>
                          <span className="text-xs text-gray-500">{challengeDescriptions[key]}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Descrição do desafio selecionado */}
              {selectedChallenge && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <PlayCircle className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900">Desafio Selecionado</span>
                  </div>
                  <p className="text-sm text-blue-800">
                    {challengeDescriptions[selectedChallenge]}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mini planilha de trabalho */}
          {selectedChallenge && (
            <SpreadsheetMiniSheet
              challengeData={{ type: selectedChallenge, level: currentLevel }}
              onSolutionSubmit={handleSubmitSolution}
              isLoading={isLoading}
            />
          )}

          {/* Botão reset */}
          {results && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={resetChallenge}>
                Escolher Novo Desafio
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {results && (
            <>
              {/* Pontuação */}
              {results.user_evaluation && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="w-5 h-5" />
                      Sua Avaliação
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-2xl font-bold text-primary">
                          {results.user_evaluation.accuracy_score}%
                        </div>
                        <div className="text-sm text-muted-foreground">Precisão</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-primary">
                          {results.user_evaluation.efficiency_rating}/5
                        </div>
                        <div className="text-sm text-muted-foreground">Eficiência</div>
                      </div>
                    </div>
                    
                    <Progress 
                      value={results.user_evaluation.accuracy_score} 
                      className="w-full" 
                    />

                    {/* Elementos corretos */}
                    {results.user_evaluation.correct_elements?.length > 0 && (
                      <div>
                        <h4 className="font-medium text-green-600 mb-2">✅ Acertos:</h4>
                        <ul className="text-sm space-y-1">
                          {results.user_evaluation.correct_elements.map((item: string, index: number) => (
                            <li key={index} className="text-green-600">• {item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Erros encontrados */}
                    {results.user_evaluation.errors_found?.length > 0 && (
                      <div>
                        <h4 className="font-medium text-red-600 mb-2">❌ Pontos de Melhoria:</h4>
                        <ul className="text-sm space-y-1">
                          {results.user_evaluation.errors_found.map((item: string, index: number) => (
                            <li key={index} className="text-red-600">• {item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Solução correta */}
              <Card>
                <CardHeader>
                  <CardTitle>Solução Modelo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {results.correct_solution.formula && (
                    <div>
                      <h4 className="font-medium mb-2">Fórmula Correta:</h4>
                      <code className="block bg-muted p-3 rounded text-sm font-mono">
                        {results.correct_solution.formula}
                      </code>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium mb-2">Abordagem:</h4>
                    <p className="text-sm text-muted-foreground">
                      {results.correct_solution.approach}
                    </p>
                  </div>

                  {/* Passo a passo */}
                  {results.correct_solution.step_by_step && (
                    <div>
                      <h4 className="font-medium mb-2">Passo a Passo:</h4>
                      <ol className="text-sm space-y-1 list-decimal list-inside">
                        {results.correct_solution.step_by_step.map((step: string, index: number) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Dicas práticas */}
              {results.practical_tips && (
                <Card>
                  <CardHeader>
                    <CardTitle>Dicas para o Próximo Nível</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-2">
                      {results.practical_tips.map((tip: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <Badge variant="secondary" className="text-xs shrink-0 mt-0.5">
                            {index + 1}
                          </Badge>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}