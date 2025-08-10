
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
  Shield
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

  const primaryActions = [
    {
      title: "Retrait Client",
      description: "Effectuer un retrait",
      icon: ArrowUpRight,
      onClick: () => navigate("/agent-withdrawal-advanced"),
      gradient: "from-red-500 to-pink-500",
      hoverGradient: "hover:from-red-600 hover:to-pink-600"
    },
    {
      title: "Dépôt Client", 
      description: "Effectuer un dépôt",
      icon: ArrowDownLeft,
      onClick: () => navigate("/agent-deposit"),
      gradient: "from-blue-500 to-cyan-500",
      hoverGradient: "hover:from-blue-600 hover:to-cyan-600"
    },
    {
      title: "Historique",
      description: "Mes transactions",
      icon: History,
      onClick: () => navigate("/transactions"),
      gradient: "from-green-500 to-emerald-500",
      hoverGradient: "hover:from-green-600 hover:to-emerald-600"
    },
    {
      title: "Performances",
      description: "Voir mes stats",
      icon: BarChart3,
      onClick: () => navigate("/agent-performance-dashboard"),
      gradient: "from-purple-500 to-violet-500",
      hoverGradient: "hover:from-purple-600 hover:to-violet-600"
    }
  ];

  const secondaryActions = [
    {
      title: "Services",
      description: "Gérer services",
      icon: Users,
      onClick: () => navigate("/agent-services")
    },
    {
      title: "Recharge Mobile",
      description: "Crédits téléphone",
      icon: Smartphone,
      onClick: () => navigate("/mobile-recharge")
    },
    {
      title: "Paiement QR",
      description: "Scanner & payer",
      icon: QrCode,
      onClick: () => navigate("/qr-payment")
    },
    {
      title: "Rapports",
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
      title: "Notifications",
      description: "Mes alertes",
      icon: Bell,
      onClick: () => navigate("/notifications")
    },
    {
      title: "Ma Zone",
      description: "Zone géographique",
      icon: MapPin,
      onClick: () => navigate("/agent-zone")
    },
    {
      title: "Sécurité",
      description: "Paramètres sécurité",
      icon: Shield,
      onClick: () => navigate("/agent-security")
    }
  ];

  if (isMobile) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-3 py-4 space-y-4 max-w-lg">
          
          {/* En-tête mobile */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="text-xl font-bold text-blue-600">Agent Dashboard</h1>
                <p className="text-sm text-gray-600">{profile?.full_name || 'Agent'}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchAgentBalances}
                disabled={isLoadingBalance}
                className="border-blue-200"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingBalance ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Soldes */}
          <div className="grid grid-cols-1 gap-3">
            {/* Solde Principal */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Wallet className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">Solde Principal</span>
                    </div>
                    {isLoadingBalance ? (
                      <div className="animate-pulse bg-blue-200 h-8 w-32 rounded"></div>
                    ) : (
                      <div className="text-2xl font-bold text-blue-800">
                        {formatCurrency(agentBalance, 'XAF')}
                      </div>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => navigate("/agent-recharge")}
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <DollarSign className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Commissions */}
            <Card className="bg-gradient-to-r from-green-50 to-emerald-100 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Award className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">Commissions</span>
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

          {/* Actions Principales */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Actions Principales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {primaryActions.map((action, index) => (
                  <Button
                    key={index}
                    onClick={action.onClick}
                    className={`h-20 flex flex-col items-center justify-center gap-2 bg-gradient-to-r ${action.gradient} ${action.hoverGradient} hover:scale-105 transform transition-all duration-200 text-white shadow-md`}
                  >
                    <action.icon className="w-5 h-5" />
                    <div className="text-center">
                      <div className="font-semibold text-sm">{action.title}</div>
                      <div className="text-xs opacity-90">{action.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Services et Outils */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Services et Outils</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {secondaryActions.map((action, index) => (
                  <Button
                    key={index}
                    onClick={action.onClick}
                    variant="outline"
                    className="h-16 flex flex-col items-center justify-center gap-1 hover:bg-blue-50 border-blue-200 hover:border-blue-300"
                  >
                    <action.icon className="w-4 h-4" />
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
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/80 rounded-lg p-3 text-center border border-purple-200">
              <div className="text-lg font-bold text-purple-700">0</div>
              <div className="text-xs text-purple-600">Aujourd'hui</div>
            </div>
            <div className="bg-white/80 rounded-lg p-3 text-center border border-orange-200">
              <div className="text-lg font-bold text-orange-700">0</div>
              <div className="text-xs text-orange-600">Cette semaine</div>
            </div>
            <div className="bg-white/80 rounded-lg p-3 text-center border border-cyan-200">
              <div className="text-lg font-bold text-cyan-700">0</div>
              <div className="text-xs text-cyan-600">Ce mois</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop version
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="container max-w-7xl mx-auto space-y-6">
        {/* En-tête amélioré */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Tableau de Bord Agent
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Bienvenue {profile?.full_name || 'Agent'} - {profile?.country || 'Congo Brazzaville'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate("/notifications")}
                className="relative border-2 border-blue-200 hover:border-blue-400"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchAgentBalances}
                disabled={isLoadingBalance}
                className="border-2 border-green-200 hover:border-green-400"
              >
                <TrendingUp className={`w-4 h-4 ${isLoadingBalance ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>
          </div>
        </div>

        {/* Soldes en première ligne */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Solde Principal */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                Solde Principal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-4xl font-bold text-blue-800">
                  {isLoadingBalance ? (
                    <div className="animate-pulse bg-blue-200 h-12 w-48 rounded"></div>
                  ) : (
                    formatCurrency(agentBalance, 'XAF')
                  )}
                </div>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => navigate("/agent-recharge")}
                  className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 h-12"
                >
                  <DollarSign className="w-5 h-5 mr-2" />
                  Recharger mon solde
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Commissions */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <Award className="w-6 h-6 text-white" />
                </div>
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
                  size="lg" 
                  variant="outline"
                  onClick={() => navigate("/agent-commission-withdrawal")}
                  className="w-full border-green-300 text-green-700 hover:bg-green-50 h-12"
                >
                  <Target className="w-5 h-5 mr-2" />
                  Retirer mes commissions
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Principales */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <TrendingUp className="w-7 h-7 text-blue-600" />
              Actions Principales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {primaryActions.map((action, index) => (
                <Button
                  key={index}
                  onClick={action.onClick}
                  className={`h-28 flex flex-col items-center justify-center gap-3 bg-gradient-to-r ${action.gradient} ${action.hoverGradient} text-white shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 rounded-xl text-base font-semibold`}
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

        {/* Services et Outils */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Settings className="w-7 h-7 text-gray-600" />
              Services et Outils
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {secondaryActions.map((action, index) => (
                <Button
                  key={index}
                  onClick={action.onClick}
                  variant="outline"
                  className={`h-24 flex flex-col items-center justify-center gap-3 hover:shadow-lg transition-all duration-300 border-2 rounded-xl`}
                >
                  <action.icon className="w-6 h-6" />
                  <div className="text-center">
                    <div className="font-semibold text-sm">{action.title}</div>
                    <div className="text-xs text-gray-500">{action.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Statistiques Rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-purple-50 to-pink-100 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg text-purple-600 font-semibold">Aujourd'hui</p>
                  <p className="text-3xl font-bold text-purple-800">0 XAF</p>
                  <p className="text-sm text-purple-600 mt-1">Transactions du jour</p>
                </div>
                <History className="w-10 h-10 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-yellow-100 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg text-orange-600 font-semibold">Cette semaine</p>
                  <p className="text-3xl font-bold text-orange-800">0 XAF</p>
                  <p className="text-sm text-orange-600 mt-1">Volume hebdomadaire</p>
                </div>
                <TrendingUp className="w-10 h-10 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-50 to-blue-100 border-cyan-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg text-cyan-600 font-semibold">Ce mois</p>
                  <p className="text-3xl font-bold text-cyan-800">0 XAF</p>
                  <p className="text-sm text-cyan-600 mt-1">Commissions mensuelles</p>
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
