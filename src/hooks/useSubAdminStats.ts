
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
      console.log('🚫 Debug - Conditions non remplies:', {
        userId: user?.id,
        role: profile?.role,
        country: profile?.country
      });
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Debug - Récupération des statistiques pour:', {
        userId: user.id,
        role: profile.role,
        country: profile.country
      });

      // Récupérer le quota journalier
      const { data: quotaSettings, error: quotaError } = await supabase
        .from('sub_admin_quota_settings')
        .select('daily_limit')
        .eq('sub_admin_id', user.id)
        .single();

      console.log('📏 Debug - Quota settings:', { quotaSettings, quotaError });

      const dailyLimit = quotaSettings?.daily_limit || 300;

      // Compter les demandes du jour
      const today = new Date().toISOString().split('T')[0];
      console.log('📅 Debug - Date du jour:', today);
      
      const { count: dailyRequests, error: dailyError } = await supabase
        .from('sub_admin_daily_requests')
        .select('*', { count: 'exact', head: true })
        .eq('sub_admin_id', user.id)
        .eq('date', today);

      console.log('📊 Debug - Demandes du jour:', { dailyRequests, dailyError });

      // Compter les utilisateurs gérés (même pays)
      const { count: totalUsersManaged, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('country', profile.country)
        .neq('role', 'admin')
        .neq('role', 'sub_admin');

      console.log('👥 Debug - Utilisateurs gérés:', { totalUsersManaged, usersError, country: profile.country });

      // Compter les agents gérés
      const { count: totalAgentsManaged, error: agentsError } = await supabase
        .from('agents')
        .select('*', { count: 'exact', head: true })
        .eq('country', profile.country);

      console.log('🔧 Debug - Agents gérés:', { totalAgentsManaged, agentsError });

      // Compter les agents actifs
      const { count: activeAgents, error: activeAgentsError } = await supabase
        .from('agents')
        .select('*', { count: 'exact', head: true })
        .eq('country', profile.country)
        .eq('status', 'active');

      console.log('✅ Debug - Agents actifs:', { activeAgents, activeAgentsError });

      // Récupérer les agents de cette zone pour les transactions
      const { data: agentsData, error: agentsDataError } = await supabase
        .from('agents')
        .select('user_id')
        .eq('country', profile.country);

      console.log('🎯 Debug - Données agents pour transactions:', { agentsData, agentsDataError });

      const agentUserIds = agentsData?.map(agent => agent.user_id).filter(Boolean) || [];
      console.log('🆔 Debug - IDs des agents:', agentUserIds);

      let totalTransactions = 0;
      let pendingWithdrawals = 0;

      if (agentUserIds.length > 0) {
        // Compter les transactions
        const { count: transactionCount, error: transactionError } = await supabase
          .from('transfers')
          .select('*', { count: 'exact', head: true })
          .in('sender_id', agentUserIds)
          .eq('status', 'completed');

        console.log('💸 Debug - Transactions:', { transactionCount, transactionError });
        totalTransactions = transactionCount || 0;

        // Compter les retraits en attente
        const { count: withdrawalCount, error: withdrawalError } = await supabase
          .from('withdrawals')
          .select('*', { count: 'exact', head: true })
          .in('user_id', agentUserIds)
          .eq('status', 'pending');

        console.log('💰 Debug - Retraits en attente:', { withdrawalCount, withdrawalError });
        pendingWithdrawals = withdrawalCount || 0;
      } else {
        console.log('⚠️ Debug - Aucun agent trouvé pour ce pays');
      }

      const quotaUtilization = dailyLimit > 0 ? Math.round((dailyRequests || 0) / dailyLimit * 100) : 0;

      const finalStats = {
        totalUsersManaged: totalUsersManaged || 0,
        totalAgentsManaged: totalAgentsManaged || 0,
        activeAgents: activeAgents || 0,
        quotaUtilization,
        dailyRequests: dailyRequests || 0,
        dailyLimit,
        pendingWithdrawals: pendingWithdrawals || 0,
        totalTransactions: totalTransactions || 0
      };

      console.log('✅ Debug - Statistiques finales calculées:', finalStats);
      setStats(finalStats);

    } catch (error) {
      console.error('💥 Debug - Erreur lors de la récupération:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🚀 Debug - Démarrage du hook useSubAdminStats');
    fetchStats();
  }, [user?.id, profile?.role, profile?.country]);

  return { stats, loading, refetch: fetchStats };
};
