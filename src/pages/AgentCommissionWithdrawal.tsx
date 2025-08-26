import React, { useEffect } from "react";
import { AgentCommissionWithdrawal } from "@/components/agent/AgentCommissionWithdrawal";
import { useAgentWithdrawalEnhanced } from "@/hooks/useAgentWithdrawalEnhanced";

const AgentCommissionWithdrawalPage = () => {
  const { agentCommissionBalance, fetchAgentBalances } = useAgentWithdrawalEnhanced();

  useEffect(() => {
    document.title = "Retrait des commissions | Agent";
  }, []);

  return (
    <div className="p-4">
      <AgentCommissionWithdrawal
        commissionBalance={agentCommissionBalance}
        onRefresh={fetchAgentBalances}
      />
    </div>
  );
};

export default AgentCommissionWithdrawalPage;
