
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const UserBalanceRechargeButton = () => {
  const { user, refreshProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRecharge = async () => {
    if (!user?.id || !amount || parseFloat(amount) <= 0) {
      toast.error("Veuillez entrer un montant valide");
      return;
    }

    setIsLoading(true);
    try {
      const rechargeAmount = parseFloat(amount);
      
      // Créer une recharge pour l'utilisateur
      const { error } = await supabase.from('recharges').insert({
        user_id: user.id,
        amount: rechargeAmount,
        payment_method: 'mobile_money',
        payment_provider: 'orange_money',
        payment_phone: 'user',
        country: 'Cameroun',
        transaction_reference: `USER_RECHARGE_${Date.now()}`,
        status: 'pending',
        provider_transaction_id: `USER_${user.id}_${Date.now()}`
      });

      if (error) throw error;

      toast.success(`Demande de recharge de ${rechargeAmount.toLocaleString()} XAF créée avec succès`);
      setAmount("");
      setIsOpen(false);
      await refreshProfile();
    } catch (error) {
      console.error('Erreur lors de la demande de recharge:', error);
      toast.error("Erreur lors de la demande de recharge");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
        >
          <Plus className="w-4 h-4 mr-2" />
          Recharger
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Recharger le solde</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="amount">Montant (XAF)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Ex: 5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              step="1"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleRecharge}
              disabled={isLoading || !amount}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Demander Recharge
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
