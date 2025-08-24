
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, Activity, TrendingUp, AlertCircle, DollarSign } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils/currency';

interface AdminStats {
  totalUsers: number;
  totalAgents: number;
  activeAgents: number;
  totalTransactions: number;
  totalVolume: number;
  pendingWithdrawals: number;
  totalRecharges: number;
  rechargeVolume: number;
}

const AdminGlobalStats = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-global-stats'],
    queryFn: async (): Promise<AdminStats> => {
      console.log('🔍 Récupération des statistiques globales admin...');

      // Récupérer tous les utilisateurs
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .neq('role', 'admin');

      // Récupérer tous les agents
      const { data: agents } = await supabase
        .from('agents')
        .select('id, status');

      const totalAgents = agents?.length || 0;
      const activeAgents = agents?.filter(a => a.status === 'active').length || 0;

      // Récupérer toutes les transactions complétées
      const { data: transfers } = await supabase
        .from('transfers')
        .select('amount')
        .eq('status', 'completed');

      const totalTransactions = transfers?.length || 0;
      const totalVolume = transfers?.reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0;

      // Récupérer tous les retraits en attente
      const { count: pendingWithdrawals } = await supabase
        .from('withdrawals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Récupérer toutes les recharges complétées
      const { data: recharges } = await supabase
        .from('recharges')
        .select('amount')
        .eq('status', 'completed');

      const totalRecharges = recharges?.length || 0;
      const rechargeVolume = recharges?.reduce((sum, r) => sum + Number(r.amount || 0), 0) || 0;

      const result = {
        totalUsers: totalUsers || 0,
        totalAgents,
        activeAgents,
        totalTransactions,
        totalVolume,
        pendingWithdrawals: pendingWithdrawals || 0,
        totalRecharges,
        rechargeVolume
      };

      console.log('✅ Statistiques globales admin calculées:', result);
      return result;
    },
    refetchInterval: 60000 // Actualiser toutes les minutes
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Utilisateurs totaux</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {stats.totalUsers}
          </div>
          <span className="text-xs text-gray-500">Dans toutes les zones</span>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-green-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Agents</span>
            <UserCheck className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-600">
            {stats.activeAgents}/{stats.totalAgents}
          </div>
          <span className="text-xs text-gray-500">Actifs/Total</span>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-purple-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Volume transferts</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {formatCurrency(stats.totalVolume, 'XAF')}
          </div>
          <span className="text-xs text-gray-500">{stats.totalTransactions} transactions</span>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-orange-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Volume recharges</span>
            <DollarSign className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-orange-600">
            {formatCurrency(stats.rechargeVolume, 'XAF')}
          </div>
          {stats.pendingWithdrawals > 0 && (
            <Badge variant="outline" className="text-xs text-orange-600">
              <AlertCircle className="w-3 h-3 mr-1" />
              {stats.pendingWithdrawals} retraits en attente
            </Badge>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminGlobalStats;
