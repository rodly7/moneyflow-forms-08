
import { supabase } from "@/integrations/supabase/client";

interface WithdrawalResult {
  success: boolean;
  withdrawal_id: string;
  agent_commission: number;
  new_client_balance: number;
  new_agent_balance: number;
  transaction_reference: string;
}

export const processAgentWithdrawalWithCommission = async (
  agentId: string,
  clientId: string,
  amount: number,
  clientPhone: string
) => {
  console.log("🚀 [SERVICE] Début du retrait automatique avec commission");
  
  try {
    // Utiliser la nouvelle fonction RPC sécurisée pour un retrait atomique
    console.log("🔧 [SERVICE] Appel de la fonction RPC sécurisée");
    const { data, error } = await supabase.rpc('agent_process_withdrawal_with_commission', {
      p_agent_id: agentId,
      p_client_id: clientId,
      p_amount: amount,
      p_client_phone: clientPhone
    });

    if (error) {
      console.error("❌ [SERVICE] Erreur RPC:", error);
      throw new Error(error.message || "Erreur lors du traitement du retrait");
    }

    const result = data as unknown as WithdrawalResult;

    if (!result?.success) {
      console.error("❌ [SERVICE] Retrait échoué:", result);
      throw new Error("Le retrait n'a pas pu être traité");
    }

    console.log("✅ [SERVICE] Retrait automatique réussi:", result);

    // Déclencher un événement pour actualiser les transactions et notifications
    window.dispatchEvent(new CustomEvent('transactionUpdate'));
    
    return { 
      success: true, 
      agentCommission: result.agent_commission,
      transactionReference: result.transaction_reference,
      withdrawalId: result.withdrawal_id,
      newClientBalance: result.new_client_balance,
      newAgentBalance: result.new_agent_balance
    };
  } catch (error) {
    console.error("❌ [SERVICE] Erreur retrait automatique:", error);
    throw error;
  }
};
