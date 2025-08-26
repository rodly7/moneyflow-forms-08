import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, Phone } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";

interface CustomDepositSystemProps {
  onDepositSuccess?: () => void;
}

export const CustomDepositSystem: React.FC<CustomDepositSystemProps> = ({ onDepositSuccess }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber || !amount) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs.",
        variant: "destructive",
      });
      return;
    }

    const amountNumber = Number(amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un montant valide.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Find the user by phone number
      const { data: users, error: userError } = await supabase
        .from("profiles")
        .select("*")
        .eq("phone", phoneNumber);

      if (userError) {
        throw new Error(userError.message);
      }

      if (!users || users.length === 0) {
        toast({
          title: "Erreur",
          description: "Utilisateur non trouvé.",
          variant: "destructive",
        });
        return;
      }

      const recipient = users[0];

      // Credit the user's account
      const { error: creditError } = await supabase.rpc("increment_balance", {
        user_id: recipient.id,
        amount: amountNumber,
      });

      if (creditError) {
        throw new Error(creditError.message);
      }

      toast({
        title: "Succès",
        description: `Le compte de ${recipient.full_name} a été crédité de ${formatCurrency(amountNumber, 'XAF')}.`,
      });

      // Reset form fields
      setPhoneNumber("");
      setAmount("");

      if (onDepositSuccess) {
        onDepositSuccess();
      }
    } catch (error: any) {
      console.error("Error depositing funds:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors du dépôt.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dépôt personnalisé</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="phoneNumber">Numéro de téléphone</Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="Ex: +242066123456"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="amount">Montant à déposer</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Entrez le montant"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={isProcessing} className="w-full">
            {isProcessing ? "Traitement..." : "Déposer"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
