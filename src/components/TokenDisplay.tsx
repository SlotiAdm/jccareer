import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Gem, RefreshCw } from 'lucide-react';

export function TokenDisplay() {
  const { profile } = useAuth();
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTokenBalance = async () => {
    if (!profile?.user_id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('token_balance, is_admin')
        .eq('user_id', profile.user_id)
        .single();

      if (error) throw error;
      
      setTokenBalance(data.token_balance);
    } catch (error) {
      console.error('Error fetching token balance:', error);
      setTokenBalance(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokenBalance();
  }, [profile?.user_id]);

  // Refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchTokenBalance, 30000);
    return () => clearInterval(interval);
  }, [profile?.user_id]);

  if (loading || !profile?.user_id) {
    return null;
  }

  // Admins have infinite tokens
  if (profile.is_admin) {
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <Gem className="h-3 w-3 text-yellow-500" />
        <span>∞ Admin</span>
      </Badge>
    );
  }

  const getTokenColor = (balance: number) => {
    if (balance > 300) return 'text-green-600';
    if (balance > 100) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="flex items-center gap-1">
        <Gem className={`h-3 w-3 ${getTokenColor(tokenBalance || 0)}`} />
        <span className={getTokenColor(tokenBalance || 0)}>
          {tokenBalance || 0} Tokens
        </span>
      </Badge>
      <button
        onClick={fetchTokenBalance}
        disabled={loading}
        className="p-1 hover:bg-muted rounded opacity-50 hover:opacity-100 transition-opacity"
        title="Atualizar saldo"
      >
        <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
}