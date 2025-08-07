
import { useState } from "react";
import { useToast } from "./use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useAgentWithdrawalRequest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const createWithdrawalRequest = async (amount: number, recipientId: string) => {
    if (!user?.id) {
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour effectuer cette opération",
        variant: "destructive"
      });
      return { success: false };
    }

    try {
      setIsLoading(true);

      // Récupérer les informations de l'agent
      const { data: agentProfile, error: agentError } = await supabase
        .from('profiles')
        .select('full_name, phone, country')
        .eq('id', user.id)
        .single();

      if (agentError || !agentProfile) {
        console.error("Erreur lors de la récupération du profil agent:", agentError);
        toast({
          title: "Erreur",
          description: "Impossible de récupérer les informations de l'agent",
          variant: "destructive"
        });
        return { success: false };
      }

      // Récupérer les informations du client
      const { data: clientProfile, error: clientError } = await supabase
        .from('profiles')
        .select('phone, country')
        .eq('id', recipientId)
        .single();

      if (clientError || !clientProfile) {
        console.error("Erreur lors de la récupération du profil client:", clientError);
        toast({
          title: "Erreur",
          description: "Impossible de récupérer les informations du client",
          variant: "destructive"
        });
        return { success: false };
      }

      // Vérifier que l'agent et le client sont dans le même pays
      if (agentProfile.country !== clientProfile.country) {
        toast({
          title: "Opération non autorisée",
          description: "Les agents ne peuvent effectuer des dépôts/retraits que pour des clients de leur pays",
          variant: "destructive"
        });
        return { success: false };
      }

      const { data, error } = await supabase
        .from('withdrawal_requests')
        .insert({
          user_id: recipientId,
          agent_id: user.id,
          agent_name: agentProfile.full_name || 'Agent',
          agent_phone: agentProfile.phone || '',
          withdrawal_phone: clientProfile.phone || '',
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
        title: "Demande créée",
        description: "La demande de retrait a été envoyée au client",
      });

      return { success: true, data };
    } catch (error) {
      console.error("Erreur lors de la création de la demande:", error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createWithdrawalRequest,
    isLoading
  };
};
