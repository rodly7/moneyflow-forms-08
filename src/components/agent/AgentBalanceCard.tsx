
import { Button } from "@/components/ui/button";
import { Wallet, RefreshCw } from "lucide-react";
import { formatCurrency, getCurrencyForCountry, convertCurrency } from "@/integrations/supabase/client";

interface AgentBalanceCardProps {
  balance: number;
  isLoading: boolean;
  onRefresh: () => void;
  userCountry?: string;
}

export const AgentBalanceCard = ({ balance, isLoading, onRefresh, userCountry = "Cameroun" }: AgentBalanceCardProps) => {
  // Déterminer la devise basée sur le pays de l'agent
  const agentCurrency = getCurrencyForCountry(userCountry);
  
  // Convertir le solde de XAF vers la devise de l'agent
  const convertedBalance = convertCurrency(balance, "XAF", agentCurrency);
  
  return (
    <div className="px-3 py-2 bg-emerald-50 rounded-md text-sm border border-emerald-200">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Wallet className="w-4 h-4 mr-2 text-emerald-600" />
          <span className="font-medium">Votre solde agent:</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`font-bold ${convertedBalance > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatCurrency(convertedBalance, agentCurrency)}
          </span>
          {agentCurrency !== "XAF" && (
            <span className="text-xs text-gray-500">
              ({formatCurrency(balance, "XAF")})
            </span>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
    </div>
  );
};
