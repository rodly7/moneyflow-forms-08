
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Wallet, TrendingUp, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/integrations/supabase/client";

interface ModernAgentBalanceCardProps {
  agentBalance: number;
  agentCommissionBalance: number;
  isLoading: boolean;
  onRefresh: () => void;
}

export const ModernAgentBalanceCard = ({ 
  agentBalance, 
  agentCommissionBalance, 
  isLoading, 
  onRefresh 
}: ModernAgentBalanceCardProps) => {
  const [isBalanceVisible, setIsBalanceVisible] = useState(false);

  const formatBalanceDisplay = (balance: number) => {
    if (!isBalanceVisible) {
      return "••••••••";
    }
    return formatCurrency(balance, 'XAF');
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Mes Soldes</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsBalanceVisible(!isBalanceVisible)}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
            >
              {isBalanceVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            <Button
              onClick={onRefresh}
              variant="ghost"
              size="sm"
              disabled={isLoading}
              className="text-white hover:bg-white/10"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Solde Principal */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">Solde Principal</h3>
                <p className="text-sm text-blue-600">Disponible pour les opérations</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-800">
              {isLoading ? (
                <div className="animate-pulse bg-blue-200 h-8 w-32 rounded"></div>
              ) : (
                formatBalanceDisplay(agentBalance || 0)
              )}
            </div>
          </div>

          {/* Commissions */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-100 rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900">Mes Commissions</h3>
                <p className="text-sm text-green-600">Gains accumulés</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-green-800">
              {isLoading ? (
                <div className="animate-pulse bg-green-200 h-8 w-32 rounded"></div>
              ) : (
                formatBalanceDisplay(agentCommissionBalance || 0)
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
