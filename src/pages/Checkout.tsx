import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Check } from "lucide-react";
import { Link } from "react-router-dom";

export default function Checkout() {
  const [plan, setPlan] = useState<'monthly' | 'annual'>('annual');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  });

  const prices = {
    monthly: { value: 97, discount: 0 },
    annual: { value: 697, discount: 467 },
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aqui será implementada a integração com Hotmart
    console.log('Processando pagamento...', { plan, ...formData });
    // Redirecionar para página de confirmação
    // navigate('/confirmation');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link 
          to="/"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar à página inicial
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulário de Pagamento */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
                <CardDescription>
                  Preencha seus dados para finalizar a compra
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Seu nome completo"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="seu@email.com"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => handleInputChange('cpf', e.target.value)}
                    placeholder="000.000.000-00"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dados do Cartão</CardTitle>
                <CardDescription>
                  Informações seguras do seu cartão de crédito
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Número do Cartão</Label>
                  <Input
                    id="cardNumber"
                    value={formData.cardNumber}
                    onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                    placeholder="0000 0000 0000 0000"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Validade</Label>
                    <Input
                      id="expiryDate"
                      value={formData.expiryDate}
                      onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                      placeholder="MM/AA"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      value={formData.cvv}
                      onChange={(e) => handleInputChange('cvv', e.target.value)}
                      placeholder="000"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resumo do Pedido */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Escolha seu Plano</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      plan === 'annual' ? 'border-primary bg-primary/5' : 'border-gray-200'
                    }`}
                    onClick={() => setPlan('annual')}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">Plano Anual</h3>
                        <p className="text-sm text-gray-600">Economize R$ 467</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500 line-through">R$ 1.164</div>
                        <div className="text-xl font-bold text-primary">R$ 697</div>
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      plan === 'monthly' ? 'border-primary bg-primary/5' : 'border-gray-200'
                    }`}
                    onClick={() => setPlan('monthly')}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">Plano Mensal</h3>
                        <p className="text-sm text-gray-600">Sem compromisso</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">R$ 97</div>
                        <div className="text-sm text-gray-500">/mês</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>O que está incluído</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Acesso ao BussulaC</p>
                    <p className="text-sm text-gray-600">Análises diárias de inteligência estratégica</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Formação Analista Estratégico</p>
                    <p className="text-sm text-gray-600">Curso completo com 4 módulos práticos</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Comunidade Exclusiva</p>
                    <p className="text-sm text-gray-600">Acesso ao grupo Data-Driven Minds</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Frameworks Práticos</p>
                    <p className="text-sm text-gray-600">Modelos para análises estratégicas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Plano {plan === 'annual' ? 'Anual' : 'Mensal'}</span>
                  <span>R$ {prices[plan].value}</span>
                </div>
                
                {plan === 'annual' && (
                  <div className="flex justify-between text-primary">
                    <span>Desconto</span>
                    <span>-R$ {prices[plan].discount}</span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>R$ {prices[plan].value}</span>
                </div>
                
                <Button 
                  onClick={handleSubmit}
                  className="w-full"
                  size="lg"
                >
                  Finalizar Compra
                </Button>
                
                <p className="text-xs text-gray-500 text-center">
                  Pagamento seguro processado pela Hotmart
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}