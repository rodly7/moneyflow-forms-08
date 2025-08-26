import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, Activity, Target } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";

interface RealTimePerformanceProps {
  userId: string | undefined;
}

export const AgentRealTimePerformance: React.FC<RealTimePerformanceProps> = ({ userId }) => {
  const [todayDeposits, setTodayDeposits] = useState(0);
  const [todayWithdrawals, setTodayWithdrawals] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [target, setTarget] = useState(1000000); // Example target
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchRealTimeData = async () => {
      setIsLoading(true);
      try {
        // Fetch today's deposits
        const { data: deposits, error: depositsError } = await supabase.rpc(
          'get_agent_daily_deposits',
          { agent_id: userId }
        );

        if (depositsError) {
          console.error("Error fetching deposits:", depositsError);
        } else {
          setTodayDeposits(deposits || 0);
        }

        // Fetch today's withdrawals
        const { data: withdrawals, error: withdrawalsError } = await supabase.rpc(
          'get_agent_daily_withdrawals',
          { agent_id: userId }
        );

        if (withdrawalsError) {
          console.error("Error fetching withdrawals:", withdrawalsError);
        } else {
          setTodayWithdrawals(withdrawals || 0);
        }

        // Fetch total transactions
        const { data: transactions, error: transactionsError } = await supabase.rpc(
          'get_agent_total_transactions',
          { agent_id: userId }
        );

        if (transactionsError) {
          console.error("Error fetching total transactions:", transactionsError);
        } else {
          setTotalTransactions(transactions || 0);
        }
      } catch (error) {
        console.error("Error fetching real-time data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRealTimeData();

    // Set up real-time subscription (optional)
    const channel = supabase
      .channel('realtime agent performance')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'recharges' },
        (payload) => {
          console.log('Change received!', payload)
          fetchRealTimeData();
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }

  }, [userId]);

  const progress = (todayDeposits / target) * 100;

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader>
        <CardTitle>Performance en temps réel</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-700">
                    Dépôts aujourd'hui
                  </span>
                  <DollarSign className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-800">
                  {formatCurrency(todayDeposits, 'XAF')}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-red-700">
                    Retraits aujourd'hui
                  </span>
                  <TrendingUp className="w-4 h-4 text-red-600" />
                </div>
                <div className="text-2xl font-bold text-red-800">
                  {formatCurrency(todayWithdrawals, 'XAF')}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700">
                  Nombre total de transactions
                </span>
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-800">
                {totalTransactions}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-yellow-700">
                  Objectif quotidien
                </span>
                <Target className="w-4 h-4 text-yellow-600" />
              </div>
              <div className="text-2xl font-bold text-yellow-800">
                {formatCurrency(target, 'XAF')}
              </div>
              <Badge variant="secondary" className="mt-2">
                {progress.toFixed(1)}% atteint
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
