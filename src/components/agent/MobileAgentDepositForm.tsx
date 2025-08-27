import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, ArrowDownLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils/currency";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface MobileAgentDepositFormProps {
  onDepositSuccess: () => void;
}

export const MobileAgentDepositForm: React.FC<MobileAgentDepositFormProps> = ({ onDepositSuccess }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState(false);

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

    setIsSubmitting(true);

    try {
      // Increment agent balance
      const { error } = await supabase.rpc('increment_balance', {
        user_id: user?.id,
        amount: Number(amount)
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

      // Create transaction record
      const { error: transactionError } = await supabase.from('transactions').insert({
        user_id: user?.id,
        type: 'deposit',
        amount: Number(amount),
        currency: 'XAF',
        status: 'completed',
        description: `Dépôt mobile`,
        created_by: user?.id,
        impact: 'credit'
      });

      if (transactionError) {
        console.error("Erreur lors de l'enregistrement de la transaction:", transactionError);
        toast({
          title: "Erreur",
          description: "Impossible d'enregistrer la transaction",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Dépôt effectué",
        description: `Dépôt de ${formatCurrency(Number(amount))} effectué avec succès`,
      });

      setDepositSuccess(true);
      setAmount("");
      onDepositSuccess();

    } catch (error) {
      console.error("Erreur inattendue:", error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-white shadow-md rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
        <CardTitle className="text-lg font-semibold">Dépôt Mobile</CardTitle>
        <ArrowDownLeft className="h-6 w-6 text-green-500" />
      </CardHeader>

      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Montant du dépôt</Label>
            <Input
              type="number"
              id="amount"
              placeholder="Entrez le montant"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                <span>Dépôt en cours...</span>
              </div>
            ) : (
              "Effectuer le Dépôt"
            )}
          </Button>
        </form>

        {depositSuccess && (
          <div className="mt-6 p-4 bg-green-50 rounded-md border border-green-200">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-700">
                Dépôt effectué avec succès.
              </span>
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-50 rounded-md border border-gray-200">
          <div className="flex items-center space-x-3 mb-3">
            <ArrowDownLeft className="h-5 w-5 text-emerald-500" />
            <h4 className="font-semibold text-gray-700">Informations Importantes</h4>
          </div>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            <li>Le montant sera ajouté à votre solde principal.</li>
            <li>Assurez-vous que les informations sont correctes avant de confirmer.</li>
          </ul>
        </div>

        <div className="mt-4 p-3 bg-red-50 rounded-md border border-red-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-xs text-red-700">
              Note: Les dépôts sont soumis à vérification.
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
