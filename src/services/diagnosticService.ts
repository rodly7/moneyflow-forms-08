
import { supabase } from "@/integrations/supabase/client";

export const findUserByPhone = async (phoneNumber: string) => {
  // Normaliser le numéro
  const normalizedPhone = phoneNumber.replace(/\D/g, '');
  const lastDigits = normalizedPhone.slice(-8);
  
  // 1. Recherche directe
  const { data: directMatch } = await supabase
    .from('profiles')
    .select('id, full_name, balance, phone, country')
    .eq('phone', phoneNumber)
    .maybeSingle();
    
  if (directMatch) return directMatch;
  
  // 2. Recherche par derniers chiffres
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, balance, phone, country');
    
  if (allProfiles) {
    const match = allProfiles.find(profile => {
      if (!profile.phone) return false;
      const profileDigits = profile.phone.replace(/\D/g, '').slice(-8);
      return profileDigits === lastDigits;
    });
    
    if (match) return match;
  }
  
  return null;
};

export const getUserTransactionHistory = async (userId: string) => {
  try {
    console.log("=== DIAGNOSTIC POUR L'UTILISATEUR ===", userId);
    
    // 1. Récupérer le profil utilisateur
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (profileError) {
      console.error("Erreur lors de la récupération du profil:", profileError);
      return null;
    }
    
    if (!profile) {
      console.error("❌ Profil introuvable pour l'utilisateur:", userId);
      return null;
    }
    
    const actualBalance = Number(profile.balance) || 0;
    console.log("👤 Profil:", profile.full_name, "- Solde BD:", actualBalance, "FCFA");
    
    // 2. Récupérer tous les transferts envoyés
    const { data: sentTransfers } = await supabase
      .from('transfers')
      .select('*')
      .eq('sender_id', userId);
    
    // 3. Récupérer tous les transferts reçus via le téléphone
    const { data: receivedTransfers } = await supabase
      .from('transfers')
      .select('*')
      .eq('recipient_phone', profile.phone);
    
    // 4. Récupérer tous les retraits
    const { data: withdrawals } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', userId);
    
    // 5. Récupérer tous les dépôts/recharges
    const { data: recharges } = await supabase
      .from('recharges')
      .select('*')
      .eq('user_id', userId);
    
    // Calculer le solde théorique
    let theoreticalBalance = 0;
    
    console.log("💸 TRANSFERTS ENVOYÉS:");
    sentTransfers?.forEach(transfer => {
      const amount = Number(transfer.amount) || 0;
      const fees = Number(transfer.fees) || 0;
      theoreticalBalance -= (amount + fees);
      console.log(`  - ${transfer.created_at}: -${amount + fees} FCFA (${amount} + ${fees} frais) vers ${transfer.recipient_full_name}`);
    });
    
    console.log("💰 TRANSFERTS REÇUS:");
    receivedTransfers?.forEach(transfer => {
      const amount = Number(transfer.amount) || 0;
      theoreticalBalance += amount;
      console.log(`  + ${transfer.created_at}: +${amount} FCFA de ${transfer.sender_id}`);
    });
    
    console.log("🏧 RETRAITS:");
    withdrawals?.forEach(withdrawal => {
      if (withdrawal.status === 'completed') {
        const amount = Number(withdrawal.amount) || 0;
        theoreticalBalance -= amount;
        console.log(`  - ${withdrawal.created_at}: -${amount} FCFA (retrait complété)`);
      }
    });
    
    console.log("💳 DÉPÔTS/RECHARGES:");
    recharges?.forEach(recharge => {
      if (recharge.status === 'completed') {
        const amount = Number(recharge.amount) || 0;
        theoreticalBalance += amount;
        console.log(`  + ${recharge.created_at}: +${amount} FCFA (dépôt complété)`);
      }
    });
    
    const difference = actualBalance - theoreticalBalance;
    
    console.log("📊 RÉSUMÉ DU DIAGNOSTIC:");
    console.log(`  Solde en base de données: ${actualBalance} FCFA`);
    console.log(`  Solde théorique calculé: ${theoreticalBalance} FCFA`);
    console.log(`  Différence: ${difference} FCFA`);
    
    if (Math.abs(difference) > 0.01) {
      console.log("⚠️  INCOHÉRENCE DÉTECTÉE !");
    } else {
      console.log("✅ Solde cohérent");
    }
    
    return {
      userId,
      userName: profile.full_name,
      actualBalance,
      theoreticalBalance,
      difference,
      sentTransfers: sentTransfers?.length || 0,
      receivedTransfers: receivedTransfers?.length || 0,
      withdrawals: withdrawals?.length || 0,
      recharges: recharges?.length || 0
    };
    
  } catch (error) {
    console.error("Erreur lors du diagnostic:", error);
    return null;
  }
};
