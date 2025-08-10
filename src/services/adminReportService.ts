
import { WeeklyReportService, WeeklyReport } from "./reports/weeklyReportService";
import { AgentReportService, AgentPerformanceReport } from "./reports/agentReportService";
import { SubAdminReportService, SubAdminReport } from "./reports/subAdminReportService";
import { supabase } from "@/integrations/supabase/client";

export interface MonthlyReport extends WeeklyReport {
  month: number;
  year: number;
}

export class AdminReportService {
  static async generateWeeklyReport(startDate: Date, endDate: Date): Promise<WeeklyReport> {
    return WeeklyReportService.generateWeeklyReport(startDate, endDate);
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
    return AgentReportService.getAgentsPerformance(startDate, endDate);
  }

  static async getSubAdminsData(): Promise<SubAdminReport[]> {
    return SubAdminReportService.getSubAdminReports();
  }

  static async getTreasuryRevenue(startDate: Date, endDate: Date) {
    try {
      // Récupérer les transferts complétés pour calculer les revenus
      const { data: transfers } = await supabase
        .from('transfers')
        .select('amount, fees, created_at')
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      const totalFees = transfers?.reduce((sum, t) => sum + (t.fees || 0), 0) || 0;
      const platformRevenue = totalFees * 0.6; // 60% pour la plateforme
      
      return {
        platformRevenue,
        totalFees,
        adminCredits: 0,
        netRevenue: platformRevenue
      };
    } catch (error) {
      console.error('Erreur calcul revenus:', error);
      return {
        platformRevenue: 0,
        totalFees: 0,
        adminCredits: 0,
        netRevenue: 0
      };
    }
  }

  static async getRecentTransactions(limit: number = 50) {
    try {
      // Récupérer les transferts récents
      const { data: transfers } = await supabase
        .from('transfers')
        .select(`
          *,
          sender:profiles!transfers_sender_id_fkey(full_name, phone)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      // Récupérer les retraits récents
      const { data: withdrawals } = await supabase
        .from('withdrawals')
        .select(`
          *,
          user:profiles!withdrawals_user_id_fkey(full_name, phone)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      // Récupérer les dépôts récents
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
    } catch (error) {
      console.error('Erreur récupération transactions récentes:', error);
      return [];
    }
  }
}

// Re-export types for backward compatibility
export type { WeeklyReport, AgentPerformanceReport, SubAdminReport };
