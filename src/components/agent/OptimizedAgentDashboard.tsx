
import React, { memo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AgentBalanceCard } from "./AgentBalanceCard";
import { AgentCommissionWithdrawal } from "./AgentCommissionWithdrawal";
import { useAgentWithdrawalEnhanced } from "@/hooks/useAgentWithdrawalEnhanced";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Banknote, CreditCard, Users, BarChart3 } from "lucide-react";

const OptimizedAgentDashboard = memo(() => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const {
    agentBalance,
    agentCommissionBalance,
    isLoadingBalance,
    fetchAgentBalances
  } = useAgentWithdrawalEnhanced();

  const actionButtons = [
    {
      title: "Retrait Client",
      description: "Effectuer un retrait pour un client",
      icon: Banknote,
      onClick: () => navigate("/agent-withdrawal-advanced"),
      color: "bg-red-500 hover:bg-red-600"
    },
    {
      title: "Dépôt Client", 
      description: "Effectuer un dépôt pour un client",
      icon: CreditCard,
      onClick: () => navigate("/agent-deposit"),
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      title: "Mes Clients",
      description: "Gérer mes clients",
      icon: Users,
      onClick: () => navigate("/agent-services"),
      color: "bg-green-500 hover:bg-green-600"
    },
    {
      title: "Rapports",
      description: "Voir mes performances",
      icon: BarChart3,
      onClick: () => navigate("/agent-reports"),
      color: "bg-purple-500 hover:bg-purple-600"
    }
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 py-4 px-4">
      <div className="container max-w-4xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Tableau de Bord Agent
          </h1>
          <p className="text-gray-600 mt-2">
            Bienvenue {profile?.full_name || 'Agent'}
          </p>
        </div>

        {/* Soldes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Solde Principal</CardTitle>
            </CardHeader>
            <CardContent>
              <AgentBalanceCard
                balance={agentBalance}
                isLoading={isLoadingBalance}
                onRefresh={fetchAgentBalances}
                userCountry={profile?.country}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Commissions</CardTitle>
            </CardHeader>
            <CardContent>
              <AgentCommissionWithdrawal
                commissionBalance={agentCommissionBalance}
                onRefresh={fetchAgentBalances}
                userCountry={profile?.country}
              />
            </CardContent>
          </Card>
        </div>

        {/* Actions rapides */}
        <Card>
          <CardHeader>
            <CardTitle>Actions Rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {actionButtons.map((action, index) => (
                <Button
                  key={index}
                  onClick={action.onClick}
                  className={`h-24 flex flex-col items-center justify-center gap-2 text-white ${action.color}`}
                >
                  <action.icon className="w-6 h-6" />
                  <div className="text-center">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-xs opacity-90">{action.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

OptimizedAgentDashboard.displayName = "OptimizedAgentDashboard";

export default OptimizedAgentDashboard;
