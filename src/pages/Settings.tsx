import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, CreditCard, Shield, ExternalLink } from "lucide-react";

export default function Settings() {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: profile?.full_name || '',
    cpfCnpj: profile?.cpf_cnpj || '',
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          cpf_cnpj: formData.cpfCnpj,
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSubscriptionStatus = () => {
    switch (profile?.subscription_status) {
      case 'active':
        return { label: 'Ativa', variant: 'default' as const, color: 'bg-green-100 text-green-800' };
      case 'cancelled':
        return { label: 'Cancelada', variant: 'secondary' as const, color: 'bg-red-100 text-red-800' };
      default:
        return { label: 'Inativa', variant: 'outline' as const, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const status = getSubscriptionStatus();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 ml-64 overflow-y-auto">
        <div className="p-8 max-w-4xl mx-auto space-y-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Configurações da Conta
            </h1>
            <p className="text-gray-600">
              Gerencie suas informações pessoais e configurações de assinatura
            </p>
          </div>

          {/* Informações Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Pessoais
              </CardTitle>
              <CardDescription>
                Atualize seus dados pessoais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome Completo</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Seu nome completo"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500">
                      Para alterar o email, entre em contato com o suporte
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
                  <Input
                    id="cpfCnpj"
                    value={formData.cpfCnpj}
                    onChange={(e) => setFormData(prev => ({ ...prev, cpfCnpj: e.target.value }))}
                    placeholder="000.000.000-00"
                  />
                </div>
                
                <Button type="submit" disabled={loading}>
                  {loading ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Status da Assinatura */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Status da Assinatura
              </CardTitle>
              <CardDescription>
                Informações sobre sua assinatura do Terminal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Status</Label>
                  <div className="mt-1">
                    <Badge className={status.color}>
                      {status.label}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700">Plano</Label>
                  <p className="mt-1 text-sm text-gray-900">
                    {profile?.subscription_plan === 'annual' ? 'Anual' : 
                     profile?.subscription_plan === 'monthly' ? 'Mensal' : 'N/A'}
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700">Início da Assinatura</Label>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatDate(profile?.subscription_start_date)}
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700">Próxima Cobrança</Label>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatDate(profile?.subscription_end_date)}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Gerenciar Assinatura</h4>
                <p className="text-sm text-gray-600">
                  Para cancelar, pausar ou atualizar seu método de pagamento, 
                  acesse o portal de gerenciamento da Hotmart.
                </p>
                
                <Button variant="outline" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Gerenciar na Hotmart
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Segurança */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Segurança
              </CardTitle>
              <CardDescription>
                Configurações de segurança da sua conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Alterar Senha</Label>
                <p className="text-sm text-gray-600 mt-1 mb-3">
                  Para alterar sua senha, use o link "Esqueci minha senha" na tela de login.
                </p>
                <Button variant="outline" size="sm">
                  Solicitar Alteração de Senha
                </Button>
              </div>
              
              <Separator />
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Conta Cadastrada em</Label>
                <p className="text-sm text-gray-900 mt-1">
                  {formatDate(profile?.created_at)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Suporte */}
          <Card>
            <CardHeader>
              <CardTitle>Precisa de Ajuda?</CardTitle>
              <CardDescription>
                Nossa equipe está aqui para ajudar você
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Se você tem dúvidas sobre sua assinatura, acesso ao conteúdo ou 
                  questões técnicas, entre em contato conosco.
                </p>
                
                <div className="flex gap-3">
                  <Button variant="outline" size="sm">
                    Falar com Suporte
                  </Button>
                  <Button variant="outline" size="sm">
                    Central de Ajuda
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}