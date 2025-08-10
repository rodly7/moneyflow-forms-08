
import { supabase } from "@/integrations/supabase/client";
import { getUserBalance } from "./withdrawalService";

export const processAgentWithdrawalWithCommission = async (
  agentId: string,
  clientId: string,
  amount: number,
  phoneNumber: string
) => {
  console.log("💰 [DEBUT] Traitement du retrait agent avec commission:", {
    agentId,
    clientId,
    amount,
    phoneNumber
  });

  try {
    // 1. Vérifier le solde du client AVANT toute transaction
    console.log("🔍 Vérification du solde client...");
    const clientData = await getUserBalance(clientId);
    console.log(`💳 Solde client actuel: ${clientData.balance} FCFA`);
    
    if (clientData.balance < amount) {
      throw new Error(`Solde client insuffisant. Disponible: ${clientData.balance} FCFA, demandé: ${amount} FCFA`);
    }

    // 2. Calculer la commission agent (0,5% pour les retraits)
    const agentCommission = amount * 0.005;
    console.log(`📊 Commission calculée: ${agentCommission} FCFA (0.5%)`);

    // 3. TRANSACTION ATOMIQUE: Débiter le client
    console.log(`💸 [ETAPE 1] Débit du client ${clientId} de ${amount} FCFA`);
    const { data: newClientBalance, error: debitError } = await supabase.rpc('increment_balance', {
      user_id: clientId,
      amount: -amount
    });

    if (debitError) {
      console.error("❌ ERREUR lors du débit du client:", debitError);
      throw new Error(`Erreur débit client: ${debitError.message}`);
    }

    console.log(`✅ [ETAPE 1 OK] Client débité. Nouveau solde: ${newClientBalance} FCFA`);

    // 4. TRANSACTION ATOMIQUE: Créditer l'agent avec le montant complet
    console.log(`💰 [ETAPE 2] Crédit de l'agent ${agentId} de ${amount} FCFA`);
    const { data: newAgentBalance, error: creditError } = await supabase.rpc('increment_balance', {
      user_id: agentId,
      amount: amount
    });

    if (creditError) {
      console.error("❌ ERREUR lors du crédit de l'agent:", creditError);
      
      // ROLLBACK AUTOMATIQUE: Recréditer le client
      console.log("🔄 [ROLLBACK] Annulation - recréditer le client");
      try {
        await supabase.rpc('increment_balance', {
          user_id: clientId,
          amount: amount
        });
        console.log("✅ [ROLLBACK OK] Client re-crédité");
      } catch (rollbackError) {
        console.error("❌ [ROLLBACK FAILED] Erreur critique lors du rollback:", rollbackError);
      }
      
      throw new Error(`Erreur crédit agent: ${creditError.message}`);
    }

    console.log(`✅ [ETAPE 2 OK] Agent crédité. Nouveau solde: ${newAgentBalance} FCFA`);

    // 5. Ajouter la commission au solde commission de l'agent (non-critique)
    console.log(`📈 [ETAPE 3] Ajout commission ${agentCommission} FCFA`);
    try {
      const { error: commissionError } = await supabase.rpc('increment_agent_commission', {
        agent_user_id: agentId,
        commission_amount: agentCommission
      });

      if (commissionError) {
        console.error("⚠️ Erreur commission (non-critique):", commissionError);
      } else {
        console.log("✅ [ETAPE 3 OK] Commission ajoutée");
      }
    } catch (commissionError) {
      console.error("⚠️ Erreur lors de l'ajout de la commission:", commissionError);
      // On continue car le retrait principal a réussi
    }

    // 6. Enregistrer le retrait dans la base (non-critique)
    console.log("📝 [ETAPE 4] Enregistrement du retrait");
    try {
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
        console.error("⚠️ Erreur enregistrement retrait (non-critique):", withdrawalError);
      } else {
        console.log("✅ [ETAPE 4 OK] Retrait enregistré:", withdrawal.id);
      }
    } catch (withdrawalError) {
      console.error("⚠️ Erreur lors de l'enregistrement du retrait:", withdrawalError);
    }

    // 7. Résultat final
    const result = {
      clientName: clientData.fullName,
      newClientBalance: Number(newClientBalance) || 0,
      newAgentBalance: Number(newAgentBalance) || 0,
      agentCommission,
      amount,
      success: true
    };

    console.log("🎉 [SUCCESS] Retrait traité avec succès:", result);
    return result;

  } catch (error) {
    console.error("❌ [FAILED] Erreur générale lors du retrait:", error);
    throw error;
  }
};

