
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
    return SubAdminReportService.getSubAdminsData();
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

// Re-export types for backward compatibility - using export type for isolatedModules
export type { WeeklyReport, AgentPerformanceReport, SubAdminReport };
