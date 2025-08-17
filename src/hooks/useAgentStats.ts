
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
    queryFn: async (): Promise<AgentStatsData> => {
      if (!userId) {
        return {
          todayTransactions: 0,
          todayVolume: 0,
          todayWithdrawals: 0,
          todayRecharges: 0
        };
      }

      const today = new Date().toISOString().split('T')[0];
      
      // Fetch withdrawals with explicit typing
      const withdrawalsResponse = await supabase
        .from('withdrawals')
        .select('amount')
        .eq('agent_id', userId)
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`);

      // Fetch recharges with explicit typing  
      const rechargesResponse = await supabase
        .from('recharges')
        .select('amount')
        .eq('user_id', userId)
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`);

      const withdrawals = withdrawalsResponse.data || [];
      const recharges = rechargesResponse.data || [];

      const todayWithdrawals = withdrawals.length;
      const todayRecharges = recharges.length;
      const todayVolume = withdrawals.reduce((sum, w) => sum + (w.amount || 0), 0) +
                         recharges.reduce((sum, r) => sum + (r.amount || 0), 0);

      return {
        todayTransactions: todayWithdrawals + todayRecharges,
        todayVolume,
        todayWithdrawals,
        todayRecharges
      };
    },
    enabled: !!userId,
    refetchInterval: 30000
  });
};
