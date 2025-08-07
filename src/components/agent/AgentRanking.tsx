
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Trophy, Medal, Star, TrendingUp, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/integrations/supabase/client";

interface AgentRankingData {
  agent_id: string;
  agent_name: string;
  total_commissions: number;
  total_operations: number;
  rank: number;
  isCurrentUser: boolean;
}

const AgentRanking = () => {
  const { user, profile } = useAuth();
  const [rankings, setRankings] = useState<AgentRankingData[]>([]);
  const [myRank, setMyRank] = useState<AgentRankingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  const fetchAgentRankings = async (range: 'week' | 'month' | 'year') => {
    try {
      const now = new Date();
      let startDate: Date;

      if (range === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (range === 'month') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else {
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      }

      // Récupérer tous les agents
      const { data: agents } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'agent');

      if (!agents) return;

      const agentRankings: AgentRankingData[] = [];

      for (const agent of agents) {
        // Calculer les commissions approximatives pour chaque agent
        const [transfersResult, withdrawalsResult, depositsResult] = await Promise.all([
          supabase
            .from('transfers')
            .select('amount, fees')
            .eq('sender_id', agent.id)
            .gte('created_at', startDate.toISOString())
            .eq('status', 'completed'),
          supabase
            .from('withdrawals')
            .select('amount')
            .eq('user_id', agent.id)
            .gte('created_at', startDate.toISOString())
            .eq('status', 'completed'),
          supabase
            .from('recharges')
            .select('amount')
            .eq('provider_transaction_id', agent.id)
            .gte('created_at', startDate.toISOString())
            .eq('status', 'completed')
        ]);

        const transfers = transfersResult.data || [];
        const withdrawals = withdrawalsResult.data || [];
        const deposits = depositsResult.data || [];

        // Calculer les commissions uniquement sur dépôts et retraits
        const transferCommissions = 0; // Plus de commission sur les transferts
        const withdrawalCommissions = withdrawals.reduce((sum, w) => sum + (Number(w.amount) * 0.002), 0); // 0,2%
        const depositCommissions = deposits.reduce((sum, d) => sum + (Number(d.amount) * 0.005), 0); // 0,5%

        const totalCommissions = transferCommissions + withdrawalCommissions + depositCommissions;
        const totalOperations = transfers.length + withdrawals.length + deposits.length;

        if (totalOperations > 0) {
          agentRankings.push({
            agent_id: agent.id,
            agent_name: agent.full_name || 'Agent sans nom',
            total_commissions: totalCommissions,
            total_operations: totalOperations,
            rank: 0, // Sera calculé après le tri
            isCurrentUser: agent.id === user?.id
          });
        }
      }

      // Trier par commissions décroissantes
      agentRankings.sort((a, b) => b.total_commissions - a.total_commissions);
      
      // Assigner les rangs
      agentRankings.forEach((agent, index) => {
        agent.rank = index + 1;
      });

      // Trouver le rang de l'utilisateur actuel
      const currentUserRank = agentRankings.find(agent => agent.agent_id === user?.id);
      setMyRank(currentUserRank || null);

      // Garder seulement le top 10 pour l'affichage
      setRankings(agentRankings.slice(0, 10));
    } catch (error) {
      console.error('Erreur lors du chargement du classement:', error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAgentRankings(timeRange);
  }, [user?.id, timeRange]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2: return <Medal className="w-6 h-6 text-gray-400" />;
      case 3: return <Award className="w-6 h-6 text-amber-600" />;
      default: return <Star className="w-5 h-5 text-gray-400" />;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 2: return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 3: return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white';
      default: return 'bg-white border border-gray-200';
    }
  };

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case 'week': return 'cette semaine';
      case 'month': return 'ce mois';
      case 'year': return 'cette année';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Contrôles */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-600" />
            Classement des Agents
          </CardTitle>
          <div className="flex gap-2">
            <button
              onClick={() => setTimeRange('week')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === 'week' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              7 jours
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === 'month' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              30 jours
            </button>
            <button
              onClick={() => setTimeRange('year')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === 'year' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              1 an
            </button>
          </div>
        </CardHeader>
      </Card>

      {/* Mon rang */}
      {myRank && (
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Votre position
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold">#{myRank.rank}</div>
                <div className="text-blue-100">Classement</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {formatCurrency(myRank.total_commissions, 'XAF')}
                </div>
                <div className="text-blue-100">Commissions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{myRank.total_operations}</div>
                <div className="text-blue-100">Opérations</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {myRank.total_operations > 0 ? Math.round(myRank.total_commissions / myRank.total_operations) : 0}
                </div>
                <div className="text-blue-100">Comm./op.</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top 3 */}
      {rankings.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {rankings.slice(0, 3).map((agent, index) => (
            <Card key={agent.agent_id} className={`${getRankColor(agent.rank)} shadow-xl`}>
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-3">
                  {getRankIcon(agent.rank)}
                </div>
                <h3 className="font-bold text-lg mb-2">
                  {agent.isCurrentUser ? 'Vous' : agent.agent_name}
                </h3>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {formatCurrency(agent.total_commissions, 'XAF')}
                  </div>
                  <div className="text-sm opacity-80">
                    {agent.total_operations} opérations
                  </div>
                </div>
                {agent.isCurrentUser && (
                  <Badge className="mt-2 bg-white/20 text-white border-white/30">
                    C'est vous !
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Classement complet */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Top 10 des agents {getTimeRangeLabel()}</span>
            <Users className="w-5 h-5 text-purple-600" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rankings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Award className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Aucun classement disponible</p>
              <p className="text-sm">Effectuez des opérations pour apparaître dans le classement</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rankings.map((agent) => (
                <div
                  key={agent.agent_id}
                  className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                    agent.isCurrentUser 
                      ? 'bg-blue-50 border-2 border-blue-200' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getRankIcon(agent.rank)}
                      <span className="font-bold text-lg">#{agent.rank}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">
                        {agent.isCurrentUser ? 'Vous' : agent.agent_name}
                        {agent.isCurrentUser && (
                          <Badge className="ml-2 bg-blue-600 text-white">Vous</Badge>
                        )}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {agent.total_operations} opérations • Moyenne: {
                          formatCurrency(
                            agent.total_operations > 0 ? agent.total_commissions / agent.total_operations : 0, 
                            'XAF'
                          )
                        }/op
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">
                      {formatCurrency(agent.total_commissions, 'XAF')}
                    </div>
                    <div className="text-sm text-gray-600">Commissions</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conseils motivation */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-purple-800 mb-4">🏆 Motivation & Conseils</h3>
          <div className="space-y-2 text-sm text-purple-700">
            <p>• Le classement est basé sur les commissions gagnées {getTimeRangeLabel()}</p>
            <p>• Plus vous effectuez d'opérations, plus vous gagnez de commissions</p>
            <p>• Concentrez-vous sur la qualité du service pour fidéliser vos clients</p>
            <p>• Utilisez les défis personnels pour améliorer vos performances</p>
            {myRank && myRank.rank <= 3 && (
              <p>• 🎉 Félicitations ! Vous êtes dans le top 3 des agents les plus performants !</p>
            )}
            {myRank && myRank.rank > 5 && (
              <p>• 📈 Vous pouvez progresser dans le classement en augmentant votre activité</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentRanking;
