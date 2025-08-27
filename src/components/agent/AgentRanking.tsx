import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/utils/currency";
import { Trophy, Star, Medal, Award, TrendingUp } from "lucide-react";

interface AgentRankingProps {
  userId: string | undefined;
}

interface AgentRankingData {
  agent_id: string;
  agent_rank: number;
  total_agents: number;
  full_name: string;
  avatar_url: string;
  total_earnings: number;
}

export const AgentRanking: React.FC<AgentRankingProps> = ({ userId }) => {
  const [agentRanking, setAgentRanking] = useState<AgentRankingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAgentRanking = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const { data: rankingData, error: rankingError } = await supabase.rpc('get_agent_ranking_with_details', {
        agent_id: userId
      }).single();

      if (rankingError) {
        console.error("Erreur lors de la récupération du classement:", rankingError);
      } else {
        setAgentRanking(rankingData);
      }
    } catch (error) {
      console.error("Erreur inattendue:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentRanking();
  }, [userId]);

  return (
    <Card className="bg-white shadow-md rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Classement Agent
        </CardTitle>
        <Badge variant="secondary">Temps Réel</Badge>
      </CardHeader>

      <CardContent className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : agentRanking ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={agentRanking?.avatar_url} />
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {agentRanking?.full_name?.[0]?.toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{agentRanking?.full_name}</h3>
                <p className="text-sm text-gray-500">Agent SendFlow</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span className="font-medium">Classement:</span>
              </div>
              <div className="text-xl font-bold">
                {agentRanking?.agent_rank} / {agentRanking?.total_agents}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span className="font-medium">Revenus Totaux:</span>
              </div>
              <div className="text-xl font-bold text-green-600">
                {formatCurrency(agentRanking?.total_earnings, 'XAF')}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500">
            <Star className="w-6 h-6 mx-auto mb-2" />
            Classement non disponible
          </div>
        )}
      </CardContent>
    </Card>
  );
};
