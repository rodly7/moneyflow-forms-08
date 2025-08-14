
import { supabase } from "@/integrations/supabase/client";

export interface CommissionData {
  depositCommission: number;
  withdrawalCommission: number;
  totalCommission: number;
}

// Calculer et créditer automatiquement la commission sur un dépôt (1%)
export const creditDepositCommission = async (agentId: string, amount: number): Promise<boolean> => {
  try {
    const commission = Math.round(amount * 0.01); // 1% pour les dépôts
    
    const { error } = await supabase.rpc('increment_agent_commission', {
      agent_user_id: agentId,
      commission_amount: commission
    });

    if (error) {
      console.error('Erreur crédit commission dépôt:', error);
      return false;
    }

    console.log(`✅ Commission dépôt de ${commission} FCFA créditée pour l'agent ${agentId}`);
    return true;
  } catch (error) {
    console.error('Erreur lors du crédit de commission dépôt:', error);
    return false;
  }
};

// Calculer et créditer automatiquement la commission sur un retrait (0,5%)
export const creditWithdrawalCommission = async (agentId: string, amount: number): Promise<boolean> => {
  try {
    const commission = Math.round(amount * 0.005); // 0,5% pour les retraits
    
    const { error } = await supabase.rpc('increment_agent_commission', {
      agent_user_id: agentId,
      commission_amount: commission
    });

    if (error) {
      console.error('Erreur crédit commission retrait:', error);
      return false;
    }

    console.log(`✅ Commission retrait de ${commission} FCFA créditée pour l'agent ${agentId}`);
    return true;
  } catch (error) {
    console.error('Erreur lors du crédit de commission retrait:', error);
    return false;
  }
};

// Récupérer le total des commissions de l'agent
export const getAgentCommissions = async (agentId: string): Promise<CommissionData> => {
  try {
    const { data, error } = await supabase
      .from('agents')
      .select('commission_balance')
      .eq('user_id', agentId)
      .single();

    if (error || !data) {
      return {
        depositCommission: 0,
        withdrawalCommission: 0,
        totalCommission: 0
      };
    }

    // Pour l'instant, on retourne le total - dans le futur on pourrait séparer par type
    return {
      depositCommission: 0, // À implémenter si besoin de séparation
      withdrawalCommission: 0, // À implémenter si besoin de séparation
      totalCommission: data.commission_balance || 0
    };
  } catch (error) {
    console.error('Erreur récupération commissions:', error);
    return {
      depositCommission: 0,
      withdrawalCommission: 0,
      totalCommission: 0
    };
  }
};
