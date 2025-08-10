
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SystemMetrics {
  totalUsers: number;
  totalAgents: number;
  todayTransactions: number;
  pendingWithdrawals: number;
  recentUsers: any[];
}

export const useSystemMetrics = () => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalUsers: 0,
    totalAgents: 0,
    todayTransactions: 0,
    pendingWithdrawals: 0,
    recentUsers: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoading(true);
        
        // Fetch total users
        const { count: totalUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Fetch total agents
        const { count: totalAgents } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'agent');

        // Fetch today's transactions
        const today = new Date().toISOString().split('T')[0];
        const { count: todayTransactions } = await supabase
          .from('transactions')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', today);

        // Fetch pending withdrawals
        const { count: pendingWithdrawals } = await supabase
          .from('withdrawal_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        // Fetch recent users
        const { data: recentUsersData } = await supabase
          .from('profiles')
          .select('id, full_name, role, country')
          .order('created_at', { ascending: false })
          .limit(5);

        const recentUsers = Array.isArray(recentUsersData) ? recentUsersData.map(user => ({
          id: user.id,
          full_name: user.full_name,
          role: user.role,
          country: user.country
        })) : [];

        setMetrics({
          totalUsers: totalUsers || 0,
          totalAgents: totalAgents || 0,
          todayTransactions: todayTransactions || 0,
          pendingWithdrawals: pendingWithdrawals || 0,
          recentUsers
        });
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  return { data: metrics, isLoading, error };
};

export const useAgentLocationTracker = () => {
  const updateLocation = async (latitude: number, longitude: number, address: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('agent_locations')
        .upsert({
          agent_id: user.id,
          latitude,
          longitude,
          address,
          is_active: true,
          last_updated: new Date().toISOString()
        });
    } catch (error) {
      console.error('Erreur mise à jour localisation:', error);
    }
  };

  const deactivateLocation = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('agent_locations')
        .update({ is_active: false })
        .eq('agent_id', user.id);
    } catch (error) {
      console.error('Erreur désactivation localisation:', error);
    }
  };

  return { updateLocation, deactivateLocation };
};
