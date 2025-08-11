
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
  RefreshCw
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/integrations/supabase/client";
import { UnifiedNotificationBell } from "@/components/notifications/UnifiedNotificationBell";
import { useAgentWithdrawalEnhanced } from "@/hooks/useAgentWithdrawalEnhanced";
import { toast } from "sonner";

const NewAgentDashboard: React.FC = () => {
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

  // Actions rapides pour agents avec couleurs oranges/rouges
  const quickActions = [
    {
      title: "Retrait Client",
      icon: ArrowUpRight,
      color: "from-orange-500 to-red-500",
      onClick: () => navigate('/agent-withdrawal-advanced')
    },
    {
      title: "Dépôt Client",
      icon: ArrowDownLeft,
      color: "from-red-500 to-pink-500",
      onClick: () => navigate('/agent-deposit')
    },
    {
      title: "QR Code",
      icon: QrCode,
      color: "from-orange-600 to-amber-600",
      onClick: () => navigate('/qr-code')
    },
    {
      title: "Scanner",
      icon: Scan,
      color: "from-red-600 to-orange-600",
      onClick: () => navigate('/qr-payment')
    },
    {
      title: "Services Agent",
      icon: Users,
      color: "from-amber-500 to-orange-500",
      onClick: () => navigate('/agent-services')
    },
    {
      title: "Recharge Mobile",
      icon: Smartphone,
      color: "from-pink-500 to-red-500",
      onClick: () => navigate('/mobile-recharge')
    }
  ];

  const formatBalanceDisplay = (balance: number) => {
    if (!isBalanceVisible) {
      return "••••••••";
    }
    return formatCurrency(balance, 'XAF');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      {/* Header avec thème orange/rouge pour agent */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-14 w-14 border-2 border-white/20">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-white/10 text-white font-semibold text-lg">
                {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-lg font-semibold leading-tight">
                Agent {profile?.full_name || 'Dashboard'} 🏪
              </h1>
              <p className="text-orange-100 text-sm mt-2 leading-relaxed">
                {new Date().toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
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
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white text-sm p-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingBalance ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white text-sm p-2"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Soldes Agent avec thème orange */}
        <div className="space-y-4">
          {/* Solde Principal */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <p className="text-orange-100 text-sm font-medium leading-tight">Solde Agent</p>
              <Button
                onClick={toggleBalanceVisibility}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10 p-2"
              >
                {isBalanceVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-3xl font-bold mb-2 text-yellow-200 leading-none">
              {formatBalanceDisplay(agentBalance || 0)}
            </p>
            <div className="flex items-center space-x-2 text-xs text-orange-100">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Solde principal</span>
            </div>
          </div>

          {/* Commissions */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-green-300" />
                <p className="text-orange-100 text-sm font-medium leading-tight">Mes Commissions</p>
              </div>
            </div>
            <p className="text-2xl font-bold mb-2 text-green-200 leading-none">
              {formatBalanceDisplay(agentCommissionBalance || 0)}
            </p>
            <div className="flex items-center space-x-2 text-xs text-orange-100">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Gains du mois</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions rapides avec thème orange/rouge */}
      <div className="px-6 -mt-8 relative z-10">
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-5">Actions Agent</h2>
            <div className="grid grid-cols-2 gap-5">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="relative h-28 flex-col gap-3 bg-white border-0 hover:bg-gray-50 transition-all duration-300 hover:scale-105 shadow-lg"
                  onClick={action.onClick}
                >
                  <div className={`p-3 bg-gradient-to-r ${action.color} rounded-full min-w-[40px] min-h-[40px] flex items-center justify-center`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-base font-medium text-center">{action.title}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services Additionnels avec thème orange */}
      <div className="px-6 mt-6">
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-5">Gestion & Rapports</h2>
            <div className="grid grid-cols-1 gap-4">
              <Button
                onClick={() => navigate('/transactions')}
                variant="outline"
                className="h-16 flex items-center justify-start gap-4 hover:bg-orange-50 border-orange-200"
              >
                <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                  <History className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Historique des Transactions</div>
                  <div className="text-sm text-gray-500">Voir toutes mes opérations</div>
                </div>
              </Button>

              <Button
                onClick={() => navigate('/agent-performance-dashboard')}
                variant="outline"
                className="h-16 flex items-center justify-start gap-4 hover:bg-red-50 border-red-200"
              >
                <div className="p-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Performances Agent</div>
                  <div className="text-sm text-gray-500">Mes statistiques et objectifs</div>
                </div>
              </Button>

              <Button
                onClick={() => navigate('/agent-reports')}
                variant="outline"
                className="h-16 flex items-center justify-start gap-4 hover:bg-amber-50 border-amber-200"
              >
                <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Mes Rapports</div>
                  <div className="text-sm text-gray-500">Rapports détaillés d'activité</div>
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
                  <div className="font-semibold">Paramètres Agent</div>
                  <div className="text-sm text-gray-500">Configuration de mon compte</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats rapides en bas avec thème orange */}
      <div className="px-6 mt-6 mb-8">
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
            <div className="text-xl font-bold text-orange-700">0</div>
            <div className="text-xs text-orange-600">Aujourd'hui</div>
          </Card>
          <Card className="p-4 text-center bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
            <div className="text-xl font-bold text-red-700">0</div>
            <div className="text-xs text-red-600">Cette semaine</div>
          </Card>
          <Card className="p-4 text-center bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <div className="text-xl font-bold text-amber-700">0</div>
            <div className="text-xs text-amber-600">Ce mois</div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NewAgentDashboard;
