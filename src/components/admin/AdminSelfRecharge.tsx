import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Wallet, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";

export const AdminSelfRecharge = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [isRecharging, setIsRecharging] = useState(false);

  const handleRecharge = async () => {
    if (!user?.id) {
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour effectuer cette opération",
        variant: "destructive",
      });
      return;
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: "Montant invalide",
        description: "Veuillez entrer un montant valide",
        variant: "destructive",
      });
      return;
    }

    setIsRecharging(true);

    try {
      const rechargeAmount = Number(amount);

      // Call the Supabase function to increment the balance
      const { error } = await supabase.rpc("increment_balance", {
        user_id: user.id,
        amount: rechargeAmount,
      });

      if (error) {
        console.error("Erreur lors de la recharge:", error);
        toast({
          title: "Erreur de recharge",
          description:
            error.message || "Une erreur est survenue lors de la recharge.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Recharge réussie!",
        description: `Votre solde a été rechargé de ${formatCurrency(rechargeAmount, 'XAF')}.`,
      });

      // Reset the amount input
      setAmount("");
    } catch (err: any) {
      console.error("Erreur inattendue lors de la recharge:", err);
      toast({
        title: "Erreur inattendue",
        description: err.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    } finally {
      setIsRecharging(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recharger votre propre compte</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="amount">Montant à recharger (XAF)</Label>
          <Input
            type="number"
            id="amount"
            placeholder="Entrez le montant"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="100"
            required
          />
        </div>
        <Button
          onClick={handleRecharge}
          disabled={isRecharging || !amount}
          className="w-full"
        >
          {isRecharging ? (
            <>
              <Wallet className="mr-2 h-4 w-4 animate-spin" />
              Recharge en cours...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Recharger mon compte
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
