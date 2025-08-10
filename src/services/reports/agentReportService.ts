
import { supabase } from "@/integrations/supabase/client";

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

export class AgentReportService {
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
}
