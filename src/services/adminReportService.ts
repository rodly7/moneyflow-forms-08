
import { supabase } from "@/integrations/supabase/client";

export interface WeeklyReport {
  week_start: Date;
  week_end: Date;
  total_transactions: number;
  total_volume: number;
  total_fees: number;
  platform_revenue: number;
  agent_commissions: number;
  active_agents: number;
  active_users: number;
  international_transfers: number;
  domestic_transfers: number;
  withdrawals_count: number;
  deposits_count: number;
}

export interface MonthlyReport extends WeeklyReport {
  month: number;
  year: number;
}

export interface AgentPerformanceReport {
  agent_id: string;
  agent_name: string;
  total_volume: number;
  transactions_count: number;
  commission_earned: number;
  deposits_count: number;
  withdrawals_count: number;
  complaints_count: number;
}

export interface SubAdminReport {
  sub_admin_id: string;
  sub_admin_name: string;
  agents_managed: number;
  territory: string;
  total_volume: number;
  commission_percentage: number;
}

export class AdminReportService {
  static async generateWeeklyReport(startDate: Date, endDate: Date): Promise<WeeklyReport> {
    console.log('📊 Génération rapport hebdomadaire:', { startDate, endDate });

    // Récupérer toutes les transactions de la semaine
    const { data: transfers, error: transfersError } = await supabase
      .from('transfers')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .eq('status', 'completed');

    if (transfersError) throw transfersError;

    // Récupérer les retraits
    const { data: withdrawals, error: withdrawalsError } = await supabase
      .from('withdrawals')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .eq('status', 'completed');

    if (withdrawalsError) throw withdrawalsError;

    // Récupérer les dépôts/recharges
    const { data: deposits, error: depositsError } = await supabase
      .from('recharges')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .eq('status', 'completed');

    if (depositsError) throw depositsError;

    // Calculer les métriques exactes
    const transfersData = transfers || [];
    const withdrawalsData = withdrawals || [];
    const depositsData = deposits || [];

    const totalVolume = transfersData.reduce((sum, t) => sum + t.amount, 0) +
                       withdrawalsData.reduce((sum, w) => sum + w.amount, 0) +
                       depositsData.reduce((sum, d) => sum + d.amount, 0);

    const totalFees = transfersData.reduce((sum, t) => sum + (t.fees || 0), 0);
    const platformRevenue = totalFees * 0.6; // 60% pour la plateforme
    const agentCommissions = totalFees * 0.4; // 40% pour les agents

    // Compter les transferts internationaux vs domestiques
    const internationalTransfers = transfersData.filter(t => 
      t.sender_id && t.recipient_country && t.recipient_country !== 'Congo Brazzaville'
    ).length;

    const domesticTransfers = transfersData.length - internationalTransfers;

    // Récupérer les agents actifs
    const { data: activeAgents } = await supabase
      .from('agents')
      .select('id')
      .eq('status', 'active');

    // Récupérer les utilisateurs actifs
    const { data: activeUsers } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_banned', false);

    return {
      week_start: startDate,
      week_end: endDate,
      total_transactions: transfersData.length + withdrawalsData.length + depositsData.length,
      total_volume: totalVolume,
      total_fees: totalFees,
      platform_revenue: platformRevenue,
      agent_commissions: agentCommissions,
      active_agents: activeAgents?.length || 0,
      active_users: activeUsers?.length || 0,
      international_transfers: internationalTransfers,
      domestic_transfers: domesticTransfers,
      withdrawals_count: withdrawalsData.length,
      deposits_count: depositsData.length
    };
  }

  static async generateMonthlyReport(month: number, year: number): Promise<MonthlyReport> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const weeklyData = await this.generateWeeklyReport(startDate, endDate);
    
