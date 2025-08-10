
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SystemMetrics {
  totalUsers: number;
  totalAgents: number;
  todayTransactions: number;
  pendingWithdrawals: number;
  recentUsers: any[];
  onlineUsers: {
    total: number;
    agents: any[];
    users: any[];
  };
  agentLocations: number;
  systemStatus: Array<{
    status_type: string;
  }>;
  anomalies: any[];
  agentPerformance: {
    activeAgents: number;
    totalAgents: number;
    averagePerformance: number;
  };
}

export const useSystemMetrics = () => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalUsers: 0,
    totalAgents: 0,
    todayTransactions: 0,
    pendingWithdrawals: 0,
    recentUsers: [],
    onlineUsers: {
      total: 0,
      agents: [],
      users: []
    },
    agentLocations: 0,
    systemStatus: [
      { status_type: 'operational' },
      { status_type: 'operational' },
      { status_type: 'operational' }
    ],
    anomalies: [],
    agentPerformance: {
      activeAgents: 0,
      totalAgents: 0,
      averagePerformance: 0
    }
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

        // Mock data for missing properties
        const onlineUsers = {
          total: Math.floor(Math.random() * 50) + 10,
          agents: [],
          users: []
        };

        const agentLocations = Math.floor(Math.random() * 20) + 5;
        
        const systemStatus = [
          { status_type: 'operational' },
          { status_type: 'operational' },
          { status_type: Math.random() > 0.8 ? 'degraded' : 'operational' }
        ];

        const anomalies: any[] = [];

        const agentPerformance = {
          activeAgents: totalAgents || 0,
          totalAgents: totalAgents || 0,
          averagePerformance: Math.floor(Math.random() * 100000) + 50000
        };

        setMetrics({
          totalUsers: totalUsers || 0,
          totalAgents: totalAgents || 0,
          todayTransactions: todayTransactions || 0,
          pendingWithdrawals: pendingWithdrawals || 0,
          recentUsers,
          onlineUsers,
          agentLocations,
          systemStatus,
          anomalies,
          agentPerformance
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
