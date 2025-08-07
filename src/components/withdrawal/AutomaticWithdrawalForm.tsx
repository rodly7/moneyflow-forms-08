
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Banknote, AlertCircle, Loader2 } from "lucide-react";
import { formatCurrency } from "@/integrations/supabase/client";
import { useAutomaticWithdrawal } from "@/hooks/useAutomaticWithdrawal";

interface AutomaticWithdrawalFormProps {
  userBalance: number;
}

export const AutomaticWithdrawalForm = ({ userBalance }: AutomaticWithdrawalFormProps) => {
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  
  const { processWithdrawal, isProcessing } = useAutomaticWithdrawal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !phoneNumber) return;
    
    const withdrawalAmount = Number(amount);
    await processWithdrawal(withdrawalAmount, phoneNumber);
    
    // Reset form on success
    setAmount("");
    setPhoneNumber("");
  };

  const isValidAmount = amount && Number(amount) > 0 && Number(amount) <= userBalance;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Banknote className="w-5 h-5 text-emerald-500" />
          Retrait automatique
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-blue-800 text-sm">
              💰 Votre solde actuel: {formatCurrency(userBalance, 'XAF')}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Numéro de téléphone de retrait</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Entrez votre numéro de téléphone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Montant du retrait (XAF)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Entrez le montant à retirer"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="h-12 text-lg"
              max={userBalance}
            />
            {amount && Number(amount) > userBalance && (
              <p className="text-red-600 text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Le montant dépasse votre solde disponible
              </p>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
            <p className="text-amber-800 text-sm">
              ⚠️ Le retrait sera traité automatiquement et les fonds seront envoyés à votre numéro de téléphone
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-lg"
            disabled={isProcessing || !isValidAmount || !phoneNumber}
          >
            {isProcessing ? (
              <div className="flex items-center">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span>Traitement en cours...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Banknote className="mr-2 h-5 w-5" />
                <span>Effectuer le retrait</span>
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
