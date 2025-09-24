import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Upload, Download, Copy, Loader2, CheckCircle, Target, Zap, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function ResumeAnalyzer() {
  const [originalResume, setOriginalResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [uploadMethod, setUploadMethod] = useState<"text" | "file">("text");
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    document.title = "Raio-X de Currículo - BussulaC";
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('text') && !file.type.includes('pdf') && !file.type.includes('doc')) {
      toast({
        title: "Formato não suportado",
        description: "Por favor, envie um arquivo PDF, DOC/DOCX ou TXT.",
        variant: "destructive"
      });
      return;
    }

    try {
      const text = await file.text();
      setOriginalResume(text);
      toast({
        title: "Arquivo carregado",
        description: "Seu currículo foi carregado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao ler arquivo",
        description: "Não foi possível ler o conteúdo do arquivo.",
        variant: "destructive"
      });
    }
  };

  const handleAnalyzeResume = async () => {
    if (!originalResume.trim() || !jobDescription.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha seu currículo e a descrição da vaga.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('resume-analyzer', {
        body: {
          originalResume: originalResume.trim(),
          jobDescription: jobDescription.trim(),
          user_id: user?.id
        }
      });

      if (error) {
        const message = (data as any)?.error || error.message || 'Erro ao gerar currículo';
        throw new Error(message);
      }

      setResult(data);
      toast({
        title: "Análise concluída!",
        description: "Seu currículo estratégico foi gerado com sucesso.",
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Currículo copiado para a área de transferência.",
    });
  };

  const downloadAsDoc = () => {
    const element = document.createElement("a");
    const file = new Blob([result.optimizedResume], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "curriculo_estrategico_bussulaC.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
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
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Raio-X de Currículo</CardTitle>
                  <CardDescription className="text-lg mt-1">
                    Transforme seu currículo-documento em uma máquina de marketing pessoal que passa por robôs (ATS) e impressiona humanos.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          {!result ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input Area */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Seu Currículo Atual
                  </CardTitle>
                  <CardDescription>
                    Escolha como enviar seu currículo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      variant={uploadMethod === "text" ? "default" : "outline"}
                      onClick={() => setUploadMethod("text")}
                      size="sm"
                    >
                      Colar Texto
                    </Button>
                    <Button
                      variant={uploadMethod === "file" ? "default" : "outline"}
                      onClick={() => setUploadMethod("file")}
                      size="sm"
                    >
                      Upload de Arquivo
                    </Button>
                  </div>

                  {uploadMethod === "text" ? (
                    <Textarea
                      placeholder="Cole aqui o conteúdo do seu currículo atual..."
                      value={originalResume}
                      onChange={(e) => setOriginalResume(e.target.value)}
                      className="min-h-[300px] resize-none"
                    />
                  ) : (
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        accept=".txt,.pdf,.doc,.docx"
                        className="hidden"
                        id="resume-upload"
                      />
                      <label htmlFor="resume-upload" className="cursor-pointer">
                        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-lg font-medium mb-2">
                          Clique para fazer upload do seu currículo
                        </p>
                        <p className="text-sm text-muted-foreground">
                          PDF, DOC, DOCX ou TXT (máx. 5MB)
                        </p>
                      </label>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Job Description Area */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Descrição da Vaga Alvo
                  </CardTitle>
                  <CardDescription>
                    Cole aqui a descrição completa da vaga desejada
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Cole aqui a descrição completa da vaga que você deseja aplicar, incluindo requisitos, responsabilidades e competências desejadas..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="min-h-[300px] resize-none"
                  />
                </CardContent>
              </Card>
            </div>
          ) : null}

          {/* Action Button */}
          {!result && (
            <div className="mt-6 text-center">
              <Button
                onClick={handleAnalyzeResume}
                disabled={isLoading || !originalResume.trim() || !jobDescription.trim()}
                className="px-8 py-3 text-lg"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Gerando seu Currículo Estratégico...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-5 w-5" />
                    Gerar meu Currículo Estratégico
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Generated Resume */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Seu Currículo Estratégico
                      </CardTitle>
                      <CardDescription>
                        Currículo otimizado usando metodologia STAR e palavras-chave da vaga
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(result.optimizedResume)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copiar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadAsDoc}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Baixar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm font-mono">
                        {result.optimizedResume}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Analysis Notes */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      Notas do Estrategista
                    </CardTitle>
                    <CardDescription>
                      Principais alterações realizadas
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {result.score && (
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary mb-2">
                          {result.score}%
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Score de Otimização
                        </p>
                      </div>
                    )}

                    <Separator />

                    {result.improvementNotes?.keywordOptimization && (
                      <div>
                        <h4 className="font-semibold mb-2">🎯 Otimização ATS</h4>
                        <div className="flex flex-wrap gap-1">
                          {result.improvementNotes.keywordOptimization.map((keyword: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.improvementNotes?.starMethodology && (
                      <div>
                        <h4 className="font-semibold mb-2">⭐ Metodologia STAR</h4>
                        <ul className="text-sm space-y-1">
                          {result.improvementNotes.starMethodology.map((item: string, index: number) => (
                            <li key={index} className="text-muted-foreground">
                              • {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.improvementNotes?.structuralChanges && (
                      <div>
                        <h4 className="font-semibold mb-2">🔧 Mudanças Estruturais</h4>
                        <ul className="text-sm space-y-1">
                          {result.improvementNotes.structuralChanges.map((change: string, index: number) => (
                            <li key={index} className="text-muted-foreground">
                              • {change}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setResult(null);
                      setOriginalResume("");
                      setJobDescription("");
                    }}
                  >
                    Nova Análise
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}