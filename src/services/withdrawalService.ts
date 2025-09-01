
import { supabase } from "@/integrations/supabase/client";

export interface ClientData {
  id: string;
  full_name: string;
  phone: string;
  balance: number;
  country?: string;
}

export const getUserBalance = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('balance, country')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return { 
    balance: data.balance || 0,
    country: data.country || 'Congo Brazzaville'
  };
};

export const getCountryCodeForAgent = (country: string): string => {
  switch (country?.toLowerCase()) {
    case 'congo brazzaville':
    case 'congo':
    case 'brazzaville':
      return '+242';
    case 'cameroun':
    case 'cameroon':
      return '+237';
    case 'gabon':
      return '+241';
    case 'tchad':
    case 'chad':
      return '+235';
    default:
      return '+242'; // Défaut Congo Brazzaville
  }
};

export const findUserByPhone = async (phone: string): Promise<ClientData | null> => {
  console.log("🔍 Recherche utilisateur par téléphone:", phone);
  
  // Normaliser le numéro (enlever espaces, tirets, etc.)
  const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Essayer plusieurs formats de numéro
  const phoneVariants = [
    phone, // Format original
    normalizedPhone,
    normalizedPhone.startsWith('+') ? normalizedPhone.substring(1) : normalizedPhone, // Sans +
    normalizedPhone.startsWith('242') ? '+' + normalizedPhone : normalizedPhone, // Avec + si commence par 242
    normalizedPhone.startsWith('0') ? '+242' + normalizedPhone.substring(1) : normalizedPhone, // Remplacer 0 par +242
  ];
  
  console.log("🔍 Variants de téléphone à tester:", phoneVariants);
  
  // Essayer chaque variant
  for (const phoneVariant of phoneVariants) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, phone, balance, country')
      .eq('phone', phoneVariant)
      .maybeSingle();

    if (error) {
      console.error("❌ Erreur lors de la recherche avec:", phoneVariant, error);
      continue; // Continuer avec le variant suivant
    }

    if (data) {
      console.log("✅ Utilisateur trouvé avec variant:", phoneVariant, data);
      return data;
    }
  }
  
  console.log("ℹ️ Aucun utilisateur trouvé avec aucun variant");
  return null;
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
      withdrawal_phone: "066164686", // Nouveau numéro Mobile Money sans indicatif
      status: 'completed',
      agent_id: agentId
    });

  if (withdrawalError) {
    console.error("❌ Erreur enregistrement retrait:", withdrawalError);
  }

  console.log("✅ Retrait agent traité avec succès");
  return { success: true };
};
