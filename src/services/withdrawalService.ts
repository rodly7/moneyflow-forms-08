
import { supabase } from "@/integrations/supabase/client";

export interface ClientData {
  id: string;
  full_name: string;
  phone: string;
  balance: number;
}

export const getUserBalance = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('balance')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return { balance: data.balance || 0 };
};

export const findUserByPhone = async (phone: string): Promise<ClientData | null> => {
  console.log("🔍 Recherche utilisateur par téléphone:", phone);
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone, balance')
    .eq('phone', phone)
    .maybeSingle();

  if (error) {
    console.error("❌ Erreur lors de la recherche:", error);
    throw error;
  }

  if (!data) {
    console.log("ℹ️ Aucun utilisateur trouvé");
    return null;
  }

  console.log("✅ Utilisateur trouvé:", data);
  return data;
};

export const validateUserBalance = async (userId: string, amount: number) => {
  const balance = await getUserBalance(userId);
  if (balance.balance < amount) {
    throw new Error(`Solde insuffisant. Solde actuel: ${balance.balance} FCFA`);
  }
  return balance;
};

export const processAgentWithdrawal = async (
  agentId: string,
  clientId: string,
  amount: number,
  clientPhone: string
) => {
  console.log("💰 Traitement du retrait agent:", {
    agentId,
    clientId,
    amount,
    clientPhone
  });

  // Valider le solde client
  await validateUserBalance(clientId, amount);

  // Débiter le compte client
  const { error: debitError } = await supabase.rpc('increment_balance', {
    user_id: clientId,
    amount: -amount
  });

  if (debitError) {
    console.error("❌ Erreur lors du débit client:", debitError);
    throw new Error("Erreur lors du débit du compte client");
  }

  // Créditer l'agent (sans commission pour l'instant)
  const { error: creditError } = await supabase.rpc('increment_balance', {
    user_id: agentId,
    amount: amount
  });

  if (creditError) {
    console.error("❌ Erreur lors du crédit agent:", creditError);
    // Rollback: recréditer le client
    await supabase.rpc('increment_balance', {
      user_id: clientId,
      amount: amount
    });
    throw new Error("Erreur lors du crédit du compte agent");
  }

  // Enregistrer la transaction de retrait avec le nouveau numéro
  const { error: withdrawalError } = await supabase
    .from('withdrawals')
    .insert({
      user_id: clientId,
      amount: amount,
      withdrawal_phone: "+242066164686", // Nouveau numéro Mobile Money
      status: 'completed',
      agent_id: agentId
    });

  if (withdrawalError) {
    console.error("❌ Erreur enregistrement retrait:", withdrawalError);
  }

  console.log("✅ Retrait agent traité avec succès");
  return { success: true };
};
