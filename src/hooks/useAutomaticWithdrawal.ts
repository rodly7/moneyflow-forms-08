
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getUserBalance, validateUserBalance } from "@/services/withdrawalService";

export const useAutomaticWithdrawal = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const processWithdrawal = async (amount: number, phoneNumber: string) => {
    if (!user?.id) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour effectuer un retrait",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessing(true);

      // Vérifier le solde utilisateur
      console.log("🔍 Vérification du solde utilisateur...");
      await validateUserBalance(user.id, amount);

      // Créer la demande de retrait automatique
      const { data: withdrawal, error: withdrawalError } = await supabase
        .from('withdrawals')
        .insert({
          user_id: user.id,
          amount: amount,
          withdrawal_phone: phoneNumber,
          status: 'completed' // Retrait automatique - traité immédiatement
        })
        .select()
        .single();

      if (withdrawalError) {
        console.error("❌ Erreur lors de la création du retrait:", withdrawalError);
        throw new Error("Erreur lors de la création de la demande de retrait");
      }

      // Débiter le compte utilisateur
      const { error: debitError } = await supabase.rpc('increment_balance', {
        user_id: user.id,
        amount: -amount
      });

      if (debitError) {
        console.error("❌ Erreur lors du débit:", debitError);
        
        // Annuler la demande de retrait en cas d'erreur
        await supabase
          .from('withdrawals')
          .delete()
          .eq('id', withdrawal.id);
          
        throw new Error("Erreur lors du débit de votre compte");
      }

      console.log("✅ Retrait automatique effectué avec succès");

      toast({
        title: "Retrait effectué",
        description: `Votre retrait de ${amount.toLocaleString()} FCFA a été traité avec succès`,
      });

      return { success: true };
    } catch (error) {
      console.error("❌ Erreur lors du retrait automatique:", error);
      toast({
        title: "Erreur de retrait",
        description: error instanceof Error ? error.message : "Erreur lors du retrait automatique",
        variant: "destructive"
      });
      return { success: false, error };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processWithdrawal,
    isProcessing
  };
};
