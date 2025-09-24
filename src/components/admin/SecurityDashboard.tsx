import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Shield, Activity, TrendingUp, Eye, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface SecurityEvent {
  id: string;
  event_type: string;
  event_data: any;
  created_at: string;
  user_id?: string;
}

interface ApiUsage {
  id: string;
  user_id: string;
  module_name: string;
  function_name: string;
  input_tokens: number;
  output_tokens: number;
  cost_estimate: number;
  created_at: string;
}

interface UsageStats {
  totalRequests: number;
  totalCost: number;
  totalTokens: number;
  hourlyAverage: number;
  topModules: Array<{ module: string; count: number; cost: number }>;
  topUsers: Array<{ user_id: string; count: number; cost: number }>;
}

export const SecurityDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [apiUsage, setApiUsage] = useState<ApiUsage[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Verificar se é admin
  if (!profile?.is_admin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Acesso Restrito</h3>
          <p className="text-muted-foreground">Apenas administradores podem acessar este dashboard.</p>
        </div>
      </div>
    );
  }

  const loadSecurityEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('security_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setSecurityEvents(data || []);
    } catch (error) {
      console.error('Erro ao carregar eventos de segurança:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os eventos de segurança.",
        variant: "destructive"
      });
    }
  };

  const loadApiUsage = async () => {
    try {
      const { data, error } = await supabase
        .from('user_api_usage')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setApiUsage(data || []);

      // Calcular estatísticas
      if (data && data.length > 0) {
        const last24h = data.filter(usage => {
          const usageTime = new Date(usage.created_at);
          const now = new Date();
          return (now.getTime() - usageTime.getTime()) < 24 * 60 * 60 * 1000;
        });

        const totalCost = last24h.reduce((sum, usage) => sum + (usage.cost_estimate || 0), 0);
        const totalTokens = last24h.reduce((sum, usage) => sum + (usage.input_tokens || 0) + (usage.output_tokens || 0), 0);

        // Agrupar por módulo
        const moduleStats = last24h.reduce((acc: any, usage) => {
          if (!acc[usage.module_name]) {
            acc[usage.module_name] = { count: 0, cost: 0 };
          }
          acc[usage.module_name].count++;
          acc[usage.module_name].cost += usage.cost_estimate || 0;
          return acc;
        }, {});

        const topModules = Object.entries(moduleStats)
          .map(([module, stats]: [string, any]) => ({ module, count: stats.count, cost: stats.cost }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Agrupar por usuário
        const userStats = last24h.reduce((acc: any, usage) => {
          if (!acc[usage.user_id]) {
            acc[usage.user_id] = { count: 0, cost: 0 };
          }
          acc[usage.user_id].count++;
          acc[usage.user_id].cost += usage.cost_estimate || 0;
          return acc;
        }, {});

        const topUsers = Object.entries(userStats)
          .map(([user_id, stats]: [string, any]) => ({ user_id, count: stats.count, cost: stats.cost }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setUsageStats({
          totalRequests: last24h.length,
          totalCost,
          totalTokens,
          hourlyAverage: last24h.length / 24,
          topModules,
          topUsers
        });
      }
    } catch (error) {
      console.error('Erro ao carregar uso da API:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar dados de uso da API.",
        variant: "destructive"
      });
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([loadSecurityEvents(), loadApiUsage()]);
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD' }).format(value);

  const formatDate = (dateString: string) => 
    new Intl.DateTimeFormat('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    }).format(new Date(dateString));

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'rate_limit_check': return 'bg-yellow-500';
      case 'access_denied': return 'bg-red-500';
      case 'access_check': return 'bg-green-500';
      default: return 'bg-blue-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Carregando dashboard de segurança..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-terminal-text">Security Dashboard</h1>
          <p className="text-muted-foreground">Monitoramento de segurança e uso da plataforma</p>
        </div>
        <Button onClick={refreshData} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="usage">Uso da API</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {usageStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Requisições (24h)</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{usageStats.totalRequests}</div>
                  <p className="text-xs text-muted-foreground">
                    {usageStats.hourlyAverage.toFixed(1)} req/hora
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Custo Estimado</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(usageStats.totalCost)}</div>
                  <p className="text-xs text-muted-foreground">Últimas 24 horas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tokens Processados</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{usageStats.totalTokens.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Input + Output</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Eventos de Segurança</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{securityEvents.length}</div>
                  <p className="text-xs text-muted-foreground">Últimos 50 eventos</p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Eventos de Segurança Recentes</CardTitle>
              <CardDescription>Monitoramento de tentativas de acesso e verificações</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {securityEvents.slice(0, 10).map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getEventTypeColor(event.event_type)}`} />
                      <div>
                        <p className="font-medium">{event.event_type}</p>
                        <p className="text-sm text-muted-foreground">
                          {event.user_id ? `Usuário: ${event.user_id.slice(0, 8)}...` : 'Sistema'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{formatDate(event.created_at)}</p>
                      {event.event_data && (
                        <Badge variant="outline" className="text-xs">
                          {Object.keys(event.event_data).length} dados
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                {securityEvents.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum evento de segurança registrado
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          {usageStats && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Módulos Mais Usados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {usageStats.topModules.map((module, index) => (
                        <div key={module.module} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{index + 1}</Badge>
                            <span className="font-medium">{module.module}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{module.count} req</p>
                            <p className="text-xs text-muted-foreground">{formatCurrency(module.cost)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Usuários Mais Ativos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {usageStats.topUsers.map((user, index) => (
                        <div key={user.user_id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{index + 1}</Badge>
                            <span className="font-mono text-sm">{user.user_id.slice(0, 8)}...</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{user.count} req</p>
                            <p className="text-xs text-muted-foreground">{formatCurrency(user.cost)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Uso Recente da API</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {apiUsage.slice(0, 20).map((usage) => (
                      <div key={usage.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">{usage.module_name}</Badge>
                          <span className="text-sm">{usage.function_name}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{(usage.input_tokens || 0) + (usage.output_tokens || 0)} tokens</span>
                          <span>{formatCurrency(usage.cost_estimate || 0)}</span>
                          <span>{formatDate(usage.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};