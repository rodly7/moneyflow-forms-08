
import { supabase } from "@/integrations/supabase/client";

export const fetchWithdrawalByCode = async (verificationCode: string, userId: string) => {
  const { data: withdrawalData, error: withdrawalError } = await supabase
    .from('withdrawals')
    .select('*')
    .eq('verification_code', verificationCode)
    .eq('user_id', userId)
    .eq('status', 'agent_pending')
    .maybeSingle();

  if (withdrawalError) {
    console.error("Erreur lors de la recherche du retrait:", withdrawalError);
    throw new Error("Erreur de base de données lors de la vérification du code");
  }

  if (!withdrawalData) {
    throw new Error("Ce code de vérification n'existe pas ou a déjà été utilisé");
  }

  return withdrawalData;
};

export const getUserBalance = async (userId: string) => {
  console.log("🔍 Recherche du solde pour l'utilisateur:", userId);
  
  // Utiliser la fonction RPC pour récupérer le solde exact
  const { data: balance, error: rpcError } = await supabase.rpc('increment_balance', {
    user_id: userId,
    amount: 0
  });

  if (rpcError) {
    console.error("❌ Erreur RPC lors de la récupération du solde:", rpcError);
    
    // Fallback : récupérer depuis la table profiles
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('balance, full_name, phone, country')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error("❌ Erreur lors de la récupération du profil:", error);
      return {
        balance: 0,
        fullName: '',
        phone: '',
        country: 'Congo Brazzaville'
      };
    }

    if (!profile) {
      console.log("ℹ️ Profil non trouvé, retour d'un solde de 0");
      return {
        balance: 0,
        fullName: '',
        phone: '',
        country: 'Congo Brazzaville'
      };
    }

    const profileBalance = Number(profile.balance) || 0;
    console.log("✅ Solde récupéré depuis le profil:", profileBalance, "FCFA");

    return {
      balance: profileBalance,
      fullName: profile.full_name || '',
      phone: profile.phone || '',
      country: profile.country || 'Congo Brazzaville'
    };
  }

  const exactBalance = Number(balance) || 0;
  console.log("✅ Solde exact récupéré via RPC:", exactBalance, "FCFA");

  // Récupérer les informations du profil
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone, country')
    .eq('id', userId)
    .maybeSingle();

  return {
    balance: exactBalance,
    fullName: profile?.full_name || '',
    phone: profile?.phone || '',
    country: profile?.country || 'Congo Brazzaville'
  };
};

export const getCountryCodeForAgent = (agentCountry: string): string => {
  const countryToCodes = {
    "Cameroun": "+237",
    "Cameroon": "+237",
    "Congo Brazzaville": "+242",
    "Gabon": "+241",
    "Tchad": "+235",
    "Chad": "+235",
    "République Centrafricaine": "+236",
    "Central African Republic": "+236",
    "Guinée Équatoriale": "+240",
    "Equatorial Guinea": "+240",
    "Sénégal": "+221",
    "Nigeria": "+234",
    "Ghana": "+233",
  };
  
  return countryToCodes[agentCountry as keyof typeof countryToCodes] || "+242";
};

