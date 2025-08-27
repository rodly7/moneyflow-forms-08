import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Wallet, Plus, AlertCircle, CheckCircle } from "lucide-react";
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

const AdminSelfRecharge = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("wallet");
  const [paymentPhone, setPaymentPhone] = useState("");
  const [paymentProvider, setPaymentProvider] = useState("agent");
  const [transactionReference, setTransactionReference] = useState("");
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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

    if (!transactionReference) {
      toast({
        title: "Référence manquante",
        description: "Veuillez entrer une référence de transaction",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setIsSuccess(false);

    try {
      // Fetch agent profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, phone, country, balance')
        .eq('id', user?.id)
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

      const agentProfile: AgentProfile = profileData as AgentProfile;

      // Perform deposit
      const { error } = await supabase.from('recharges').insert({
        user_id: user?.id,
        amount: Number(amount),
        country: agentProfile?.country || "Congo Brazzaville",
        payment_method: paymentMethod,
        payment_phone: paymentPhone,
        payment_provider: paymentProvider,
        status: 'completed',
        transaction_reference: transactionReference,
        notes: notes
      });

      if (error) {
        console.error("Erreur lors du dépôt:", error);
        toast({
          title: "Erreur de dépôt",
          description: "Impossible d'effectuer le dépôt",
          variant: "destructive"
        });
        return;
      }

      // Increment agent balance
      await supabase.rpc('increment_balance', {
        user_id: user?.id,
        amount: Number(amount)
      });

      toast({
        title: "Dépôt effectué",
        description: `Dépôt de ${formatCurrency(Number(amount), 'XAF')} effectué avec succès`,
      });

      setIsSuccess(true);
      setAmount("");
      setTransactionReference("");
      setNotes("");

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
        <CardTitle className="text-lg font-semibold">Recharge de Solde (Admin)</CardTitle>
        <div className="flex items-center space-x-2">
          <Wallet className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            Rechargez votre propre solde
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-4">
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
                <SelectItem value="wallet">Wallet</SelectItem>
                <SelectItem value="mobile_money">Mobile Money</SelectItem>
                <SelectItem value="bank_transfer">Virement Bancaire</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {paymentMethod === 'mobile_money' && (
            <div>
              <Label htmlFor="paymentPhone">Numéro de téléphone</Label>
              <Input
                type="tel"
                id="paymentPhone"
                placeholder="Entrez le numéro de téléphone"
                value={paymentPhone}
                onChange={(e) => setPaymentPhone(e.target.value)}
              />
            </div>
          )}

          {paymentMethod === 'mobile_money' && (
            <div>
              <Label htmlFor="paymentProvider">Opérateur</Label>
              <Select value={paymentProvider} onValueChange={setPaymentProvider}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionnez un opérateur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mtn">MTN</SelectItem>
                  <SelectItem value="orange">Orange</SelectItem>
                  <SelectItem value="guichet_unique">Guichet Unique</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="transactionReference">Référence de la transaction</Label>
            <Input
              type="text"
              id="transactionReference"
              placeholder="Entrez la référence"
              value={transactionReference}
              onChange={(e) => setTransactionReference(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Ajouter des notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isProcessing}>
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

        {isSuccess && (
          <div className="mt-6 p-4 bg-green-50 rounded-md border border-green-200">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-700">
                Recharge effectuée avec succès.
              </span>
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-50 rounded-md border border-gray-200">
          <div className="flex items-center space-x-3 mb-3">
            <Plus className="h-5 w-5 text-emerald-500" />
            <h4 className="font-semibold text-gray-700">Informations Importantes</h4>
          </div>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            <li>Le montant sera ajouté à votre solde principal.</li>
            <li>Assurez-vous que les informations sont correctes avant de confirmer.</li>
            <li>Conservez la référence de la transaction pour toute vérification.</li>
          </ul>
        </div>

        <div className="mt-4 p-3 bg-red-50 rounded-md border border-red-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-xs text-red-700">
              Note: Les recharges sont soumises à vérification.
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminSelfRecharge;
