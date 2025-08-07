
import { supabase } from "@/integrations/supabase/client";

export interface PendingWithdrawal {
  id: string;
  amount: number;
  agent_name?: string;
  created_at: string;
  status: string;
  verification_code?: string;
}

export const fetchPendingWithdrawals = async (userId: string): Promise<PendingWithdrawal[]> => {
  const { data, error } = await supabase
    .from('withdrawals')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'agent_pending')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error("Erreur lors de la récupération des retraits en attente:", error);
    throw error;
  }
  
  return data || [];
};

export const confirmWithdrawal = async (withdrawalId: string, userId: string): Promise<void> => {
  // Mettre à jour le statut du retrait
  const { error: updateError } = await supabase
    .from('withdrawals')
    .update({ status: 'completed' })
    .eq('id', withdrawalId)
    .eq('user_id', userId);

  if (updateError) {
    console.error("Erreur lors de la confirmation:", updateError);
    throw new Error("Erreur lors de la confirmation du retrait");
  }

  // Débiter le compte utilisateur
  const { data: withdrawal } = await supabase
    .from('withdrawals')
    .select('amount')
    .eq('id', withdrawalId)
    .single();

  if (withdrawal) {
    const { error: debitError } = await supabase.rpc('increment_balance', {
      user_id: userId,
      amount: -withdrawal.amount
    });

    if (debitError) {
      console.error("Erreur lors du débit:", debitError);
      throw new Error("Erreur lors du débit du compte");
    }
  }
};

export const rejectWithdrawal = async (withdrawalId: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('withdrawals')
    .update({ status: 'rejected' })
    .eq('id', withdrawalId)
    .eq('user_id', userId);

  if (error) {
    console.error("Erreur lors du refus:", error);
    throw new Error("Erreur lors du refus du retrait");
  }
};
