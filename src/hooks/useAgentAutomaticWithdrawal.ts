
import { useState } from "react";
import { useToast } from "./use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useAgentAutomaticWithdrawal = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const processAgentAutomaticWithdrawal = async (
    clientId: string,
    amount: number,
    clientPhone: string,
    clientName: string,
    clientBalance: number
  ) => {
    if (!user?.id || !profile) {
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour effectuer cette opération",
        variant: "destructive"
      });
      return { success: false };
    }

    if (amount > clientBalance) {
      toast({
        title: "Solde insuffisant",
        description: `Le client n'a que ${clientBalance} FCFA dans son compte`,
        variant: "destructive"
      });
      return { success: false };
    }

    try {
      setIsProcessing(true);

      // Créer une demande de retrait au lieu d'effectuer le retrait directement
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .insert({
          user_id: clientId,
          agent_id: user.id,
          agent_name: profile.full_name || 'Agent',
          agent_phone: profile.phone || '',
          withdrawal_phone: clientPhone,
          amount: amount,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error("Erreur lors de la création de la demande:", error);
        toast({
          title: "Erreur",
          description: "Impossible de créer la demande de retrait",
          variant: "destructive"
        });
        return { success: false };
      }

      toast({
        title: "Demande de retrait créée",
        description: `Demande de retrait de ${amount} FCFA envoyée à ${clientName}. En attente de confirmation.`,
      });

      return { 
        success: true, 
        data,
        message: "Demande de retrait créée avec succès" 
      };
    } catch (error) {
      console.error("Erreur lors de la création de la demande:", error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
      return { success: false };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processAgentAutomaticWithdrawal,
    isProcessing
  };
};
