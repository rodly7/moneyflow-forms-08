
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  DollarSign, 
  Activity, 
  Users, 
  RefreshCw, 
  ChevronRight, 
  Target,
  Gift,
  MapPin,
  Award,
  Trophy,
  Medal,
  Star,
  ArrowUp,
  AlertTriangle
} from "lucide-react";
import { createClient } from '@supabase/supabase-js';
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAgentEarnings } from "@/hooks/useAgentEarnings";
import { formatCurrency } from "@/integrations/supabase/client";

const SUPABASE_URL = "https://msasycggbiwyxlczknwj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zYXN5Y2dnYml3eXhsY3prbndqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzczNjU5MTMsImV4cCI6MjA1Mjk0MTkxM30.Ezb5GjSg8ApUWR5iNMvVS9bSA7oxudUuYOP2g2ugB_4";

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

interface PerformanceData {
  todayTransactions: number;
  todayVolume: number;
  todayCommissions: number;
  weeklyTransactions: number;
  weeklyVolume: number;
  weeklyCommissions: number;
  monthlyTransactions: number;
  monthlyVolume: number;
  monthlyCommissions: number;
}

interface AgentRankingData {
  agent_id: string;
  agent_name: string;
  total_commissions: number;
  total_operations: number;
  rank: number;
  isCurrentUser: boolean;
}

