
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getUserBalance, validateUserBalance } from "@/services/withdrawalService";

export const useSimpleWithdrawal = () => {
  const { user, isAgent } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const createWithdrawalRequest = async (amount: number, phoneNumber: string) => {
    if (!user?.id) throw new Error("Utilisateur non connecté");

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    const { error } = await supabase
      .from('withdrawals')
      .insert({
        user_id: user.id,
        amount: amount,
        withdrawal_phone: phoneNumber,
        status: isAgent() ? 'agent_pending' : 'pending',
        verification_code: verificationCode
      });

    if (error) throw error;
    return verificationCode;
  };

  const processWithdrawal = async (amount: number, phoneNumber: string) => {
    try {
      setIsProcessing(true);

      // Vérifier le solde utilisateur depuis la base de données
      console.log("🔍 Vérification du solde utilisateur...");
      await validateUserBalance(user?.id || '', amount);

      const verificationCode = await createWithdrawalRequest(amount, phoneNumber);

      toast({
        title: "Demande de retrait créée",
        description: `Code de vérification: ${verificationCode}`,
      });

      return { success: true, verificationCode };
    } catch (error) {
      console.error("❌ Erreur lors du retrait:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors du retrait",
        variant: "destructive"
      });
      return { success: false, error };
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmWithdrawal = async (verificationCode: string) => {
    try {
      setIsProcessing(true);

      // Trouver le retrait
      const { data: withdrawal, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('verification_code', verificationCode)
        .eq('status', 'agent_pending')
        .single();

      if (error || !withdrawal) {
        throw new Error("Code de vérification invalide");
      }

      // Vérifier à nouveau le solde avant de débiter
      await validateUserBalance(withdrawal.user_id, withdrawal.amount);

      // Débiter l'utilisateur et mettre à jour le statut
      const { error: debitError } = await supabase.rpc('increment_balance', {
        user_id: withdrawal.user_id,
        amount: -withdrawal.amount
      });

      if (debitError) throw debitError;

      // Mettre à jour le statut
      await supabase
        .from('withdrawals')
        .update({ status: 'completed' })
        .eq('id', withdrawal.id);

      // Créditer l'agent
      if (isAgent() && user?.id) {
        await supabase.rpc('increment_balance', {
          user_id: user.id,
          amount: withdrawal.amount
        });
      }

      toast({
        title: "Retrait confirmé",
        description: `Retrait de ${withdrawal.amount} FCFA effectué avec succès`,
      });

      return { success: true };
    } catch (error) {
      console.error("❌ Erreur lors de la confirmation:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la confirmation",
        variant: "destructive"
      });
      return { success: false, error };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processWithdrawal,
    confirmWithdrawal,
    isProcessing
  };
};
