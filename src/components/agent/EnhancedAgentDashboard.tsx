import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  QrCode, 
  History, 
  DollarSign, 
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Wallet,
  Eye,
  EyeOff,
  RefreshCw,
  Star,
  Trophy,
  MapPin,
  Target,
  BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/utils/currency';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AgentStats {
  total_volume: number;
  total_transactions: number;
  total_commission: number;
  new_users: number;
}

interface AgentRanking {
  agent_id: string;
  agent_name: string;
  total_volume: number;
  rank: number;
}

const EnhancedAgentDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [agentStats, setAgentStats] = useState<AgentStats | null>(null);
  const [agentRankings, setAgentRankings] = useState<AgentRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const fetchAgentStats = async () => {
      setLoading(true);
      try {
        const { data: stats, error: statsError } = await supabase
          .from('agent_stats')
          .select('*')
          .eq('agent_id', user.id)
          .single();

        if (statsError) {
          console.error("Erreur lors de la récupération des statistiques de l'agent:", statsError);
          toast({
            title: "Erreur",
            description: "Impossible de charger les statistiques de l'agent",
            variant: "destructive"
          });
        } else {
          setAgentStats(stats);
        }

        const { data: rankings, error: rankingsError } = await supabase
          .from('agent_rankings')
          .select('*')
          .order('rank', { ascending: true });

        if (rankingsError) {
          console.error("Erreur lors de la récupération du classement des agents:", rankingsError);
          toast({
            title: "Erreur",
            description: "Impossible de charger le classement des agents",
            variant: "destructive"
          });
        } else {
          setAgentRankings(rankings);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAgentStats();
  }, [user?.id, toast]);

  const userRanking = useMemo(() => {
    return agentRankings.find(rank => rank.agent_id === user?.id);
  }, [agentRankings, user?.id]);

  const toggleBalanceVisibility = () => {
    setShowBalance(!showBalance);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card className="bg-white shadow-lg rounded-xl overflow-hidden">
        <CardHeader className="p-6 pb-0">
          <CardTitle className="text-2xl font-bold text-gray-800">
            Bienvenue, {profile?.full_name || 'Agent'} 👋
          </CardTitle>
          <p className="text-gray-600 mt-1">
            Suivez vos performances et gérez votre activité.
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Solde Card */}
            <Card className="bg-blue-50 border border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Solde actuel</p>
                    <p className="text-2xl font-bold text-blue-800">
                      {showBalance ? formatCurrency(profile?.balance || 0, 'XAF') : '••••••'}
                    </p>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={toggleBalanceVisibility}
                      className="mt-2 text-blue-500 hover:bg-blue-100"
                    >
                      {showBalance ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                      {showBalance ? 'Masquer' : 'Afficher'}
                    </Button>
                  </div>
                  <Wallet className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            {/* Commission Card */}
            <Card className="bg-green-50 border border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Commissions</p>
                    <p className="text-2xl font-bold text-green-800">
                      {formatCurrency(agentStats?.total_commission || 0, 'XAF')}
                    </p>
                    <p className="text-xs text-green-500 mt-1">Total accumulé</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            {/* Transactions Card */}
            <Card className="bg-purple-50 border border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Transactions</p>
                    <p className="text-2xl font-bold text-purple-800">
                      {agentStats?.total_transactions || 0}
                    </p>
                    <p className="text-xs text-purple-500 mt-1">Nombre total</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-lg rounded-xl overflow-hidden">
        <CardHeader className="p-6 pb-0">
          <CardTitle className="text-xl font-bold text-gray-800">
            Classement des Agents
          </CardTitle>
          <p className="text-gray-600 mt-1">
            Votre position actuelle dans le réseau.
          </p>
        </CardHeader>
        <CardContent className="p-6">
          {userRanking ? (
            <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 p-4 rounded-xl">
              <div>
                <p className="text-sm text-yellow-700 font-medium">Votre Classement</p>
                <p className="text-2xl font-bold text-yellow-900">
                  #{userRanking.rank}
                </p>
                <p className="text-xs text-yellow-500 mt-1">
                  Volume total: {formatCurrency(userRanking.total_volume, 'XAF')}
                </p>
              </div>
              <Trophy className="w-8 h-8 text-yellow-600" />
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <p>Classement non disponible pour le moment.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white shadow-lg rounded-xl overflow-hidden">
        <CardHeader className="p-6 pb-0">
          <CardTitle className="text-xl font-bold text-gray-800">
            Actions Rapides
          </CardTitle>
          <p className="text-gray-600 mt-1">
            Accès rapide aux fonctionnalités clés.
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="flex items-center justify-center space-x-2 bg-blue-50 hover:bg-blue-100"
              onClick={() => navigate('/transfer')}
            >
              <ArrowUpRight className="w-4 h-4 text-blue-600" />
              <span>Envoyer</span>
            </Button>
            <Button
              variant="outline"
              className="flex items-center justify-center space-x-2 bg-green-50 hover:bg-green-100"
              onClick={() => navigate('/qr-code')}
            >
              <QrCode className="w-4 h-4 text-green-600" />
              <span>QR Code</span>
            </Button>
            <Button
              variant="outline"
              className="flex items-center justify-center space-x-2 bg-orange-50 hover:bg-orange-100"
              onClick={() => navigate('/agent/history')}
            >
              <History className="w-4 h-4 text-orange-600" />
              <span>Historique</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedAgentDashboard;
