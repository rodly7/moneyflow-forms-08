
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
  Calendar,
  History,
  UserCog,
  ChartLine,
  FileText,
  Smartphone,
  QrCode
} from "lucide-react";
import { useAgentWithdrawalEnhanced } from "@/hooks/useAgentWithdrawalEnhanced";
import { formatCurrency } from "@/lib/utils/currency";

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
      title: "Mes Services",
      description: "Gérer mes services",
      icon: Users,
      onClick: () => navigate("/agent-services"),
      color: "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600",
      textColor: "text-white"
    },
    {
      title: "Mes Performances",
      description: "Voir mes statistiques",
      icon: BarChart3,
      onClick: () => navigate("/agent-performance-dashboard"),
      color: "bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600",
      textColor: "text-white"
    }
  ];

  const transactionActions = [
    {
      title: "Historique Transactions",
      description: "Voir toutes mes transactions",
      icon: History,
      onClick: () => navigate("/transactions"),
      color: "bg-gradient-to-r from-amber-500 to-orange-500"
    },
    {
      title: "Recharges Mobiles",
      description: "Services de recharge",
      icon: Smartphone,
      onClick: () => navigate("/mobile-recharge"),
      color: "bg-gradient-to-r from-sky-500 to-blue-500"
    },
    {
      title: "Paiement QR",
      description: "Scanner pour payer",
      icon: QrCode,
      onClick: () => navigate("/qr-payment"),
      color: "bg-gradient-to-r from-pink-500 to-rose-500"
    },
  ];

  const managementActions = [
    {
      title: "Mes Paramètres",
      description: "Configurer mon compte",
      icon: UserCog,
      onClick: () => navigate("/agent-settings"),
      color: "bg-gradient-to-r from-gray-600 to-slate-600"
    },
    {
      title: "Notifications",
      description: "Voir mes notifications",
      icon: Bell,
      onClick: () => navigate("/notifications"),
      color: "bg-gradient-to-r from-orange-500 to-amber-500"
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
              <Banknote className="w-7 h-7 text-blue-600" />
              Actions Principales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  onClick={action.onClick}
                  className={`h-28 flex flex-col items-center justify-center gap-3 ${action.color} ${action.textColor} shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 rounded-xl text-base font-semibold`}
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

        {/* Transactions et Historiques */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <ChartLine className="w-7 h-7 text-purple-600" />
              Transactions et Historiques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {transactionActions.map((action, index) => (
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

        {/* Gestion et Paramètres */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Settings className="w-7 h-7 text-gray-600" />
              Gestion et Paramètres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {managementActions.map((action, index) => (
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
                <Calendar className="w-10 h-10 text-purple-600" />
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

export default EnhancedAgentDashboard;
