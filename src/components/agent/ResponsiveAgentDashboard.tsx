
import React from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  Award,
  History,
  BarChart3,
  Settings,
  Bell,
  TrendingUp,
  DollarSign,
  Target,
  Smartphone,
  QrCode,
  Users,
  FileText,
  RefreshCw,
  MapPin,
  Plus,
  Send,
  Receipt,
  CreditCard
} from "lucide-react";
import { useAgentWithdrawalEnhanced } from "@/hooks/useAgentWithdrawalEnhanced";
import { formatCurrency } from "@/integrations/supabase/client";

const ResponsiveAgentDashboard = () => {
  const isMobile = useIsMobile(768);
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const {
    agentBalance,
    agentCommissionBalance,
    isLoadingBalance,
    fetchAgentBalances
  } = useAgentWithdrawalEnhanced();

  // Actions rapides pour agent
  const quickActions = [
    {
      title: "Retrait Client",
      description: "Effectuer un retrait",
      icon: ArrowUpRight,
      onClick: () => navigate("/agent-withdrawal-advanced"),
      color: "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
    },
    {
      title: "Dépôt Client", 
      description: "Effectuer un dépôt",
      icon: ArrowDownLeft,
      onClick: () => navigate("/agent-deposit"),
      color: "bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
    },
    {
      title: "Recharge Mobile",
      description: "Crédits téléphone",
      icon: Smartphone,
      onClick: () => navigate("/mobile-recharge"),
      color: "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
    },
    {
      title: "Paiement QR",
      description: "Scanner & payer",
      icon: QrCode,
      onClick: () => navigate("/qr-payment"),
      color: "bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600"
    }
  ];

  const additionalActions = [
    {
      title: "Mes Transactions",
      icon: History,
      onClick: () => navigate("/transactions")
    },
    {
      title: "Performances",
      icon: BarChart3,
      onClick: () => navigate("/agent-performance-dashboard")
    },
    {
      title: "Services Agent",
      icon: Users,
      onClick: () => navigate("/agent-services")
    },
    {
      title: "Mes Rapports",
      icon: FileText,
      onClick: () => navigate("/agent-reports")
    },
    {
      title: "Paramètres",
      icon: Settings,
      onClick: () => navigate("/agent-settings")
    },
    {
      title: "Ma Zone",
      icon: MapPin,
      onClick: () => navigate("/agent-zone")
    }
  ];

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 p-4">
        <div className="max-w-md mx-auto space-y-6">
          
          {/* Header Agent Mobile */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-orange-700">Agent Dashboard</h1>
                <p className="text-gray-600">{profile?.full_name || 'Agent'}</p>
                <p className="text-sm text-orange-600">{profile?.country || 'Congo'}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchAgentBalances}
                disabled={isLoadingBalance}
                className="border-orange-200 hover:border-orange-400"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingBalance ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Soldes Agent Mobile */}
          <div className="grid grid-cols-1 gap-4">
            <Card className="bg-gradient-to-r from-orange-100 to-red-100 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="w-5 h-5 text-orange-600" />
                      <span className="font-medium text-orange-700">Solde Principal</span>
                    </div>
                    {isLoadingBalance ? (
                      <div className="animate-pulse bg-orange-200 h-8 w-32 rounded"></div>
                    ) : (
                      <div className="text-2xl font-bold text-orange-800">
                        {formatCurrency(agentBalance, 'XAF')}
                      </div>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => navigate("/agent-recharge")}
                    className="border-orange-300 text-orange-700 hover:bg-orange-50"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-100 to-emerald-100 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-700">Commissions</span>
                    </div>
                    {isLoadingBalance ? (
                      <div className="animate-pulse bg-green-200 h-8 w-32 rounded"></div>
                    ) : (
                      <div className="text-2xl font-bold text-green-800">
                        {formatCurrency(agentCommissionBalance, 'XAF')}
                      </div>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => navigate("/agent-commission-withdrawal")}
                    className="border-green-300 text-green-700 hover:bg-green-50"
                  >
                    <Target className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions Rapides Mobile */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                Actions Rapides
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    onClick={action.onClick}
                    className={`h-20 flex flex-col items-center justify-center gap-2 ${action.color} text-white shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200`}
                  >
                    <action.icon className="w-5 h-5" />
                    <div className="text-center">
                      <div className="font-semibold text-xs">{action.title}</div>
                      <div className="text-xs opacity-90">{action.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Services Additionnels Mobile */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-600" />
                Mes Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {additionalActions.map((action, index) => (
                  <Button
                    key={index}
                    onClick={action.onClick}
                    variant="outline"
                    className="h-16 flex flex-col items-center justify-center gap-2 hover:bg-orange-50 border-orange-200 hover:border-orange-300"
                  >
                    <action.icon className="w-4 h-4" />
                    <div className="text-xs font-medium">{action.title}</div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stats Rapides Mobile */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl p-4 text-center border border-orange-200">
              <div className="text-xl font-bold text-orange-700">0</div>
              <div className="text-xs text-orange-600">Aujourd'hui</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center border border-green-200">
              <div className="text-xl font-bold text-green-700">0</div>
              <div className="text-xs text-green-600">Cette semaine</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center border border-blue-200">
              <div className="text-xl font-bold text-blue-700">0</div>
              <div className="text-xs text-blue-600">Ce mois</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Version Desktop
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Desktop */}
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-orange-700">Dashboard Agent</h1>
              <p className="text-gray-600 mt-2 text-lg">
                Bienvenue {profile?.full_name || 'Agent'} - {profile?.country || 'Congo'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => navigate("/notifications")}
                className="border-orange-200 hover:border-orange-400"
              >
                <Bell className="w-5 h-5" />
              </Button>
              <Button 
                variant="outline"
                onClick={fetchAgentBalances}
                disabled={isLoadingBalance}
                className="border-green-200 hover:border-green-400"
              >
                <TrendingUp className={`w-5 h-5 ${isLoadingBalance ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>
          </div>
        </div>

        {/* Soldes Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-gradient-to-br from-orange-100 to-red-100 border-orange-200 shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-3">
                <Wallet className="w-6 h-6 text-orange-600" />
                Solde Principal Agent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-4xl font-bold text-orange-800">
                  {isLoadingBalance ? (
                    <div className="animate-pulse bg-orange-200 h-12 w-48 rounded"></div>
                  ) : (
                    formatCurrency(agentBalance, 'XAF')
                  )}
                </div>
                <Button 
                  onClick={() => navigate("/agent-recharge")}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Recharger mon solde
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-100 to-emerald-100 border-green-200 shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-3">
                <Award className="w-6 h-6 text-green-600" />
                Mes Commissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-4xl font-bold text-green-800">
                  {isLoadingBalance ? (
                    <div className="animate-pulse bg-green-200 h-12 w-48 rounded"></div>
                  ) : (
                    formatCurrency(agentCommissionBalance, 'XAF')
                  )}
                </div>
                <Button 
                  onClick={() => navigate("/agent-commission-withdrawal")}
                  className="w-full bg-green-500 hover:bg-green-600 text-white"
                >
                  <Target className="w-5 h-5 mr-2" />
                  Retirer mes commissions
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Principales Desktop */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <TrendingUp className="w-7 h-7 text-orange-600" />
              Actions Principales Agent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  onClick={action.onClick}
                  className={`h-28 flex flex-col items-center justify-center gap-3 ${action.color} text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300`}
                >
                  <action.icon className="w-8 h-8" />
                  <div className="text-center">
                    <div className="font-bold">{action.title}</div>
                    <div className="text-sm opacity-90">{action.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Services Additionnels Desktop */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Settings className="w-7 h-7 text-gray-600" />
              Mes Services Agent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {additionalActions.map((action, index) => (
                <Button
                  key={index}
                  onClick={action.onClick}
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center gap-3 hover:shadow-lg transition-all duration-300 border-2 hover:border-orange-300 hover:bg-orange-50"
                >
                  <action.icon className="w-6 h-6" />
                  <div className="font-semibold">{action.title}</div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Statistiques Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="bg-gradient-to-br from-purple-100 to-pink-100 border-purple-200 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg text-purple-600 font-semibold">Aujourd'hui</p>
                  <p className="text-3xl font-bold text-purple-800">0 XAF</p>
                  <p className="text-sm text-purple-600">Transactions</p>
                </div>
                <History className="w-10 h-10 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-100 to-yellow-100 border-orange-200 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg text-orange-600 font-semibold">Cette semaine</p>
                  <p className="text-3xl font-bold text-orange-800">0 XAF</p>
                  <p className="text-sm text-orange-600">Volume</p>
                </div>
                <TrendingUp className="w-10 h-10 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-100 to-blue-100 border-cyan-200 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg text-cyan-600 font-semibold">Ce mois</p>
                  <p className="text-3xl font-bold text-cyan-800">0 XAF</p>
                  <p className="text-sm text-cyan-600">Commissions</p>
                </div>
                <Award className="w-10 h-10 text-cyan-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResponsiveAgentDashboard;
