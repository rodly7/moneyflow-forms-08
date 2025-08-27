import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Wallet, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";

interface AgentBalanceDisplayProps {
  agentBalance: number;
  agentCommissionBalance: number;
  isLoadingBalance: boolean;
  onRefresh: () => void;
  userCountry?: string;
}

export const AgentBalanceDisplay: React.FC<AgentBalanceDisplayProps> = ({
  agentBalance,
  agentCommissionBalance,
  isLoadingBalance,
  onRefresh,
  userCountry = "Cameroun"
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Solde Principal */}
      <Card className="bg-emerald-50 border border-emerald-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-600" />
            Solde Principal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-2xl font-bold">
                {isLoadingBalance ? (
                  <span className="loading loading-dots loading-sm"></span>
                ) : (
                  formatCurrency(agentBalance)
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                Solde disponible pour les transferts
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={onRefresh}
              disabled={isLoadingBalance}
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingBalance ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Solde Commission */}
      <Card className="bg-blue-50 border border-blue-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Solde Commission
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-2xl font-bold">
                {isLoadingBalance ? (
                  <span className="loading loading-dots loading-sm"></span>
                ) : (
                  formatCurrency(agentCommissionBalance)
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                Solde disponible pour les retraits
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={onRefresh}
              disabled={isLoadingBalance}
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingBalance ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
