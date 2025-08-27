import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/currency";
import { CalendarDays, TrendingUp, Users, DollarSign } from "lucide-react";

interface AgentDailyHistoryProps {
  userId: string | undefined;
}

export const AgentDailyHistory: React.FC<AgentDailyHistoryProps> = ({ userId }) => {
  const [totalTransfers, setTotalTransfers] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAgentPerformance = async () => {
      if (!userId) return;

      setIsLoading(true);
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today

        const { data: transfers, error: transfersError } = await supabase
          .from('transfers')
          .select('id, amount')
          .eq('sender_id', userId)
          .gte('created_at', today.toISOString());

        if (transfersError) {
          console.error("Erreur lors de la récupération des transferts:", transfersError);
          return;
        }

        const totalTransfersToday = transfers?.length || 0;
        const totalVolumeToday = transfers?.reduce((sum, transfer) => sum + transfer.amount, 0) || 0;

        setTotalTransfers(totalTransfersToday);
        setTotalVolume(totalVolumeToday);

      } catch (error) {
        console.error("Erreur inattendue:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgentPerformance();
  }, [userId]);

  return (
    <Card className="bg-white shadow-md rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
        <CardTitle className="text-lg font-semibold">Historique du Jour</CardTitle>
        <CalendarDays className="h-6 w-6 text-gray-500" />
      </CardHeader>

      <CardContent className="p-4">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-gray-200 rounded-md w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded-md w-1/2"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium text-gray-600">Volume Total</span>
              </div>
              <span className="text-lg font-bold text-gray-800">{formatCurrency(totalVolume, 'XAF')}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-gray-600">Nombre de Transferts</span>
              </div>
              <span className="text-lg font-bold text-gray-800">{totalTransfers}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
