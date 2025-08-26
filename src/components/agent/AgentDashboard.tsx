import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/utils/currency';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AgentStatsCard from './AgentStatsCard';
import AgentEarningsCard from './AgentEarningsCard';
import AgentTransactionHistory from './AgentTransactionHistory';
import AgentYesterdaySummary from './AgentYesterdaySummary';
import { useAgentEarnings } from '@/hooks/useAgentEarnings';
import { useAgentTransactions } from '@/hooks/useAgentTransactions';
import { AgentCommissionWithdrawal } from './AgentCommissionWithdrawal';

const AgentDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isBalanceVisible, setIsBalanceVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<number | null>(null);
  const [totalTransactions, setTotalTransactions] = useState<number>(0);
  const [totalVolume, setTotalVolume] = useState<number>(0);
  const [totalEarnings, setTotalEarnings] = useState<number>(0);
  const [yesterdaySummary, setYesterdaySummary] = useState<{
    totalVolume: number;
    totalTransactions: number;
  } | null>(null);

  const { 
    totalCommission: totalCommissionEarned, 
    withdrawableCommission: withdrawableCommission 
  } = useAgentEarnings();

  const { transactions, refreshTransactions } = useAgentTransactions();

  useEffect(() => {
    if (!user?.id) {
      navigate('/auth');
      return;
    }

    const fetchAgentData = async () => {
      setLoading(true);
      try {
        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('balance, full_name, phone, country, is_verified')
          .eq('id', user.id)
          .single();

        if (profileError) {
          throw profileError;
        }

        setBalance(profileData?.balance || 0);

        // Fetch yesterday's summary
        const { data: yesterdayData, error: yesterdayError } = await supabase.rpc(
          'get_agent_yesterday_summary',
          { agent_id: user.id }
        );

        if (yesterdayError) {
          console.error("Error fetching yesterday's summary:", yesterdayError);
        } else {
          setYesterdaySummary({
            totalVolume: yesterdayData?.total_volume || 0,
            totalTransactions: yesterdayData?.total_transactions || 0,
          });
        }

        // Fetch total transactions and volume
        const { data: transactionData, error: transactionError } = await supabase.rpc(
          'get_agent_total_stats',
          { agent_id: user.id }
        );

        if (transactionError) {
          console.error("Error fetching total stats:", transactionError);
        } else {
          setTotalTransactions(transactionData?.total_transactions || 0);
          setTotalVolume(transactionData?.total_volume || 0);
        }

        // Fetch total earnings (assuming you have a function for this)
        const { data: earningsData, error: earningsError } = await supabase.rpc(
          'get_agent_total_earnings',
          { agent_id: user.id }
        );

        if (earningsError) {
          console.error("Error fetching total earnings:", earningsError);
        } else {
          setTotalEarnings(earningsData?.total_earnings || 0);
        }

      } catch (error: any) {
        console.error('Error fetching agent data:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données de l'agent",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAgentData();
  }, [user?.id, navigate, toast]);

  const toggleBalanceVisibility = () => {
    setIsBalanceVisible(!isBalanceVisible);
  };

  const formatBalanceDisplay = () => {
    if (!isBalanceVisible) {
      return "••••••••";
    }
    return formatCurrency(balance || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <div className="container mx-auto px-4 space-y-6">
        {/* Header Section */}
        <Card className="bg-white shadow-md rounded-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src={profile?.avatar_url} alt={profile?.full_name || 'Agent'} />
                  <AvatarFallback className="bg-gray-200 text-gray-600 font-semibold">
                    {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg font-semibold">
                    Bonjour, {profile?.full_name || 'Agent'} 👋
                  </CardTitle>
                  <p className="text-gray-500">
                    {new Date().toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={() => navigate('/transfer')}>
                Nouveau Transfert
              </Button>
            </div>

            {/* Balance Display */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-gray-600 text-sm font-medium">Solde actuel</div>
                <div className="text-2xl font-bold">{formatBalanceDisplay()}</div>
                <Button variant="ghost" size="sm" onClick={toggleBalanceVisibility}>
                  {isBalanceVisible ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                  {isBalanceVisible ? 'Masquer' : 'Afficher'}
                </Button>
              </div>
              <Button variant="secondary" onClick={() => refreshTransactions()}>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Rafraîchir
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats and Earnings Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AgentStatsCard
            title="Transactions Totales"
            value={totalTransactions}
            icon={History}
            color="blue"
          />
          <AgentStatsCard
            title="Volume Total"
            value={formatCurrency(totalVolume)}
            icon={DollarSign}
            color="green"
          />
          <AgentEarningsCard
            title="Commissions Totales"
            value={formatCurrency(totalEarnings)}
            icon={TrendingUp}
            color="purple"
          />
        </div>

        {/* Yesterday's Summary */}
        {yesterdaySummary && (
          <AgentYesterdaySummary
            totalVolume={yesterdaySummary.totalVolume}
            totalTransactions={yesterdaySummary.totalTransactions}
          />
        )}

        {/* Commission Management Section */}
        <AgentCommissionWithdrawal 
          totalCommission={totalCommissionEarned}
          withdrawableCommission={withdrawableCommission}
        />

        {/* Recent Transactions Section */}
        <AgentTransactionHistory transactions={transactions} />
      </div>
    </div>
  );
};

export default AgentDashboard;
