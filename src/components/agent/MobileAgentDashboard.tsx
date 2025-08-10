
import React from "react";
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
  FileText
} from "lucide-react";
import { useAgentWithdrawalEnhanced } from "@/hooks/useAgentWithdrawalEnhanced";
import { formatCurrency } from "@/integrations/supabase/client";

const MobileAgentDashboard = () => {
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
      gradient: "from-red-500 to-pink-500"
    },
    {
      title: "Dépôt Client", 
      description: "Effectuer un dépôt",
      icon: ArrowDownLeft,
      onClick: () => navigate("/agent-deposit"),
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      title: "Historique",
      description: "Mes transactions",
      icon: History,
      onClick: () => navigate("/transactions"),
      gradient: "from-green-500 to-emerald-500"
    },
    {
      title: "Performances",
      description: "Voir mes stats",
      icon: BarChart3,
      onClick: () => navigate("/agent-performance-dashboard"),
      gradient: "from-purple-500 to-violet-500"
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
    }
  ];

  return (
    <div className="agent-mobile-interface min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
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
              <TrendingUp className={`w-4 h-4 ${isLoadingBalance ? 'animate-spin' : ''}`} />
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
                  className={`h-20 flex flex-col items-center justify-center gap-2 bg-gradient-to-r ${action.gradient} hover:scale-105 transform transition-all duration-200 text-white shadow-md`}
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
};

export default MobileAgentDashboard;
