import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, MessageSquare, Navigation, Database, Table, Target } from "lucide-react";

interface ModuleInterfaceProps {
  moduleName: string;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

export const ModuleInterface = ({ moduleName, onSubmit, isLoading }: ModuleInterfaceProps) => {
  const [formData, setFormData] = useState<any>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const renderInterface = () => {
    switch (moduleName) {
      case 'curriculum_analysis':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="curriculum">Cole seu currículo completo</Label>
              <Textarea
                id="curriculum"
                placeholder="Cole aqui o texto completo do seu currículo..."
                className="min-h-32 md:min-h-48"
                value={formData.curriculum_text || ''}
                onChange={(e) => setFormData({...formData, curriculum_text: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="job_description">Descrição da vaga (opcional)</Label>
              <Textarea
                id="job_description"
                placeholder="Cole a descrição da vaga para análise comparativa..."
                className="min-h-20"
                value={formData.job_description || ''}
                onChange={(e) => setFormData({...formData, job_description: e.target.value})}
              />
            </div>
          </div>
        );

      case 'communication_lab':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="scenario">Tipo de comunicação</Label>
              <Select value={formData.scenario} onValueChange={(value) => setFormData({...formData, scenario: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cenário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email_to_director">E-mail para diretor</SelectItem>
                  <SelectItem value="negative_results_presentation">Apresentar resultados negativos</SelectItem>
                  <SelectItem value="client_proposal">Proposta para cliente</SelectItem>
                  <SelectItem value="team_feedback">Feedback para equipe</SelectItem>
                  <SelectItem value="project_update">Update de projeto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="user_text">Seu texto atual</Label>
              <Textarea
                id="user_text"
                placeholder="Cole ou escreva seu texto para análise e melhoria..."
                className="min-h-32 md:min-h-48"
                value={formData.user_text || ''}
                onChange={(e) => setFormData({...formData, user_text: e.target.value})}
                required
              />
            </div>
          </div>
        );

      case 'career_gps':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="career_history">Seu histórico profissional</Label>
              <Textarea
                id="career_history"
                placeholder="Descreva sua trajetória profissional, cargos, empresas, principais conquistas..."
                className="min-h-32"
                value={formData.career_history || ''}
                onChange={(e) => setFormData({...formData, career_history: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="skills">Suas principais competências</Label>
              <Textarea
                id="skills"
                placeholder="Liste suas habilidades técnicas e comportamentais..."
                className="min-h-20"
                value={formData.skills || ''}
                onChange={(e) => setFormData({...formData, skills: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="long_term_goal">Objetivo de carreira</Label>
              <Input
                id="long_term_goal"
                placeholder="Ex: Ser Diretor de Operações em 5 anos"
                value={formData.long_term_goal || ''}
                onChange={(e) => setFormData({...formData, long_term_goal: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="timeline_years">Prazo (anos)</Label>
              <Select value={formData.timeline_years?.toString()} onValueChange={(value) => setFormData({...formData, timeline_years: parseInt(value)})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o prazo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 ano</SelectItem>
                  <SelectItem value="2">2 anos</SelectItem>
                  <SelectItem value="3">3 anos</SelectItem>
                  <SelectItem value="5">5 anos</SelectItem>
                  <SelectItem value="10">10 anos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'erp_simulator':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="business_problem">Problema de negócio</Label>
              <Textarea
                id="business_problem"
                placeholder="Descreva um problema empresarial que gostaria de resolver com ERP (ex: controle de estoque, integração vendas-financeiro)..."
                className="min-h-32"
                value={formData.business_problem || ''}
                onChange={(e) => setFormData({...formData, business_problem: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="user_solution">Sua proposta de solução (opcional)</Label>
              <Textarea
                id="user_solution"
                placeholder="Como você resolveria este problema usando um ERP?"
                className="min-h-24"
                value={formData.user_solution || ''}
                onChange={(e) => setFormData({...formData, user_solution: e.target.value})}
              />
            </div>
          </div>
        );

      case 'spreadsheet_arena':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="challenge_type">Tipo de desafio</Label>
              <Select value={formData.challenge_type} onValueChange={(value) => setFormData({...formData, challenge_type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o desafio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="formula_calculation">Cálculo com fórmulas</SelectItem>
                  <SelectItem value="pivot_analysis">Tabela dinâmica</SelectItem>
                  <SelectItem value="conditional_formatting">Formatação condicional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="user_formula">Sua fórmula/abordagem</Label>
              <Input
                id="user_formula"
                placeholder="Ex: =PROCV(A2,B:C,2,FALSO)"
                value={formData.user_formula || ''}
                onChange={(e) => setFormData({...formData, user_formula: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="user_approach">Explicação da sua abordagem</Label>
              <Textarea
                id="user_approach"
                placeholder="Explique como você resolveria o desafio..."
                className="min-h-20"
                value={formData.user_approach || ''}
                onChange={(e) => setFormData({...formData, user_approach: e.target.value})}
              />
            </div>
          </div>
        );

      case 'bsc_strategic':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="company_name">Nome da empresa</Label>
              <Input
                id="company_name"
                placeholder="Nome da empresa para o BSC"
                value={formData.company_info?.name || ''}
                onChange={(e) => setFormData({
                  ...formData, 
                  company_info: {...(formData.company_info || {}), name: e.target.value}
                })}
                required
              />
            </div>
            <div>
              <Label htmlFor="company_sector">Setor</Label>
              <Input
                id="company_sector"
                placeholder="Ex: Tecnologia, Varejo, Saúde"
                value={formData.company_info?.sector || ''}
                onChange={(e) => setFormData({
                  ...formData, 
                  company_info: {...(formData.company_info || {}), sector: e.target.value}
                })}
              />
            </div>
            <div>
              <Label htmlFor="strategic_objectives">Objetivos estratégicos</Label>
              <Textarea
                id="strategic_objectives"
                placeholder="Liste os principais objetivos estratégicos da empresa (um por linha)..."
                className="min-h-32"
                value={formData.strategic_objectives_text || ''}
                onChange={(e) => {
                  const objectives = e.target.value.split('\n').filter(obj => obj.trim());
                  setFormData({
                    ...formData, 
                    strategic_objectives_text: e.target.value,
                    strategic_objectives: objectives
                  });
                }}
                required
              />
            </div>
          </div>
        );

      default:
        return (
          <div>
            <Label htmlFor="general_input">Descreva o que você quer praticar</Label>
            <Textarea
              id="general_input"
              placeholder="Digite sua pergunta ou desafio..."
              className="min-h-32"
              value={formData.general_input || ''}
              onChange={(e) => setFormData({...formData, general_input: e.target.value})}
              required
            />
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getModuleIcon(moduleName)}
          Dados da Simulação
        </CardTitle>
        <CardDescription>
          Preencha as informações para iniciar sua simulação
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {renderInterface()}
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Processando...' : 'Iniciar Simulação'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

const getModuleIcon = (moduleName: string) => {
  const icons = {
    curriculum_analysis: FileText,
    communication_lab: MessageSquare,
    career_gps: Navigation,
    erp_simulator: Database,
    spreadsheet_arena: Table,
    bsc_strategic: Target,
  };
  
  const IconComponent = icons[moduleName as keyof typeof icons] || FileText;
  return <IconComponent className="h-5 w-5 text-primary" />;
};