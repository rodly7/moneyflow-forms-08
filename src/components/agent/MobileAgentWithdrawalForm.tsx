import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils/currency";
import { useToast } from "@/hooks/use-toast";

interface MobileAgentWithdrawalFormProps {
  onWithdrawalSuccess: () => void;
}

const MobileAgentWithdrawalForm: React.FC<MobileAgentWithdrawalFormProps> = ({ onWithdrawalSuccess }) => {
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [withdrawalSuccess, setWithdrawalSuccess] = useState(false);
  const { toast } = useToast();

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

    if (!phoneNumber) {
      toast({
        title: "Numéro de téléphone requis",
        description: "Veuillez entrer votre numéro de téléphone",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate withdrawal processing (replace with actual logic)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update UI based on success
      setWithdrawalSuccess(true);
      toast({
        title: "Retrait effectué",
        description: `Retrait de ${formatCurrency(Number(amount), 'XAF')} vers ${phoneNumber} effectué avec succès`,
      });

      // Reset form
      setAmount("");
      setPhoneNumber("");
      onWithdrawalSuccess();

    } catch (error) {
      console.error("Erreur lors du retrait:", error);
      toast({
        title: "Erreur de retrait",
        description: "Impossible d'effectuer le retrait",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="bg-white shadow-md rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
        <CardTitle className="text-lg font-semibold">Retrait Mobile</CardTitle>
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
            <Label htmlFor="phoneNumber">Numéro de téléphone</Label>
            <Input
              type="tel"
              id="phoneNumber"
              placeholder="Entrez votre numéro de téléphone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
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
                Retrait effectué avec succès.
              </span>
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-50 rounded-md border border-gray-200">
          <div className="flex items-center space-x-3 mb-3">
            <ArrowUpRight className="h-5 w-5 text-blue-500" />
            <h4 className="font-semibold text-gray-700">Informations Importantes</h4>
          </div>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            <li>Le montant sera retiré de votre solde principal.</li>
            <li>Assurez-vous que le numéro de téléphone est correct.</li>
            <li>Les retraits peuvent prendre quelques minutes pour être traités.</li>
          </ul>
        </div>

        <div className="mt-4 p-3 bg-red-50 rounded-md border border-red-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-xs text-red-700">
              Note: Des frais peuvent s'appliquer.
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileAgentWithdrawalForm;
