import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowRight, MessageCircle, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

export default function Confirmation() {
  // Em uma implementação real, você pegaria o nome do usuário da URL ou contexto
  const userName = "Analista"; // Placeholder

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-6">
            <Check className="h-8 w-8 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Parabéns, {userName}!
          </h1>
          
          <p className="text-xl text-gray-600">
            Seu acesso ao BussulaC está liberado
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Próximos Passos</CardTitle>
            <CardDescription>
              Siga estas etapas para aproveitar ao máximo sua assinatura
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div className="flex-grow">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Acesse seu Dashboard
                  </h3>
                  <p className="text-gray-600 mb-3">
                    Comece explorando o centro de comando da sua jornada analítica
                  </p>
                  <Link to="/dashboard">
                    <Button size="sm" className="gap-2">
                      Ir para Dashboard
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div className="flex-grow">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Junte-se à Comunidade
                  </h3>
                  <p className="text-gray-600 mb-3">
                    Conecte-se com outros analistas no grupo "Data-Driven Minds"
                  </p>
                  <Button variant="outline" size="sm" className="gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Acessar Comunidade
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div className="flex-grow">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Comece o Curso
                  </h3>
                  <p className="text-gray-600 mb-3">
                    Inicie sua jornada com a "Formação Analista Estratégico"
                  </p>
                  <Link to="/course">
                    <Button variant="outline" size="sm" className="gap-2">
                      <BookOpen className="h-4 w-4" />
                      Começar Curso
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">
                📧 Fique de olho no seu email
              </h4>
              <p className="text-blue-800 text-sm">
                Você receberá um email de boas-vindas com informações importantes 
                sobre como aproveitar ao máximo sua assinatura do BussulaC.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Precisa de ajuda? Nossa equipe está aqui para você.
          </p>
          <Button variant="outline">
            Falar com Suporte
          </Button>
        </div>
      </div>
    </div>
  );
}