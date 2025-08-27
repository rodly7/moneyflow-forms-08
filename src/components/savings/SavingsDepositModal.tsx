import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils/currency";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface SavingsDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: {
    id: string;
    name: string;
    balance: number;
  };
  onSuccess: () => void;
}

const SavingsDepositModal = ({ isOpen, onClose, account, onSuccess }: SavingsDepositModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDeposit = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: "Montant invalide",
        description: "Veuillez entrer un montant valide",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Insert deposit transaction
      const { error: insertError } = await supabase.from('savings_transactions').insert({
        savings_account_id: account.id,
        user_id: user?.id,
        amount: Number(amount),
        type: 'deposit',
        status: 'completed',
      });

      if (insertError) {
        console.error("Erreur lors de l'insertion de la transaction:", insertError);
        toast({
          title: "Erreur",
          description: "Impossible d'effectuer le dépôt",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Update savings account balance
      const { error: updateError } = await supabase.rpc('increment_savings_balance', {
        account_id: account.id,
        amount: Number(amount),
      });

      if (updateError) {
        console.error("Erreur lors de la mise à jour du solde:", updateError);
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour le solde",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      toast({
        title: "Dépôt effectué",
        description: `Dépôt de ${formatCurrency(Number(amount), 'XAF')} effectué avec succès sur le compte "${account.name}"`,
      });

      setAmount("");
      onSuccess();
      onClose();
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dépôt sur le compte "{account.name}"</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="depositAmount">Montant à déposer</Label>
            <Input
              id="depositAmount"
              type="number"
              placeholder="Entrez le montant"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isProcessing}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              Annuler
            </Button>
            <Button onClick={handleDeposit} disabled={isProcessing}>
              {isProcessing ? "Traitement..." : "Déposer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SavingsDepositModal;
