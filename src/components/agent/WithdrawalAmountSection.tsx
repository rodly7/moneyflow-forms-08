
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DollarSign, Banknote, AlertTriangle, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";

interface ClientData {
  id: string;
  full_name: string;
  phone: string;
  balance: number;
  country?: string;
}

interface WithdrawalAmountSectionProps {
  amount: string;
  clientData: ClientData | null;
  isProcessing: boolean;
  onAmountChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const WithdrawalAmountSection = ({
  amount,
  clientData,
  isProcessing,
  onAmountChange,
  onSubmit
}: WithdrawalAmountSectionProps) => {
  const isAmountExceedsBalance = amount && clientData && Number(amount) > clientData.balance;
  const commission = amount ? Number(amount) * 0.005 : 0;

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-100 border-purple-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-purple-600" />
          Montant du Retrait
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-purple-700 font-medium">
              Montant du retrait (XAF)
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="Entrez le montant"
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              required
              className="h-12 text-lg"
              disabled={!clientData}
            />
            
            {/* Validation du montant */}
            {isAmountExceedsBalance && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <p className="text-red-700 text-sm">
                  Le montant dépasse le solde disponible du client
                </p>
              </div>
            )}
            
            {/* Affichage de la commission */}
            {amount && clientData && !isAmountExceedsBalance && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-green-700">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-medium">
                    Votre commission: {formatCurrency(commission, 'XAF')}
                  </span>
                </div>
              </div>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 h-12 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            disabled={isProcessing || isAmountExceedsBalance || !clientData || !amount}
          >
            {isProcessing ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                <span>Traitement en cours...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Banknote className="w-5 h-5" />
                <span>Effectuer le retrait</span>
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
