import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Download, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SpreadsheetMiniSheetProps {
  challengeData?: any;
  onSolutionSubmit: (data: { formula?: string; approach: string; file?: File }) => void;
  isLoading: boolean;
}

export default function SpreadsheetMiniSheet({ 
  challengeData, 
  onSolutionSubmit, 
  isLoading 
}: SpreadsheetMiniSheetProps) {
  const [userFormula, setUserFormula] = useState('');
  const [userApproach, setUserApproach] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.includes('spreadsheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
        setUploadedFile(file);
        toast({
          title: "Arquivo carregado",
          description: `${file.name} foi carregado com sucesso.`,
        });
      } else {
        toast({
          title: "Formato inválido",
          description: "Por favor, envie um arquivo Excel (.xlsx, .xls) ou CSV.",
          variant: "destructive",
        });
      }
    }
  };

  const downloadTemplate = () => {
    // Simular download de template - em produção seria um arquivo real
    const csvContent = `Nome,Idade,Cidade,Salario
João,25,São Paulo,5000
Maria,30,Rio de Janeiro,6000
Pedro,28,Belo Horizonte,5500
Ana,32,Salvador,7000`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_desafio.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Template baixado",
      description: "Use este arquivo como base para o desafio.",
    });
  };

  const handleSubmit = () => {
    if (!userApproach.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Descreva sua abordagem para resolver o desafio.",
        variant: "destructive",
      });
      return;
    }

    onSolutionSubmit({
      formula: userFormula,
      approach: userApproach,
      file: uploadedFile || undefined
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Save className="h-5 w-5" />
          Área de Trabalho
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Template Download */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium mb-1">Template do Desafio</h4>
              <p className="text-sm text-gray-600">
                Baixe o arquivo base para trabalhar
              </p>
            </div>
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Baixar Template
            </Button>
          </div>
        </div>

        {/* Fórmula (opcional) */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Fórmula Principal (opcional):
          </label>
          <Input
            placeholder="Ex: =PROCV(A2,Produtos!A:C,3,0)"
            value={userFormula}
            onChange={(e) => setUserFormula(e.target.value)}
            className="font-mono"
          />
          <p className="text-xs text-gray-500 mt-1">
            Informe a fórmula principal que você usou (se aplicável)
          </p>
        </div>

        {/* Abordagem */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Sua Abordagem/Estratégia *:
          </label>
          <Textarea
            placeholder="Descreva passo a passo como você resolveu o desafio:
1. Primeiro identifiquei...
2. Depois apliquei...
3. Por fim..."
            value={userApproach}
            onChange={(e) => setUserApproach(e.target.value)}
            rows={5}
            className="resize-none"
          />
        </div>

        {/* Upload de arquivo */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Upload da Solução:
          </label>
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600 mb-2">
              Envie seu arquivo Excel/CSV com a solução
            </p>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
            >
              Escolher Arquivo
            </label>
            
            {uploadedFile && (
              <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm">
                <span className="text-green-700">
                  ✓ {uploadedFile.name} ({Math.round(uploadedFile.size / 1024)} KB)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <Button 
          onClick={handleSubmit}
          disabled={isLoading || !userApproach.trim()}
          className="w-full"
          size="lg"
        >
          {isLoading ? 'Analisando Solução...' : 'Enviar Solução'}
        </Button>

        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
          <strong>Dica:</strong> Mesmo que você não tenha usado fórmulas complexas, 
          descreva detalhadamente sua abordagem na seção "Estratégia". 
          A IA avaliará sua lógica de resolução.
        </div>
      </CardContent>
    </Card>
  );
}