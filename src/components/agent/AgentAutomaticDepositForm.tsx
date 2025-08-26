import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Wallet, RefreshCw } from "lucide-react";
import { useAgentAutomaticDeposit } from "@/hooks/useAgentAutomaticDeposit";
import { formatCurrency } from "@/lib/utils/currency";

interface AgentAutomaticDepositFormProps {
  onDepositSuccess?: () => void;
}

export const AgentAutomaticDepositForm: React.FC<AgentAutomaticDepositFormProps> = ({ onDepositSuccess }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { processAgentDeposit, isProcessing } = useAgentAutomaticDeposit();
  const [amount, setAmount] = useState("");
  const [clientId, setClientId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: "Montant invalide",
        description: "Veuillez entrer un montant valide",
        variant: "destructive",
      });
      return;
    }

    if (!clientId) {
      toast({
        title: "ID Client requis",
        description: "Veuillez entrer l'ID du client",
        variant: "destructive",
      });
      return;
    }

    const depositAmount = Number(amount);

    const result = await processAgentDeposit(clientId, depositAmount);

    if (result?.success) {
      setAmount("");
      setClientId("");
      onDepositSuccess?.();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dépôt Automatique</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="clientId">ID du Client</Label>
            <Input
              id="clientId"
              type="text"
              placeholder="Entrez l'ID du client"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="amount">Montant à déposer (FCFA)</Label>
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
            disabled={isProcessing || !amount || !clientId}
            className="w-full"
          >
            {isProcessing ? "Traitement en cours..." : "Effectuer le dépôt"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
