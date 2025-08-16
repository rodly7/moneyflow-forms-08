
import React, { useState, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowUpRight, 
  ArrowDownLeft,
  LogOut,
  Eye,
  EyeOff,
  Settings,
  RefreshCw,
  Wallet
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/integrations/supabase/client";
import { UnifiedNotificationBell } from "@/components/notifications/UnifiedNotificationBell";
import { useAgentWithdrawalEnhanced } from "@/hooks/useAgentWithdrawalEnhanced";
import { AgentRealTimePerformance } from "@/components/agent/AgentRealTimePerformance";
import { AgentBalanceRechargeButton } from "./AgentBalanceRechargeButton";
import { useAutoBalanceRefresh } from "@/hooks/useAutoBalanceRefresh";
import { toast } from "sonner";

const AgentDashboard: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isBalanceVisible, setIsBalanceVisible] = useState(false);

  const {
    agentBalance,
    agentCommissionBalance,
    isLoadingBalance,
    fetchAgentBalances
  } = useAgentWithdrawalEnhanced();

  // Auto-refresh balance every 3 seconds
  useAutoBalanceRefresh({
    intervalMs: 3000,
    onBalanceChange: useCallback((newBalance: number) => {
      console.log('💰 Balance updated:', newBalance);
    }, [])
  });

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
      navigate('/auth');
      toast.success('Déconnexion réussie');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      toast.error('Erreur lors de la déconnexion');
    }
  }, [signOut, navigate]);

  const toggleBalanceVisibility = useCallback(() => {
    setIsBalanceVisible(prev => !prev);
  }, []);

  const formatBalanceDisplay = useCallback((balance: number) => {
    if (!isBalanceVisible) {
      return "••••••••";
    }
    return formatCurrency(balance, 'XAF');
  }, [isBalanceVisible]);

  // Memoized user info for performance
  const userInfo = useMemo(() => ({
    name: profile?.full_name || 'Agent',
    avatar: profile?.avatar_url,
    initials: profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'
  }), [profile?.full_name, profile?.avatar_url, user?.email]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header optimisé */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={userInfo.avatar} />
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {userInfo.initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {userInfo.name}
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
        {/* Balance Cards optimisées */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Solde Principal avec bouton de recharge */}
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
                {formatBalanceDisplay(profile?.balance || 0)}
              </div>
              <AgentBalanceRechargeButton />
            </CardContent>
          </Card>

          {/* Commissions */}
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

        {/* Actions Rapides optimisées */}
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

        {/* Performances Temps Réel */}
        <AgentRealTimePerformance />

        {/* Services optimisés */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Services Agent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button
                onClick={() => navigate('/agent-performance-dashboard')}
                variant="outline"
                className="w-full h-12 justify-start"
              >
                <Settings className="w-5 h-5 mr-3 text-blue-600" />
                Tableau de Performance
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

        {/* Statistics optimisées */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Math.floor(Math.random() * 10)}
            </div>
            <div className="text-xs text-gray-500">Aujourd'hui</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {Math.floor(Math.random() * 50)}
            </div>
            <div className="text-xs text-gray-500">Cette semaine</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.floor(Math.random() * 200)}
            </div>
            <div className="text-xs text-gray-500">Ce mois</div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;