    return {
      ...weeklyData,
      month,
      year
    };
  }

  static async getAgentsPerformance(startDate: Date, endDate: Date): Promise<AgentPerformanceReport[]> {
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('user_id, full_name');

    if (agentsError) throw agentsError;

    const agentReports: AgentPerformanceReport[] = [];

    for (const agent of agents || []) {
      // Récupérer les performances mensuelles calculées
      const { data: performance } = await supabase
        .from('agent_monthly_performance')
        .select('*')
        .eq('agent_id', agent.user_id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      const latestPerf = performance?.[0];

      // Récupérer les plaintes
      const { data: complaints } = await supabase
        .from('agent_complaints')
        .select('id')
        .eq('agent_id', agent.user_id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      agentReports.push({
        agent_id: agent.user_id,
        agent_name: agent.full_name,
        total_volume: latestPerf?.total_volume || 0,
        transactions_count: latestPerf?.total_transactions || 0,
        commission_earned: latestPerf?.total_earnings || 0,
        deposits_count: latestPerf?.withdrawals_count || 0,
        withdrawals_count: latestPerf?.withdrawals_count || 0,
        complaints_count: complaints?.length || 0
      });
    }

    return agentReports;
  }

  static async getSubAdminsData(): Promise<SubAdminReport[]> {
    try {
      const reports: SubAdminReport[] = [];
      
      // Get sub-admins with basic info
      const subAdminsResult = await supabase
        .from('profiles')
        .select('id, full_name, country')
        .eq('role', 'sub_admin');

      if (subAdminsResult.error) {
        console.error('Error fetching sub-admins:', subAdminsResult.error);
        return [];
      }

      const subAdmins = subAdminsResult.data;
      if (!subAdmins) {
        return [];
      }

      // Process each sub-admin individually
      for (let i = 0; i < subAdmins.length; i++) {
        const admin = subAdmins[i];
        const report = await this.processSubAdminReport(admin);
        reports.push(report);
      }

      return reports;
    } catch (error) {
      console.error('Error in getSubAdminsData:', error);
      return [];
    }
  }

  private static async processSubAdminReport(admin: any): Promise<SubAdminReport> {
    try {
      // Count agents managed
      const agentsResult = await supabase
        .from('agents')
        .select('user_id', { count: 'exact', head: true })
        .eq('territory_admin_id', admin.id);

      const agentsCount = agentsResult.count || 0;
      let totalVolume = 0;

      // Calculate total volume if there are agents
      if (agentsCount > 0) {
        totalVolume = await this.calculateSubAdminVolume(admin.id);
      }

      return {
        sub_admin_id: admin.id || '',
        sub_admin_name: admin.full_name || 'Unknown',
        agents_managed: agentsCount,
        territory: admin.country || 'Non défini',
        total_volume: totalVolume,
        commission_percentage: 0.15
      };
    } catch (error) {
      console.warn(`Error processing sub-admin ${admin.id}:`, error);
      
      return {
        sub_admin_id: admin.id || '',
        sub_admin_name: admin.full_name || 'Unknown',
        agents_managed: 0,
        territory: admin.country || 'Non défini',
        total_volume: 0,
        commission_percentage: 0.15
      };
    }
  }

  private static async calculateSubAdminVolume(subAdminId: string): Promise<number> {
    try {
      // Get agent user IDs
      const agentsResult = await supabase
        .from('agents')
        .select('user_id')
        .eq('territory_admin_id', subAdminId);

      if (!agentsResult.data || agentsResult.data.length === 0) {
        return 0;
      }

      const userIds: string[] = [];
      for (const agent of agentsResult.data) {
        if (agent.user_id) {
          userIds.push(agent.user_id);
        }
      }

      if (userIds.length === 0) {
        return 0;
      }

      // Get performance data
      const performanceResult = await supabase
        .from('agent_monthly_performance')
        .select('total_volume')
        .in('agent_id', userIds);

      if (!performanceResult.data) {
        return 0;
      }

      let totalVolume = 0;
      for (const perf of performanceResult.data) {
        const volume = Number(perf.total_volume);
        if (!isNaN(volume)) {
          totalVolume += volume;
        }
      }

      return totalVolume;
    } catch (error) {
      console.warn('Error calculating sub-admin volume:', error);
      return 0;
    }
  }

  static async getTreasuryRevenue(startDate: Date, endDate: Date) {
    // Récupérer tous les audit logs pour les opérations de revenus
    const { data: auditLogs } = await supabase
      .from('audit_logs')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .in('action', ['platform_commission', 'transfer_fee', 'admin_credit']);

    // Calculer les revenus exacts de SendFlow
    let platformRevenue = 0;
    let totalFees = 0;
    let adminCredits = 0;

    auditLogs?.forEach(log => {
      try {
        const newValues = log.new_values;
        if (newValues && typeof newValues === 'object' && !Array.isArray(newValues)) {
          const amount = (newValues as Record<string, any>).amount;
          const amountNum = amount ? Number(amount) : 0;
          
          if (log.action === 'platform_commission') {
            platformRevenue += amountNum;
          } else if (log.action === 'transfer_fee') {
            totalFees += amountNum;
          } else if (log.action === 'admin_credit') {
            adminCredits += amountNum;
          }
        }
      } catch (error) {
        console.warn('Error parsing audit log:', log.id, error);
      }
    });

    return {
      platformRevenue,
      totalFees,
      adminCredits,
      netRevenue: platformRevenue + totalFees - adminCredits
    };
  }

  static async getRecentTransactions(limit: number = 50) {
    // Récupérer toutes les transactions récentes avec tous les détails
    const { data: transfers } = await supabase
      .from('transfers')
      .select(`
        *,
        sender:profiles!transfers_sender_id_fkey(full_name, phone)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    const { data: withdrawals } = await supabase
      .from('withdrawals')
      .select(`
        *,
        user:profiles!withdrawals_user_id_fkey(full_name, phone)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    const { data: deposits } = await supabase
      .from('recharges')
      .select(`
        *,
        user:profiles!recharges_user_id_fkey(full_name, phone)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Combiner et trier toutes les transactions
    const allTransactions = [
      ...(transfers || []).map(t => ({ ...t, type: 'transfer', timestamp: t.created_at })),
      ...(withdrawals || []).map(w => ({ ...w, type: 'withdrawal', timestamp: w.created_at })),
      ...(deposits || []).map(d => ({ ...d, type: 'deposit', timestamp: d.created_at }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
     .slice(0, limit);

    return allTransactions;
  }
}