export const AgentRealTimePerformance = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    earnings, 
    isLoading: earningsLoading, 
    getNextTierInfo, 
    getBonusProgress 
  } = useAgentEarnings();

  const [performance, setPerformance] = useState<PerformanceData>({
    todayTransactions: 0,
    todayVolume: 0,
    todayCommissions: 0,
    weeklyTransactions: 0,
    weeklyVolume: 0,
    weeklyCommissions: 0,
    monthlyTransactions: 0,
    monthlyVolume: 0,
    monthlyCommissions: 0
  });
  const [rankings, setRankings] = useState<AgentRankingData[]>([]);
  const [myRank, setMyRank] = useState<AgentRankingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPerformance = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Récupérer les transactions aujourd'hui
      const { data: todayData } = await supabaseClient
        .from('recharges')
        .select('amount')
        .eq('provider_transaction_id', user.id)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`);

      // Récupérer les retraits aujourd'hui
      const { data: withdrawalsData } = await supabaseClient
        .from('withdrawals')
        .select('amount')
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`);

      // Calculs pour aujourd'hui
      const todayDeposits = todayData || [];
      const todayWithdrawals = withdrawalsData || [];
      const todayTransactions = todayDeposits.length + todayWithdrawals.length;
      const todayVolume = [...todayDeposits, ...todayWithdrawals].reduce((sum, t) => sum + Number(t.amount), 0);
      const todayCommissions = todayDeposits.reduce((sum, t) => sum + (Number(t.amount) * 0.01), 0) + 
                              todayWithdrawals.reduce((sum, t) => sum + (Number(t.amount) * 0.005), 0);

      setPerformance({
        todayTransactions,
        todayVolume,
        todayCommissions,
        weeklyTransactions: todayTransactions,
        weeklyVolume: todayVolume,
        weeklyCommissions: todayCommissions,
        monthlyTransactions: todayTransactions,
        monthlyVolume: todayVolume,
        monthlyCommissions: todayCommissions
      });
    } catch (error) {
      console.error('Erreur récupération performances:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAgentRankings = async () => {
    try {
      const now = new Date();
      const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Récupérer tous les agents
      const { data: agents } = await supabaseClient
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'agent');

      if (!agents) return;

      const agentRankings: AgentRankingData[] = [];

      for (const agent of agents) {
        // Calculer les commissions approximatives pour chaque agent
        const [withdrawalsResult, depositsResult] = await Promise.all([
          supabaseClient
            .from('withdrawals')
            .select('amount')
            .eq('user_id', agent.id)
            .gte('created_at', startDate.toISOString())
            .eq('status', 'completed'),
          supabaseClient
            .from('recharges')
            .select('amount')
            .eq('provider_transaction_id', agent.id)
            .gte('created_at', startDate.toISOString())
            .eq('status', 'completed')
        ]);

        const withdrawals = withdrawalsResult.data || [];
        const deposits = depositsResult.data || [];

        const withdrawalCommissions = withdrawals.reduce((sum, w) => sum + (Number(w.amount) * 0.002), 0);
        const depositCommissions = deposits.reduce((sum, d) => sum + (Number(d.amount) * 0.005), 0);

        const totalCommissions = withdrawalCommissions + depositCommissions;
        const totalOperations = withdrawals.length + deposits.length;

        if (totalOperations > 0) {
          agentRankings.push({
            agent_id: agent.id,
            agent_name: agent.full_name || 'Agent sans nom',
            total_commissions: totalCommissions,
            total_operations: totalOperations,
            rank: 0,
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

      // Garder seulement le top 5 pour l'affichage
      setRankings(agentRankings.slice(0, 5));
    } catch (error) {
      console.error('Erreur lors du chargement du classement:', error);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchPerformance();
      fetchAgentRankings();
      const interval = setInterval(() => {
        fetchPerformance();
        fetchAgentRankings();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Award className="w-5 h-5 text-amber-600" />;
      default: return <Star className="w-4 h-4 text-gray-400" />;
    }
  };

  const nextTier = getNextTierInfo();
  const bonusProgress = getBonusProgress();

  return (
    <div className="space-y-6">
      {/* Performances Temps Réel */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Performances Temps Réel
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={fetchPerformance}
                variant="ghost"
                size="sm"
                disabled={isLoading}
                className="h-8 w-8 p-0 hover:bg-blue-100"
              >
                <RefreshCw className={`w-4 h-4 text-blue-600 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Aujourd'hui */}
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-blue-100">
              <div className="text-center">
                <h3 className="text-sm font-medium text-blue-700 mb-2">Aujourd'hui</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Transactions
                    </span>
                    <span className="font-bold">{performance.todayTransactions}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      Volume
                    </span>
                    <span className="font-bold">{formatCurrency(performance.todayVolume)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Commissions
                    </span>
                    <span className="font-bold text-green-600">{formatCurrency(performance.todayCommissions)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cette semaine */}
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-green-100">
              <div className="text-center">
                <h3 className="text-sm font-medium text-green-700 mb-2">Cette semaine</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Transactions
                    </span>
                    <span className="font-bold">{performance.weeklyTransactions}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      Volume
                    </span>
                    <span className="font-bold">{formatCurrency(performance.weeklyVolume)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Commissions
                    </span>
                    <span className="font-bold text-green-600">{formatCurrency(performance.weeklyCommissions)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ce mois */}
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-purple-100">
              <div className="text-center">
                <h3 className="text-sm font-medium text-purple-700 mb-2">Ce mois</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Transactions
                    </span>
                    <span className="font-bold">{performance.monthlyTransactions}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      Volume
                    </span>
                    <span className="font-bold">{formatCurrency(performance.monthlyVolume)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Commissions
                    </span>
                    <span className="font-bold text-green-600">{formatCurrency(performance.monthlyCommissions)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-blue-600">
              🔄 Mise à jour automatique toutes les 30 secondes
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Progression vers Sendflow */}
      {earnings && nextTier && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <ArrowUp className="w-5 h-5" />
              Progression vers {nextTier.tierName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Volume requis:</span>
                <span className="font-semibold">
                  {formatCurrency(nextTier.requiredVolume, 'XAF')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Restant:</span>
                <span className="font-semibold text-amber-700">
                  {formatCurrency(nextTier.remainingVolume, 'XAF')}
                </span>
              </div>
              <Progress 
                value={(earnings.totalVolume / nextTier.requiredVolume) * 100}
                className="h-3"
              />
              <div className="text-xs text-amber-700">
                Nouveau taux: {(nextTier.commissionRate * 100).toFixed(1)}%
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bonus Mensuels */}
      {earnings && bonusProgress.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-600" />
              Bonus Mensuels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bonusProgress.slice(0, 3).map((bonus, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{bonus.description}</span>
                    {bonus.achieved ? (
                      <Badge className="bg-green-100 text-green-800">
                        <Award className="w-3 h-3 mr-1" />
                        Atteint
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        {formatCurrency(bonus.bonusAmount, 'XAF')}
                      </Badge>
                    )}
                  </div>
                  <Progress 
                    value={bonus.progress}
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                       {bonus.bonusType === 'no_complaints' 
                        ? `${bonus.current} réclamation(s)`
                        : bonus.bonusType === 'volume'
                        ? formatCurrency(bonus.current, 'XAF')
                        : `${bonus.current} transactions`
                      }
                    </span>
                    <span>
                      {bonus.bonusType === 'no_complaints'
                        ? 'Objectif: 0 réclamation'
                        : bonus.bonusType === 'volume'
                        ? `Objectif: ${formatCurrency(bonus.requirementValue, 'XAF')}`
                        : `Objectif: ${bonus.requirementValue} transactions`
                      }
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analyse des Zones Performantes */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-purple-600" />
            Analyse des Zones Performantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Zones Performantes</h3>
            <p className="text-gray-600 mb-4">Analyse de vos zones d'activité les plus performantes</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-purple-100 rounded-lg">
                <div className="font-semibold text-purple-800">Zone Centre-Ville</div>
                <div className="text-purple-600">Potentiel élevé</div>
              </div>
              <div className="p-3 bg-pink-100 rounded-lg">
                <div className="font-semibold text-pink-800">Zone Résidentielle</div>
                <div className="text-pink-600">En développement</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Classement des Agents */}
      <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-orange-600" />
            Classement des Agents (Top 5)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {myRank && (
            <div className="mb-4 p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg">
              <div className="text-center">
                <div className="text-lg font-bold">Votre position: #{myRank.rank}</div>
                <div className="text-sm opacity-90">
                  {formatCurrency(myRank.total_commissions, 'XAF')} • {myRank.total_operations} opérations
                </div>
              </div>
            </div>
          )}

          {rankings.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <Award className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Aucun classement disponible</p>
            </div>
          ) : (
            <div className="space-y-2">
              {rankings.map((agent) => (
                <div
                  key={agent.agent_id}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                    agent.isCurrentUser 
                      ? 'bg-blue-50 border-2 border-blue-200' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {getRankIcon(agent.rank)}
                    <div>
                      <h4 className="font-semibold text-sm">
                        {agent.isCurrentUser ? 'Vous' : agent.agent_name}
                        {agent.isCurrentUser && (
                          <Badge className="ml-2 bg-blue-600 text-white text-xs">Vous</Badge>
                        )}
                      </h4>
                      <p className="text-xs text-gray-600">
                        {agent.total_operations} opérations
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">
                      {formatCurrency(agent.total_commissions, 'XAF')}
                    </div>
                    <div className="text-xs text-gray-600">#{agent.rank}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
