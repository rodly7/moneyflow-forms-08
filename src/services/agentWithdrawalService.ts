
import { supabase } from "@/integrations/supabase/client";
import { getUserBalance } from "./withdrawalService";

export const processAgentWithdrawalWithCommission = async (
  agentId: string,
  clientId: string,
  amount: number,
  phoneNumber: string
) => {
  console.log("💰 Traitement du retrait agent avec commission:", {
    agentId,
    clientId,
    amount,
    phoneNumber
  });

  // Vérifier le solde du client
  const clientData = await getUserBalance(clientId);
  
  if (clientData.balance < amount) {
    throw new Error(`Solde insuffisant. Le client a ${clientData.balance} FCFA, montant demandé: ${amount} FCFA`);
  }

  // Calculer la commission agent (0,5% pour les retraits)
  const agentCommission = amount * 0.005;

  // Débiter le client
  const { data: newClientBalance, error: debitError } = await supabase.rpc('increment_balance', {
    user_id: clientId,
    amount: -amount
  });

  if (debitError) {
    console.error("❌ Erreur lors du débit du client:", debitError);
    throw new Error("Erreur lors du débit du compte client");
  }

  // Créditer l'agent avec le montant complet
  const { data: newAgentBalance, error: creditError } = await supabase.rpc('increment_balance', {
    user_id: agentId,
    amount: amount
  });

  if (creditError) {
    console.error("❌ Erreur lors du crédit de l'agent:", creditError);
    // En cas d'erreur, recréditer le client
    await supabase.rpc('increment_balance', {
      user_id: clientId,
      amount: amount
    });
    throw new Error("Erreur lors du crédit du compte agent");
  }

  // Ajouter la commission au solde commission de l'agent
  const { error: commissionError } = await supabase.rpc('increment_agent_commission', {
    agent_user_id: agentId,
    commission_amount: agentCommission
  });

  if (commissionError) {
    console.error("❌ Erreur lors de l'ajout de la commission:", commissionError);
  }

  // Créer l'enregistrement du retrait
  const { data: withdrawal, error: withdrawalError } = await supabase
    .from('withdrawals')
    .insert({
      user_id: clientId,
      amount: amount,
      withdrawal_phone: phoneNumber,
      status: 'completed'
    })
    .select()
    .single();

  if (withdrawalError) {
    console.error("❌ Erreur lors de l'enregistrement du retrait:", withdrawalError);
  }

  console.log("✅ Retrait traité avec succès, commission ajoutée");
  return {
    clientName: clientData.fullName,
    newClientBalance: Number(newClientBalance) || 0,
    newAgentBalance: Number(newAgentBalance) || 0,
    agentCommission,
    amount
  };
};

export const processAgentDepositWithCommission = async (
  agentId: string,
  clientId: string,
  amount: number,
  phoneNumber: string
) => {
  console.log("💰 Traitement du dépôt agent avec commission:", {
    agentId,
    clientId,
    amount,
    phoneNumber
  });

  // Vérifier le solde de l'agent
  const agentData = await getUserBalance(agentId);
  
  if (agentData.balance < amount) {
    throw new Error(`Solde agent insuffisant. L'agent a ${agentData.balance} FCFA, montant demandé: ${amount} FCFA`);
  }

  // Calculer la commission agent (1% pour les dépôts)
  const agentCommission = amount * 0.01;

  // Débiter l'agent
  const { data: newAgentBalance, error: debitError } = await supabase.rpc('increment_balance', {
    user_id: agentId,
    amount: -amount
  });

  if (debitError) {
    console.error("❌ Erreur lors du débit de l'agent:", debitError);
    throw new Error("Erreur lors du débit du compte agent");
  }

  // Créditer le client
  const { data: newClientBalance, error: creditError } = await supabase.rpc('increment_balance', {
    user_id: clientId,
    amount: amount
  });

  if (creditError) {
    console.error("❌ Erreur lors du crédit du client:", creditError);
    // En cas d'erreur, recréditer l'agent
    await supabase.rpc('increment_balance', {
      user_id: agentId,
      amount: amount
    });
    throw new Error("Erreur lors du crédit du compte client");
  }

  // Ajouter la commission au solde commission de l'agent
  const { error: commissionError } = await supabase.rpc('increment_agent_commission', {
    agent_user_id: agentId,
    commission_amount: agentCommission
  });

  if (commissionError) {
    console.error("❌ Erreur lors de l'ajout de la commission:", commissionError);
  }

  // Créer l'enregistrement du dépôt
  const { data: recharge, error: rechargeError } = await supabase
    .from('recharges')
    .insert({
      user_id: clientId,
      amount: amount,
      country: agentData.country || "Congo Brazzaville",
      payment_method: 'agent_deposit',
      payment_phone: phoneNumber,
      payment_provider: 'agent',
      transaction_reference: `DEP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: 'completed',
      provider_transaction_id: agentId
    })
    .select()
    .single();

  if (rechargeError) {
    console.error("❌ Erreur lors de l'enregistrement du dépôt:", rechargeError);
  }

  console.log("✅ Dépôt traité avec succès, commission ajoutée");
  return {
    clientName: agentData.fullName,
    newClientBalance: Number(newClientBalance) || 0,
    newAgentBalance: Number(newAgentBalance) || 0,
    agentCommission,
    amount
  };
};
