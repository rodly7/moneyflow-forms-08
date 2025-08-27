import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowUpRight, 
  ArrowDownLeft,
  LogOut,
  Eye,
  EyeOff,
  Settings,
  RefreshCw,
  Wallet,
  History,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Trophy,
  Bell,
  Calendar,
  MapPin,
  Clock,
  Star,
  Award,
  BarChart3,
  PieChart,
  LineChart
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/lib/utils/currency";
import { UnifiedNotificationBell } from "@/components/notifications/UnifiedNotificationBell";
import { useAgentWithdrawalEnhanced } from "@/hooks/useAgentWithdrawalEnhanced";
import { AgentRealTimePerformance } from "@/components/agent/AgentRealTimePerformance";
import AgentTransactionHistory from "@/components/agent/AgentTransactionHistory";
import AgentEarningsCard from "@/components/agent/AgentEarningsCard";
import AgentRanking from "@/components/agent/AgentRanking";
import AgentZoneAnalysis from "@/components/agent/AgentZoneAnalysis";
import AgentDailyHistory from "@/components/agent/AgentDailyHistory";
import AgentYesterdaySummary from "@/components/agent/AgentYesterdaySummary";

interface EnhancedAgentDashboardProps {
  userId: string | undefined;
}

const EnhancedAgentDashboard: React.FC<EnhancedAgentDashboardProps> = ({ userId }) => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isBalanceVisible, setIsBalanceVisible] = useState(false);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);

  const {
    agentBalance,
    agentCommissionBalance,
    isLoadingBalance,
    fetchAgentBalances
  } = useAgentWithdrawalEnhanced();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const toggleBalanceVisibility = () => {
    setIsBalanceVisible(!isBalanceVisible);
  };

  const formatBalanceDisplay = (balance: number) => {
    if (!isBalanceVisible) {
      return "••••••••";
    }
    return formatCurrency(balance, 'XAF');
  };

  if (showTransactionHistory) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <Button
                onClick={() => setShowTransactionHistory(false)}
                variant="ghost"
                size="sm"
              >
                ← Retour au tableau de bord
              </Button>
              <div className="flex items-center space-x-2">
                <UnifiedNotificationBell />
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-6">
          <AgentTransactionHistory />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {profile?.full_name || 'Agent'}
                </h1>
                <p className="text-sm text-gray-500">Agent SendFlow</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <UnifiedNotificationBell />
              <Button
                onClick={fetchAgentBalances}
                variant="ghost"
                size="sm"
                disabled={isLoadingBalance}
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingBalance ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Solde Principal */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Solde Principal
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={toggleBalanceVisibility}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  {isBalanceVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Wallet className="w-4 h-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 mb-3">
                {formatBalanceDisplay(agentBalance || 0)}
              </div>
            </CardContent>
          </Card>

          {/* Commissions - Total (Dépôt 1% + Retrait 0,5%) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Commissions Totales
              </CardTitle>
              <Wallet className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 mb-3">
                {formatBalanceDisplay(agentCommissionBalance || 0)}
              </div>
              <div className="text-xs text-gray-500 mb-3">
                Dépôt: 1% | Retrait: 0,5%
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/agent-commission-withdrawal')}
              >
                Retirer Commissions
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions - Moved after commissions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Actions Rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-20 flex-col gap-2 hover:bg-blue-50 border-blue-200"
                onClick={() => navigate('/agent-withdrawal-advanced')}
              >
                <ArrowUpRight className="w-6 h-6 text-blue-600" />
                <span className="text-sm">Retrait Client</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex-col gap-2 hover:bg-green-50 border-green-200"
                onClick={() => navigate('/agent-deposit')}
              >
                <ArrowDownLeft className="w-6 h-6 text-green-600" />
                <span className="text-sm">Dépôt Client</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="performance" className="space-y-4">
          <TabsList>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="statistics">Statistiques</TabsTrigger>
            <TabsTrigger value="analysis">Analyse</TabsTrigger>
          </TabsList>
          <TabsContent value="performance" className="space-y-4">
            <AgentRealTimePerformance userId={userId} />
            <AgentEarningsCard userId={userId} />
            <AgentRanking userId={userId} />
          </TabsContent>
          <TabsContent value="statistics" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AgentDailyHistory userId={userId} />
              <AgentYesterdaySummary userId={userId} />
          </TabsContent>
          <TabsContent value="analysis">
            <AgentZoneAnalysis userId={userId} />
          </TabsContent>
        </Tabs>

        {/* Services */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Services Agent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button
                onClick={() => setShowTransactionHistory(true)}
                variant="outline"
                className="w-full h-12 justify-start"
              >
                <History className="w-5 h-5 mr-3 text-gray-600" />
                Historique des Transactions
              </Button>
              
              <Button
                onClick={() => navigate('/agent-settings')}
                variant="outline"
                className="w-full h-12 justify-start"
              >
                <Settings className="w-5 h-5 mr-3 text-gray-600" />
                Paramètres
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedAgentDashboard;
