
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/utils/currency";
import { Users, DollarSign, FileText } from "lucide-react";

const BatchAgentDeposit = () => {
  const [agentIds, setAgentIds] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleBatchDeposit = async () => {
    if (!user || !agentIds.trim() || !amount) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs requis",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const agentIdList = agentIds.split(',').map(id => id.trim()).filter(id => id);
      const depositAmount = parseFloat(amount);

      if (agentIdList.length === 0 || isNaN(depositAmount) || depositAmount <= 0) {
        throw new Error("Données invalides");
      }

      // Process each agent deposit
      for (const agentId of agentIdList) {
        const { error } = await supabase
          .from('admin_deposits')
          .insert({
            admin_id: user.id,
            agent_id: agentId,
            amount: depositAmount,
            reason: reason || 'Dépôt groupé',
            created_at: new Date().toISOString()
          });

        if (error) {
          console.error(`Erreur pour l'agent ${agentId}:`, error);
        }
      }

      toast({
        title: "Succès",
        description: `Dépôts effectués pour ${agentIdList.length} agent(s)`,
      });

      // Reset form
      setAgentIds("");
      setAmount("");
      setReason("");
    } catch (error: any) {
      console.error('Erreur lors du dépôt groupé:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'effectuer les dépôts groupés",
        variant: "destructive"
      });
    }

    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Dépôt Groupé pour Agents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="agentIds">IDs des Agents (séparés par des virgules)</Label>
          <Textarea
            id="agentIds"
            placeholder="agent-id-1, agent-id-2, agent-id-3..."
            value={agentIds}
            onChange={(e) => setAgentIds(e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Montant par Agent (FCFA)</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="amount"
              type="number"
              placeholder="100000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-10"
              min="1"
            />
          </div>
          {amount && (
            <p className="text-sm text-gray-600">
              Montant formaté: {formatCurrency(parseFloat(amount) || 0)}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="reason">Raison du dépôt (optionnel)</Label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="reason"
              placeholder="Recharge mensuelle, bonus performance..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="pt-4">
          <Button
            onClick={handleBatchDeposit}
            disabled={isLoading || !agentIds.trim() || !amount}
            className="w-full"
          >
            {isLoading ? "Traitement en cours..." : "Effectuer les Dépôts Groupés"}
          </Button>
        </div>

        {agentIds.trim() && amount && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Aperçu:</strong> {agentIds.split(',').filter(id => id.trim()).length} agent(s) × {formatCurrency(parseFloat(amount) || 0)} = {formatCurrency((agentIds.split(',').filter(id => id.trim()).length) * (parseFloat(amount) || 0))}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BatchAgentDeposit;
