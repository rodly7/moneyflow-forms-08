
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useSystemMetrics = () => {
  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['system-metrics'],
    queryFn: async () => {
      try {
        // Récupérer le nombre total d'utilisateurs
        const { count: totalUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Récupérer le nombre d'agents
        const { count: totalAgents } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'agent');

        // Récupérer les transactions du jour
        const today = new Date().toISOString().split('T')[0];
        const { count: todayTransactions } = await supabase
          .from('transfers')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', `${today}T00:00:00.000Z`)
          .lt('created_at', `${today}T23:59:59.999Z`);

        // Récupérer les retraits en attente
        const { count: pendingWithdrawals } = await supabase
          .from('withdrawals')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        // Récupérer les utilisateurs récents avec gestion d'erreur
        let recentUsers: any[] = [];
        try {
          const { data: usersData, error: usersError } = await supabase
            .from('profiles')
            .select('id, full_name, role, country')
            .order('created_at', { ascending: false })
            .limit(5);

          if (usersError) {
            console.error('Erreur récupération utilisateurs récents:', usersError);
          } else if (usersData) {
            recentUsers = usersData.map(user => ({
              id: user.id,
              full_name: user.full_name,
              role: user.role,
              country: user.country
            }));
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des utilisateurs récents:', error);
        }

        return {
          totalUsers: totalUsers || 0,
          totalAgents: totalAgents || 0,
          todayTransactions: todayTransactions || 0,
          pendingWithdrawals: pendingWithdrawals || 0,
          recentUsers
        };
      } catch (error) {
        console.error('Erreur lors de la récupération des métriques système:', error);
        throw error;
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return {
    metrics: metrics || {
      totalUsers: 0,
      totalAgents: 0,
      todayTransactions: 0,
      pendingWithdrawals: 0,
      recentUsers: []
    },
    isLoading,
    error
  };
};
