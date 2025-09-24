import { CheckCircle, BookOpen, TrendingUp, Users, ArrowRight, Star, Zap, Brain, Target, Cpu, FileText, MessageSquare, Presentation, Database, Table, Navigation, Trophy, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const LandingPage = () => {
  const aiModules = [
    {
      icon: FileText,
      name: "Raio-X de Currículo",
      description: "IA analisa seu CV e otimiza para recrutadores",
      features: ["Análise STAR", "Score ATS", "Palavras-chave estratégicas"],
      color: "bg-blue-500",
      difficulty: 2
    },
    {
      icon: MessageSquare,
      name: "Dojo de Entrevistas",
      description: "Simulador de entrevistas com feedback em tempo real",
      features: ["Comportamental", "Técnica", "Estudo de caso"],
      color: "bg-green-500",
      difficulty: 3
    },
    {
      icon: Presentation,
      name: "Lab de Comunicação",
      description: "IA reescreve seus e-mails e apresentações",
      features: ["E-mails executivos", "Apresentações de resultados", "Feedback construtivo"],
      color: "bg-purple-500",
      difficulty: 2
    },
    {
      icon: Database,
      name: "Simulador de ERP",
      description: "Entenda a lógica de sistemas empresariais",
      features: ["Fluxo de dados", "Integração de módulos", "Relatórios gerenciais"],
      color: "bg-orange-500",
      difficulty: 4
    },
    {
      icon: Table,
      name: "Arena de Planilhas",
      description: "Desafios práticos para dominar Excel/Sheets",
      features: ["Fórmulas avançadas", "Tabelas dinâmicas", "Análise de dados"],
      color: "bg-yellow-500",
      difficulty: 3
    },
    {
      icon: Target,
      name: "BSC Estratégico",
      description: "Construa Balanced Scorecards com orientação IA",
      features: ["4 perspectivas", "KPIs inteligentes", "Mapa estratégico"],
      color: "bg-red-500",
      difficulty: 4
    },
    {
      icon: Navigation,
      name: "GPS de Carreira",
      description: "IA mapeia sua trajetória e próximos passos",
      features: ["Análise de gaps", "Benchmarking", "Plano de ação"],
      color: "bg-indigo-500",
      difficulty: 3
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-primary/10 py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-6 flex justify-center">
            <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-2 text-sm font-medium">
              🚀 Plataforma de Simulação com IA
            </Badge>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            O <span className="text-primary">Terminal</span> dos
            <br />
            Analistas de Elite
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            <strong>7 simuladores de IA</strong> que transformam analistas comuns em 
            <strong> estrategistas de alto impacto</strong>. Treine suas habilidades em um ambiente seguro 
            antes de aplicar no mundo real.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/checkout">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg">
                <Brain className="mr-2 h-5 w-5" />
                Começar Simulações
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="px-8 py-4 text-lg">
                <Trophy className="mr-2 h-5 w-5" />
                Login / Demo Gratuita
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-primary" />
              <span>Powered by GPT-4</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>20-45 min por módulo</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" />
              <span>Sistema de pontuação</span>
            </div>
          </div>
        </div>
      </section>

      {/* Módulos de IA */}
      <section className="py-20 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              7 Simuladores de IA para Dominar a Análise Estratégica
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Cada módulo é uma experiência imersiva que desenvolve habilidades específicas. 
              A IA atua como seu mentor pessoal, oferecendo feedback detalhado e orientação personalizada.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {aiModules.map((module, index) => {
              const IconComponent = module.icon;
              return (
                <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 ${module.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-3 w-3 ${i < module.difficulty ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                          />
                        ))}
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{module.name}</h3>
                    <p className="text-gray-600 mb-4">{module.description}</p>
                    
                    <div className="space-y-2">
                      {module.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center text-sm">
                          <CheckCircle className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          IA Personalizada
                        </Badge>
                        <span className="text-sm text-gray-500">Nível {module.difficulty}/5</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p6 inline-block">
              <div className="flex items-center gap-3 text-primary">
                <Brain className="h-5 w-5" />
                <span className="font-medium">Sistema Gamificado:</span>
                <span className="text-gray-700">Ganhe pontos, suba de nível e acompanhe seu progresso em tempo real</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Como o Terminal Acelera sua Carreira
            </h2>
            <p className="text-xl text-gray-600">
              Metodologia comprovada em 3 etapas simples
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Escolha seu Desafio</h3>
              <p className="text-gray-600">
                Selecione um dos 7 módulos baseado na habilidade que quer desenvolver. 
                Cada simulação é única e adaptada ao seu nível.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Interaja com a IA</h3>
              <p className="text-gray-600">
                Nossa IA atua como seu mentor pessoal, analisando suas respostas e 
                fornecendo feedback detalhado em tempo real.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Aplique no Mundo Real</h3>
              <p className="text-gray-600">
                Receba um plano de ação personalizado e aplique imediatamente 
                o que aprendeu no seu trabalho atual.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bônus Course */}
      <section className="py-20 px-4 bg-primary text-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-6">
            <Badge className="bg-white/20 text-white border-white/30 px-4 py-2">
              🎁 BÔNUS EXCLUSIVO
            </Badge>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Formação Analista Estratégico
          </h2>
          
          <p className="text-xl mb-8 opacity-90">
            Além dos simuladores, você ganha acesso ao <strong>curso completo na Hotmart</strong> 
            com 4 módulos estruturados para fundamentar sua base teórica.
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto mb-8">
            <div className="bg-white/10 backdrop-blur rounded-lg p-6">
              <BookOpen className="h-8 w-8 mb-3 mx-auto" />
              <h3 className="font-bold mb-2">Fundamentos Sólidos</h3>
              <p className="text-sm opacity-90">Base teórica essencial para análise estratégica</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-6">
              <TrendingUp className="h-8 w-8 mb-3 mx-auto" />
              <h3 className="font-bold mb-2">Ferramentas Avançadas</h3>
              <p className="text-sm opacity-90">Domine as metodologias dos consultores de elite</p>
            </div>
          </div>

          <Button size="lg" className="bg-white text-primary hover:bg-white/90 px-8 py-4">
            Garantir Acesso Completo
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 bg-background">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Investimento no seu Futuro
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            Menos que o preço de um almoço executivo por semana
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Plano Mensal */}
            <Card className="border-2 border-gray-200 hover:border-primary/50 transition-colors">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-4">Mensal</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">R$ 97</span>
                  <span className="text-gray-600">/mês</span>
                </div>
                <ul className="space-y-3 mb-6 text-left">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-primary mr-2" />
                    <span className="text-sm">7 Simuladores de IA</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-primary mr-2" />
                    <span className="text-sm">Curso Completo (Bônus)</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-primary mr-2" />
                    <span className="text-sm">Sistema de Progresso</span>
                  </li>
                </ul>
                <Link to="/checkout">
                  <Button className="w-full" variant="outline">
                    Começar Agora
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Plano Anual */}
            <Card className="border-2 border-primary bg-primary/5 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-white px-4 py-1">
                  🔥 MAIS POPULAR
                </Badge>
              </div>
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-4">Anual</h3>
                <div className="mb-2">
                  <span className="text-lg line-through text-gray-500">R$ 1.164</span>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-primary">R$ 697</span>
                  <span className="text-gray-600">/ano</span>
                </div>
                <div className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full mb-6 inline-block">
                  Economize R$ 467 (40% OFF)
                </div>
                <ul className="space-y-3 mb-6 text-left">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-primary mr-2" />
                    <span className="text-sm">Tudo do plano mensal</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-primary mr-2" />
                    <span className="text-sm">2 meses GRÁTIS</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-primary mr-2" />
                    <span className="text-sm">Suporte prioritário</span>
                  </li>
                </ul>
                <Link to="/checkout">
                  <Button className="w-full bg-primary hover:bg-primary/90">
                    Economizar 40%
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Sua Carreira não Pode Esperar
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Enquanto outros analistas fazem mais do mesmo, você estará treinando com IA 
            e desenvolvendo habilidades que <strong>realmente importam</strong> no mercado.
          </p>
          
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-lg px-4 py-2">
              <Users className="h-4 w-4" />
              <span className="text-sm">Mais de 500 profissionais já estão dentro</span>
            </div>
          </div>

          <Link to="/checkout">
            <Button size="lg" className="bg-primary hover:bg-primary/90 px-8 py-4 text-lg">
              <Brain className="mr-2 h-5 w-5" />
              Garantir Minha Vaga
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          
          <p className="text-sm opacity-70 mt-4">
            ✅ Garantia de 7 dias • ✅ Cancele quando quiser • ✅ Suporte dedicado
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-2">O Terminal</h3>
            <p className="text-gray-400">Uma iniciativa SLOTI</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 text-sm">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              Jovens Corporativos
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              Termos de Uso
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              Política de Privacidade
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;