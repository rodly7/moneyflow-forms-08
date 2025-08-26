
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useWithdrawalOperations = (onClose: () => void) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleConfirm = async (verificationCode: string) => {
    if (!user?.id || verificationCode.length !== 6) return;

    try {
      setIsProcessing(true);

      // Trouver le retrait avec ce code
      const { data: withdrawal, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('verification_code', verificationCode)
        .eq('status', 'pending')
        .single();

      if (error || !withdrawal) {
        throw new Error("Code de vérification invalide ou expiré");
      }

      // Confirmer le retrait
      const { error: updateError } = await supabase
        .from('withdrawals')
        .update({ status: 'completed' })
        .eq('id', withdrawal.id);

      if (updateError) throw updateError;

      toast({
        title: "Retrait confirmé",
        description: `Retrait de ${withdrawal.amount} FCFA confirmé avec succès`,
      });

      onClose();
    } catch (error) {
      console.error("Erreur confirmation:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la confirmation",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (verificationCode: string) => {
    if (!user?.id || verificationCode.length !== 6) return;

    try {
      setIsProcessing(true);

      // Trouver et rejeter le retrait
      const { error } = await supabase
        .from('withdrawals')
        .update({ status: 'rejected' })
        .eq('verification_code', verificationCode)
        .eq('status', 'pending');

      if (error) throw error;

      toast({
        title: "Retrait refusé",
        description: "La demande de retrait a été refusée",
      });

      onClose();
    } catch (error) {
      console.error("Erreur refus:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors du refus du retrait",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    handleConfirm,
    handleReject,
    isProcessing
  };
};
