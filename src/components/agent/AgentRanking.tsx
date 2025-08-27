
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';

interface AgentRankingData {
  rankings: Array<{
    agent_id: string;
    full_name: string;
    phone: string;
    total_volume: number;
    total_commissions: number;
    rank: number;
  }>;
  currentUserRank?: number;
  totalAgents: number;
}

const AgentRanking: React.FC = () => {
  const [rankingData, setRankingData] = useState<AgentRankingData>({
    rankings: [],
    totalAgents: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock data since the database function doesn't exist
    const mockData: AgentRankingData = {
      rankings: [
        {
          agent_id: '1',
          full_name: 'Agent Premium',
          phone: '+221701234567',
          total_volume: 5000000,
          total_commissions: 25000,
          rank: 1
        },
        {
          agent_id: '2',
          full_name: 'Agent Gold',
          phone: '+221701234568',
          total_volume: 3500000,
          total_commissions: 17500,
          rank: 2
        },
        {
          agent_id: '3',
          full_name: 'Agent Silver',
          phone: '+221701234569',
          total_volume: 2000000,
          total_commissions: 10000,
          rank: 3
        }
      ],
      currentUserRank: 2,
      totalAgents: 15
    };

    setTimeout(() => {
      setRankingData(mockData);
      setIsLoading(false);
    }, 1000);
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <TrendingUp className="w-5 h-5 text-blue-500" />;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-yellow-100 text-yellow-800";
      case 2:
        return "bg-gray-100 text-gray-800";
      case 3:
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Classement des Agents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="space-y-1">
                    <div className="w-24 h-4 bg-gray-200 rounded"></div>
                    <div className="w-16 h-3 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Classement des Agents
          <Badge variant="secondary">{rankingData.totalAgents} agents</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {rankingData.rankings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucun classement disponible</p>
          </div>
        ) : (
          rankingData.rankings.map((agent) => (
            <div
              key={agent.agent_id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                agent.rank === rankingData.currentUserRank
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8">
                  {getRankIcon(agent.rank)}
                </div>
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {agent.full_name}
                    <Badge className={getRankBadgeColor(agent.rank)}>
                      #{agent.rank}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {agent.phone}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">
                  {formatCurrency(agent.total_volume)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(agent.total_commissions)} commissions
                </div>
              </div>
            </div>
          ))
        )}
        
        {rankingData.currentUserRank && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-center">
              <div className="font-medium text-blue-900">Votre Position</div>
              <div className="text-2xl font-bold text-blue-600">
                #{rankingData.currentUserRank} / {rankingData.totalAgents}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AgentRanking;
