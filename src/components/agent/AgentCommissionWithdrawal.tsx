import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, getCurrencyForCountry, convertCurrency } from "@/lib/utils/currency";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Wallet, TrendingUp, AlertCircle } from "lucide-react";

interface AgentProfile {
  id: string;
  full_name: string;
  phone: string;
  country: string;
  balance: number;
}

const AgentCommissionWithdrawal = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [amount, setAmount] = useState("");
  const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [agentBalance, setAgentBalance] = useState(0);
  const [agentCommissionBalance, setAgentCommissionBalance] = useState(0);
  const [currency, setCurrency] = useState("XAF");

  useEffect(() => {
    const fetchAgentData = async () => {
      if (!user?.id) return;

      try {
        // Fetch agent profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, phone, country, balance')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error("Erreur lors de la récupération du profil agent:", profileError);
          toast({
            title: "Erreur",
            description: "Impossible de charger votre profil",
            variant: "destructive"
          });
          return;
        }

        setAgentProfile(profileData);
        setCurrency(getCurrencyForCountry(profileData.country));
        setAgentBalance(profileData.balance);

        // Fetch agent commission balance
        const { data: agentData, error: commissionError } = await supabase
          .from('agents')
          .select('commission_balance')
          .eq('user_id', user.id)
          .single();

        if (commissionError) {
          console.error("Erreur lors de la récupération du solde de commission:", commissionError);
          toast({
            title: "Erreur",
            description: "Impossible de charger votre solde de commission",
            variant: "destructive"
          });
          return;
        }

        setAgentCommissionBalance(agentData?.commission_balance || 0);

      } catch (error) {
        console.error("Erreur inattendue:", error);
        toast({
          title: "Erreur",
          description: "Une erreur inattendue s'est produite",
          variant: "destructive"
        });
      }
    };

    fetchAgentData();
  }, [user?.id, toast]);

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

    if (withdrawalAmount > agentCommissionBalance) {
      toast({
        title: "Solde insuffisant",
        description: "Le montant du retrait dépasse votre solde de commission disponible",
        variant: "destructive"
      });
      return;
    }

    if (!agentProfile) {
      toast({
        title: "Profil agent non trouvé",
        description: "Impossible de récupérer les informations de votre profil",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Perform withdrawal
      const { error } = await supabase
        .from('agents')
        .update({ commission_balance: agentCommissionBalance - withdrawalAmount })
        .eq('user_id', user.id);

      if (error) {
        console.error("Erreur lors du retrait de la commission:", error);
        toast({
          title: "Erreur de retrait",
          description: "Impossible d'effectuer le retrait de commission",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Retrait effectué",
        description: `Retrait de ${formatCurrency(withdrawalAmount, currency)} effectué avec succès`,
      });

      // Update local state
      setAgentCommissionBalance(agentCommissionBalance - withdrawalAmount);
      setAmount("");

    } catch (error) {
      console.error("Erreur inattendue:", error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="bg-white shadow-md rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
        <CardTitle className="text-lg font-semibold">Retrait de Commission</CardTitle>
        <div className="flex items-center space-x-2">
          <Wallet className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            Solde Commission: {formatCurrency(convertCurrency(agentCommissionBalance, "XAF", currency), currency)}
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Montant à retirer</Label>
            <Input
              type="number"
              id="amount"
              placeholder="Entrez le montant"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isProcessing}>
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                <span>Traitement...</span>
              </div>
            ) : (
              "Effectuer le Retrait"
            )}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-md border border-gray-200">
          <div className="flex items-center space-x-3 mb-3">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            <h4 className="font-semibold text-gray-700">Informations Importantes</h4>
          </div>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            <li>Le montant sera déduit de votre solde de commission.</li>
            <li>Assurez-vous que le montant est correct avant de confirmer.</li>
            <li>Les fonds seront transférés vers votre solde principal.</li>
          </ul>
        </div>

        <div className="mt-4 p-3 bg-red-50 rounded-md border border-red-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-xs text-red-700">
              Note: Les retraits sont soumis à vérification.
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentCommissionWithdrawal;
