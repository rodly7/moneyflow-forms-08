import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { calculateFee } from "@/lib/utils/currency";

export const useTransferOperations = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [isProcessing, setIsProcessing] = useState(false);

  const performTransfer = async (
    recipientPhone: string,
    amount: number,
    senderCountry: string,
    recipientCountry: string
  ) => {
    if (!user?.id || !profile) {
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour effectuer cette opération",
        variant: "destructive",
      });
      return false;
    }

    setIsProcessing(true);

    try {
      // Calculate fees
      const { fee, agentCommission, moneyFlowCommission } = calculateFee(
        amount,
        senderCountry,
        recipientCountry,
        profile.role
      );

      // Start transaction
      const { error: transferError } = await supabase.rpc(
        "transfer_funds_with_fees",
        {
          sender_id: user.id,
          recipient_phone: recipientPhone,
          transfer_amount: amount,
          transfer_fee: fee,
          agent_commission: agentCommission,
          money_flow_commission: moneyFlowCommission,
        }
      );

      if (transferError) {
        console.error("Erreur lors du transfert:", transferError);
        throw new Error(
          transferError.message || "Impossible d'effectuer le transfert"
        );
      }

      toast({
        title: "Transfert réussi",
        description: "Le transfert a été effectué avec succès.",
      });
      return true;
    } catch (error: any) {
      console.error("Erreur lors du transfert:", error);
      toast({
        title: "Erreur de transfert",
        description:
          error.message || "Une erreur est survenue lors du transfert.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return { performTransfer, isProcessing };
};
