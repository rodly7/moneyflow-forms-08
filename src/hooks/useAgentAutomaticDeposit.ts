
import { useState } from "react";
import { useToast } from "./use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useAgentAutomaticDeposit = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const processAgentAutomaticDeposit = async (
    clientId: string,
    amount: number,
    clientPhone: string,
    clientName: string,
    agentBalance: number
  ) => {
    if (!user?.id || !profile) {
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour effectuer cette opération",
        variant: "destructive"
      });
      return { success: false };
    }

    if (amount > agentBalance) {
      toast({
        title: "Solde insuffisant",
        description: `Vous n'avez que ${agentBalance} FCFA dans votre compte`,
        variant: "destructive"
      });
      return { success: false };
    }

    try {
      setIsProcessing(true);

      // Vérifier les informations agent et client
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

      // Transaction atomique pour le dépôt
      // 1. Débiter l'agent
      const { data: newAgentBalance, error: debitError } = await supabase.rpc('increment_balance', {
        user_id: user.id,
        amount: -amount
      });

      if (debitError) {
        console.error("❌ Erreur lors du débit de l'agent:", debitError);
        throw new Error(`Erreur débit agent: ${debitError.message}`);
      }

      // 2. Créditer le client
      const { data: newClientBalance, error: creditError } = await supabase.rpc('increment_balance', {
        user_id: clientId,
        amount: amount
      });

      if (creditError) {
        console.error("❌ Erreur lors du crédit du client:", creditError);
        
        // ROLLBACK: Recréditer l'agent
        try {
          await supabase.rpc('increment_balance', {
            user_id: user.id,
            amount: amount
          });
        } catch (rollbackError) {
          console.error("❌ Erreur critique lors du rollback:", rollbackError);
        }
        
        throw new Error(`Erreur crédit client: ${creditError.message}`);
      }

      // 3. Créditer la commission agent (0,5%)
      const commission = Math.round(amount * 0.005);
      const { error: commissionError } = await supabase.rpc('increment_agent_commission', {
        agent_user_id: user.id,
        commission_amount: commission
      });

      if (commissionError) {
        console.error("⚠️ Erreur commission (non-critique):", commissionError);
      }

      // 4. Enregistrer la transaction
      const transactionReference = `DEP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      const { error: rechargeError } = await supabase
        .from('recharges')
        .insert({
          user_id: clientId,
          amount: amount,
          country: agentCountry || "Congo Brazzaville",
          payment_method: 'agent_deposit',
          payment_phone: clientPhone,
          payment_provider: 'agent',
          transaction_reference: transactionReference,
          status: 'completed',
          provider_transaction_id: user.id
        });

      if (rechargeError) {
        console.error("⚠️ Erreur enregistrement (non-critique):", rechargeError);
      }

      toast({
        title: "Dépôt effectué avec succès",
        description: `Dépôt de ${amount} FCFA effectué pour ${clientName}. Commission de ${commission} FCFA ajoutée.`,
      });

      return { 
        success: true, 
        message: "Dépôt effectué avec succès",
        newAgentBalance: Number(newAgentBalance) || 0,
        newClientBalance: Number(newClientBalance) || 0,
        commission
      };
    } catch (error) {
      console.error("Erreur lors du dépôt automatique:", error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite lors du dépôt",
        variant: "destructive"
      });
      return { success: false };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processAgentAutomaticDeposit,
    isProcessing
  };
};
