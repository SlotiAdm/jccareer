import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export default function ErpSimulator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [businessProblem, setBusinessProblem] = useState("");
  const [userSolution, setUserSolution] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    document.title = "Simulador ERP - BussulaC";
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessProblem) {
      toast({
        title: "Informe o problema de negócio",
        description: "Descreva o cenário que deseja simular.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke("erp-simulator", {
        body: {
          business_problem: businessProblem,
          user_solution: userSolution,
          user_id: user?.id,
        },
      });
      if (error) throw error;
      setResult(data);
      toast({ title: "Simulação concluída!", description: "Confira a análise abaixo." });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Erro na simulação", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 lg:ml-64 overflow-y-auto pt-16 lg:pt-8 overscroll-contain">
        <div className="max-w-5xl mx-auto p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Simulador ERP</CardTitle>
              <CardDescription>Projete soluções ERP com orientação de IA</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="problem">Problema de negócio</Label>
                  <Textarea
                    id="problem"
                    value={businessProblem}
                    onChange={(e) => setBusinessProblem(e.target.value)}
                    placeholder="Ex: Falta de integração entre vendas e financeiro..."
                    className="min-h-32"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="solution">Sua proposta (opcional)</Label>
                  <Textarea
                    id="solution"
                    value={userSolution}
                    onChange={(e) => setUserSolution(e.target.value)}
                    placeholder="Como você resolveria usando ERP?"
                    className="min-h-24"
                  />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? "Processando..." : "Iniciar Simulação"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {result && (
            <Card>
              <CardHeader>
                <CardTitle>Resultado</CardTitle>
                <CardDescription>Análise detalhada</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg overflow-auto">
{JSON.stringify(result, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
