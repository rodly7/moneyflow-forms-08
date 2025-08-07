
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useWithdrawalRequest = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const createWithdrawalRequest = async (amount: number, phoneNumber: string) => {
    if (!user?.id) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour faire une demande de retrait",
        variant: "destructive"
      });
      return { success: false };
    }

    try {
      setIsProcessing(true);

      // Vérifier le solde utilisateur
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        throw new Error("Impossible de vérifier votre solde");
      }

      if (profile.balance < amount) {
        throw new Error(`Solde insuffisant. Votre solde: ${profile.balance} FCFA`);
      }

      // Générer un code de vérification
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Créer la demande de retrait
      const { data: withdrawal, error: withdrawalError } = await supabase
        .from('withdrawals')
        .insert({
          user_id: user.id,
          amount: amount,
          withdrawal_phone: phoneNumber,
          verification_code: verificationCode,
          status: 'pending'
        })
        .select()
        .single();

      if (withdrawalError) {
        throw new Error("Erreur lors de la création de la demande");
      }

      toast({
        title: "Demande créée",
        description: `Votre demande de retrait de ${amount.toLocaleString()} FCFA a été créée. Code: ${verificationCode}`,
      });

      return { 
        success: true, 
        withdrawalId: withdrawal.id,
        verificationCode: verificationCode,
        agentCommission: 0,
        moneyFlowCommission: 0,
        totalFee: 0,
        message: "Demande de retrait créée avec succès"
      };
    } catch (error) {
      console.error("❌ Erreur lors de la demande de retrait:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la demande de retrait";
      toast({
        title: "Erreur de demande",
        description: errorMessage,
        variant: "destructive"
      });
      return { 
        success: false, 
        error,
        message: errorMessage
      };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    createWithdrawalRequest,
    isProcessing
  };
};
