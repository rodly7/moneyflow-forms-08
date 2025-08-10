
import React from "react";
import { useAgentWithdrawalEnhanced } from "@/hooks/useAgentWithdrawalEnhanced";
import { AgentHeader } from "./AgentHeader";
import { AgentBalanceSection } from "./AgentBalanceSection";
import { AgentQuickActions } from "./AgentQuickActions";
import { AgentServicesSection } from "./AgentServicesSection";
import { AgentQuickStats } from "./AgentQuickStats";

const MobileAgentDashboard = () => {
  const {
    agentBalance,
    agentCommissionBalance,
    isLoadingBalance,
    fetchAgentBalances
  } = useAgentWithdrawalEnhanced();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <AgentHeader 
        isLoadingBalance={isLoadingBalance}
        onRefreshBalances={fetchAgentBalances}
      />
      
      <AgentBalanceSection 
        agentBalance={agentBalance}
        agentCommissionBalance={agentCommissionBalance}
      />

      <AgentQuickActions />

      <AgentServicesSection />

      <AgentQuickStats />
    </div>
  );
};

export default MobileAgentDashboard;
