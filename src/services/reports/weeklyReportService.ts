
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

export class WeeklyReportService {
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
}
