
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AgentStatsData {
  todayTransactions: number;
  todayVolume: number;
  todayWithdrawals: number;
  todayRecharges: number;
}

export const useAgentStats = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['agentStats', userId],
    queryFn: async () => {
      if (!userId) {
        return {
          todayTransactions: 0,
          todayVolume: 0,
          todayWithdrawals: 0,
          todayRecharges: 0
        };
      }

      const today = new Date().toISOString().split('T')[0];
      
      // Simplify queries to avoid deep type inference
      const withdrawalsQuery = supabase
        .from('withdrawals')
        .select('amount')
        .eq('agent_id', userId)
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`);

      const rechargesQuery = supabase
        .from('recharges')
        .select('amount')
        .eq('user_id', userId)
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`);

      // Execute queries separately
      const [withdrawalsResponse, rechargesResponse] = await Promise.all([
        withdrawalsQuery,
        rechargesQuery
      ]);

      const withdrawals = withdrawalsResponse.data || [];
      const recharges = rechargesResponse.data || [];

      const todayWithdrawals = withdrawals.length;
      const todayRecharges = recharges.length;
      
      let todayVolume = 0;
      for (const w of withdrawals) {
        todayVolume += w.amount || 0;
      }
      for (const r of recharges) {
        todayVolume += r.amount || 0;
      }

      const result: AgentStatsData = {
        todayTransactions: todayWithdrawals + todayRecharges,
        todayVolume,
        todayWithdrawals,
        todayRecharges
      };

      return result;
    },
    enabled: !!userId,
    refetchInterval: 30000
  });
};
