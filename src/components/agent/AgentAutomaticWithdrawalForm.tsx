import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAgentAutomaticWithdrawal } from "@/hooks/useAgentAutomaticWithdrawal";
import { formatCurrency } from "@/lib/utils/currency";
import { Phone, User } from "lucide-react";

interface AgentAutomaticWithdrawalFormProps {
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientBalance: number;
  onSuccess: () => void;
}

export const AgentAutomaticWithdrawalForm: React.FC<AgentAutomaticWithdrawalFormProps> = ({
  clientId,
  clientName,
  clientPhone,
  clientBalance,
  onSuccess
}) => {
  const { toast } = useToast();
  const { processAgentAutomaticWithdrawal, isProcessing } = useAgentAutomaticWithdrawal();
  const [amount, setAmount] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: "Montant invalide",
        description: "Veuillez entrer un montant valide",
        variant: "destructive"
      });
      return;
    }

    const withdrawalAmount = Number(amount);

    const result = await processAgentAutomaticWithdrawal(
      clientId,
      withdrawalAmount,
      clientPhone,
      clientName,
      clientBalance
    );

    if (result?.success) {
      setAmount("");
      onSuccess();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Retrait Automatique</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client Information Display */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Client:</span>
              <span className="text-sm font-semibold text-gray-900">{clientName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Téléphone:</span>
              <span className="text-sm text-gray-900">{clientPhone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Solde:</span>
              <span className="text-sm text-gray-900">{formatCurrency(clientBalance, 'XAF')}</span>
            </div>
          </div>

          <div>
            <Label htmlFor="amount">Montant à retirer (FCFA)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Entrez le montant"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="100"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isProcessing || !amount}
            className="w-full"
          >
            {isProcessing ? "Traitement en cours..." : "Confirmer le retrait"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
