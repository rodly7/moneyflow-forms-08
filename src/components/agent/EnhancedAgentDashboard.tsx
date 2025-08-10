
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Banknote, 
  CreditCard, 
  Users, 
  BarChart3, 
  Wallet, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Settings,
  Bell,
  MapPin,
  Shield,
  DollarSign,
  Target,
  Award,
  Calendar
} from "lucide-react";
import { useAgentWithdrawalEnhanced } from "@/hooks/useAgentWithdrawalEnhanced";
import { formatCurrency } from "@/integrations/supabase/client";

const EnhancedAgentDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const {
    agentBalance,
    agentCommissionBalance,
    isLoadingBalance,
    fetchAgentBalances
  } = useAgentWithdrawalEnhanced();

  const quickActions = [
    {
      title: "Retrait Client",
      description: "Effectuer un retrait pour un client",
      icon: ArrowUpRight,
      onClick: () => navigate("/agent-withdrawal-advanced"),
      color: "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600",
      textColor: "text-white"
    },
    {
      title: "Dépôt Client", 
      description: "Effectuer un dépôt pour un client",
      icon: ArrowDownLeft,
      onClick: () => navigate("/agent-deposit"),
      color: "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600",
      textColor: "text-white"
    },
    {
      title: "Services Agent",
      description: "Gérer mes services",
      icon: Users,
      onClick: () => navigate("/agent-services"),
      color: "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600",
      textColor: "text-white"
    },
    {
      title: "Mes Rapports",
      description: "Voir mes performances",
      icon: BarChart3,
      onClick: () => navigate("/agent-performance-dashboard"),
      color: "bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600",
      textColor: "text-white"
    }
  ];

  const managementActions = [
    {
      title: "Notifications",
      description: "Voir mes notifications",
      icon: Bell,
      onClick: () => navigate("/notifications"),
      color: "bg-gradient-to-r from-orange-500 to-amber-500"
    },
    {
      title: "Paramètres",
      description: "Configurer mon compte",
      icon: Settings,
      onClick: () => navigate("/agent-settings"),
      color: "bg-gradient-to-r from-gray-500 to-slate-500"
    },
    {
      title: "Ma Zone",
      description: "Gérer ma zone géographique",
      icon: MapPin,
      onClick: () => navigate("/agent-zone"),
      color: "bg-gradient-to-r from-teal-500 to-cyan-500"
    },
    {
      title: "Sécurité",
      description: "Sécurité et authentification",
      icon: Shield,
      onClick: () => navigate("/agent-security"),
      color: "bg-gradient-to-r from-indigo-500 to-blue-500"
    }
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="container max-w-7xl mx-auto space-y-6">
        {/* En-tête amélioré */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Tableau de Bord Agent
              </h1>
              <p className="text-gray-600 mt-2">
                Bienvenue {profile?.full_name || 'Agent'} - {profile?.country || 'Congo Brazzaville'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate("/notifications")}
                className="relative"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchAgentBalances}
                disabled={isLoadingBalance}
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
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Wallet className="w-5 h-5 text-blue-600" />
                Solde Principal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-3xl font-bold text-blue-800">
                  {isLoadingBalance ? (
                    <div className="animate-pulse bg-blue-200 h-10 w-40 rounded"></div>
                  ) : (
                    formatCurrency(agentBalance, 'XAF')
                  )}
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => navigate("/agent-recharge")}
                  className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Recharger mon solde
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Commissions */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="w-5 h-5 text-green-600" />
                Mes Commissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-3xl font-bold text-green-800">
                  {isLoadingBalance ? (
                    <div className="animate-pulse bg-green-200 h-10 w-40 rounded"></div>
                  ) : (
                    formatCurrency(agentCommissionBalance, 'XAF')
                  )}
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => navigate("/agent-commission-withdrawal")}
                  className="w-full border-green-300 text-green-700 hover:bg-green-50"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Retirer mes commissions
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Principales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5" />
              Actions Principales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  onClick={action.onClick}
                  className={`h-24 flex flex-col items-center justify-center gap-2 ${action.color} ${action.textColor} shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200`}
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

        {/* Gestion et Outils */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Gestion et Outils
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {managementActions.map((action, index) => (
                <Button
                  key={index}
                  onClick={action.onClick}
                  variant="outline"
                  className={`h-20 flex flex-col items-center justify-center gap-2 hover:shadow-md transition-all duration-200 border-2`}
                >
                  <action.icon className="w-5 h-5" />
                  <div className="text-center">
                    <div className="font-medium text-sm">{action.title}</div>
                    <div className="text-xs text-gray-500">{action.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Statistiques Rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-purple-50 to-pink-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Aujourd'hui</p>
                  <p className="text-2xl font-bold text-purple-800">0 XAF</p>
                </div>
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-yellow-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">Cette semaine</p>
                  <p className="text-2xl font-bold text-orange-800">0 XAF</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-50 to-blue-100 border-cyan-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-cyan-600 font-medium">Ce mois</p>
                  <p className="text-2xl font-bold text-cyan-800">0 XAF</p>
                </div>
                <Award className="w-8 h-8 text-cyan-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAgentDashboard;
