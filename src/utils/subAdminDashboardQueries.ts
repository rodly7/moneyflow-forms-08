
import { supabase } from "@/integrations/supabase/client";

export const fetchSubAdminStats = async (userId: string) => {
  try {
    // Fetch agents with complete type bypass
    const agentsQuery = (supabase as any)
      .from('agents')
      .select('id, status, user_id')
      .eq('territory_admin_id', userId);

    const agentsResult = await agentsQuery;

    if (agentsResult.error) throw agentsResult.error;

    const agentsData = agentsResult.data as Array<{
      id: string;
      status: string;
      user_id: string;
    }> || [];
    
    const totalAgents = agentsData.length;
    const activeAgents = agentsData.filter(agent => agent.status === 'active').length;
    const agentUserIds = agentsData.map(agent => agent.user_id).filter(Boolean);

    let pendingWithdrawals = 0;
    let totalTransactions = 0;

    if (agentUserIds.length > 0) {
      // Fetch withdrawals with complete type bypass
      const withdrawalsQuery = (supabase as any)
        .from('withdrawals')
        .select('id')
        .eq('status', 'pending')
        .in('user_id', agentUserIds);

      const withdrawalsResult = await withdrawalsQuery;

      if (!withdrawalsResult.error && withdrawalsResult.data) {
        pendingWithdrawals = (withdrawalsResult.data as Array<{id: string}>).length;
      }

      // Fetch transactions with complete type bypass
      const transactionsQuery = (supabase as any)
        .from('transfers')
        .select('id')
        .in('agent_id', agentUserIds);

      const transactionsResult = await transactionsQuery;

      if (!transactionsResult.error && transactionsResult.data) {
        totalTransactions = (transactionsResult.data as Array<{id: string}>).length;
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
