
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowUpRight, 
  ArrowDownLeft,
  QrCode,
  Smartphone,
  Scan,
  Users,
  History,
  LogOut,
  Eye,
  EyeOff,
  Award,
  Settings,
  FileText,
  BarChart3,
  RefreshCw,
  DollarSign,
  CreditCard,
  Wallet
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/integrations/supabase/client";
import { UnifiedNotificationBell } from "@/components/notifications/UnifiedNotificationBell";
import { useAgentWithdrawalEnhanced } from "@/hooks/useAgentWithdrawalEnhanced";
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

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth');
      toast.success('Déconnexion réussie');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      toast.error('Erreur lors de la déconnexion');
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
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => navigate('/deposit')}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Recharger
              </Button>
            </CardContent>
          </Card>

          {/* Commissions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Mes Commissions
              </CardTitle>
              <Award className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 mb-3">
                {formatBalanceDisplay(agentCommissionBalance || 0)}
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/agent-commission-withdrawal')}
              >
                Retirer
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
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

              <Button
                variant="outline"
                className="h-20 flex-col gap-2 hover:bg-purple-50 border-purple-200"
                onClick={() => navigate('/qr-code')}
              >
                <QrCode className="w-6 h-6 text-purple-600" />
                <span className="text-sm">QR Code</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex-col gap-2 hover:bg-orange-50 border-orange-200"
                onClick={() => navigate('/qr-payment')}
              >
                <Scan className="w-6 h-6 text-orange-600" />
                <span className="text-sm">Scanner</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Services */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Services Agent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button
                onClick={() => navigate('/agent-services')}
                variant="outline"
                className="w-full h-12 justify-start"
              >
                <Users className="w-5 h-5 mr-3 text-blue-600" />
                Services Client
              </Button>

              <Button
                onClick={() => navigate('/mobile-recharge')}
                variant="outline"
                className="w-full h-12 justify-start"
              >
                <Smartphone className="w-5 h-5 mr-3 text-green-600" />
                Recharge Mobile
              </Button>

              <Button
                onClick={() => navigate('/transactions')}
                variant="outline"
                className="w-full h-12 justify-start"
              >
                <History className="w-5 h-5 mr-3 text-purple-600" />
                Historique
              </Button>

              <Button
                onClick={() => navigate('/agent-performance-dashboard')}
                variant="outline"
                className="w-full h-12 justify-start"
              >
                <BarChart3 className="w-5 h-5 mr-3 text-orange-600" />
                Performances
              </Button>

              <Button
                onClick={() => navigate('/agent-reports')}
                variant="outline"
                className="w-full h-12 justify-start"
              >
                <FileText className="w-5 h-5 mr-3 text-indigo-600" />
                Rapports
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

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">0</div>
            <div className="text-xs text-gray-500">Aujourd'hui</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">0</div>
            <div className="text-xs text-gray-500">Cette semaine</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">0</div>
            <div className="text-xs text-gray-500">Ce mois</div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;
