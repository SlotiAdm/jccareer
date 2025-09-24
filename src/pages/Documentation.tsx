import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Target, MessageSquare, Presentation, Database, Table, Navigation, FileText, Zap } from "lucide-react";

export default function Documentation() {
  const modules = [
    {
      id: "resume-analyzer",
      title: "Raio-X de Currículo",
      icon: FileText,
      category: "Ferramenta de Arsenal",
      description: "Transforme seu currículo em uma máquina de marketing pessoal",
      howToUse: [
        "Cole ou envie seu currículo atual (PDF, DOC ou texto)",
        "Cole a descrição completa da vaga desejada",
        "Clique em 'Fazer Raio-X do Currículo' para análise",
        "Revise o diagnóstico detalhado com pontos fortes e fracos",
        "Clique no botão verde 'Gerar Currículo Otimizado'",
        "Copie ou baixe seu novo currículo estratégico"
      ],
      tips: [
        "📝 Seja específico: quanto mais detalhada a vaga, melhor a otimização",
        "🎯 Foque nas palavras-chave: a ferramenta identifica termos ATS importantes",
        "⭐ Metodologia STAR: suas experiências serão reescritas com Situação-Tarefa-Ação-Resultado",
        "🔄 Use múltiplas vagas: adapte o mesmo currículo para diferentes posições"
      ]
    },
    {
      id: "communication-lab",
      title: "Laboratório de Comunicação",
      icon: MessageSquare,
      category: "Ferramenta de Arsenal",
      description: "Aprimore sua comunicação corporativa estratégica",
      howToUse: [
        "Escolha o cenário de comunicação desejado",
        "Escreva seu texto inicial (e-mail, proposta, feedback, etc.)",
        "Clique em 'Analisar e Melhorar'",
        "Receba a versão otimizada do seu texto",
        "Estude os princípios aplicados e melhorias sugeridas",
        "Use as próximas etapas para desenvolver ainda mais"
      ],
      tips: [
        "🎭 Contexto é tudo: escolha o cenário certo para sua situação",
        "✨ Seja claro: textos diretos geram melhores otimizações",
        "📈 Foque no impacto: pense no resultado que quer alcançar",
        "🔄 Pratique regularmente: comunicação é habilidade que se desenvolve"
      ]
    },
    {
      id: "interview-dojo",
      title: "Dojo de Entrevistas",
      icon: Target,
      category: "Dojo de Treinamento",
      description: "Treino intensivo para entrevistas comportamentais e técnicas",
      howToUse: [
        "Escolha o tipo de entrevista (comportamental ou técnica)",
        "Inicie a simulação - você receberá uma pergunta",
        "Responda como se fosse uma entrevista real",
        "Receba feedback detalhado sobre sua resposta",
        "Continue a entrevista para treinar múltiplas perguntas",
        "Finalize para ver sua pontuação e áreas de melhoria"
      ],
      tips: [
        "🎯 Use a metodologia STAR: Situação, Tarefa, Ação, Resultado",
        "🗣️ Seja específico: exemplos concretos são mais impactantes",
        "⏱️ Pratique timing: respostas de 2-3 minutos são ideais",
        "🔄 Treine regularmente: diferentes cenários desenvolvem versatilidade"
      ]
    },
    {
      id: "bsc-strategic",
      title: "BSC Estratégico",
      icon: Presentation,
      category: "Dojo de Treinamento", 
      description: "Desenvolva estratégias usando Balanced Scorecard",
      howToUse: [
        "Descreva sua empresa e contexto atual",
        "Defina os objetivos estratégicos principais",
        "A IA criará um BSC completo com 4 perspectivas",
        "Analise indicadores, metas e iniciativas sugeridas",
        "Use o plano de implementação fornecido",
        "Monitore e ajuste conforme necessário"
      ],
      tips: [
        "🎯 Objetivos SMART: específicos, mensuráveis, alcançáveis",
        "📊 Foque em poucos KPIs: qualidade sobre quantidade",
        "🔗 Conecte perspectivas: tudo deve estar alinhado",
        "📈 Pense longo prazo: BSC é ferramenta estratégica"
      ]
    },
    {
      id: "erp-simulator",
      title: "Simulador ERP",
      icon: Database,
      category: "Dojo de Treinamento",
      description: "Simule problemas reais de negócio com soluções ERP",
      howToUse: [
        "Descreva um problema específico do seu negócio",
        "Receba análise completa da situação",
        "Veja quais módulos ERP são necessários",
        "Estude o fluxo de dados sugerido",
        "Implemente as melhores práticas indicadas",
        "Compare sua solução com a resposta da IA"
      ],
      tips: [
        "🔍 Seja específico: problemas claros geram soluções melhores",
        "📋 Pense em processos: ERP é sobre fluxos de trabalho",
        "🎯 Foque na integração: módulos devem trabalhar juntos",
        "📊 Dados são chave: qualidade da informação é crucial"
      ]
    },
    {
      id: "spreadsheet-arena",
      title: "Arena de Planilhas",
      icon: Table,
      category: "Dojo de Treinamento",
      description: "Domine Excel/Sheets com desafios práticos de negócio",
      howToUse: [
        "Escolha seu nível de dificuldade",
        "Receba um desafio de planilha realista",
        "Resolva usando suas habilidades em Excel/Sheets",
        "Envie sua resposta ou fórmula",
        "Compare com a solução otimizada da IA",
        "Aprenda técnicas avançadas sugeridas"
      ],
      tips: [
        "🧮 Pratique fórmulas: PROCV, ÍNDICE, CORRESP são fundamentais",
        "📊 Visualize dados: gráficos contam histórias",
        "🎯 Pense em eficiência: uma fórmula pode substituir horas de trabalho",
        "🔧 Use ferramentas avançadas: tabelas dinâmicas, macros"
      ]
    }
  ];

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
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Central de Ajuda</CardTitle>
                  <CardDescription className="text-lg mt-1">
                    Manual completo para extrair o máximo valor da BussulaC
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Legend */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Tipos de Módulo</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Badge variant="outline" className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-600" />
                <span>Arsenal: Uso diário, pontos fixos</span>
              </Badge>
              <Badge variant="outline" className="flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-600" />
                <span>Dojo: Treino com scoring</span>
              </Badge>
            </CardContent>
          </Card>

          {/* Modules Documentation */}
          <Card>
            <CardHeader>
              <CardTitle>Guia por Módulo</CardTitle>
              <CardDescription>
                Clique em cada módulo para ver o passo a passo completo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {modules.map((module) => {
                  const IconComponent = module.icon;
                  return (
                    <AccordionItem key={module.id} value={module.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 text-left">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <IconComponent className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-semibold">{module.title}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <Badge 
                                variant={module.category.includes("Arsenal") ? "secondary" : "outline"}
                                className="text-xs"
                              >
                                {module.category}
                              </Badge>
                              {module.description}
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pl-14">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2 text-primary">
                              📋 Como Usar (Passo a Passo)
                            </h4>
                            <ol className="space-y-2">
                              {module.howToUse.map((step, index) => (
                                <li key={index} className="flex gap-3">
                                  <span className="flex-shrink-0 w-6 h-6 bg-primary/20 text-primary text-xs rounded-full flex items-center justify-center font-medium">
                                    {index + 1}
                                  </span>
                                  <span className="text-sm">{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold mb-2 text-green-600">
                              💡 Dicas Estratégicas
                            </h4>
                            <ul className="space-y-2">
                              {module.tips.map((tip, index) => (
                                <li key={index} className="text-sm flex items-start gap-2">
                                  <span className="text-green-600 flex-shrink-0">•</span>
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}