
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, RefreshCw, TrendingUp, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";

interface AgentBalanceDisplayProps {
  agentBalance: number;
  agentCommissionBalance: number;
  isLoadingBalance: boolean;
  onRefresh: () => void;
  userCountry?: string;
}

export const AgentBalanceDisplay = ({
  agentBalance,
  agentCommissionBalance,
  isLoadingBalance,
  onRefresh,
  userCountry = "Congo Brazzaville"
}: AgentBalanceDisplayProps) => {
  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="w-5 h-5 text-blue-600" />
            Mes Soldes Agent
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isLoadingBalance}
            className="h-8 w-8 p-0 hover:bg-blue-100"
          >
            <RefreshCw className={`w-4 h-4 text-blue-600 ${isLoadingBalance ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {/* Solde Principal */}
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Solde Principal</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-800">
              {isLoadingBalance ? (
                <div className="animate-pulse bg-blue-200 h-8 w-32 rounded"></div>
              ) : (
                formatCurrency(agentBalance, 'XAF')
              )}
            </div>
          </div>

        </div>

        <div className="text-xs text-blue-600 text-center bg-blue-50 rounded-md p-2">
          📍 Pays: {userCountry}
        </div>
      </CardContent>
    </Card>
  );
};
