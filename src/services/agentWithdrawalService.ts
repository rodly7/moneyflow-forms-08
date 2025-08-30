
import { supabase } from "@/integrations/supabase/client";

export const processAgentWithdrawalWithCommission = async (
  agentId: string,
  clientId: string,
  amount: number,
  clientPhone: string
) => {
  console.log("🚀 [SERVICE] Début du retrait automatique avec commission");
  
  try {
    // 1. Vérifier le solde du client
    const { data: clientBalance, error: balanceError } = await supabase.rpc('increment_balance', {
      user_id: clientId,
      amount: 0
    });

    if (balanceError) {
      console.error("❌ [SERVICE] Erreur récupération solde client:", balanceError);
      throw new Error("Impossible de vérifier le solde du client");
    }

    if (Number(clientBalance) < amount) {
      throw new Error(`Solde insuffisant. Solde actuel: ${Number(clientBalance)} FCFA`);
    }

    // 2. Débiter le compte client
    const { error: debitError } = await supabase.rpc('increment_balance', {
      user_id: clientId,
      amount: -amount
    });

    if (debitError) {
      console.error("❌ [SERVICE] Erreur débit client:", debitError);
      throw new Error("Erreur lors du débit du compte client");
    }

    // 3. Créditer l'agent avec l'argent du retrait
    const { error: creditError } = await supabase.rpc('increment_balance', {
      user_id: agentId,
      amount: amount
    });

    if (creditError) {
      console.error("❌ [SERVICE] Erreur crédit agent:", creditError);
      // Rollback: recréditer le client
      await supabase.rpc('increment_balance', {
        user_id: clientId,
        amount: amount
      });
      throw new Error("Erreur lors du crédit du compte agent");
    }

    // 4. Calculer et créditer la commission agent (0.5%)
    const agentCommission = Math.round(amount * 0.005);
    
    const { error: commissionError } = await supabase.rpc('increment_agent_commission', {
      agent_user_id: agentId,
      commission_amount: agentCommission
    });

    if (commissionError) {
      console.error("⚠️ [SERVICE] Erreur commission (non-critique):", commissionError);
    }

    // 5. Enregistrer la transaction avec le nouveau numéro Mobile Money
    const transactionReference = `WDR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const { error: withdrawalError } = await supabase
      .from('withdrawals')
      .insert({
        user_id: clientId,
        amount: amount,
        withdrawal_phone: "+242066164686", // Nouveau numéro Mobile Money
        status: 'completed',
        agent_id: agentId,
        transaction_reference: transactionReference
      });

    if (withdrawalError) {
      console.error("⚠️ [SERVICE] Erreur enregistrement (non-critique):", withdrawalError);
    }

    console.log("✅ [SERVICE] Retrait automatique avec commission terminé");
    return { 
      success: true, 
      agentCommission,
      transactionReference 
    };
  } catch (error) {
    console.error("❌ [SERVICE] Erreur retrait automatique:", error);
    throw error;
  }
};
