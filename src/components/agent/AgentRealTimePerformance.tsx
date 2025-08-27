import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target, 
  Clock,
  Trophy,
  Star,
  RefreshCw
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils/currency";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface AgentRealTimePerformanceProps {
  userId: string | undefined;
}

export const AgentRealTimePerformance: React.FC<AgentRealTimePerformanceProps> = ({ userId }) => {
  const { toast } = useToast();
  const [totalTransfers, setTotalTransfers] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [dailyTarget, setDailyTarget] = useState(1000000);
  const [timeRemaining, setTimeRemaining] = useState({ hours: 0, minutes: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [agentRanking, setAgentRanking] = useState<number | null>(null);
  const [totalAgents, setTotalAgents] = useState<number | null>(null);

  const fetchAgentPerformance = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      // Fetch total transfers and volume
      const { data: transfersData, error: transfersError } = await supabase.from('transfers')
        .select('id, amount')
        .eq('sender_id', userId)
        .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString());

      if (transfersError) {
        console.error("Erreur lors de la récupération des transferts:", transfersError);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données de transfert",
          variant: "destructive"
        });
        return;
      }

      const totalTransfersToday = transfersData?.length || 0;
      const totalVolumeToday = transfersData?.reduce((sum, transfer) => sum + transfer.amount, 0) || 0;

      setTotalTransfers(totalTransfersToday);
      setTotalVolume(totalVolumeToday);

      // Fetch agent ranking
      const { data: rankingData, error: rankingError } = await supabase.rpc('get_agent_ranking', {
        agent_id: userId
      });

      if (rankingError) {
        console.error("Erreur lors de la récupération du classement:", rankingError);
      } else {
        setAgentRanking(rankingData?.agent_rank);
        setTotalAgents(rankingData?.total_agents);
      }

    } catch (error) {
      console.error("Erreur inattendue:", error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    await fetchAgentPerformance();
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchAgentPerformance();

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

  const progress = dailyTarget > 0 ? Math.min((totalVolume / dailyTarget) * 100, 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Total Transfers Card */}
      <Card className="bg-blue-50 border border-blue-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-80">Transferts Aujourd'hui</p>
              {isLoading ? (
                <div className="animate-pulse bg-white/30 h-8 w-24 rounded mt-1"></div>
              ) : (
                <p className="text-2xl font-bold mt-1">{totalTransfers}</p>
              )}
            </div>
            <TrendingUp className="w-8 h-8 opacity-70 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      {/* Total Volume Card */}
      <Card className="bg-green-50 border border-green-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-80">Volume Total Aujourd'hui</p>
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

      {/* Daily Target Card */}
      <Card className="bg-yellow-50 border border-yellow-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-80">Objectif Quotidien</p>
              {isLoading ? (
                <div className="animate-pulse bg-white/30 h-8 w-32 rounded mt-1"></div>
              ) : (
                <>
                  <p className="text-2xl font-bold mt-1">
                    {formatCurrency(dailyTarget, 'XAF')}
                  </p>
                  <Progress value={progress} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {progress.toFixed(1)}% atteint
                  </p>
                </>
              )}
            </div>
            <Target className="w-8 h-8 opacity-70 text-yellow-600" />
          </div>
        </CardContent>
      </Card>

      {/* Time Remaining Card */}
      <Card className="bg-purple-50 border border-purple-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-80">Temps Restant</p>
              {isLoading ? (
                <div className="animate-pulse bg-white/30 h-8 w-20 rounded mt-1"></div>
              ) : (
                <p className="text-2xl font-bold mt-1">
                  {timeRemaining.hours}h {timeRemaining.minutes}m
                </p>
              )}
            </div>
            <Clock className="w-8 h-8 opacity-70 text-purple-600" />
          </div>
        </CardContent>
      </Card>

      {/* Agent Ranking Card */}
      <Card className="bg-orange-50 border border-orange-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-80">Classement</p>
              {isLoading ? (
                <div className="animate-pulse bg-white/30 h-8 w-24 rounded mt-1"></div>
              ) : (
                <>
                  {agentRanking !== null && totalAgents !== null ? (
                    <p className="text-2xl font-bold mt-1">
                      <Trophy className="inline-block w-5 h-5 mr-1 align-middle text-orange-600" />
                      {agentRanking} / {totalAgents}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Classement non disponible
                    </p>
                  )}
                </>
              )}
            </div>
            <Star className="w-8 h-8 opacity-70 text-orange-600" />
          </div>
        </CardContent>
      </Card>

      {/* Refresh Button Card */}
      <Card className="bg-gray-50 border border-gray-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-80">Mettre à jour</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshData} 
                disabled={isRefreshing}
                className="mt-2"
              >
                {isRefreshing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Actualisation...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Actualiser
                  </>
                )}
              </Button>
            </div>
            <RefreshCw className="w-8 h-8 opacity-70 text-gray-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
