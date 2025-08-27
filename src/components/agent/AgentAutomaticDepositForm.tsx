import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, ArrowDownLeft, Loader2 } from "lucide-react";
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

const AgentAutomaticDepositForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [agentPhone, setAgentPhone] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositFrequency, setDepositFrequency] = useState("daily");
  const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState(false);

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
      setDepositSuccess(false);

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

  const handleAutomaticDeposit = async () => {
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
      // Update agent profile with automatic deposit details
      const { error } = await supabase
        .from('profiles')
        .update({
          auto_deposit_amount: Number(depositAmount),
          auto_deposit_frequency: depositFrequency,
        })
        .eq('id', agentProfile.id);

      if (error) {
        console.error("Erreur lors de la mise à jour du profil de l'agent:", error);
        toast({
          title: "Erreur",
          description: "Impossible de configurer le dépôt automatique",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Dépôt automatique configuré",
        description: `Dépôt automatique de ${formatCurrency(Number(depositAmount))} configuré avec succès pour ${agentProfile.full_name}`,
      });

      setDepositSuccess(true);

      // Reset form
      setAgentPhone("");
      setDepositAmount("");
      setDepositFrequency("daily");
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
        <CardTitle className="text-lg font-semibold">Dépôt Automatique pour Agents</CardTitle>
        <ArrowDownLeft className="h-6 w-6 text-gray-500" />
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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

          {/* Automatic Deposit Form */}
          {agentProfile && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="depositAmount">Montant du dépôt automatique</Label>
                <Input
                  type="number"
                  id="depositAmount"
                  placeholder="Entrez le montant à déposer automatiquement"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="depositFrequency">Fréquence du dépôt</Label>
                <Select value={depositFrequency} onValueChange={setDepositFrequency}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionnez la fréquence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Quotidien</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    <SelectItem value="monthly">Mensuel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleAutomaticDeposit} className="w-full" disabled={isProcessing}>
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Configuration en cours...</span>
                  </div>
                ) : (
                  "Configurer le Dépôt Automatique"
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

          {depositSuccess && (
            <div className="p-3 bg-green-50 rounded-md border border-green-200">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-xs text-green-700">
                  Dépôt automatique configuré avec succès.
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentAutomaticDepositForm;
