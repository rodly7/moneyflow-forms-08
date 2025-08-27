import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  Trophy,
  Calendar,
  RefreshCw,
  Award,
  Star
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/utils/currency";
import { useToast } from "@/hooks/use-toast";

interface AgentEarningsCardProps {
  userId: string | undefined;
  onRefresh: () => void;
  isLoading: boolean;
}

export const AgentEarningsCard: React.FC<AgentEarningsCardProps> = ({ userId, onRefresh, isLoading }) => {
  const { toast } = useToast();
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [dailyTarget, setDailyTarget] = useState(500000);
  const [timeRemaining, setTimeRemaining] = useState({ hours: 0, minutes: 0 });

  const fetchAgentEarnings = async () => {
    if (!userId) return;

    try {
      // Fetch total earnings
      const { data: earningsData, error: earningsError } = await supabase.from('transfers')
        .select('amount')
        .eq('sender_id', userId);

      if (earningsError) {
        console.error("Erreur lors de la récupération des gains:", earningsError);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données de gains",
          variant: "destructive"
        });
        return;
      }

      const totalEarningsAmount = earningsData?.reduce((sum, transfer) => sum + transfer.amount, 0) || 0;
      setTotalEarnings(totalEarningsAmount);

      // Fetch monthly revenue
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { data: revenueData, error: revenueError } = await supabase.from('transfers')
        .select('amount')
        .eq('sender_id', userId)
        .gte('created_at', startOfMonth);

      if (revenueError) {
        console.error("Erreur lors de la récupération du chiffre d'affaires mensuel:", revenueError);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données du chiffre d'affaires mensuel",
          variant: "destructive"
        });
        return;
      }

      const monthlyRevenueAmount = revenueData?.reduce((sum, transfer) => sum + transfer.amount, 0) || 0;
      setMonthlyRevenue(monthlyRevenueAmount);

    } catch (error) {
      console.error("Erreur inattendue:", error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchAgentEarnings();

    // Update time remaining every minute
    const intervalId = setInterval(() => {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      const diffInSeconds = (endOfDay.getTime() - now.getTime()) / 1000;
      const hours = Math.floor(diffInSeconds / 3600);
      const minutes = Math.floor((diffInSeconds % 3600) / 60);

      setTimeRemaining({ hours, minutes });
    }, 60000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [userId, toast]);

  const progress = dailyTarget > 0 ? Math.min((monthlyRevenue / dailyTarget) * 100, 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Total Earnings Card */}
      <Card className="bg-emerald-50 border border-emerald-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-80">Gains Totaux</p>
              {isLoading ? (
                <div className="animate-pulse bg-white/30 h-8 w-24 rounded mt-1"></div>
              ) : (
                <p className="text-2xl font-bold mt-1">
                  {formatCurrency(totalEarnings, 'XAF')}
                </p>
              )}
            </div>
            <DollarSign className="w-8 h-8 opacity-70 text-emerald-600" />
          </div>
        </CardContent>
      </Card>

      {/* Monthly Revenue Card */}
      <Card className="bg-blue-50 border border-blue-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-80">Chiffre d'affaires Mensuel</p>
              {isLoading ? (
                <div className="animate-pulse bg-white/30 h-8 w-32 rounded mt-1"></div>
              ) : (
                <>
                  <p className="text-2xl font-bold mt-1">
                    {formatCurrency(monthlyRevenue, 'XAF')}
                  </p>
                  <Progress value={progress} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {progress.toFixed(1)}% de l'objectif atteint
                  </p>
                </>
              )}
            </div>
            <TrendingUp className="w-8 h-8 opacity-70 text-blue-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
