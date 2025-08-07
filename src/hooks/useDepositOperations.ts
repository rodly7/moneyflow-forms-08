
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { NotificationService } from "@/services/notificationService";

export const useDepositOperations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const processDeposit = async (
    amount: number,
    recipientId: string,
    recipientName: string,
    recipientBalance: number | null,
    fullPhone: string
  ) => {
    if (!user?.id) {
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour effectuer un dépôt",
        variant: "destructive"
      });
      return false;
    }

    setIsProcessing(true);

    try {
      const { data: agentProfile, error: agentProfileError } = await supabase
        .from('profiles')
        .select('balance, country')
        .eq('id', user.id)
        .single();

      if (agentProfileError || !agentProfile) {
        throw new Error("Impossible de vérifier votre solde");
      }

      if (agentProfile.balance < amount) {
        throw new Error("Solde insuffisant pour effectuer ce dépôt");
      }

      const agentCommission = amount * 0.005;
      const transactionReference = `DEP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const { error: deductError } = await supabase.rpc('increment_balance', {
        user_id: user.id,
        amount: -(amount)
      });

      if (deductError) {
        throw new Error("Erreur lors de la déduction du montant de votre compte");
      }

      const { error: creditError } = await supabase.rpc('increment_balance', {
        user_id: recipientId,
        amount: amount
      });

      if (creditError) {
        await supabase.rpc('increment_balance', {
          user_id: user.id,
          amount: amount
        });
        throw new Error("Erreur lors du crédit du compte de l'utilisateur");
      }
      
      const { error: commissionError } = await supabase.rpc('increment_balance', {
        user_id: user.id,
        amount: agentCommission
      });
      
      if (commissionError) {
        console.error("Erreur lors du crédit de la commission à l'agent:", commissionError);
      }

      const { error: transactionError } = await supabase
        .from('recharges')
        .insert({
          user_id: recipientId,
          amount: amount,
          country: agentProfile.country || "Cameroun",
          payment_method: 'agent_deposit',
          payment_phone: fullPhone,
          payment_provider: 'agent',
          transaction_reference: transactionReference,
          status: 'completed',
          provider_transaction_id: user.id
        });

      if (transactionError) {
        console.error('Erreur transaction:', transactionError);
      }

      // Calculer le nouveau solde du destinataire
      const newRecipientBalance = (recipientBalance || 0) + amount;

      // Créer une notification pour le destinataire
      await NotificationService.createAutoNotification(
        "💰 Argent reçu",
        `Vous avez reçu ${amount.toLocaleString()} FCFA. Nouveau solde: ${newRecipientBalance.toLocaleString()} FCFA`,
        'high',
        [recipientId],
        user.id
      );

      toast({
        title: "Dépôt effectué avec succès",
        description: `Le compte de ${recipientName} a été crédité de ${amount} FCFA. Nouveau solde: ${newRecipientBalance} FCFA. Votre commission: ${agentCommission.toFixed(0)} FCFA`,
      });

      navigate('/');
      return true;
    } catch (error) {
      console.error('Erreur lors du dépôt:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors du dépôt",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    processDeposit
  };
};
