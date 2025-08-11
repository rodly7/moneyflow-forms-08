
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
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
  Bell,
  DollarSign
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header avec thème bleu pour agent */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-14 w-14 border-2 border-white/20">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-white/10 text-white font-semibold text-lg">
                {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold text-blue-100">
                Tableau de Bord Agent
              </h1>
              <p className="text-blue-200 text-sm">
                Bienvenue {profile?.full_name || 'Agent'}
              </p>
              <p className="text-blue-300 text-xs">
                NGANGOUE - Congo Brazzaville
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <UnifiedNotificationBell />
            <Button
              onClick={fetchAgentBalances}
              variant="outline"
              size="sm"
              disabled={isLoadingBalance}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingBalance ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline ml-1">Actualiser</span>
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="bg-red-500/20 border-red-300/30 text-white hover:bg-red-500/30 hover:text-white flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Solde Principal */}
      <div className="px-6 -mt-8 relative z-10">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-600 rounded-full">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-800">Solde Principal</h3>
                </div>
              </div>
              <Button
                onClick={toggleBalanceVisibility}
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:bg-blue-100"
              >
                {isBalanceVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            <div className="text-3xl font-bold text-blue-900 mb-2">
              {formatBalanceDisplay(agentBalance || 0)}
            </div>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => navigate('/agent-deposit')}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Recharger mon solde
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Commissions */}
      <div className="px-6 mt-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-600 rounded-full">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-800">Mes Commissions</h3>
              </div>
            </div>
            <div className="text-2xl font-bold text-green-900">
              {formatBalanceDisplay(agentCommissionBalance || 0)}
            </div>
            <Button
              variant="outline"
              className="w-full mt-3 border-green-300 text-green-700 hover:bg-green-50"
              onClick={() => navigate('/agent-commission-withdrawal')}
            >
              Retirer mes commissions
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Actions Principales */}
      <div className="px-6 mt-6">
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-5">Actions Principales</h2>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-24 flex-col gap-3 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:bg-blue-100"
                onClick={() => navigate('/agent-withdrawal-advanced')}
              >
                <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full">
                  <ArrowUpRight className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-center">Retrait Client</span>
              </Button>

              <Button
                variant="outline"
                className="h-24 flex-col gap-3 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:bg-green-100"
                onClick={() => navigate('/agent-deposit')}
              >
                <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full">
                  <ArrowDownLeft className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-center">Dépôt Client</span>
              </Button>

              <Button
                variant="outline"
                className="h-24 flex-col gap-3 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 hover:bg-purple-100"
                onClick={() => navigate('/qr-code')}
              >
                <div className="p-3 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full">
                  <QrCode className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-center">QR Code</span>
              </Button>

              <Button
                variant="outline"
                className="h-24 flex-col gap-3 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 hover:bg-orange-100"
                onClick={() => navigate('/qr-payment')}
              >
                <div className="p-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full">
                  <Scan className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-center">Scanner</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services Additionnels */}
      <div className="px-6 mt-6">
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-5">Services Agent</h2>
            <div className="grid grid-cols-1 gap-4">
              <Button
                onClick={() => navigate('/agent-services')}
                variant="outline"
                className="h-16 flex items-center justify-start gap-4 hover:bg-blue-50 border-blue-200"
              >
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Services Agent</div>
                  <div className="text-sm text-gray-500">Gérer mes services client</div>
                </div>
              </Button>

              <Button
                onClick={() => navigate('/mobile-recharge')}
                variant="outline"
                className="h-16 flex items-center justify-start gap-4 hover:bg-green-50 border-green-200"
              >
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Recharge Mobile</div>
                  <div className="text-sm text-gray-500">Recharger les téléphones</div>
                </div>
              </Button>

              <Button
                onClick={() => navigate('/transactions')}
                variant="outline"
                className="h-16 flex items-center justify-start gap-4 hover:bg-purple-50 border-purple-200"
              >
                <div className="p-2 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg">
                  <History className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Historique</div>
                  <div className="text-sm text-gray-500">Mes transactions</div>
                </div>
              </Button>

              <Button
                onClick={() => navigate('/agent-performance-dashboard')}
                variant="outline"
                className="h-16 flex items-center justify-start gap-4 hover:bg-orange-50 border-orange-200"
              >
                <div className="p-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Performances</div>
                  <div className="text-sm text-gray-500">Mes statistiques</div>
                </div>
              </Button>

              <Button
                onClick={() => navigate('/agent-reports')}
                variant="outline"
                className="h-16 flex items-center justify-start gap-4 hover:bg-indigo-50 border-indigo-200"
              >
                <div className="p-2 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Rapports</div>
                  <div className="text-sm text-gray-500">Rapports d'activité</div>
                </div>
              </Button>

              <Button
                onClick={() => navigate('/agent-settings')}
                variant="outline"
                className="h-16 flex items-center justify-start gap-4 hover:bg-gray-50 border-gray-200"
              >
                <div className="p-2 bg-gradient-to-r from-gray-500 to-slate-500 rounded-lg">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Paramètres</div>
                  <div className="text-sm text-gray-500">Configuration</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats en bas */}
      <div className="px-6 mt-6 mb-8">
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <div className="text-xl font-bold text-blue-700">0</div>
            <div className="text-xs text-blue-600">Aujourd'hui</div>
          </Card>
          <Card className="p-4 text-center bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <div className="text-xl font-bold text-green-700">0</div>
            <div className="text-xs text-green-600">Cette semaine</div>
          </Card>
          <Card className="p-4 text-center bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
            <div className="text-xl font-bold text-purple-700">0</div>
            <div className="text-xs text-purple-600">Ce mois</div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;
