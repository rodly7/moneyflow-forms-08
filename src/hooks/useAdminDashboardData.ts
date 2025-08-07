import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSystemMetrics } from './useSystemMetrics';

export interface AgentPerformanceData {
  agent_id: string;
  agent_name: string;
  agent_phone: string;
  status: 'active' | 'pending' | 'suspended' | 'rejected';
  monthly_revenue: number;
  volume_processed: number;
  transfers_count: number;
  complaints_count: number;
  commission_earnings: number;
  total_earnings: number;
}

export interface AdminDashboardStats {
  totalAgents: number;
  activeAgents: number;
  totalUsers: number;
  activeUsers: number;
  adminBalance: number;
  totalCommissions: number;
  totalVolume: number;
  topAgent: AgentPerformanceData | null;
  agents: AgentPerformanceData[];
  anomalies: Array<{
    id: string;
    type: 'suspicious_transfer' | 'cancelled_transfer' | 'high_volume';
    description: string;
    amount?: number;
    created_at: string;
  }>;
  systemMetrics?: {
    onlineUsers: number;
    agentLocations: number;
    systemStatus: string;
  };
}

export const useAdminDashboardData = () => {
  const [data, setData] = useState<AdminDashboardStats>({
    totalAgents: 0,
    activeAgents: 0,
    totalUsers: 0,
    activeUsers: 0,
    adminBalance: 0,
    totalCommissions: 0,
    totalVolume: 0,
    topAgent: null,
    agents: [],
    anomalies: [],
    systemMetrics: {
      onlineUsers: 0,
      agentLocations: 0,
      systemStatus: 'operational'
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { data: systemMetrics } = useSystemMetrics();

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Récupérer tous les utilisateurs pour avoir le compte total
      const { data: allUsersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, role, is_banned, balance');

      if (usersError) throw usersError;

      // Récupérer les agents avec leurs profils
      const { data: agentsData, error: agentsError } = await supabase
        .from('agents')
        .select(`
          *,
          user_id
        `);

      if (agentsError) throw agentsError;

      // Récupérer les profils des agents
      const agentUserIds = agentsData?.map(a => a.user_id) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .in('id', agentUserIds);

      // Récupérer les performances mensuelles de tous les agents
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const agentsPerformance: AgentPerformanceData[] = [];
      let totalCommissions = 0;
      let totalVolume = 0;

      for (const agent of agentsData || []) {
        const profile = profilesData?.find(p => p.id === agent.user_id);
        
        // Récupérer les performances pour cet agent depuis la table agent_monthly_performance
        const { data: performance } = await supabase
          .from('agent_monthly_performance')
          .select('*')
          .eq('agent_id', agent.user_id)
          .eq('month', currentMonth)
          .eq('year', currentYear)
          .maybeSingle();

        const perfData = performance || {
          total_volume: 0,
          total_transactions: 0,
          complaints_count: 0,
          total_earnings: 0
        };

        const agentPerf: AgentPerformanceData = {
          agent_id: agent.user_id,
          agent_name: profile?.full_name || agent.full_name,
          agent_phone: profile?.phone || agent.phone,
          status: agent.status,
          monthly_revenue: perfData.total_earnings,
          volume_processed: perfData.total_volume,
          transfers_count: perfData.total_transactions,
          complaints_count: perfData.complaints_count,
          commission_earnings: perfData.total_earnings,
          total_earnings: perfData.total_earnings
        };

        agentsPerformance.push(agentPerf);
        totalCommissions += perfData.total_earnings;
        totalVolume += perfData.total_volume;
      }

      // Trouver le meilleur agent
      const topAgent = agentsPerformance.reduce((best, current) => 
        !best || current.total_earnings > best.total_earnings ? current : best, 
        null as AgentPerformanceData | null
      );

      // Récupérer les anomalies (transactions annulées, transferts suspects)
      const { data: cancelledTransfers } = await supabase
        .from('transfers')
        .select('id, amount, created_at, recipient_full_name')
        .eq('status', 'cancelled')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .limit(10);

      const { data: suspiciousTransfers } = await supabase
        .from('transfers')
        .select('id, amount, created_at, recipient_full_name')
        .gte('amount', 500000) // Transferts > 500k XAF
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(5);

      const anomalies = [
        ...(cancelledTransfers?.map(t => ({
          id: t.id,
          type: 'cancelled_transfer' as const,
          description: `Transfert annulé: ${t.amount.toLocaleString()} XAF vers ${t.recipient_full_name}`,
          amount: t.amount,
          created_at: t.created_at
        })) || []),
        ...(suspiciousTransfers?.map(t => ({
          id: t.id,
          type: 'high_volume' as const,
          description: `Transfert important: ${t.amount.toLocaleString()} XAF vers ${t.recipient_full_name}`,
          amount: t.amount,
          created_at: t.created_at
        })) || [])
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Calculer les statistiques utilisateurs
      const totalUsers = allUsersData?.length || 0;
      const activeUsers = allUsersData?.filter(u => !u.is_banned).length || 0;
      const adminUser = allUsersData?.find(u => u.role === 'admin');
      const adminBalance = adminUser?.balance || 0;

      setData({
        totalAgents: agentsData?.length || 0,
        activeAgents: agentsData?.filter(a => a.status === 'active').length || 0,
        totalUsers,
        activeUsers,
        adminBalance,
        totalCommissions,
        totalVolume,
        topAgent,
        agents: agentsPerformance,
        anomalies: anomalies.slice(0, 10),
        systemMetrics: systemMetrics ? {
          onlineUsers: systemMetrics.onlineUsers.total,
          agentLocations: systemMetrics.agentLocations,
          systemStatus: systemMetrics.systemStatus.every(s => s.status_type === 'operational') ? 'operational' : 'degraded'
        } : {
          onlineUsers: 0,
          agentLocations: 0,
          systemStatus: 'operational'
        }
      });

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du tableau de bord",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    data,
    isLoading,
    refetch: fetchDashboardData
  };
};