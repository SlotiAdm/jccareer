import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, Zap, TrendingUp, RefreshCw, Calendar } from 'lucide-react';

interface ApiCostLog {
  id: string;
  created_at: string;
  user_id: string;
  module_name: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated_cost: number;
  model_used: string;
}

interface DashboardStats {
  totalCost: number;
  totalTokens: number;
  totalCalls: number;
  avgCostPerCall: number;
}

export function ApiCostDashboard() {
  const [logs, setLogs] = useState<ApiCostLog[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalCost: 0,
    totalTokens: 0,
    totalCalls: 0,
    avgCostPerCall: 0
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7');

  const fetchData = async () => {
    setLoading(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeRange));

      const { data: logsData, error } = await supabase
        .from('api_cost_logs')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      setLogs(logsData || []);

      // Calculate stats
      const totalCost = logsData?.reduce((sum, log) => sum + (log.estimated_cost || 0), 0) || 0;
      const totalTokens = logsData?.reduce((sum, log) => sum + log.total_tokens, 0) || 0;
      const totalCalls = logsData?.length || 0;
      const avgCostPerCall = totalCalls > 0 ? totalCost / totalCalls : 0;

      setStats({
        totalCost,
        totalTokens,
        totalCalls,
        avgCostPerCall
      });
    } catch (error) {
      console.error('Error fetching API cost data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  // Prepare data for charts
  const moduleUsageData = logs.reduce((acc, log) => {
    const existing = acc.find(item => item.module === log.module_name);
    if (existing) {
      existing.tokens += log.total_tokens;
      existing.cost += log.estimated_cost || 0;
      existing.calls += 1;
    } else {
      acc.push({
        module: log.module_name,
        tokens: log.total_tokens,
        cost: log.estimated_cost || 0,
        calls: 1
      });
    }
    return acc;
  }, [] as Array<{module: string, tokens: number, cost: number, calls: number}>);

  // Daily usage data
  const dailyUsageData = logs.reduce((acc, log) => {
    const date = new Date(log.created_at).toLocaleDateString('pt-BR');
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.tokens += log.total_tokens;
      existing.cost += log.estimated_cost || 0;
      existing.calls += 1;
    } else {
      acc.push({
        date,
        tokens: log.total_tokens,
        cost: log.estimated_cost || 0,
        calls: 1
      });
    }
    return acc;
  }, [] as Array<{date: string, tokens: number, cost: number, calls: number}>).reverse();

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Dashboard de Custos API</h2>
          <p className="text-muted-foreground">
            Monitoramento de uso e custos da OpenAI API
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Última 24h</SelectItem>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchData} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalCost.toFixed(4)}
            </div>
            <p className="text-xs text-muted-foreground">
              Últimos {timeRange} dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Tokens</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalTokens.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Tokens processados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chamadas API</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalCalls}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de requisições
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Médio</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.avgCostPerCall.toFixed(4)}
            </div>
            <p className="text-xs text-muted-foreground">
              Por chamada
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage by Module */}
        <Card>
          <CardHeader>
            <CardTitle>Uso por Módulo</CardTitle>
            <CardDescription>Tokens utilizados por ferramenta</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={moduleUsageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="module" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'tokens' ? (value as number).toLocaleString() : `$${(value as number).toFixed(4)}`,
                    name === 'tokens' ? 'Tokens' : 'Custo'
                  ]}
                />
                <Bar dataKey="tokens" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Daily Usage Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Tendência Diária</CardTitle>
            <CardDescription>Uso de tokens ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyUsageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'tokens' ? value.toLocaleString() : value,
                    name === 'tokens' ? 'Tokens' : 'Chamadas'
                  ]}
                />
                <Line type="monotone" dataKey="tokens" stroke="#8884d8" />
                <Line type="monotone" dataKey="calls" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Module Distribution Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Custos por Módulo</CardTitle>
          <CardDescription>Proporção dos custos por ferramenta</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={moduleUsageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ module, percent }) => `${module} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="cost"
                >
                  {moduleUsageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${(value as number).toFixed(4)}`, 'Custo']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
          <CardDescription>Últimas 10 chamadas à API</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {logs.slice(0, 10).map((log) => (
              <div key={log.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{log.module_name}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {new Date(log.created_at).toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{log.total_tokens} tokens</span>
                  <span className="text-sm font-medium">${log.estimated_cost?.toFixed(4)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}