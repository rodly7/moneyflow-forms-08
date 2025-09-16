
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserSearchResult {
  id: string;
  full_name: string;
  phone: string;
  balance: number;
  country?: string;
  role: 'user' | 'agent' | 'admin' | 'sub_admin' | 'merchant' | 'provider';
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
      console.log("🔍 Recherche d'utilisateur avec find_recipient sécurisé:", phoneNumber);
      
      // Utiliser la fonction RPC sécurisée find_recipient qui gère tous les cas de matching
      const { data, error } = await supabase.rpc('find_recipient', { 
        search_term: phoneNumber 
      });

      if (error) {
        console.error("❌ Erreur lors de la recherche RPC:", error);
        return null;
      }
      
      if (data && data.length > 0) {
        const userData = data[0];
        console.log("✅ Utilisateur trouvé via find_recipient sécurisé:", userData);
        
        return {
          id: userData.id,
          full_name: userData.full_name || "Utilisateur",
          phone: userData.phone,
          balance: Number(userData.balance) || 0,
          country: userData.country,
          role: userData.role
        };
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
