import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/currency";
import { CalendarDays, TrendingUp, Users, DollarSign } from "lucide-react";

interface YesterdaySummaryProps {
  userId: string | undefined;
}

export const AgentYesterdaySummary: React.FC<YesterdaySummaryProps> = ({ userId }) => {
  const [totalTransfers, setTotalTransfers] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchYesterdayPerformance = async () => {
      if (!userId) return;

      setIsLoading(true);
      try {
        // Calculate yesterday's date range
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const tomorrow = new Date(yesterday);
        tomorrow.setDate(yesterday.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        // Fetch total transfers and volume for yesterday
        const { data: transfersData, error: transfersError } = await supabase
          .from('transfers')
          .select('id, amount')
          .eq('sender_id', userId)
          .gte('created_at', yesterday.toISOString())
          .lt('created_at', tomorrow.toISOString());

        if (transfersError) {
          console.error("Erreur lors de la récupération des transferts d'hier:", transfersError);
          return;
        }

        const totalTransfersYesterday = transfersData?.length || 0;
        const totalVolumeYesterday = transfersData?.reduce((sum, transfer) => sum + transfer.amount, 0) || 0;

        setTotalTransfers(totalTransfersYesterday);
        setTotalVolume(totalVolumeYesterday);

      } catch (error) {
        console.error("Erreur inattendue:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchYesterdayPerformance();
  }, [userId]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Total Transfers Card */}
      <Card className="bg-blue-50 border border-blue-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-80">Transferts Hier</p>
              {isLoading ? (
                <div className="animate-pulse bg-white/30 h-8 w-24 rounded mt-1"></div>
              ) : (
                <p className="text-2xl font-bold mt-1">{totalTransfers}</p>
              )}
            </div>
            <Users className="w-8 h-8 opacity-70 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      {/* Total Volume Card */}
      <Card className="bg-green-50 border border-green-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-80">Volume Total Hier</p>
              {isLoading ? (
                <div className="animate-pulse bg-white/30 h-8 w-32 rounded mt-1"></div>
              ) : (
                <p className="text-2xl font-bold mt-1">
                  {formatCurrency(totalVolume, 'XAF')}
                </p>
              )}
            </div>
            <DollarSign className="w-8 h-8 opacity-70 text-green-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
