
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const LOW_BALANCE_THRESHOLD = 10000; // 10,000 FCFA

export const useBalanceCheck = (balance: number) => {
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!profile || balance === 0) return;

    if (balance < LOW_BALANCE_THRESHOLD) {
      toast({
        title: "⚠️ Solde faible",
        description: `Votre solde est de ${balance.toLocaleString('fr-FR')} FCFA. Pensez à recharger votre compte.`,
        variant: "destructive",
        duration: 5000,
      });
    }
  }, [balance, profile, toast]);
};
