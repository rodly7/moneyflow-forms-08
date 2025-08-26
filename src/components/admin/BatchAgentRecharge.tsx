import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Users, DollarSign, Zap } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";

interface AgentData {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  balance: number;
  country: string;
}

export const BatchAgentRecharge = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [agentList, setAgentList] = useState<AgentData[]>([]);
  const [agentIds, setAgentIds] = useState<string[]>([]);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [selectAll, setSelectAll] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecharging, setIsRecharging] = useState(false);

  useEffect(() => {
    const fetchAgents = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, phone, email, balance, country')
          .eq('role', 'agent');

        if (error) {
          console.error("Erreur lors de la récupération des agents:", error);
          toast({
            title: "Erreur",
            description: "Impossible de récupérer la liste des agents",
            variant: "destructive"
          });
          return;
        }

        setAgentList(data as AgentData[]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgents();
  }, [toast]);

  const handleAgentSelection = (agentId: string) => {
    setAgentIds((prev) => {
      if (prev.includes(agentId)) {
        return prev.filter((id) => id !== agentId);
      } else {
        return [...prev, agentId];
      }
    });
  };

  const handleSelectAll = () => {
    setSelectAll(!selectAll);
    if (!selectAll) {
      setAgentIds(agentList.map((agent) => agent.id));
    } else {
      setAgentIds([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (agentIds.length === 0) {
      toast({
        title: "Sélection requise",
        description: "Veuillez sélectionner au moins un agent",
        variant: "destructive"
      });
      return;
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: "Montant invalide",
        description: "Veuillez entrer un montant valide",
        variant: "destructive"
      });
      return;
    }

    setIsRecharging(true);

    try {
      const rechargeAmount = Number(amount);

      // Recharge chaque agent sélectionné
      for (const agentId of agentIds) {
        const { error } = await supabase.rpc('increment_balance', {
          user_id: agentId,
          amount: rechargeAmount
        });

        if (error) {
          console.error(`Erreur lors du rechargement de l'agent ${agentId}:`, error);
          toast({
            title: "Erreur de rechargement",
            description: `Impossible de recharger le compte de l'agent.`,
            variant: "destructive"
          });
          continue; // Passer à l'agent suivant en cas d'erreur
        }
      }

      toast({
        title: "Rechargement réussi",
        description: `Les comptes des agents sélectionnés ont été rechargés avec succès.`,
      });

      // Réinitialiser la sélection et les champs
      setAgentIds([]);
      setAmount("");
      setDescription("");
      setSelectAll(false);
    } catch (error) {
      console.error("Erreur lors du rechargement des agents:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du rechargement des agents.",
        variant: "destructive"
      });
    } finally {
      setIsRecharging(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Recharge en lot des agents
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Liste des agents avec checkboxes */}
          <div>
            <Label className="flex items-center space-x-2">
              <Checkbox
                checked={selectAll}
                onCheckedChange={handleSelectAll}
                disabled={isLoading}
              />
              <span>Sélectionner tout</span>
            </Label>
            {isLoading ? (
              <p>Chargement des agents...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                {agentList.map((agent) => (
                  <Label
                    key={agent.id}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      checked={agentIds.includes(agent.id)}
                      onCheckedChange={() => handleAgentSelection(agent.id)}
                      disabled={isLoading}
                    />
                    <span>{agent.full_name}</span>
                    <Badge variant="secondary">{formatCurrency(agent.balance, 'XAF')}</Badge>
                  </Label>
                ))}
              </div>
            )}
          </div>

          {/* Montant à recharger */}
          <div>
            <Label htmlFor="amount">Montant à recharger (XAF)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Entrez le montant"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          {/* Description (optionnel) */}
          <div>
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              placeholder="Ajouter une description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Bouton de soumission */}
          <Button
            type="submit"
            disabled={isRecharging || isLoading}
            className="w-full"
          >
            {isRecharging ? "Rechargement en cours..." : "Recharger les agents"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
