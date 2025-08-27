
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CreditCard } from "lucide-react";

interface SubAdminRechargeTabProps {
  userId: string;
}

const SubAdminRechargeTab = ({ userId }: SubAdminRechargeTabProps) => {
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    console.log("SubAdminRechargeTab loaded for user:", userId);
  }, [userId]);

  const handleRecharge = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un montant valide",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Mock recharge logic - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Succès",
        description: `Recharge de ${amount} XAF effectuée`,
      });
      
      setAmount("");
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la recharge",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Recharge de Compte
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="amount">Montant (XAF)</Label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Entrez le montant"
          />
        </div>
        <Button 
          onClick={handleRecharge} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Traitement..." : "Effectuer la recharge"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SubAdminRechargeTab;
