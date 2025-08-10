
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
  Shield,
  Plus,
  Send,
  Receipt
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

  // Actions principales de l'agent
  const quickActions = [
    {
      title: "Retrait Client",
      description: "Effectuer un retrait",
      icon: ArrowUpRight,
      onClick: () => navigate("/agent-withdrawal-advanced"),
      gradient: "from-orange-500 to-red-500"
    },
    {
      title: "Dépôt Client", 
      description: "Effectuer un dépôt",
      icon: ArrowDownLeft,
      onClick: () => navigate("/agent-deposit"),
      gradient: "from-green-500 to-emerald-500"
    },
    {
      title: "Recharge Mobile",
      description: "Crédits téléphone",
      icon: Smartphone,
      onClick: () => navigate("/mobile-recharge"),
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      title: "Paiement QR",
      description: "Scanner & payer",
      icon: QrCode,
      onClick: () => navigate("/qr-payment"),
      gradient: "from-purple-500 to-violet-500"
    }
  ];

  const additionalActions = [
    {
      title: "Mes Transactions",
      description: "Historique complet",
      icon: History,
      onClick: () => navigate("/transactions")
    },
    {
      title: "Performances",
      description: "Mes statistiques",
      icon: BarChart3,
      onClick: () => navigate("/agent-performance-dashboard")
    },
    {
      title: "Services Agent",
      description: "Gérer mes services",
      icon: Users,
      onClick: () => navigate("/agent-services")
    },
    {
      title: "Mes Rapports",
      description: "Rapports détaillés",
      icon: FileText,
      onClick: () => navigate("/agent-reports")
    },
    {
      title: "Paramètres",
      description: "Mon compte",
      icon: Settings,
      onClick: () => navigate("/agent-settings")
    },
    {
      title: "Ma Zone",
      description: "Zone géographique",
      icon: MapPin,
      onClick: () => navigate("/agent-zone")
    }
  ];

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <div className="container mx-auto px-4 py-6 space-y-6 max-w-lg">
          
          {/* En-tête Agent */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-orange-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Agent Dashboard
                </h1>
                <p className="text-gray-600 mt-1">{profile?.full_name || 'Agent'}</p>
                <p className="text-sm text-orange-600">{profile?.country || 'Congo Brazzaville'}</p>
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

          {/* Soldes Agent */}
          <div className="grid grid-cols-1 gap-4">
            {/* Solde Principal */}
            <Card className="bg-gradient-to-r from-orange-50 to-red-100 border-orange-200 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="w-5 h-5 text-orange-600" />
                      <span className="font-medium text-orange-700">Solde Principal</span>
                    </div>
                    {isLoadingBalance ? (
                      <div className="animate-pulse bg-orange-200 h-8 w-32 rounded"></div>
                    ) : (
                      <div className="text-3xl font-bold text-orange-800">
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

            {/* Commissions */}
            <Card className="bg-gradient-to-r from-green-50 to-emerald-100 border-green-200 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-700">Mes Commissions</span>
                    </div>
                    {isLoadingBalance ? (
                      <div className="animate-pulse bg-green-200 h-8 w-32 rounded"></div>
                    ) : (
                      <div className="text-3xl font-bold text-green-800">
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

          {/* Actions Rapides */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <TrendingUp className="w-6 h-6 text-orange-600" />
                Actions Rapides
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    onClick={action.onClick}
                    className={`h-24 flex flex-col items-center justify-center gap-2 bg-gradient-to-r ${action.gradient} hover:scale-105 transform transition-all duration-200 text-white shadow-lg`}
                  >
                    <action.icon className="w-6 h-6" />
                    <div className="text-center">
                      <div className="font-semibold text-sm">{action.title}</div>
                      <div className="text-xs opacity-90">{action.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Autres Services */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Settings className="w-6 h-6 text-gray-600" />
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
                    className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-orange-50 border-orange-200 hover:border-orange-300"
                  >
                    <action.icon className="w-5 h-5" />
                    <div className="text-center">
                      <div className="font-medium text-xs">{action.title}</div>
                      <div className="text-xs text-gray-500">{action.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stats rapides */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/80 rounded-xl p-4 text-center border border-orange-200 shadow-md">
              <div className="text-2xl font-bold text-orange-700">0</div>
              <div className="text-xs text-orange-600">Aujourd'hui</div>
            </div>
            <div className="bg-white/80 rounded-xl p-4 text-center border border-green-200 shadow-md">
              <div className="text-2xl font-bold text-green-700">0</div>
              <div className="text-xs text-green-600">Cette semaine</div>
            </div>
            <div className="bg-white/80 rounded-xl p-4 text-center border border-blue-200 shadow-md">
              <div className="text-2xl font-bold text-blue-700">0</div>
              <div className="text-xs text-blue-600">Ce mois</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Version Desktop
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-6">
      <div className="container max-w-7xl mx-auto space-y-8">
        
        {/* En-tête Desktop */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent">
                Dashboard Agent
              </h1>
              <p className="text-gray-600 mt-3 text-xl">
                Bienvenue {profile?.full_name || 'Agent'} - {profile?.country || 'Congo Brazzaville'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate("/notifications")}
                className="relative border-2 border-orange-200 hover:border-orange-400"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={fetchAgentBalances}
                disabled={isLoadingBalance}
                className="border-2 border-green-200 hover:border-green-400"
              >
                <TrendingUp className={`w-5 h-5 ${isLoadingBalance ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>
          </div>
        </div>

        {/* Soldes en première ligne */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Solde Principal */}
          <Card className="bg-gradient-to-br from-orange-50 to-red-100 border-orange-200 shadow-2xl hover:shadow-3xl transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl flex items-center gap-4">
                <div className="p-3 bg-orange-500 rounded-xl">
                  <Wallet className="w-8 h-8 text-white" />
                </div>
                Solde Principal Agent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-5xl font-bold text-orange-800">
                  {isLoadingBalance ? (
                    <div className="animate-pulse bg-orange-200 h-16 w-64 rounded"></div>
                  ) : (
                    formatCurrency(agentBalance, 'XAF')
                  )}
                </div>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => navigate("/agent-recharge")}
                  className="w-full border-orange-300 text-orange-700 hover:bg-orange-50 h-14 text-lg"
                >
                  <Plus className="w-6 h-6 mr-3" />
                  Recharger mon solde
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Commissions */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 shadow-2xl hover:shadow-3xl transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl flex items-center gap-4">
                <div className="p-3 bg-green-500 rounded-xl">
                  <Award className="w-8 h-8 text-white" />
                </div>
                Mes Commissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-5xl font-bold text-green-800">
                  {isLoadingBalance ? (
                    <div className="animate-pulse bg-green-200 h-16 w-64 rounded"></div>
                  ) : (
                    formatCurrency(agentCommissionBalance, 'XAF')
                  )}
                </div>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => navigate("/agent-commission-withdrawal")}
                  className="w-full border-green-300 text-green-700 hover:bg-green-50 h-14 text-lg"
                >
                  <Target className="w-6 h-6 mr-3" />
                  Retirer mes commissions
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Principales */}
        <Card className="shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-4 text-3xl">
              <TrendingUp className="w-8 h-8 text-orange-600" />
              Actions Principales Agent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  onClick={action.onClick}
                  className={`h-32 flex flex-col items-center justify-center gap-4 bg-gradient-to-r ${action.gradient} text-white shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 rounded-2xl text-lg font-semibold`}
                >
                  <action.icon className="w-10 h-10" />
                  <div className="text-center">
                    <div className="font-bold">{action.title}</div>
                    <div className="text-sm opacity-90">{action.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Services Additionnels */}
        <Card className="shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-4 text-3xl">
              <Settings className="w-8 h-8 text-gray-600" />
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
                  className="h-28 flex flex-col items-center justify-center gap-4 hover:shadow-xl transition-all duration-300 border-2 rounded-2xl hover:border-orange-300 hover:bg-orange-50"
                >
                  <action.icon className="w-8 h-8" />
                  <div className="text-center">
                    <div className="font-semibold text-lg">{action.title}</div>
                    <div className="text-sm text-gray-500">{action.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Statistiques Rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="bg-gradient-to-br from-purple-50 to-pink-100 border-purple-200 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl text-purple-600 font-semibold">Aujourd'hui</p>
                  <p className="text-4xl font-bold text-purple-800">0 XAF</p>
                  <p className="text-sm text-purple-600 mt-2">Transactions du jour</p>
                </div>
                <History className="w-12 h-12 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-yellow-100 border-orange-200 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl text-orange-600 font-semibold">Cette semaine</p>
                  <p className="text-4xl font-bold text-orange-800">0 XAF</p>
                  <p className="text-sm text-orange-600 mt-2">Volume hebdomadaire</p>
                </div>
                <TrendingUp className="w-12 h-12 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-50 to-blue-100 border-cyan-200 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl text-cyan-600 font-semibold">Ce mois</p>
                  <p className="text-4xl font-bold text-cyan-800">0 XAF</p>
                  <p className="text-sm text-cyan-600 mt-2">Commissions mensuelles</p>
                </div>
                <Award className="w-12 h-12 text-cyan-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResponsiveAgentDashboard;
