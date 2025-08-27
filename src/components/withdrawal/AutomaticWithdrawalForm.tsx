import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils/currency";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface AutomaticWithdrawalFormProps {
  onWithdrawalSuccess: () => void;
}

const AutomaticWithdrawalForm: React.FC<AutomaticWithdrawalFormProps> = ({ onWithdrawalSuccess }) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("mtn_momo");
  const [accountNumber, setAccountNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [withdrawalSuccess, setWithdrawalSuccess] = useState(false);

  useEffect(() => {
    document.title = "Retrait Automatique | SendFlow";
  }, []);

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

    if (!accountNumber) {
      toast({
        title: "Numéro de compte requis",
        description: "Veuillez entrer votre numéro de compte",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Perform withdrawal
      const { error } = await supabase.from('withdrawals').insert({
        user_id: user?.id,
        amount: Number(amount),
        payment_method: paymentMethod,
        account_number: accountNumber,
        status: 'pending',
        country: profile?.country,
      });

      if (error) {
        console.error("Erreur lors du retrait:", error);
        toast({
          title: "Erreur de retrait",
          description: "Impossible d'effectuer le retrait",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Retrait effectué",
        description: `Votre demande de retrait de ${formatCurrency(Number(amount), 'XAF')} a été soumise avec succès`,
      });

      setWithdrawalSuccess(true);
      onWithdrawalSuccess();

      // Reset form
      setAmount("");
      setAccountNumber("");

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
        <CardTitle className="text-lg font-semibold">Retrait Automatique</CardTitle>
        <Badge variant="secondary">Client</Badge>
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
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="accountNumber">Numéro de compte</Label>
            <Input
              type="text"
              id="accountNumber"
              placeholder="Entrez votre numéro de compte"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
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

        {withdrawalSuccess && (
          <div className="mt-6 p-4 bg-green-50 rounded-md border border-green-200">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-700">
                Votre demande de retrait a été soumise avec succès.
              </span>
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-red-50 rounded-md border border-red-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-xs text-red-700">
              Note: Les retraits sont soumis à vérification et peuvent prendre jusqu'à 24 heures.
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AutomaticWithdrawalForm;
