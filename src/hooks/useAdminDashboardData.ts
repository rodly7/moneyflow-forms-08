
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  totalTransactionVolume: number;
  todayTransactions: number;
  newUsersToday: number;
  pendingTransactions: number;
  pendingAgents: number;
  topAgent: AgentPerformanceData | null;
  agents: AgentPerformanceData[];
  anomalies: Array<{
    id: string;
    type: 'suspicious_transfer' | 'cancelled_transfer' | 'high_volume';
    description: string;
    amount?: number;
    created_at: string;
  }>;
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
    totalTransactionVolume: 0,
    todayTransactions: 0,
    newUsersToday: 0,
    pendingTransactions: 0,
    pendingAgents: 0,
    topAgent: null,
    agents: [],
    anomalies: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Chargement des données du tableau de bord admin...');

      // Récupérer les profils utilisateurs
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, role, is_banned, balance, created_at, full_name, phone');

      if (profilesError) {
        console.error('Erreur profiles:', profilesError);
        throw profilesError;
      }

      // Statistiques de base
      const totalUsers = profilesData?.length || 0;
      const activeUsers = profilesData?.filter(u => !u.is_banned).length || 0;
      
      // Calculer les nouveaux utilisateurs aujourd'hui
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const newUsersToday = profilesData?.filter(u => 
        new Date(u.created_at) >= today
      ).length || 0;

      // Récupérer les agents
      const { data: agentsData, error: agentsError } = await supabase
        .from('agents')
        .select('*');

      if (agentsError) {
        console.error('Erreur agents:', agentsError);
      }

      const totalAgents = agentsData?.length || 0;
      const activeAgents = agentsData?.filter(a => a.status === 'active').length || 0;
      const pendingAgents = agentsData?.filter(a => a.status === 'pending').length || 0;

      // Récupérer les transferts du jour
      const { data: transfersData, error: transfersError } = await supabase
        .from('transfers')
        .select('id, amount, status, created_at')
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

      if (transfersError) {
        console.error('Erreur transfers:', transfersError);
      }

      const todayTransactions = transfersData?.length || 0;
      const totalTransactionVolume = transfersData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
      const pendingTransactions = transfersData?.filter(t => t.status === 'pending').length || 0;

      // Performance des agents (simplifiée)
      const agentsPerformance: AgentPerformanceData[] = [];
      
      if (agentsData && agentsData.length > 0) {
        for (const agent of agentsData) {
          const profile = profilesData?.find(p => p.id === agent.user_id);
          
          agentsPerformance.push({
            agent_id: agent.user_id,
            agent_name: profile?.full_name || agent.full_name || 'Agent inconnu',
            agent_phone: profile?.phone || agent.phone || '',
            status: agent.status,
            monthly_revenue: agent.commission_balance || 0,
            volume_processed: 0, // À calculer avec les vraies données
            transfers_count: 0, // À calculer avec les vraies données
            complaints_count: 0, // À calculer avec les vraies données
            commission_earnings: agent.commission_balance || 0,
            total_earnings: agent.commission_balance || 0
          });
        }
      }

      // Trouver le meilleur agent
      const topAgent = agentsPerformance.reduce((best, current) => 
        !best || current.total_earnings > best.total_earnings ? current : best, 
        null as AgentPerformanceData | null
      );

      // Anomalies (transferts suspects)
      const anomalies = transfersData?.filter(t => t.amount > 500000).map(t => ({
        id: t.id,
        type: 'high_volume' as const,
        description: `Transfert important: ${t.amount.toLocaleString()} XAF`,
        amount: t.amount,
        created_at: t.created_at
      })).slice(0, 10) || [];

      // Balance admin
      const adminUser = profilesData?.find(u => u.role === 'admin');
      const adminBalance = adminUser?.balance || 0;

      const dashboardStats: AdminDashboardStats = {
        totalAgents,
        activeAgents,
        totalUsers,
        activeUsers,
        adminBalance,
        totalCommissions: agentsPerformance.reduce((sum, a) => sum + a.commission_earnings, 0),
        totalVolume: totalTransactionVolume,
        totalTransactionVolume,
        todayTransactions,
        newUsersToday,
        pendingTransactions,
        pendingAgents,
        topAgent,
        agents: agentsPerformance,
        anomalies
      };

      console.log('✅ Données chargées:', dashboardStats);
      setData(dashboardStats);

    } catch (error) {
      console.error('❌ Erreur lors du chargement des données:', error);
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
