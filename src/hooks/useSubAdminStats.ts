
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SubAdminStats {
  totalUsersManaged: number;
  totalAgentsManaged: number;
  activeAgents: number;
  quotaUtilization: number;
  dailyRequests: number;
  dailyLimit: number;
  pendingWithdrawals: number;
  totalTransactions: number;
}

export const useSubAdminStats = () => {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<SubAdminStats>({
    totalUsersManaged: 0,
    totalAgentsManaged: 0,
    activeAgents: 0,
    quotaUtilization: 0,
    dailyRequests: 0,
    dailyLimit: 300,
    pendingWithdrawals: 0,
    totalTransactions: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    if (!user?.id || profile?.role !== 'sub_admin' || !profile?.country) {
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Récupération des statistiques du sous-admin pour:', profile.country);

      // Récupérer le quota journalier
      const { data: quotaSettings } = await supabase
        .from('sub_admin_quota_settings')
        .select('daily_limit')
        .eq('sub_admin_id', user.id)
        .single();

      const dailyLimit = quotaSettings?.daily_limit || 300;

      // Compter les demandes du jour
      const today = new Date().toISOString().split('T')[0];
      const { count: dailyRequests } = await supabase
        .from('user_requests')
        .select('*', { count: 'exact', head: true })
        .eq('processed_by', user.id)
        .gte('processed_at', `${today}T00:00:00.000Z`)
        .lt('processed_at', `${today}T23:59:59.999Z`);

      // Compter les utilisateurs gérés (même pays)
      const { count: totalUsersManaged } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('country', profile.country)
        .neq('role', 'admin')
        .neq('role', 'sub_admin');

      // Compter les agents gérés
      const { count: totalAgentsManaged } = await supabase
        .from('agents')
        .select('*', { count: 'exact', head: true })
        .eq('country', profile.country);

      // Compter les agents actifs
      const { count: activeAgents } = await supabase
        .from('agents')
        .select('*', { count: 'exact', head: true })
        .eq('country', profile.country)
        .eq('status', 'active');

      // Récupérer les agents de cette zone pour les transactions
      const { data: agentsData } = await supabase
        .from('agents')
        .select('user_id')
        .eq('country', profile.country);

      const agentUserIds = agentsData?.map(agent => agent.user_id).filter(Boolean) || [];

      let totalTransactions = 0;
      let pendingWithdrawals = 0;

      if (agentUserIds.length > 0) {
        // Compter les transactions
        const { count: transactionCount } = await supabase
          .from('transfers')
          .select('*', { count: 'exact', head: true })
          .in('sender_id', agentUserIds)
          .eq('status', 'completed');

        totalTransactions = transactionCount || 0;

        // Compter les retraits en attente
        const { count: withdrawalCount } = await supabase
          .from('withdrawals')
          .select('*', { count: 'exact', head: true })
          .in('user_id', agentUserIds)
          .eq('status', 'pending');

        pendingWithdrawals = withdrawalCount || 0;
      }

      const quotaUtilization = dailyLimit > 0 ? Math.round((dailyRequests || 0) / dailyLimit * 100) : 0;

      setStats({
        totalUsersManaged: totalUsersManaged || 0,
        totalAgentsManaged: totalAgentsManaged || 0,
        activeAgents: activeAgents || 0,
        quotaUtilization,
        dailyRequests: dailyRequests || 0,
        dailyLimit,
        pendingWithdrawals: pendingWithdrawals || 0,
        totalTransactions: totalTransactions || 0
      });

      console.log('✅ Statistiques récupérées:', {
        totalUsersManaged: totalUsersManaged || 0,
        totalAgentsManaged: totalAgentsManaged || 0,
        activeAgents: activeAgents || 0,
        quotaUtilization,
        dailyRequests: dailyRequests || 0,
        totalTransactions: totalTransactions || 0
      });

    } catch (error) {
      console.error('❌ Erreur récupération statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user?.id, profile?.role, profile?.country]);

  return { stats, loading, refetch: fetchStats };
};