export const findUserByPhoneWithCountryCode = async (phoneNumber: string, countryCode: string) => {
  console.log("🔍 Recherche d'utilisateur par numéro avec indicatif:", countryCode, phoneNumber);
  
  // Normaliser le numéro de téléphone
  const normalizedPhone = phoneNumber.replace(/[\s+]/g, '');
  
  // Construire le numéro complet avec l'indicatif
  const fullPhoneWithCode = phoneNumber.startsWith('+') 
    ? phoneNumber 
    : `${countryCode}${normalizedPhone.startsWith('0') ? normalizedPhone.substring(1) : normalizedPhone}`;
  
  console.log("🔍 Numéro complet recherché:", fullPhoneWithCode);
  
  // Recherche directe avec le numéro complet
  const { data: directMatch, error: directError } = await supabase
    .from('profiles')
    .select('id, full_name, phone, balance, country')
    .eq('phone', fullPhoneWithCode)
    .maybeSingle();

  if (!directError && directMatch) {
    console.log("✅ Utilisateur trouvé (correspondance directe):", directMatch);
    return directMatch;
  }

  // Recherche alternative avec le numéro local
  const { data: localMatch, error: localError } = await supabase
    .from('profiles')
    .select('id, full_name, phone, balance, country')
    .eq('phone', normalizedPhone)
    .maybeSingle();

  if (!localError && localMatch) {
    console.log("✅ Utilisateur trouvé (correspondance locale):", localMatch);
    return localMatch;
  }

  // Recherche flexible par les derniers 8 chiffres
  const { data: allProfiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, phone, balance, country');

  if (profilesError) {
    console.error("❌ Erreur lors de la recherche:", profilesError);
    return null;
  }

  if (allProfiles) {
    const lastDigits = normalizedPhone.slice(-8);
    
    for (const profile of allProfiles) {
      if (profile.phone) {
        const profileLastDigits = profile.phone.replace(/[\s+]/g, '').slice(-8);
        if (profileLastDigits === lastDigits && lastDigits.length >= 8) {
          console.log("✅ Utilisateur trouvé (correspondance par derniers chiffres):", profile);
          return profile;
        }
      }
    }
  }

  console.log("❌ Aucun utilisateur trouvé avec ce numéro");
  return null;
};

export const findUserByPhone = async (phoneNumber: string) => {
  console.log("🔍 Recherche d'utilisateur par numéro:", phoneNumber);
  
  // Normaliser le numéro de téléphone
  const normalizedPhone = phoneNumber.replace(/[\s+]/g, '');
  
  // Recherche directe
  const { data: directMatch, error: directError } = await supabase
    .from('profiles')
    .select('id, full_name, phone, balance, country')
    .eq('phone', phoneNumber)
    .maybeSingle();

  if (!directError && directMatch) {
    console.log("✅ Utilisateur trouvé (correspondance directe):", directMatch);
    return directMatch;
  }

  // Recherche flexible par les derniers 8 chiffres
  const { data: allProfiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, phone, balance, country');

  if (profilesError) {
    console.error("❌ Erreur lors de la recherche:", profilesError);
    return null;
  }

  if (allProfiles) {
    const lastDigits = normalizedPhone.slice(-8);
    
    for (const profile of allProfiles) {
      if (profile.phone) {
        const profileLastDigits = profile.phone.replace(/[\s+]/g, '').slice(-8);
        if (profileLastDigits === lastDigits && lastDigits.length >= 8) {
          console.log("✅ Utilisateur trouvé (correspondance par derniers chiffres):", profile);
          return profile;
        }
      }
    }
  }

  console.log("❌ Aucun utilisateur trouvé avec ce numéro");
  return null;
};

export const processAgentWithdrawal = async (
  agentId: string,
  clientId: string,
  amount: number,
  phoneNumber: string
) => {
  console.log("💰 Traitement du retrait agent:", {
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

  // Débiter le client et récupérer le nouveau solde
  const { data: newClientBalance, error: debitError } = await supabase.rpc('increment_balance', {
    user_id: clientId,
    amount: -amount
  });

  if (debitError) {
    console.error("❌ Erreur lors du débit du client:", debitError);
    throw new Error("Erreur lors du débit du compte client");
  }

  // Créditer l'agent
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
    // Ne pas faire échouer la transaction si l'enregistrement échoue
  }

  console.log("✅ Retrait traité avec succès");
  return {
    clientName: clientData.fullName,
    newClientBalance: Number(newClientBalance) || 0,
    newAgentBalance: Number(newAgentBalance) || 0,
    amount
  };
};

export const updateWithdrawalStatus = async (withdrawalId: string, status: string) => {
  const { error: updateError } = await supabase
    .from('withdrawals')
    .update({ 
      status: status,
      updated_at: new Date().toISOString()
    })
    .eq('id', withdrawalId);

  if (updateError) {
    console.error("Erreur lors de la mise à jour:", updateError);
    throw new Error("Erreur lors de la finalisation du retrait");
  }
};

export const validateUserBalance = async (userId: string, withdrawalAmount: number) => {
  const balanceData = await getUserBalance(userId);
  const currentBalance = balanceData.balance;
  
  console.log("💰 Validation du solde:", {
    soldeActuel: currentBalance,
    montantDemande: withdrawalAmount
  });
  
  if (currentBalance < withdrawalAmount) {
    throw new Error(`Solde insuffisant. Solde disponible: ${currentBalance} FCFA, montant demandé: ${withdrawalAmount} FCFA`);
  }
  
  return {
    currentBalance,
    withdrawalAmount,
    remainingBalance: currentBalance - withdrawalAmount
  };
};
