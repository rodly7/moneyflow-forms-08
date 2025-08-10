
import { supabase } from "@/integrations/supabase/client";

// Service pour gérer automatiquement les frais et commissions selon les nouvelles règles
export const creditTransactionFees = async (
  transactionType: 'transfer' | 'withdrawal' | 'deposit' | 'bill_payment',
  amount: number,
  isNational: boolean = false,
  performedBy?: 'agent' | 'user',
  agentId?: string
) => {
  try {
    console.log(`💰 Calcul des frais pour ${transactionType} de ${amount} FCFA`);
    
    let fees = 0;
    
    // Calcul des frais selon le type de transaction et vos nouvelles règles
    if (transactionType === 'transfer') {
      if (isNational) {
        // Transfert national : 1% uniquement pour SendFlow
        fees = amount * 0.01;
      } else {
        // Transfert international : 6,5% si < 800,000 FCFA, sinon 5%
        if (amount < 800000) {
          fees = amount * 0.065; // 6,5%
        } else {
          fees = amount * 0.05; // 5%
        }
      }
    } else if (transactionType === 'bill_payment') {
      // Paiement de factures : 1%
      fees = amount * 0.01;
    } else if (transactionType === 'withdrawal') {
      // Pas de frais pour les clients sur les retraits
      fees = 0;
    } else if (transactionType === 'deposit') {
      // Pas de frais sur les dépôts
      fees = 0;
    }
    
    if (fees > 0) {
      // Créditer les frais sur le compte admin (+221773637752)
      const { data: adminProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', '+221773637752')
        .maybeSingle();
      
      if (profileError || !adminProfile) {
        console.error("❌ Erreur lors de la recherche du profil admin:", profileError);
        return false;
      }
      
      // Utiliser la fonction RPC pour créditer les frais à l'admin
      const { error: creditError } = await supabase.rpc('increment_balance', {
        user_id: adminProfile.id,
        amount: fees
      });
      
      if (creditError) {
        console.error("❌ Erreur lors du crédit des frais à l'admin:", creditError);
        return false;
      }
      
      console.log(`✅ Frais de ${fees} FCFA crédités sur le compte admin SendFlow`);
    }
    
    // Créditer la commission de l'agent si applicable (seulement pour dépôts/retraits)
    if (agentId && (transactionType === 'deposit' || transactionType === 'withdrawal')) {
      await creditAgentCommission(agentId, transactionType, amount);
    }
    
    return true;
  } catch (error) {
    console.error("❌ Erreur lors du traitement des frais:", error);
    return false;
  }
};

export const calculateTransactionFees = (
  transactionType: 'transfer' | 'withdrawal' | 'deposit' | 'bill_payment',
  amount: number,
  isNational: boolean = false,
  performedBy?: 'agent' | 'user'
): number => {
  if (transactionType === 'transfer') {
    if (isNational) {
      // Transfert national : 1% pour SendFlow
      return amount * 0.01;
    } else {
      // Transfert international : 6,5% si < 800,000 FCFA, sinon 5%
      if (amount < 800000) {
        return amount * 0.065; // 6,5%
      } else {
        return amount * 0.05; // 5%
      }
    }
  } else if (transactionType === 'bill_payment') {
    // Paiement de factures : 1%
    return amount * 0.01;
  } else if (transactionType === 'withdrawal') {
    // Pas de frais pour les clients sur les retraits
    return 0;
  } else if (transactionType === 'deposit') {
    // Pas de frais sur les dépôts
    return 0;
  }
  return 0;
};

// Fonction pour créditer automatiquement la commission de l'agent (inchangée)
export const creditAgentCommission = async (
  agentId: string,
  transactionType: 'deposit' | 'withdrawal',
  amount: number
) => {
  try {
    let commission = 0;
    
    if (transactionType === 'deposit') {
      commission = amount * 0.005; // 0.5% pour les dépôts
    } else if (transactionType === 'withdrawal') {
      commission = amount * 0.002; // 0.2% pour les retraits
    }
    
    if (commission > 0) {
      // Utiliser la fonction RPC pour créditer la commission
      const { error } = await supabase.rpc('increment_agent_commission', {
        agent_user_id: agentId,
        commission_amount: commission
      });
      
      if (error) {
        console.error("❌ Erreur lors du crédit de la commission agent:", error);
        return false;
      }
      
      console.log(`✅ Commission de ${commission} FCFA créditée à l'agent`);
      return true;
    }
    
    return true;
  } catch (error) {
    console.error("❌ Erreur lors du traitement de la commission agent:", error);
    return false;
  }
};
