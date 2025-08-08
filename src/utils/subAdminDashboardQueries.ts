
import { supabase } from "@/integrations/supabase/client";

export const fetchSubAdminStats = async (userId: string) => {
  try {
    // Fetch agents - completely bypass type inference
    const agentsResult = await supabase
      .from('agents')
      .select('id, status, user_id')
      .eq('territory_admin_id', userId);

    if (agentsResult.error) throw agentsResult.error;

    const agentsData = agentsResult.data || [];
    const totalAgents = agentsData.length;
    const activeAgents = agentsData.filter((agent: any) => agent.status === 'active').length;
    const agentUserIds = agentsData.map((agent: any) => agent.user_id).filter(Boolean);

    let pendingWithdrawals = 0;
    let totalTransactions = 0;

    if (agentUserIds.length > 0) {
      // Fetch withdrawals
      const withdrawalsResult = await supabase
        .from('withdrawals')
        .select('id')
        .eq('status', 'pending')
        .in('user_id', agentUserIds);

      if (!withdrawalsResult.error && withdrawalsResult.data) {
        pendingWithdrawals = withdrawalsResult.data.length;
      }

      // Fetch transactions
      const transactionsResult = await supabase
        .from('transfers')
        .select('id')
        .in('agent_id', agentUserIds);

      if (!transactionsResult.error && transactionsResult.data) {
        totalTransactions = transactionsResult.data.length;
      }
    }

    return {
      totalAgents,
      activeAgents,
      pendingWithdrawals,
      totalTransactions,
    };
  } catch (error) {
    console.error("Error fetching sub-admin stats:", error);
    throw error;
  }
};
