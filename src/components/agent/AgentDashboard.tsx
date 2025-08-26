
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
import useAgentEarnings from '@/hooks/useAgentEarnings';
import AgentCommissionWithdrawal from './AgentCommissionWithdrawal';

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
  const [commissionBalance, setCommissionBalance] = useState<number>(0);
  const [yesterdaySummary, setYesterdaySummary] = useState<{
    totalVolume: number;
    totalTransactions: number;
  } | null>(null);

  const { earnings } = useAgentEarnings();

  const handleWithdrawalSuccess = () => {
    // Refresh data after successful withdrawal
    fetchAgentData();
  };

  const fetchAgentData = async () => {
    if (!user?.id) {
      navigate('/auth');
      return;
    }

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

      // Fetch agent commission balance
      const { data: agentData, error: agentError } = await supabase
        .from('agents')
        .select('commission_balance')
        .eq('user_id', user.id)
        .single();

      if (!agentError && agentData) {
        setCommissionBalance(agentData.commission_balance || 0);
      }

      // Set mock data for demonstration - using existing data from useAgentEarnings
      setYesterdaySummary({
        totalVolume: 150000,
        totalTransactions: 25,
      });

      setTotalTransactions(120);
      setTotalVolume(2500000);
      setTotalEarnings(earnings.totalEarnings || 45000);

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

  useEffect(() => {
    fetchAgentData();
  }, [user?.id, navigate, toast, earnings.totalEarnings]);

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
              <Button variant="secondary" onClick={() => fetchAgentData()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Rafraîchir
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats and Earnings Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AgentStatsCard
            label="Transactions Totales"
            value={totalTransactions}
            icon={History}
          />
          <AgentStatsCard
            label="Volume Total"
            value={formatCurrency(totalVolume)}
            icon={DollarSign}
          />
          <AgentEarningsCard
            totalEarnings={totalEarnings}
            commissionRate={2.5}
            totalWithdrawals={15000}
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
          commissionBalance={commissionBalance}
          onRefresh={handleWithdrawalSuccess}
        />

        {/* Recent Transactions Section */}
        <AgentTransactionHistory />
      </div>
    </div>
  );
};

export default AgentDashboard;
