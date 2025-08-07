
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface AgentReportData {
  agent_id: string;
  agent_name: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  totalTransfers: number;
  totalWithdrawals: number;
  totalDeposits: number;
  currentBalance: number;
  amountToAdd: number;
  totalCommissions: number;
  startDate: Date;
  endDate: Date;
}

export const useAgentReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<AgentReportData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const TARGET_BALANCE = 100000; // 100,000 FCFA

  const generateReport = async (agentId: string, period: 'daily' | 'weekly' | 'monthly' | 'yearly'): Promise<AgentReportData | null> => {
    try {
      console.log(`📊 Génération du rapport ${period} pour l'agent:`, agentId);
      
      const now = new Date();
      let startDate: Date;
      let endDate = now;

      switch (period) {
        case 'daily':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'weekly':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'yearly':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }

      // Récupérer les informations de l'agent
      const { data: agentProfile, error: agentError } = await supabase
        .from('profiles')
        .select('id, full_name, balance')
        .eq('id', agentId)
        .eq('role', 'agent')
        .single();

      if (agentError || !agentProfile) {
        console.error('❌ Erreur agent:', agentError);
        return null;
      }

      // Récupérer les transferts de l'agent
      const { data: transfers, error: transfersError } = await supabase
        .from('transfers')
        .select('amount, fees, created_at')
        .eq('sender_id', agentId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (transfersError) {
        console.error('❌ Erreur transferts:', transfersError);
        throw transfersError;
      }

      // Récupérer les retraits traités par l'agent
      const { data: withdrawals, error: withdrawalsError } = await supabase
        .from('withdrawal_requests')
        .select('amount, created_at')
        .eq('agent_id', agentId)
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (withdrawalsError) {
        console.error('❌ Erreur retraits:', withdrawalsError);
        throw withdrawalsError;
      }

      // Récupérer les dépôts/recharges effectués par l'agent
      const { data: deposits, error: depositsError } = await supabase
        .from('recharges')
        .select('amount, created_at')
        .eq('user_id', agentId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (depositsError) {
        console.error('❌ Erreur dépôts:', depositsError);
      }

      const transfersData = transfers || [];
      const withdrawalsData = withdrawals || [];
      const depositsData = deposits || [];
      const currentBalance = agentProfile.balance || 0;

      // Calculer les commissions (approximation basée sur les frais)
      const totalCommissions = transfersData.reduce((sum, t) => sum + (Number(t.fees) || 0), 0);

      const amountToAdd = Math.max(0, TARGET_BALANCE - currentBalance);

      const reportData: AgentReportData = {
        agent_id: agentId,
        agent_name: agentProfile.full_name || 'Agent',
        period,
        totalTransfers: transfersData.length,
        totalWithdrawals: withdrawalsData.length,
        totalDeposits: depositsData.length,
        currentBalance,
        amountToAdd,
        totalCommissions,
        startDate,
        endDate
      };

      console.log(`✅ Rapport ${period} généré pour l'agent ${agentProfile.full_name}:`, reportData);
      return reportData;
    } catch (error) {
      console.error(`❌ Erreur lors de la génération du rapport ${period}:`, error);
      throw error;
    }
  };

  const generateAllReports = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 Génération de tous les rapports d\'agents');
      
      // Récupérer tous les agents
      const { data: agents, error: agentsError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'agent');

      if (agentsError) {
        throw agentsError;
      }

      if (!agents || agents.length === 0) {
        console.log('⚠️ Aucun agent trouvé');
        setReports([]);
        return;
      }

      const periods: ('daily' | 'weekly' | 'monthly' | 'yearly')[] = ['daily', 'weekly', 'monthly', 'yearly'];
      const allReports: AgentReportData[] = [];

      // Générer les rapports pour chaque agent et chaque période
      for (const agent of agents) {
        for (const period of periods) {
          try {
            const report = await generateReport(agent.id, period);
            if (report) {
              allReports.push(report);
            }
          } catch (error) {
            console.error(`❌ Erreur pour l'agent ${agent.full_name}, période ${period}:`, error);
          }
        }
      }
      
      setReports(allReports);
      console.log('✅ Tous les rapports générés avec succès:', allReports.length);
    } catch (error) {
      console.error('❌ Erreur lors de la génération des rapports:', error);
      setError(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  const getReportsByAgent = (agentId: string) => {
    return reports.filter(report => report.agent_id === agentId);
  };

  const getReportsByPeriod = (period: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
    return reports.filter(report => report.period === period);
  };

  // Auto-génération des rapports au chargement et toutes les heures
  useEffect(() => {
    if (user?.id) {
      console.log('🚀 Initialisation des rapports automatiques');
      generateAllReports();
      
      // Programmer la génération automatique des rapports toutes les heures
      const interval = setInterval(() => {
        console.log('⏰ Génération automatique des rapports');
        generateAllReports();
      }, 60 * 60 * 1000); // Toutes les heures

      return () => {
        console.log('🛑 Nettoyage de l\'intervalle des rapports');
        clearInterval(interval);
      };
    }
  }, [user?.id]);

  return {
    reports,
    isLoading,
    error,
    generateReport,
    generateAllReports,
    getReportsByAgent,
    getReportsByPeriod
  };
};
