import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/currency";
import { Star, Receipt, TrendingUp, DollarSign, Calendar } from "lucide-react";

interface AgentCommissionsProps {
  userId: string | undefined;
}

const AgentCommissions: React.FC<AgentCommissionsProps> = ({ userId }) => {
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalTransfers, setTotalTransfers] = useState(0);
  const [totalWithdrawals, setTotalWithdrawals] = useState(0);
  const [startDate, setStartDate] = useState<Date | null>(new Date(new Date().setDate(new Date().getDate() - 30)));
  const [endDate, setEndDate] = useState<Date | null>(new Date());

  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const { data: transfers, isLoading: transfersLoading } = useQuery({
    queryKey: ['agent-transfers', userId, formatDate(startDate), formatDate(endDate)],
    queryFn: async () => {
      if (!userId || !startDate || !endDate) return [];

      const { data, error } = await supabase
        .from('transfers')
        .select('amount, fees, created_at')
        .eq('sender_id', userId)
        .gte('created_at', formatDate(startDate))
        .lte('created_at', formatDate(endDate))
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: withdrawals, isLoading: withdrawalsLoading } = useQuery({
    queryKey: ['agent-withdrawals', userId, formatDate(startDate), formatDate(endDate)],
    queryFn: async () => {
      if (!userId || !startDate || !endDate) return [];

      const { data, error } = await supabase
        .from('withdrawals')
        .select('amount, created_at')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('created_at', formatDate(startDate))
        .lte('created_at', formatDate(endDate))
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    if (transfers && withdrawals) {
      const totalTransfersAmount = transfers.reduce((sum, transfer) => sum + transfer.amount, 0);
      const totalWithdrawalsAmount = withdrawals.reduce((sum, withdrawal) => sum + withdrawal.amount, 0);
      const totalEarningsAmount = (totalTransfersAmount * 0.01) + (totalWithdrawalsAmount * 0.005);

      setTotalEarnings(totalEarningsAmount);
      setTotalTransfers(transfers.length);
      setTotalWithdrawals(withdrawals.length);
    }
  }, [transfers, withdrawals]);

  return (
    <Card className="bg-white shadow-md rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
        <CardTitle className="text-lg font-semibold">
          <Receipt className="mr-2 h-5 w-5 text-gray-500" />
          Commissions Agent
        </CardTitle>
        <Badge variant="secondary">Agent</Badge>
      </CardHeader>

      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Total Earnings */}
          <div className="bg-emerald-50 rounded-md p-4 border border-emerald-200">
            <div className="flex items-center space-x-3 mb-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              <h4 className="font-semibold text-gray-700">Gains Totaux</h4>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(totalEarnings, 'XAF')}
            </p>
          </div>

          {/* Total Transfers */}
          <div className="bg-blue-50 rounded-md p-4 border border-blue-200">
            <div className="flex items-center space-x-3 mb-2">
              <DollarSign className="h-5 w-5 text-blue-500" />
              <h4 className="font-semibold text-gray-700">Transferts Totaux</h4>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalTransfers}</p>
          </div>

          {/* Total Withdrawals */}
          <div className="bg-orange-50 rounded-md p-4 border border-orange-200">
            <div className="flex items-center space-x-3 mb-2">
              <Calendar className="h-5 w-5 text-orange-500" />
              <h4 className="font-semibold text-gray-700">Retraits Totaux</h4>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalWithdrawals}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentCommissions;
