
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

      // Vérifier les informations agent et client avant la création de la demande
      // Récupérer/valider le profil agent (utiliser le contexte si dispo, sinon fallback DB)
      let agentName = profile.full_name || 'Agent';
      let agentPhone = profile.phone || '';
      let agentCountry = profile.country as string | undefined;

      if (!agentCountry) {
        const { data: agentProfile, error: agentErr } = await supabase
          .from('profiles')
          .select('full_name, phone, country')
          .eq('id', user.id)
          .maybeSingle();
        if (agentErr || !agentProfile) {
          toast({
            title: "Erreur",
            description: "Impossible de récupérer les informations de l'agent",
            variant: "destructive"
          });
          return { success: false };
        }
        agentName = agentProfile.full_name || agentName;
        agentPhone = agentProfile.phone || agentPhone;
        agentCountry = agentProfile.country || agentCountry;
      }

      // Récupérer le profil client (téléphone et pays nécessaires pour les règles)
      const { data: clientProfile, error: clientErr } = await supabase
        .from('profiles')
        .select('phone, country')
        .eq('id', clientId)
        .maybeSingle();

      if (clientErr || !clientProfile) {
        console.error("Erreur lors de la récupération du profil client:", clientErr);
        toast({
          title: "Erreur",
          description: "Impossible de récupérer les informations du client",
          variant: "destructive"
        });
        return { success: false };
      }

      // Vérifier que l'agent et le client sont dans le même pays (conforme RLS)
      if (agentCountry && clientProfile.country && agentCountry !== clientProfile.country) {
        toast({
          title: "Opération non autorisée",
          description: "Retraits uniquement pour les clients du même pays que l'agent",
          variant: "destructive"
        });
        return { success: false };
      }

      // Créer une demande de retrait (sans .select() pour éviter RLS sur lecture)
      const { error } = await supabase
        .from('withdrawal_requests')
        .insert({
          user_id: clientId,
          agent_id: user.id,
          agent_name: agentName,
          agent_phone: agentPhone,
          withdrawal_phone: clientProfile.phone || clientPhone,
          amount: amount,
          status: 'pending'
        });

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
