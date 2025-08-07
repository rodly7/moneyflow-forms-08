
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type RecipientData = {
  email: string;
  fullName: string;
  country: string;
  userId?: string;
  balance?: number;
};

export const useRecipientVerification = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [recipientVerified, setRecipientVerified] = useState(false);
  const { toast } = useToast();

  // Vérifie si un email est valide
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const startsWithNumbersOnly = /^[0-9]+@/;
    
    return emailRegex.test(email) && !startsWithNumbersOnly.test(email);
  };

  // Vérifie si un numéro de téléphone est valide
  const isValidPhoneNumber = (input: string) => {
    const cleanedInput = input.replace(/[\s+]/g, '');
    return /^\d+$/.test(cleanedInput) && cleanedInput.length >= 8;
  };

  // Fonction pour extraire le nom à partir des métadonnées utilisateur
  const extractNameFromMetadata = (metadata: any): string | null => {
    if (!metadata) return null;
    
    const possibleNameKeys = [
      'display_name', 'displayName', 'full_name', 'fullName', 
      'name', 'user_name', 'userName', 'first_name', 'firstName',
      'nom', 'prenom', 'prénom', 'pseudo'
    ];
    
    for (const key of possibleNameKeys) {
      if (metadata[key] && typeof metadata[key] === 'string' && metadata[key].trim().length > 0) {
        return metadata[key].trim();
      }
    }
    
    if (metadata.first_name && metadata.last_name) {
      return `${metadata.first_name} ${metadata.last_name}`.trim();
    }
    
    if (metadata.firstName && metadata.lastName) {
      return `${metadata.firstName} ${metadata.lastName}`.trim();
    }
    
    if (metadata.prenom && metadata.nom) {
      return `${metadata.prenom} ${metadata.nom}`.trim();
    }
    
    if (metadata.prénom && metadata.nom) {
      return `${metadata.prénom} ${metadata.nom}`.trim();
    }
    
    return null;
  };

  // Fonction pour normaliser un numéro de téléphone
  const normalizePhoneNumber = (phone: string): string => {
    return phone.replace(/\D/g, '');
  };
  
  // Fonction pour extraire les derniers X chiffres d'un numéro de téléphone
  const getLastDigits = (phone: string, count: number): string => {
    const normalized = normalizePhoneNumber(phone);
    return normalized.slice(-count);
  };

  // Fonction pour comparer deux numéros de téléphone normalisés
  const phoneNumbersMatch = (phone1: string, phone2: string, countryCode?: string): boolean => {
    const normalizedPhone1 = normalizePhoneNumber(phone1);
    const normalizedPhone2 = normalizePhoneNumber(phone2);
    
    console.log(`Comparing phones: "${normalizedPhone1}" vs "${normalizedPhone2}"`);
    
    // Correspondance directe
    if (normalizedPhone1 === normalizedPhone2) {
      console.log("✓ Direct match");
      return true;
    }
    
    // Comparer les derniers 9 chiffres
    const last9digits1 = getLastDigits(normalizedPhone1, 9);
    const last9digits2 = getLastDigits(normalizedPhone2, 9);
    
    if (last9digits1.length === 9 && last9digits2.length === 9 && last9digits1 === last9digits2) {
      console.log(`✓ Last 9 digits match: ${last9digits1} vs ${last9digits2}`);
      return true;
    }
    
    // Comparer les derniers 8 chiffres
    const last8digits1 = getLastDigits(normalizedPhone1, 8);
    const last8digits2 = getLastDigits(normalizedPhone2, 8);
    
    if (last8digits1.length === 8 && last8digits2.length === 8 && last8digits1 === last8digits2) {
      console.log(`✓ Last 8 digits match: ${last8digits1} vs ${last8digits2}`);
      return true;
    }
    
    // Vérification spécifique pour Congo Brazzaville (+242)
    if (countryCode?.includes('242')) {
      const congoFormat = (num: string): string => {
        let formatted = num.replace(/^242/, '').replace(/^\+242/, '');
        formatted = formatted.replace(/^0/, '');
        return formatted;
      };
      
      const congoPhone1 = congoFormat(normalizedPhone1);
      const congoPhone2 = congoFormat(normalizedPhone2);
      
      console.log(`Congo special format: "${congoPhone1}" vs "${congoPhone2}"`);
      
      if (congoPhone1 === congoPhone2) {
        console.log("✓ Congo format match");
        return true;
      }
      
      if ((congoPhone1.length > 0 && congoPhone2.length > 0) && 
          (congoPhone1.includes(congoPhone2) || congoPhone2.includes(congoPhone1))) {
        console.log("✓ Congo number is substring of the other");
        return true;
      }
    }
    
    // Vérifier si un numéro est une sous-chaîne de l'autre
    if ((normalizedPhone1.length > 0 && normalizedPhone2.length > 0) &&
        (normalizedPhone1.endsWith(normalizedPhone2) || normalizedPhone2.endsWith(normalizedPhone1))) {
      console.log("✓ Substring match (one ends with the other)");
      return true;
    }
    
    // Si nous avons un code pays, vérifier les cas avec et sans code pays
    if (countryCode) {
      const normalizedCountryCode = normalizePhoneNumber(countryCode);
      
      if (normalizedPhone1.startsWith(normalizedCountryCode)) {
        const phone1WithoutCode = normalizedPhone1.substring(normalizedCountryCode.length);
        console.log(`Without code comparison: "${phone1WithoutCode}" vs "${normalizedPhone2}"`);
        
        if (phone1WithoutCode === normalizedPhone2) {
          console.log("✓ Match after removing country code from phone1");
          return true;
        }
        
        if (normalizedPhone2.startsWith('0') && 
            phone1WithoutCode === normalizedPhone2.substring(1)) {
          console.log("✓ Match after removing country code from phone1 and leading 0 from phone2");
          return true;
        }
        
        if ((phone1WithoutCode.length > 0 && normalizedPhone2.length > 0) &&
            (phone1WithoutCode.endsWith(normalizedPhone2) || normalizedPhone2.endsWith(phone1WithoutCode))) {
          console.log("✓ Partial match after removing country code");
          return true;
        }
      }
      
      if (normalizedPhone2.startsWith(normalizedCountryCode)) {
        const phone2WithoutCode = normalizedPhone2.substring(normalizedCountryCode.length);
        console.log(`Without code comparison (reverse): "${normalizedPhone1}" vs "${phone2WithoutCode}"`);
        
        if (phone2WithoutCode === normalizedPhone1) {
          console.log("✓ Match after removing country code from phone2");
          return true;
        }
        
        if (normalizedPhone1.startsWith('0') && 
            phone2WithoutCode === normalizedPhone1.substring(1)) {
          console.log("✓ Match after removing country code from phone2 and leading 0 from phone1");
          return true;
        }
        
        if ((phone2WithoutCode.length > 0 && normalizedPhone1.length > 0) &&
            (phone2WithoutCode.endsWith(normalizedPhone1) || normalizedPhone1.endsWith(phone2WithoutCode))) {
          console.log("✓ Partial match after removing country code (reverse)");
          return true;
        }
      }
    }
    
    return false;
  };

  // Fonction pour récupérer le solde réel d'un utilisateur
  const getUserBalance = async (userId: string): Promise<{ balance: number; fullName?: string; phone?: string; country?: string }> => {
    try {
      console.log("🔍 Recherche du solde pour l'utilisateur:", userId);
      
      // Utiliser la fonction RPC increment_balance avec un montant de 0 pour obtenir le solde actuel
      const { data: balanceResult, error: balanceError } = await supabase.rpc('increment_balance', {
        user_id: userId,
        amount: 0
      });
      
      if (balanceError) {
        console.error("❌ Erreur lors de la vérification du solde via RPC:", balanceError);
      }
      
      // Récupérer le profil pour obtenir les autres informations
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('balance, full_name, phone, country')
        .eq('id', userId)
        .maybeSingle();

      if (!profileError && profile) {
        const balance = Number(profile.balance) || 0;
        console.log("✅ Solde récupéré depuis profiles:", balance);
        return { 
          balance, 
          fullName: profile.full_name || '',
          phone: profile.phone || '',
          country: profile.country || ''
        };
      }

      // Si pas de profil, récupérer depuis auth_users_agents_view pour les métadonnées
      const { data: authUser, error: authError } = await supabase
        .from('auth_users_agents_view')
        .select('raw_user_meta_data')
        .eq('id', userId)
        .maybeSingle();

      if (!authError && authUser?.raw_user_meta_data) {
        const metadata = authUser.raw_user_meta_data as any;
        const userPhone = metadata?.phone || '';
        const userFullName = extractNameFromMetadata(metadata) || 'Utilisateur';
        const userCountry = metadata?.country || 'Congo Brazzaville';
        
        console.log("ℹ️ Métadonnées utilisateur récupérées, solde par défaut: 0");
        return { 
          balance: 0, 
          fullName: userFullName, 
          phone: userPhone, 
          country: userCountry 
        };
      }

      console.log("ℹ️ Aucune donnée trouvée, retour d'un solde de 0");
      return { balance: 0 };

    } catch (error) {
      console.error("❌ Erreur lors de la récupération du solde:", error);
      return { balance: 0 };
    }
  };

  // Fonction principale pour vérifier un destinataire par téléphone ou email
  const verifyRecipient = async (identifier: string, countryCode: string, recipient: RecipientData): Promise<{
    verified: boolean;
    recipientData?: RecipientData;
  }> => {
    if (!identifier) return { verified: false };
    
    setRecipientVerified(false);
    setIsLoading(true);

    const isEmail = identifier.includes('@');
    const isPhone = !isEmail;

    try {
      if (isEmail && !isValidEmail(identifier)) {
        toast({
          title: "Format d'email invalide",
          description: "Veuillez entrer une adresse email valide",
          variant: "destructive",
        });
        setIsLoading(false);
        return { verified: false };
      }

      if (isPhone && !identifier.match(/^\+?[0-9\s]+$/)) {
        toast({
          title: "Format de téléphone invalide",
          description: "Veuillez entrer un numéro de téléphone valide",
          variant: "destructive",
        });
        setIsLoading(false);
        return { verified: false };
      }

      console.log("Vérification de l'identifiant:", identifier);
      
      if (isEmail) {
        toast({
          title: "Email enregistré",
          description: "Ce destinataire recevra un code pour réclamer le transfert",
        });
        
        setIsLoading(false);
        return { 
          verified: false,
          recipientData: {
            email: identifier,
            fullName: recipient.fullName || "Nouveau destinataire",
            country: recipient.country
          }
        };
      } else {
        // Pour les numéros de téléphone, rechercher dans les profils d'abord
        const cleanedPhone = identifier.replace(/[\s]/g, '');
        const formattedPhone = cleanedPhone.startsWith('+') ? cleanedPhone : `${countryCode}${cleanedPhone.startsWith('0') ? cleanedPhone.substring(1) : cleanedPhone}`;
        
        console.log("Recherche par téléphone:", cleanedPhone);
        console.log("Téléphone formaté avec indicatif:", formattedPhone);
        console.log("Indicatif pays utilisé:", countryCode);
        
        // Strategy 1: Recherche directe dans la table profiles
        let profilesData = [];
        try {
          const { data, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, country, phone, balance')
            .order('created_at', { ascending: false });
          
          if (!profilesError && data) {
            profilesData = data;
          }
        } catch (error) {
          console.error("Erreur lors de la récupération des profils:", error);
        }
        
        if (profilesData && profilesData.length > 0) {
          console.log("Nombre de profils trouvés dans la table profiles:", profilesData.length);
          
          for (const profile of profilesData) {
            if (profile.phone) {
              console.log(`Comparaison profil: "${profile.phone}" vs "${formattedPhone}"`);
              
              if (phoneNumbersMatch(profile.phone, formattedPhone, countryCode)) {
                console.log("✓ Correspondance trouvée dans profiles:", profile.phone);
                console.log("ID utilisateur trouvé directement dans profiles:", profile.id);
                
                // Récupérer le solde exact
                const balanceData = await getUserBalance(profile.id);
                const actualBalance = balanceData.balance;
                
                console.log("Solde exact de l'utilisateur:", actualBalance);
                
                const finalResult = {
                  verified: true,
                  recipientData: {
                    email: profile.phone,
                    fullName: profile.full_name || balanceData.fullName || `Utilisateur ${profile.phone}`,
                    country: profile.country || balanceData.country || recipient.country,
                    userId: profile.id,
                    balance: actualBalance
                  }
                };
                
                toast({
                  title: "Bénéficiaire trouvé",
                  description: `${finalResult.recipientData.fullName} - Solde: ${actualBalance} FCFA`,
                });
                
                setRecipientVerified(true);
                setIsLoading(false);
                return finalResult;
              }
            }
          }
        }
        
        // Strategy 2: Recherche supplémentaire dans les profils avec numéros normalisés
        let additionalProfileData = [];
        try {
          // Recherche plus flexible dans les profils pour capturer plus d'utilisateurs
          const normalizedSearchTerm = cleanedPhone.replace(/[\s+\-]/g, '');
          const { data, error: additionalProfileError } = await supabase
            .from('profiles')
            .select('id, full_name, phone, country, balance')
            .or(`phone.ilike.%${normalizedSearchTerm}%,full_name.ilike.%${cleanedPhone}%`)
            .limit(50);
          
          if (!additionalProfileError && data) {
            additionalProfileData = data;
            
            // Vérifier les résultats supplémentaires
            for (const additionalProfile of data) {
              if (additionalProfile.phone && phoneNumbersMatch(additionalProfile.phone, formattedPhone, countryCode)) {
                console.log("✓ Correspondance trouvée dans la recherche supplémentaire:", additionalProfile.id);
                
                const balanceData = await getUserBalance(additionalProfile.id);
                const actualBalance = balanceData.balance;
                
                const finalResult = {
                  verified: true,
                  recipientData: {
                    email: additionalProfile.phone,
                    fullName: additionalProfile.full_name || balanceData.fullName || `Utilisateur ${additionalProfile.phone}`,
                    country: additionalProfile.country || balanceData.country || recipient.country,
                    userId: additionalProfile.id,
                    balance: actualBalance
                  }
                };
                
                toast({
                  title: "Bénéficiaire trouvé",
                  description: `${finalResult.recipientData.fullName} - Solde: ${actualBalance} FCFA`,
                });
                
                setRecipientVerified(true);
                setIsLoading(false);
                return finalResult;
              }
            }
          }
        } catch (error) {
          console.error("Erreur lors de la recherche supplémentaire de profils:", error);
        }
        
        // Aucun utilisateur trouvé dans les stratégies précédentes
        console.log("Aucune correspondance trouvée dans les recherches principales");
        
        // Strategy 3: Recherche par derniers chiffres
        console.log("Recherche par derniers chiffres du numéro...");
        const lastDigits = normalizePhoneNumber(formattedPhone).slice(-8);
        
        if (lastDigits.length >= 8 && profilesData) {
          for (const profile of profilesData) {
            if (profile.phone) {
              const profileLastDigits = normalizePhoneNumber(profile.phone).slice(-8);
              if (profileLastDigits === lastDigits) {
                console.log("✓ Correspondance trouvée par les 8 derniers chiffres:", profile.id);
                
                // Récupérer le solde exact
                const balanceData = await getUserBalance(profile.id);
                const actualBalance = balanceData.balance;
                
                console.log("Solde exact de l'utilisateur (8 derniers chiffres):", actualBalance);
                
                const finalResult = {
                  verified: true,
                  recipientData: {
                    email: profile.phone,
                    fullName: profile.full_name || balanceData.fullName || `Utilisateur ${profile.phone}`,
                    country: profile.country || balanceData.country || recipient.country,
                    userId: profile.id,
                    balance: actualBalance
                  }
                };
                
                toast({
                  title: "Bénéficiaire trouvé",
                  description: `${finalResult.recipientData.fullName} - Solde: ${actualBalance} FCFA`,
                });
                
                setRecipientVerified(true);
                setIsLoading(false);
                return finalResult;
              }
            }
          }
        }
        
        // Aucun utilisateur trouvé
        console.log("Aucun utilisateur trouvé avec ce numéro:", formattedPhone);
        
        const noUserResult = {
          verified: false,
          recipientData: {
            email: formattedPhone,
            fullName: recipient.fullName || formattedPhone,
            country: recipient.country,
          }
        };
        
        toast({
          title: "Numéro non trouvé",
          description: "Ce numéro n'est pas enregistré dans le système",
          variant: "destructive",
        });
        
        setIsLoading(false);
        return noUserResult;
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la vérification",
        variant: "destructive",
      });
      setIsLoading(false);
      return { verified: false };
    }
  };

  return {
    isLoading,
    recipientVerified,
    verifyRecipient,
    isValidEmail,
    isValidPhoneNumber,
    setRecipientVerified,
    getUserBalance
  };
};
