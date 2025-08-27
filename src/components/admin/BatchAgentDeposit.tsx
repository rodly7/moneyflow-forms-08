import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Wallet, Users, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils/currency";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface AgentProfile {
  id: string;
  full_name: string;
  phone: string;
  country: string;
  balance: number;
}

const BatchAgentDeposit = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [agentPhone, setAgentPhone] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositNote, setDepositNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null);

  const handleSearchAgent = async () => {
    if (!agentPhone) {
      toast({
        title: "Téléphone requis",
        description: "Veuillez entrer le numéro de téléphone de l'agent",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, country, balance')
        .eq('phone', agentPhone)
        .single();

      if (error) {
        console.error("Erreur lors de la recherche de l'agent:", error);
        toast({
          title: "Erreur",
          description: "Impossible de trouver l'agent avec ce numéro",
          variant: "destructive",
        });
        setAgentProfile(null);
        return;
      }

      setAgentProfile(data);
      toast({
        title: "Agent trouvé",
        description: `Agent ${data.full_name} trouvé`,
      });

    } catch (error) {
      console.error("Erreur lors de la recherche de l'agent:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la recherche de l'agent",
        variant: "destructive",
      });
      setAgentProfile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeposit = async () => {
    if (!agentProfile) {
      toast({
        title: "Agent requis",
        description: "Veuillez d'abord rechercher l'agent",
        variant: "destructive",
      });
      return;
    }

    if (!depositAmount || isNaN(Number(depositAmount)) || Number(depositAmount) <= 0) {
      toast({
        title: "Montant invalide",
        description: "Veuillez entrer un montant valide",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Increment agent balance
      const { error } = await supabase.rpc('increment_balance', {
        user_id: agentProfile.id,
        amount: Number(depositAmount)
      });

      if (error) {
        console.error("Erreur lors du dépôt:", error);
        toast({
          title: "Erreur de dépôt",
          description: "Impossible d'effectuer le dépôt",
          variant: "destructive",
        });
        return;
      }

      // Create transaction record
      const { error: transactionError } = await supabase.from('transactions').insert({
        user_id: agentProfile.id,
        type: 'deposit',
        amount: Number(depositAmount),
        currency: 'XAF',
        status: 'completed',
        description: `Dépôt par lot: ${depositNote}`,
        created_by: user?.id,
        impact: 'credit'
      });

      if (transactionError) {
        console.error("Erreur lors de l'enregistrement de la transaction:", transactionError);
        toast({
          title: "Erreur",
          description: "Impossible d'enregistrer la transaction",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Dépôt effectué",
        description: `Dépôt de ${formatCurrency(Number(depositAmount))} effectué avec succès pour ${agentProfile.full_name}`,
      });

      // Reset form
      setAgentPhone("");
      setDepositAmount("");
      setDepositNote("");
      setAgentProfile(null);

    } catch (error) {
      console.error("Erreur inattendue:", error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="bg-white shadow-md rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
        <CardTitle className="text-lg font-semibold">Dépôt par Lot pour Agents</CardTitle>
        <Users className="h-6 w-6 text-gray-500" />
      </CardHeader>

      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Search Agent */}
          <div>
            <Label htmlFor="agentPhone">Téléphone de l'agent</Label>
            <div className="flex space-x-2">
              <Input
                type="tel"
                id="agentPhone"
                placeholder="Entrez le numéro de téléphone"
                value={agentPhone}
                onChange={(e) => setAgentPhone(e.target.value)}
              />
              <Button onClick={handleSearchAgent} disabled={isProcessing}>
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    <span>Recherche...</span>
                  </div>
                ) : (
                  "Rechercher"
                )}
              </Button>
            </div>
          </div>

          {/* Agent Info */}
          {agentProfile && (
            <div className="p-4 bg-emerald-50 rounded-md border border-emerald-200">
              <div className="flex items-center space-x-3 mb-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <h4 className="font-semibold text-gray-700">Informations de l'agent</h4>
              </div>
              <p className="text-sm text-gray-600">Nom: {agentProfile.full_name}</p>
              <p className="text-sm text-gray-600">Téléphone: {agentProfile.phone}</p>
              <p className="text-sm text-gray-600">Solde actuel: {formatCurrency(agentProfile.balance)}</p>
            </div>
          )}

          {/* Deposit Form */}
          {agentProfile && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="depositAmount">Montant du dépôt</Label>
                <Input
                  type="number"
                  id="depositAmount"
                  placeholder="Entrez le montant à déposer"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="depositNote">Note de dépôt</Label>
                <Textarea
                  id="depositNote"
                  placeholder="Ajouter une note (facultatif)"
                  value={depositNote}
                  onChange={(e) => setDepositNote(e.target.value)}
                />
              </div>

              <Button onClick={handleDeposit} className="w-full" disabled={isProcessing}>
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    <span>Dépôt en cours...</span>
                  </div>
                ) : (
                  "Effectuer le Dépôt"
                )}
              </Button>
            </div>
          )}

          {/* Alert Message */}
          {!agentProfile && agentPhone && (
            <div className="p-3 bg-red-50 rounded-md border border-red-200">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-xs text-red-700">
                  Aucun agent trouvé avec le numéro de téléphone fourni.
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BatchAgentDeposit;
