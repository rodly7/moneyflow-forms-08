
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
  totalRechargeAmount: number;
  totalWithdrawalAmount: number;
  totalAmount: number;
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
    totalTransactions: 0,
    totalRechargeAmount: 0,
    totalWithdrawalAmount: 0,
    totalAmount: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    console.log('🔍 Debug - Démarrage fetchStats pour:', user?.id, profile?.role);
    
    if (!user?.id) {
      console.log('❌ Debug - Pas d\'utilisateur connecté');
      setLoading(false);
      return;
    }

    try {
      if (profile?.role === 'admin') {
        console.log('👑 Debug - Admin principal détecté');
        // Pour l'admin principal, récupérer toutes les données globales
        const [usersResult, agentsResult, transfersResult, withdrawalsResult, rechargesResult] = await Promise.all([
          supabase.from('profiles').select('id, role, country').neq('role', 'admin').neq('role', 'sub_admin'),
          supabase.from('agents').select('id, status, country'),
          supabase.from('transfers').select('id, amount, status').eq('status', 'completed'),
          supabase.from('withdrawals').select('id, amount, status').eq('status', 'completed'),
          supabase.from('recharges').select('id, amount, status').eq('status', 'completed')
        ]);

        const totalRechargeAmount = rechargesResult.data?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;
        const totalWithdrawalAmount = withdrawalsResult.data?.reduce((sum, w) => sum + (w.amount || 0), 0) || 0;

        const finalStats = {
          totalUsersManaged: usersResult.data?.length || 0,
          totalAgentsManaged: agentsResult.data?.length || 0,
          activeAgents: agentsResult.data?.filter(a => a.status === 'active').length || 0,
          quotaUtilization: 0,
          dailyRequests: 0,
          dailyLimit: 999999,
          pendingWithdrawals: 0,
          totalTransactions: (transfersResult.data?.length || 0) + (rechargesResult.data?.length || 0) + (withdrawalsResult.data?.length || 0),
          totalRechargeAmount,
          totalWithdrawalAmount,
          totalAmount: totalRechargeAmount + totalWithdrawalAmount
        };

        console.log('✅ Debug - Stats admin principal calculées:', finalStats);
        setStats(finalStats);
        
      } else if (profile?.role === 'sub_admin' && profile?.country) {
        console.log('🎯 Debug - Sous-admin détecté pour le pays:', profile.country);
        
        // Récupérer le quota journalier réel
        const today = new Date().toISOString().split('T')[0];
        console.log('📅 Debug - Date du jour:', today);

        // Compter les vraies demandes traitées aujourd'hui dans user_requests
        const { count: todayRequests, error: todayError } = await supabase
          .from('user_requests')
          .select('*', { count: 'exact', head: true })
          .eq('processed_by', user.id)
          .gte('processed_at', `${today}T00:00:00.000Z`)
          .lt('processed_at', `${today}T23:59:59.999Z`);

        console.log('📊 Debug - Vraies demandes traitées aujourd\'hui:', todayRequests);

        // Récupérer les paramètres de quota
        const { data: quotaSettings } = await supabase
          .from('sub_admin_quota_settings')
          .select('daily_limit')
          .eq('sub_admin_id', user.id)
          .single();

        const dailyLimit = quotaSettings?.daily_limit || 300;
        const dailyRequests = todayRequests || 0;
        const quotaUtilization = dailyLimit > 0 ? Math.round(dailyRequests / dailyLimit * 100) : 0;

        // Compter les utilisateurs et agents gérés dans le même pays
        const [usersResult, agentsResult, activeAgentsResult] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true })
            .eq('country', profile.country)
            .neq('role', 'admin')
            .neq('role', 'sub_admin'),
          supabase.from('agents').select('*', { count: 'exact', head: true })
            .eq('country', profile.country),
          supabase.from('agents').select('*', { count: 'exact', head: true })
            .eq('country', profile.country)
            .eq('status', 'active')
        ]);

        // Récupérer les IDs des agents de ce pays pour calculer les montants
        const { data: agentsData } = await supabase
          .from('agents')
          .select('user_id')
          .eq('country', profile.country);

        const agentUserIds = agentsData?.map(agent => agent.user_id).filter(Boolean) || [];
        console.log('🆔 Debug - IDs des agents pour', profile.country, ':', agentUserIds);

        let totalTransactions = 0;
        let pendingWithdrawals = 0;
        let totalRechargeAmount = 0;
        let totalWithdrawalAmount = 0;

        if (agentUserIds.length > 0) {
          // Calculer les montants des recharges effectuées par les agents de ce pays
          const { data: recharges } = await supabase
            .from('recharges')
            .select('amount')
            .in('provider_transaction_id', agentUserIds.map(id => id.toString()))
            .eq('status', 'completed');

          totalRechargeAmount = recharges?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;

          // Calculer les montants des retraits effectués par les agents de ce pays
          const { data: withdrawals } = await supabase
            .from('withdrawals')
            .select('amount, status')
            .in('user_id', agentUserIds)
            .eq('status', 'completed');

          totalWithdrawalAmount = withdrawals?.reduce((sum, w) => sum + (w.amount || 0), 0) || 0;

          // Compter les retraits en attente
          const { count: pendingCount } = await supabase
            .from('withdrawals')
            .select('*', { count: 'exact', head: true })
            .in('user_id', agentUserIds)
            .eq('status', 'pending');

          pendingWithdrawals = pendingCount || 0;

          // Compter toutes les transactions
          const { count: transactionCount } = await supabase
            .from('transfers')
            .select('*', { count: 'exact', head: true })
            .in('sender_id', agentUserIds)
            .eq('status', 'completed');

          totalTransactions = (transactionCount || 0) + (recharges?.length || 0) + (withdrawals?.length || 0);
        }

        const finalStats = {
          totalUsersManaged: usersResult.count || 0,
          totalAgentsManaged: agentsResult.count || 0,
          activeAgents: activeAgentsResult.count || 0,
          quotaUtilization,
          dailyRequests,
          dailyLimit,
          pendingWithdrawals,
          totalTransactions,
          totalRechargeAmount,
          totalWithdrawalAmount,
          totalAmount: totalRechargeAmount + totalWithdrawalAmount
        };

        console.log('✅ Debug - Statistiques sous-admin finales:', finalStats);
        setStats(finalStats);
      }
      
    } catch (error) {
      console.error('💥 Debug - Erreur lors de la récupération des stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🚀 Debug - Démarrage du hook useSubAdminStats pour:', profile?.role);
    fetchStats();
  }, [user?.id, profile?.role, profile?.country]);

  return { stats, loading, refetch: fetchStats };
};
