import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Users, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";

interface AgentData {
  id: string;
  full_name: string;
  phone: string;
  balance: number;
  country?: string;
}

export const BatchAgentDeposit = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [agentList, setAgentList] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

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

    if (!agentList) {
      toast({
        title: "Liste d'agents requise",
        description: "Veuillez entrer une liste d'agents",
        variant: "destructive",
      });
      return;
    }

    const agentIds = agentList.split(",").map((id) => id.trim());

    setIsProcessing(true);

    try {
      const amountValue = Number(amount);

      // Fetch agent profiles in batch
      const { data: agents, error: agentsError } = await supabase
        .from("profiles")
        .select("id, full_name, phone, balance, country")
        .in("id", agentIds);

      if (agentsError) {
        console.error("Erreur lors de la récupération des profils:", agentsError);
        toast({
          title: "Erreur",
          description: "Impossible de récupérer les profils des agents",
          variant: "destructive",
        });
        return;
      }

      if (!agents || agents.length === 0) {
        toast({
          title: "Aucun agent trouvé",
          description: "Aucun agent trouvé avec les IDs fournis",
          variant: "destructive",
        });
        return;
      }

      // Process each agent deposit
      for (const agent of agents) {
        // Credit the agent's account
        const { error: creditError } = await supabase.rpc("increment_balance", {
          user_id: agent.id,
          amount: amountValue,
        });

        if (creditError) {
          console.error(`Erreur lors du crédit du compte de ${agent.full_name}:`, creditError);
          toast({
            title: "Erreur",
            description: `Impossible de créditer le compte de ${agent.full_name}`,
            variant: "destructive",
          });
          continue; // Skip to the next agent
        }

        // Create a transaction record (optional)
        const transactionReference = `DEP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const { error: transactionError } = await supabase
          .from("recharges")
          .insert({
            user_id: agent.id,
            amount: amountValue,
            country: agent.country || "Cameroun",
            payment_method: "admin_deposit",
            payment_phone: "admin",
            payment_provider: "admin",
            transaction_reference: transactionReference,
            status: "completed",
            provider_transaction_id: user?.id,
          });

        if (transactionError) {
          console.error(`Erreur lors de la création de la transaction pour ${agent.full_name}:`, transactionError);
        }

        toast({
          title: "Dépôt réussi",
          description: `Le compte de ${agent.full_name} a été crédité de ${formatCurrency(amountValue, 'XAF')}`,
        });
      }

      // Reset form
      setAmount("");
      setAgentList("");
    } catch (error) {
      console.error("Erreur lors du dépôt groupé:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors du dépôt groupé",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Dépôt groupé pour les agents
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="agentList">Liste des IDs des agents (séparés par des virgules)</Label>
            <Textarea
              id="agentList"
              placeholder="Ex: agent123, agent456, agent789"
              value={agentList}
              onChange={(e) => setAgentList(e.target.value)}
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
            disabled={isProcessing || !amount || !agentList}
            className="w-full"
          >
            {isProcessing ? "Traitement en cours..." : "Effectuer le dépôt groupé"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
