
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserSearchResult {
  id: string;
  full_name: string;
  phone: string;
  balance: number;
  country?: string;
  role: 'user' | 'agent' | 'admin' | 'sub_admin';
}

export const useUserSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const searchUserByPhone = async (phoneNumber: string): Promise<UserSearchResult | null> => {
    if (!phoneNumber || phoneNumber.length < 6) {
      return null;
    }

    setIsSearching(true);
    try {
      console.log("🔍 Recherche d'utilisateur avec find_recipient:", phoneNumber);
      
      // Utiliser la fonction RPC find_recipient en premier
      const { data, error } = await supabase.rpc('find_recipient', { 
        search_term: phoneNumber 
      });

      if (error) {
        console.error("❌ Erreur lors de la recherche RPC:", error);
        // Continuer avec la recherche manuelle en cas d'erreur RPC
      } else if (data && data.length > 0) {
        const userData = data[0];
        console.log("✅ Utilisateur trouvé via find_recipient:", userData);
        
        // Récupérer le profil complet avec le rôle
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, phone, balance, country, role')
          .eq('id', userData.id)
          .single();
        
        if (profileError) {
          console.error("Erreur lors de la récupération du profil:", profileError);
        } else if (profileData) {
          // Récupérer le solde exact via RPC
          const { data: currentBalance, error: balanceError } = await supabase.rpc('increment_balance', {
            user_id: profileData.id,
            amount: 0
          });
          
          const actualBalance = balanceError ? Number(profileData.balance) || 0 : Number(currentBalance) || 0;
          
          return {
            id: profileData.id,
            full_name: profileData.full_name || "Utilisateur",
            phone: profileData.phone,
            balance: actualBalance,
            country: profileData.country,
            role: profileData.role
          };
        }
      }

      // Si find_recipient ne trouve rien, essayer une recherche directe plus flexible
      console.log("🔍 Recherche directe dans profiles...");
      
      // Normaliser le numéro de téléphone pour la recherche
      const normalizedPhone = phoneNumber.replace(/[\s+\-]/g, '');
      
      // Recherche directe dans la table profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, phone, balance, country, role')
        .or(`phone.eq.${phoneNumber},phone.eq.${normalizedPhone}`);

      if (profileError) {
        console.error("❌ Erreur lors de la recherche directe:", profileError);
      } else if (profileData && profileData.length > 0) {
        const userData = profileData[0];
        console.log("✅ Utilisateur trouvé via recherche directe:", userData);
        
        // Récupérer le solde exact via RPC
        const { data: currentBalance, error: balanceError } = await supabase.rpc('increment_balance', {
          user_id: userData.id,
          amount: 0
        });
        
        const actualBalance = balanceError ? Number(userData.balance) || 0 : Number(currentBalance) || 0;
        
        return {
          id: userData.id,
          full_name: userData.full_name || "Utilisateur",
          phone: userData.phone,
          balance: actualBalance,
          country: userData.country,
          role: userData.role
        };
      }

      // Si aucune correspondance exacte, essayer une recherche par les derniers chiffres
      console.log("🔍 Recherche par correspondance partielle...");
      
      const { data: allProfiles, error: allProfilesError } = await supabase
        .from('profiles')
        .select('id, full_name, phone, balance, country, role');

      if (!allProfilesError && allProfiles) {
        const lastDigits = normalizedPhone.slice(-8); // Prendre les 8 derniers chiffres
        
        for (const profile of allProfiles) {
          if (profile.phone) {
            const profileNormalized = profile.phone.replace(/[\s+\-]/g, '');
            const profileLastDigits = profileNormalized.slice(-8);
            
            if (profileLastDigits === lastDigits && lastDigits.length >= 8) {
              console.log("✅ Utilisateur trouvé par correspondance partielle:", profile);
              
              // Récupérer le solde exact via RPC
              const { data: currentBalance, error: balanceError } = await supabase.rpc('increment_balance', {
                user_id: profile.id,
                amount: 0
              });
              
              const actualBalance = balanceError ? Number(profile.balance) || 0 : Number(currentBalance) || 0;
              
              return {
                id: profile.id,
                full_name: profile.full_name || "Utilisateur",
                phone: profile.phone,
                balance: actualBalance,
                country: profile.country,
                role: profile.role
              };
            }
          }
        }
      }

      console.log("ℹ️ Aucun utilisateur trouvé avec ce numéro");
      return null;
      
    } catch (error) {
      console.error("❌ Erreur lors de la recherche d'utilisateur:", error);
      return null;
    } finally {
      setIsSearching(false);
    }
  };

  return {
    searchUserByPhone,
    isSearching
  };
};
