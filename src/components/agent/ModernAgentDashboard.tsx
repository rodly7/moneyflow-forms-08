
import React from "react";
import { useAgentWithdrawalEnhanced } from "@/hooks/useAgentWithdrawalEnhanced";
import { ModernAgentHeader } from "./ModernAgentHeader";
import { ModernAgentBalanceCard } from "./ModernAgentBalanceCard";
import { ModernAgentQuickActions } from "./ModernAgentQuickActions";
import { ModernAgentServices } from "./ModernAgentServices";
import { ModernAgentStats } from "./ModernAgentStats";

const ModernAgentDashboard = () => {
  const {
    agentBalance,
    agentCommissionBalance,
    isLoadingBalance,
    fetchAgentBalances
  } = useAgentWithdrawalEnhanced();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <ModernAgentHeader 
        isLoadingBalance={isLoadingBalance}
        onRefreshBalances={fetchAgentBalances}
      />
      
      <div className="px-4 py-6 space-y-6">
        <ModernAgentBalanceCard 
          agentBalance={agentBalance}
          agentCommissionBalance={agentCommissionBalance}
          isLoading={isLoadingBalance}
          onRefresh={fetchAgentBalances}
        />

        <ModernAgentQuickActions />

        <ModernAgentServices />

        <ModernAgentStats />
      </div>
    </div>
  );
};

export default ModernAgentDashboard;
