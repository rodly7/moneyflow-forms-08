import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const BatchAgentRecharge = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [agentPhone, setAgentPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("mtn_momo");
  const [paymentReference, setPaymentReference] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null);
  const [rechargeSuccess, setRechargeSuccess] = useState(false);

  const handleSearchAgent = async () => {
    if (!agentPhone) {
      toast({
        title: "Numéro de téléphone requis",
        description: "Veuillez entrer le numéro de téléphone de l'agent",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, phone, country, balance')
        .eq('phone', agentPhone)
        .single();

      if (profileError) {
        console.error("Erreur lors de la récupération du profil agent:", profileError);
        toast({
          title: "Erreur",
          description: "Impossible de charger le profil de l'agent",
          variant: "destructive"
        });
        return;
      }

      setAgentProfile(profileData);
      setRechargeSuccess(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agentProfile) {
      toast({
        title: "Agent non trouvé",
        description: "Veuillez d'abord rechercher l'agent",
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

    if (!paymentMethod) {
      toast({
        title: "Méthode de paiement requise",
        description: "Veuillez sélectionner une méthode de paiement",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Perform recharge
      const { error } = await supabase.from('recharges').insert({
        user_id: agentProfile.id,
        amount: Number(amount),
        country: agentProfile.country,
        payment_method: paymentMethod,
        payment_phone: agentProfile.phone,
        payment_provider: "admin",
        status: 'completed',
        transaction_reference: paymentReference,
        additional_notes: additionalNotes
      });

      if (error) {
        console.error("Erreur lors de la recharge:", error);
        toast({
          title: "Erreur de recharge",
          description: "Impossible d'effectuer la recharge",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Recharge effectuée",
        description: `Recharge de ${formatCurrency(Number(amount), 'XAF')} effectuée avec succès pour ${agentProfile.full_name}`,
      });

      setRechargeSuccess(true);

      // Reset form
      setAmount("");
      setPaymentReference("");
      setAdditionalNotes("");

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
        <CardTitle className="text-lg font-semibold">Recharge Multiple d'Agents</CardTitle>
        <Badge variant="secondary">Admin</Badge>
      </CardHeader>

      <CardContent className="p-4">
        <div className="mb-4">
          <Label htmlFor="agentPhone">Numéro de téléphone de l'agent</Label>
          <div className="flex mt-2">
            <Input
              type="tel"
              id="agentPhone"
              placeholder="Entrez le numéro de téléphone"
              value={agentPhone}
              onChange={(e) => setAgentPhone(e.target.value)}
              className="flex-1 mr-2"
            />
            <Button type="button" onClick={handleSearchAgent} disabled={isProcessing}>
              {isProcessing ? "Recherche..." : "Rechercher"}
            </Button>
          </div>
        </div>

        {agentProfile && (
          <div className="mb-4 p-4 bg-gray-50 rounded-md border border-gray-200">
            <div className="flex items-center space-x-3 mb-2">
              <Users className="h-5 w-5 text-blue-500" />
              <h4 className="font-semibold text-gray-700">Informations sur l'Agent</h4>
            </div>
            <p className="text-sm text-gray-600">Nom: {agentProfile.full_name}</p>
            <p className="text-sm text-gray-600">Téléphone: {agentProfile.phone}</p>
            <p className="text-sm text-gray-600">Solde actuel: {formatCurrency(agentProfile.balance, 'XAF')}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Montant à recharger</Label>
            <Input
              type="number"
              id="amount"
              placeholder="Entrez le montant"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="paymentMethod">Méthode de paiement</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionnez une méthode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mtn_momo">MTN MoMo</SelectItem>
                <SelectItem value="orange_money">Orange Money</SelectItem>
                <SelectItem value="eumoney">EU Money</SelectItem>
                <SelectItem value="autres">Autres</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="paymentReference">Référence de paiement</Label>
            <Input
              type="text"
              id="paymentReference"
              placeholder="Entrez la référence de paiement"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="additionalNotes">Notes additionnelles</Label>
            <Textarea
              id="additionalNotes"
              placeholder="Ajouter des notes si nécessaire"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isProcessing || !agentProfile}>
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                <span>Traitement...</span>
              </div>
            ) : (
              "Effectuer la Recharge"
            )}
          </Button>
        </form>

        {rechargeSuccess && (
          <div className="mt-6 p-4 bg-green-50 rounded-md border border-green-200">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-700">
                Recharge effectuée avec succès pour {agentProfile?.full_name}
              </span>
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-red-50 rounded-md border border-red-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-xs text-red-700">
              Note: Assurez-vous que les informations sont correctes avant de confirmer la recharge.
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BatchAgentRecharge;
