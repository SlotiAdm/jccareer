import { CheckCircle, BookOpen, TrendingUp, Users, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background to-terminal-light py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-hero mb-6 text-terminal-text max-w-4xl mx-auto">
            Acesse o centro de inteligência dos <span className="text-primary">analistas de elite</span>
          </h1>
          <p className="text-subtitle mb-8 max-w-2xl mx-auto">
            Assinatura de inteligência estratégica diária + curso completo para transformar sua carreira em análise de dados
          </p>
          <Button className="btn-hero shadow-terminal">
            Quero Acesso Imediato
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* O que você ganha */}
      <section className="py-20 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-section-title text-center mb-16 text-terminal-text">
            O que você ganha com sua assinatura
          </h2>
          
          <div className="grid md:grid-cols-2 gap-12">
            {/* O Terminal */}
            <Card className="card-feature">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <TrendingUp className="h-10 w-10 text-primary mr-4" />
                  <h3 className="text-2xl font-semibold text-terminal-text">O Terminal</h3>
                </div>
                <p className="text-muted-foreground mb-6 text-lg">
                  Sua dose diária de inteligência estratégica
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" />
                    <span>Análises de mercado atualizadas diariamente</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" />
                    <span>Frameworks estratégicos testados na prática</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" />
                    <span>Insights de tendências antes da concorrência</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" />
                    <span>Metodologias de análise exclusivas</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Formação Analista Estratégico */}
            <Card className="card-feature bg-terminal-light">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <BookOpen className="h-10 w-10 text-primary mr-4" />
                  <div>
                    <h3 className="text-2xl font-semibold text-terminal-text">Formação Analista Estratégico</h3>
                    <p className="text-primary font-medium">Bônus de Adesão</p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg mb-6">
                  <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <BookOpen className="h-16 w-16 text-primary mx-auto mb-2" />
                      <p className="text-terminal-text font-medium">Curso Completo</p>
                    </div>
                  </div>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-primary mr-3" />
                    <span className="font-medium">Módulo 1:</span>
                    <span className="ml-2">Fundamentos da Análise</span>
                  </li>
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-primary mr-3" />
                    <span className="font-medium">Módulo 2:</span>
                    <span className="ml-2">Ferramentas Avançadas</span>
                  </li>
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-primary mr-3" />
                    <span className="font-medium">Módulo 3:</span>
                    <span className="ml-2">Storytelling com Dados</span>
                  </li>
                  <li className="flex items-center">
                    <Star className="h-4 w-4 text-primary mr-3" />
                    <span className="font-medium">Módulo 4:</span>
                    <span className="ml-2">Estratégia Corporativa</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Prova Social */}
      <section className="py-20 px-4 bg-terminal-light">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-section-title mb-12 text-terminal-text">
            Profissionais de empresas líderes já fazem parte
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-60">
            <div className="bg-white p-6 rounded-lg">
              <div className="h-12 bg-muted rounded flex items-center justify-center">
                <span className="font-bold text-muted-foreground">Empresa A</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg">
              <div className="h-12 bg-muted rounded flex items-center justify-center">
                <span className="font-bold text-muted-foreground">Empresa B</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg">
              <div className="h-12 bg-muted rounded flex items-center justify-center">
                <span className="font-bold text-muted-foreground">Empresa C</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg">
              <div className="h-12 bg-muted rounded flex items-center justify-center">
                <span className="font-bold text-muted-foreground">Empresa D</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Preços */}
      <section className="py-20 px-4 bg-background">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-section-title mb-12 text-terminal-text">
            Escolha seu plano
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Plano Mensal */}
            <Card className="card-feature">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-4">Plano Mensal</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-terminal-text">R$ 97</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <Button className="w-full mb-4" variant="outline">
                  Começar Agora
                </Button>
                <p className="text-sm text-muted-foreground">
                  Cancele quando quiser
                </p>
              </CardContent>
            </Card>

            {/* Plano Anual */}
            <Card className="card-feature bg-primary text-primary-foreground relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-white text-primary px-3 py-1 rounded-full text-sm font-semibold">
                2 meses grátis
              </div>
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-4">Plano Anual</h3>
                <div className="mb-2">
                  <span className="text-lg line-through opacity-70">R$ 1.164</span>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold">R$ 970</span>
                  <span className="opacity-90">/ano</span>
                </div>
                <Button className="w-full mb-4 bg-white text-primary hover:bg-white/90">
                  Economizar Agora
                </Button>
                <p className="text-sm opacity-90">
                  Equivale a R$ 80,83/mês
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-terminal-light">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-section-title text-center mb-12 text-terminal-text">
            Perguntas Frequentes
          </h2>
          
          <div className="space-y-6">
            <Card className="card-feature">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Como funciona a assinatura?</h3>
                <p className="text-muted-foreground">
                  Você recebe acesso imediato ao curso completo e ao conteúdo diário do Terminal. 
                  O pagamento é recorrente e você pode cancelar quando quiser.
                </p>
              </CardContent>
            </Card>
            
            <Card className="card-feature">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Posso cancelar a qualquer momento?</h3>
                <p className="text-muted-foreground">
                  Sim, você tem total controle da sua assinatura e pode cancelar diretamente na sua área de membro.
                </p>
              </CardContent>
            </Card>
            
            <Card className="card-feature">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Como acesso o conteúdo?</h3>
                <p className="text-muted-foreground">
                  Após a confirmação do pagamento, você recebe os dados de acesso por e-mail e pode acessar 
                  tudo através da nossa plataforma online.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Pronto para elevar sua carreira?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Junte-se aos analistas de elite e transforme sua forma de trabalhar com dados
          </p>
          <Button className="btn-hero bg-white text-primary hover:bg-white/90">
            Começar Agora
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-terminal-text text-white py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-2">O Terminal</h3>
            <p className="text-white/70">Uma iniciativa SLOTI</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 text-sm">
            <a href="#" className="text-white/70 hover:text-white transition-colors">
              Jovens Corporativos
            </a>
            <a href="#" className="text-white/70 hover:text-white transition-colors">
              Termos de Uso
            </a>
            <a href="#" className="text-white/70 hover:text-white transition-colors">
              Política de Privacidade
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;