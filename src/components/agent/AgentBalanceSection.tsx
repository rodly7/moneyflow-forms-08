
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Award } from "lucide-react";
import { formatCurrency } from "@/integrations/supabase/client";

interface AgentBalanceSectionProps {
  agentBalance: number;
  agentCommissionBalance: number;
}

export const AgentBalanceSection = ({ agentBalance, agentCommissionBalance }: AgentBalanceSectionProps) => {
  const [isBalanceVisible, setIsBalanceVisible] = useState(false);

  const toggleBalanceVisibility = () => {
    setIsBalanceVisible(!isBalanceVisible);
  };

  const formatBalanceDisplay = (balance: number) => {
    if (!isBalanceVisible) {
      return "••••••••";
    }
    return formatCurrency(balance, 'XAF');
  };

  return (
    <div className="space-y-4 -mt-8 relative z-10 px-6">
      {/* Solde Principal */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
        <div className="flex items-center justify-between mb-2">
          <p className="text-blue-100 text-sm font-medium leading-tight">Solde Agent</p>
          <Button
            onClick={toggleBalanceVisibility}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 p-2"
          >
            {isBalanceVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-3xl font-bold mb-2 text-yellow-200 leading-none">
          {formatBalanceDisplay(agentBalance || 0)}
        </p>
        <div className="flex items-center space-x-2 text-xs text-blue-100">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>Solde principal</span>
        </div>
      </div>

      {/* Commissions */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-green-300" />
            <p className="text-blue-100 text-sm font-medium leading-tight">Mes Commissions</p>
          </div>
        </div>
        <p className="text-2xl font-bold mb-2 text-green-200 leading-none">
          {formatBalanceDisplay(agentCommissionBalance || 0)}
        </p>
        <div className="flex items-center space-x-2 text-xs text-blue-100">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>Gains du mois</span>
        </div>
      </div>
    </div>
  );
};