export const processAgentDepositWithCommission = async (
  agentId: string,
  clientId: string,
  amount: number,
  phoneNumber: string
) => {
  console.log("💰 [DEBUT] Traitement du dépôt agent avec commission:", {
    agentId,
    clientId,
    amount,
    phoneNumber
  });

  try {
    // 1. Vérifier le solde de l'agent
    console.log("🔍 Vérification du solde agent...");
    const agentData = await getUserBalance(agentId);
    console.log(`💳 Solde agent actuel: ${agentData.balance} FCFA`);
    
    if (agentData.balance < amount) {
      throw new Error(`Solde agent insuffisant. Disponible: ${agentData.balance} FCFA, demandé: ${amount} FCFA`);
    }

    // 2. Calculer la commission agent (1% pour les dépôts)
    const agentCommission = amount * 0.01;
    console.log(`📊 Commission calculée: ${agentCommission} FCFA (1%)`);

    // 3. TRANSACTION ATOMIQUE: Débiter l'agent
    console.log(`💸 [ETAPE 1] Débit de l'agent ${agentId} de ${amount} FCFA`);
    const { data: newAgentBalance, error: debitError } = await supabase.rpc('increment_balance', {
      user_id: agentId,
      amount: -amount
    });

    if (debitError) {
      console.error("❌ ERREUR lors du débit de l'agent:", debitError);
      throw new Error(`Erreur débit agent: ${debitError.message}`);
    }

    console.log(`✅ [ETAPE 1 OK] Agent débité. Nouveau solde: ${newAgentBalance} FCFA`);

    // 4. TRANSACTION ATOMIQUE: Créditer le client
    console.log(`💰 [ETAPE 2] Crédit du client ${clientId} de ${amount} FCFA`);
    const { data: newClientBalance, error: creditError } = await supabase.rpc('increment_balance', {
      user_id: clientId,
      amount: amount
    });

    if (creditError) {
      console.error("❌ ERREUR lors du crédit du client:", creditError);
      
      // ROLLBACK: Recréditer l'agent
      console.log("🔄 [ROLLBACK] Annulation - recréditer l'agent");
      try {
        await supabase.rpc('increment_balance', {
          user_id: agentId,
          amount: amount
        });
        console.log("✅ [ROLLBACK OK] Agent re-crédité");
      } catch (rollbackError) {
        console.error("❌ [ROLLBACK FAILED] Erreur critique lors du rollback:", rollbackError);
      }
      
      throw new Error(`Erreur crédit client: ${creditError.message}`);
    }

    console.log(`✅ [ETAPE 2 OK] Client crédité. Nouveau solde: ${newClientBalance} FCFA`);

    // 5. Ajouter la commission au solde commission de l'agent
    console.log(`📈 [ETAPE 3] Ajout commission ${agentCommission} FCFA`);
    try {
      const { error: commissionError } = await supabase.rpc('increment_agent_commission', {
        agent_user_id: agentId,
        commission_amount: agentCommission
      });

      if (commissionError) {
        console.error("⚠️ Erreur commission (non-critique):", commissionError);
      } else {
        console.log("✅ [ETAPE 3 OK] Commission ajoutée");
      }
    } catch (commissionError) {
      console.error("⚠️ Erreur lors de l'ajout de la commission:", commissionError);
    }

    // 6. Enregistrer le dépôt dans la base
    console.log("📝 [ETAPE 4] Enregistrement du dépôt");
    try {
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
        console.error("⚠️ Erreur enregistrement dépôt (non-critique):", rechargeError);
      } else {
        console.log("✅ [ETAPE 4 OK] Dépôt enregistré:", recharge.id);
      }
    } catch (rechargeError) {
      console.error("⚠️ Erreur lors de l'enregistrement du dépôt:", rechargeError);
    }

    const result = {
      clientName: agentData.fullName,
      newClientBalance: Number(newClientBalance) || 0,
      newAgentBalance: Number(newAgentBalance) || 0,
      agentCommission,
      amount
    };

    console.log("🎉 [SUCCESS] Dépôt traité avec succès:", result);
    return result;

  } catch (error) {
    console.error("❌ [FAILED] Erreur générale lors du dépôt:", error);
    throw error;
  }
};
