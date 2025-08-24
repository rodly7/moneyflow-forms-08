
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
    console.log('🔍 Debug - Démarrage fetchStats');
    console.log('🔍 Debug - User:', user?.id);
    console.log('🔍 Debug - Profile role:', profile?.role);
    console.log('🔍 Debug - Profile country:', profile?.country);

    // Si ce n'est pas un sous-admin, on retourne des stats vides mais on continue à charger
    if (!user?.id) {
      console.log('❌ Debug - Pas d\'utilisateur connecté');
      setLoading(false);
      return;
    }

    // Pour l'admin principal, on va chercher des données globales
    if (profile?.role === 'admin') {
      console.log('🔍 Debug - Admin principal détecté, récupération des stats globales');
      try {
        // Récupérer tous les sous-administrateurs
        const { data: subAdmins, error: subAdminsError } = await supabase
          .from('profiles')
          .select('id, full_name, country, phone')
          .eq('role', 'sub_admin');

        console.log('👥 Debug - Sous-administrateurs trouvés:', subAdmins?.length || 0);

        // Récupérer tous les utilisateurs
        const { data: allUsers, error: usersError } = await supabase
          .from('profiles')
          .select('id, role, country')
          .neq('role', 'admin')
          .neq('role', 'sub_admin');

        console.log('👤 Debug - Utilisateurs totaux:', allUsers?.length || 0);

        // Récupérer tous les agents
        const { data: allAgents, error: agentsError } = await supabase
          .from('agents')
          .select('id, status, country');

        console.log('🏪 Debug - Agents totaux:', allAgents?.length || 0);
        console.log('✅ Debug - Agents actifs:', allAgents?.filter(a => a.status === 'active').length || 0);

        // Récupérer toutes les transactions
        const { data: allTransfers, error: transfersError } = await supabase
          .from('transfers')
          .select('id, amount, status')
          .eq('status', 'completed');

        console.log('💸 Debug - Transferts totaux:', allTransfers?.length || 0);

        // Récupérer tous les retraits en attente
        const { data: allWithdrawals, error: withdrawalsError } = await supabase
          .from('withdrawals')
          .select('id, amount, status')
          .eq('status', 'pending');

        console.log('💰 Debug - Retraits en attente:', allWithdrawals?.length || 0);

        // Récupérer toutes les recharges
        const { data: allRecharges, error: rechargesError } = await supabase
          .from('recharges')
          .select('id, amount, status')
          .eq('status', 'completed');

        console.log('🔋 Debug - Recharges totales:', allRecharges?.length || 0);

        const finalStats = {
          totalUsersManaged: allUsers?.length || 0,
          totalAgentsManaged: allAgents?.length || 0,
          activeAgents: allAgents?.filter(a => a.status === 'active').length || 0,
          quotaUtilization: 0, // Pas de quota pour l'admin principal
          dailyRequests: 0,
          dailyLimit: 999999, // Pas de limite pour l'admin principal
          pendingWithdrawals: allWithdrawals?.length || 0,
          totalTransactions: (allTransfers?.length || 0) + (allRecharges?.length || 0)
        };

        console.log('✅ Debug - Stats admin principal calculées:', finalStats);
        setStats(finalStats);

      } catch (error) {
        console.error('💥 Debug - Erreur admin principal:', error);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Pour un sous-admin spécifique
    if (profile?.role === 'sub_admin' && profile?.country) {
      console.log('🔍 Debug - Sous-admin détecté pour le pays:', profile.country);
      try {
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

        console.log('✅ Debug - Statistiques sous-admin finales calculées:', finalStats);
        setStats(finalStats);

      } catch (error) {
        console.error('💥 Debug - Erreur lors de la récupération sous-admin:', error);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Si aucune condition n'est remplie
    console.log('⚠️ Debug - Aucune condition remplie, stats par défaut');
    setLoading(false);
  };

  useEffect(() => {
    console.log('🚀 Debug - Démarrage du hook useSubAdminStats');
    fetchStats();
  }, [user?.id, profile?.role, profile?.country]);

  return { stats, loading, refetch: fetchStats };
};
