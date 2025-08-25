
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
    if (!user?.id || !profile) {
      console.log('❌ Pas d\'utilisateur ou de profil connecté');
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Récupération des stats pour:', { userId: user.id, role: profile.role, country: profile.country });

      if (profile.role === 'admin') {
        // Admin principal - toutes les données globales
        console.log('👑 Mode admin principal - récupération des données globales');
        
        const [usersResult, agentsResult, withdrawalsResult, rechargesResult, transfersResult] = await Promise.all([
          // Tous les utilisateurs sauf admins
          supabase
            .from('profiles')
            .select('id, role, country')
            .neq('role', 'admin')
            .neq('role', 'sub_admin'),
          
          // Tous les agents
          supabase
            .from('agents')
            .select('id, status, user_id, country'),
          
          // Tous les retraits
          supabase
            .from('withdrawals')
            .select('id, amount, status')
            .eq('status', 'completed'),
          
          // Toutes les recharges
          supabase
            .from('recharges')
            .select('id, amount, status')
            .eq('status', 'completed'),
          
          // Tous les transferts
          supabase
            .from('transfers')
            .select('id, amount, status')
            .eq('status', 'completed')
        ]);

        console.log('📊 Données globales récupérées:', {
          users: usersResult.data?.length,
          agents: agentsResult.data?.length,
          withdrawals: withdrawalsResult.data?.length,
          recharges: rechargesResult.data?.length,
          transfers: transfersResult.data?.length
        });

        const totalRechargeAmount = rechargesResult.data?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;
        const totalWithdrawalAmount = withdrawalsResult.data?.reduce((sum, w) => sum + (w.amount || 0), 0) || 0;
        const totalTransferAmount = transfersResult.data?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

        const finalStats = {
          totalUsersManaged: usersResult.data?.length || 0,
          totalAgentsManaged: agentsResult.data?.length || 0,
          activeAgents: agentsResult.data?.filter(a => a.status === 'active').length || 0,
          quotaUtilization: 0, // Pas de quota pour l'admin principal
          dailyRequests: 0,
          dailyLimit: 999999,
          pendingWithdrawals: 0,
          totalTransactions: (transfersResult.data?.length || 0) + (rechargesResult.data?.length || 0) + (withdrawalsResult.data?.length || 0),
          totalRechargeAmount,
          totalWithdrawalAmount,
          totalAmount: totalRechargeAmount + totalWithdrawalAmount + totalTransferAmount
        };

        console.log('✅ Stats admin principal:', finalStats);
        setStats(finalStats);
        
      } else if (profile.role === 'sub_admin') {
        console.log('🎯 Mode sous-admin pour le pays:', profile.country);
        
        // 1. Récupérer le quota journalier réel
        const today = new Date().toISOString().split('T')[0];
        
        // Compter les demandes traitées aujourd'hui par ce sous-admin
        const { count: todayRequests } = await supabase
          .from('user_requests')
          .select('*', { count: 'exact', head: true })
          .eq('processed_by', user.id)
          .gte('created_at', `${today}T00:00:00.000Z`)
          .lt('created_at', `${today}T23:59:59.999Z`);

        console.log('📊 Demandes traitées aujourd\'hui:', todayRequests);

        // 2. Récupérer les paramètres de quota
        const { data: quotaSettings } = await supabase
          .from('sub_admin_quota_settings')
          .select('daily_limit')
          .eq('sub_admin_id', user.id)
          .maybeSingle();

        const dailyLimit = quotaSettings?.daily_limit || 300;
        const dailyRequests = todayRequests || 0;
        const quotaUtilization = dailyLimit > 0 ? Math.round((dailyRequests / dailyLimit) * 100) : 0;

        console.log('⚙️ Quota settings:', { dailyRequests, dailyLimit, quotaUtilization });

        // 3. Récupérer les utilisateurs et agents dans le même pays
        const [usersResult, agentsResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('country', profile.country)
            .neq('role', 'admin')
            .neq('role', 'sub_admin'),
          
          supabase
            .from('agents')
            .select('user_id, status')
            .eq('country', profile.country)
        ]);

        const agentUserIds = agentsResult.data?.map(agent => agent.user_id).filter(Boolean) || [];
        const activeAgentsCount = agentsResult.data?.filter(a => a.status === 'active').length || 0;

        console.log('👥 Agents du pays:', { 
          total: agentsResult.data?.length,
          active: activeAgentsCount,
          userIds: agentUserIds 
        });

        // 4. Calculer les montants financiers pour les agents de ce pays
        let totalRechargeAmount = 0;
        let totalWithdrawalAmount = 0;
        let totalTransactions = 0;
        let pendingWithdrawals = 0;

        if (agentUserIds.length > 0) {
          // Recharges effectuées par les agents
          const { data: recharges } = await supabase
            .from('recharges')
            .select('amount, status')
            .in('user_id', agentUserIds)
            .eq('status', 'completed');

          totalRechargeAmount = recharges?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;

          // Retraits effectués par les agents
          const { data: withdrawals } = await supabase
            .from('withdrawals')
            .select('amount, status')
            .in('user_id', agentUserIds);

          const completedWithdrawals = withdrawals?.filter(w => w.status === 'completed') || [];
          totalWithdrawalAmount = completedWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);
          
          pendingWithdrawals = withdrawals?.filter(w => w.status === 'pending').length || 0;

          // Transferts effectués par les agents
          const { data: transfers } = await supabase
            .from('transfers')
            .select('amount, status')
            .in('sender_id', agentUserIds)
            .eq('status', 'completed');

          totalTransactions = (recharges?.length || 0) + completedWithdrawals.length + (transfers?.length || 0);

          console.log('💰 Montants calculés:', {
            recharges: totalRechargeAmount,
            withdrawals: totalWithdrawalAmount,
            transactions: totalTransactions,
            pending: pendingWithdrawals
          });
        }

        const finalStats = {
          totalUsersManaged: usersResult.count || 0,
          totalAgentsManaged: agentsResult.data?.length || 0,
          activeAgents: activeAgentsCount,
          quotaUtilization,
          dailyRequests,
          dailyLimit,
          pendingWithdrawals,
          totalTransactions,
          totalRechargeAmount,
          totalWithdrawalAmount,
          totalAmount: totalRechargeAmount + totalWithdrawalAmount
        };

        console.log('✅ Stats sous-admin finales:', finalStats);
        setStats(finalStats);
      }
      
    } catch (error) {
      console.error('💥 Erreur lors de la récupération des stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user?.id, profile?.role, profile?.country]);

  return { stats, loading, refetch: fetchStats };
};
