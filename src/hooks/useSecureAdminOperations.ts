
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { secureCreditUserBalance } from "@/services/secureBalanceService";

export const useSecureAdminOperations = () => {
  const { toast } = useToast();
  const { isAdmin, user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const secureUpdateUserBalance = async (phone: string, amount: number) => {
    setIsProcessing(true);
    
    try {
      // Check if current user is admin
      if (!isAdmin()) {
        throw new Error("Unauthorized: Admin access required");
      }

      console.log("🔍 Recherche sécurisée du profil pour le téléphone:", phone);
      
      // Find user by phone
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, phone, balance')
        .eq('phone', phone)
        .maybeSingle();
      
      if (profileError) {
        console.error("❌ Erreur lors de la recherche du profil:", profileError);
        throw new Error("Erreur lors de la recherche du profil");
      }
      
      if (!profile) {
        console.error("❌ Aucun profil trouvé avec ce numéro:", phone);
        throw new Error("Aucun utilisateur trouvé avec ce numéro de téléphone");
      }

      console.log("✅ Profil trouvé:", profile.full_name, "- Solde actuel:", profile.balance);
      
      // Use secure credit function with admin privileges
      const newBalance = await secureCreditUserBalance(
        profile.id, 
        amount, 
        'admin_credit',
        user?.id
      );
      
      console.log("✅ Solde mis à jour avec succès via fonction sécurisée. Nouveau solde:", newBalance);
      
      toast({
        title: "Crédit effectué avec succès",
        description: `Compte de ${profile.full_name} crédité de ${amount} FCFA de manière sécurisée.`,
      });
      
      return {
        success: true,
        user: profile,
        oldBalance: Number(profile.balance),
        newBalance: newBalance,
        amount: amount
      };
      
    } catch (error) {
      console.error("❌ Erreur lors de la mise à jour sécurisée du solde:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors du crédit",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const checkUserRole = async (userId: string) => {
    try {
      // Use the new role-based system
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error("Erreur lors de la vérification du rôle:", error);
        return false;
      }

      return profile?.role === 'admin';
    } catch (error) {
      console.error("Erreur lors de la vérification du rôle:", error);
      return false;
    }
  };

  return {
    secureUpdateUserBalance,
    checkUserRole,
    isProcessing
  };
};
