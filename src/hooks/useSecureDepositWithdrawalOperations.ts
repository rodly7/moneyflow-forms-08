
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { calculateDepositFees, calculateWithdrawalFees } from "@/utils/depositWithdrawalCalculations";
import { getUserBalance } from "@/services/withdrawalService";
import { 
  secureDebitUserBalance, 
  secureCreditUserBalance, 
  checkTransactionLimit,
  secureCreditPlatformCommission 
} from "@/services/secureBalanceService";

export const useSecureDepositWithdrawalOperations = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const processSecureDeposit = async (
    amount: number,
    recipientId: string,
    recipientName: string,
    recipientPhone: string
  ) => {
    if (!user?.id) {
      throw new Error("Agent non connecté");
    }

    setIsProcessing(true);

    try {
      // Vérifier les limites de transaction
      const isWithinLimits = await checkTransactionLimit(user.id, amount, 'deposit');
      if (!isWithinLimits) {
        throw new Error("Le montant dépasse les limites de transaction autorisées");
      }

      // Calculer les frais (0 pour les dépôts)
      const { agentCommission } = calculateDepositFees(amount);

      // Vérifier le solde de l'agent
      const agentBalanceData = await getUserBalance(user.id);
      if (agentBalanceData.balance < amount) {
        throw new Error("Solde agent insuffisant pour effectuer ce dépôt");
      }

      // Débiter l'agent de manière sécurisée
      await secureDebitUserBalance(user.id, amount, 'agent_deposit');

      // Créditer le client de manière sécurisée
      await secureCreditUserBalance(recipientId, amount, 'agent_deposit', user.id);

      // Créditer la commission sur le compte commission de l'agent
      if (agentCommission > 0) {
        const { error: commissionError } = await supabase.rpc('increment_agent_commission', {
          agent_user_id: user.id,
          commission_amount: agentCommission
        });
        
        if (commissionError) {
          console.error("❌ Erreur lors du crédit de la commission agent:", commissionError);
        } else {
          console.log(`✅ Commission de ${agentCommission} FCFA créditée sur le compte commission de l'agent`);
        }
      }

      // Créer l'enregistrement de la transaction
      const transactionReference = `DEP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      const { error: transactionError } = await supabase
        .from('recharges')
        .insert({
          user_id: recipientId,
          amount: amount,
          country: agentBalanceData.country || "Congo Brazzaville",
          payment_method: 'agent_deposit',
          payment_phone: recipientPhone,
          payment_provider: 'agent',
          transaction_reference: transactionReference,
          status: 'completed',
          provider_transaction_id: user.id
        });

      if (transactionError) {
        console.error('Erreur transaction:', transactionError);
      }

      toast({
        title: "Dépôt effectué avec succès",
        description: `Dépôt de ${amount} FCFA effectué pour ${recipientName}. Transaction sécurisée.`,
      });

      return true;
    } catch (error) {
      console.error('Erreur lors du dépôt sécurisé:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors du dépôt",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const processSecureWithdrawal = async (
    amount: number,
    clientId: string,
    clientName: string,
    clientPhone: string
  ) => {
    if (!user?.id) {
      throw new Error("Agent non connecté");
    }

    setIsProcessing(true);

    try {
      // Vérifier les limites de transaction
      const isWithinLimits = await checkTransactionLimit(clientId, amount, 'withdrawal');
      if (!isWithinLimits) {
        throw new Error("Le montant dépasse les limites de retrait autorisées");
      }

      // Calculer les frais (pas de frais pour les agents)
      const { totalFee, agentCommission, platformCommission } = calculateWithdrawalFees(amount, profile?.role || 'user');
      const totalAmount = amount + totalFee;

      // Vérifier le solde du client
      const clientBalanceData = await getUserBalance(clientId);
      if (clientBalanceData.balance < totalAmount) {
        throw new Error(`Solde client insuffisant. Solde: ${clientBalanceData.balance} FCFA, montant total requis: ${totalAmount} FCFA (incluant frais de ${totalFee} FCFA)`);
      }

      // Débiter le client (montant + frais) de manière sécurisée
      await secureDebitUserBalance(clientId, totalAmount, 'agent_withdrawal', user.id);

      // Créditer l'agent du montant de manière sécurisée
      await secureCreditUserBalance(user.id, amount, 'agent_withdrawal_credit');
      
      // Créditer la commission sur le compte commission de l'agent
      if (agentCommission > 0) {
        const { error: commissionError } = await supabase.rpc('increment_agent_commission', {
          agent_user_id: user.id,
          commission_amount: agentCommission
        });
        
        if (commissionError) {
          console.error("❌ Erreur lors du crédit de la commission agent:", commissionError);
        } else {
          console.log(`✅ Commission de ${agentCommission} FCFA créditée sur le compte commission de l'agent`);
        }
      }

      // Créditer la commission plateforme de manière sécurisée
      if (platformCommission > 0) {
        await secureCreditPlatformCommission(platformCommission);
      }

      // Créer l'enregistrement du retrait
      const { error: withdrawalError } = await supabase
        .from('withdrawals')
        .insert({
          user_id: clientId,
          amount: amount,
          withdrawal_phone: clientPhone,
          status: 'completed'
        });

      if (withdrawalError) {
        console.error("❌ Erreur lors de l'enregistrement du retrait:", withdrawalError);
      }

      toast({
        title: "Retrait effectué avec succès",
        description: `Retrait de ${amount} FCFA effectué pour ${clientName}. Frais: ${totalFee} FCFA. Commission: ${agentCommission} FCFA. Transaction sécurisée.`,
      });

      return true;
    } catch (error) {
      console.error('Erreur lors du retrait sécurisé:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors du retrait",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processSecureDeposit,
    processSecureWithdrawal,
    isProcessing
  };
};
