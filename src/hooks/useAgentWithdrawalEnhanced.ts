
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { findUserByPhone } from "@/services/withdrawalService";
import { formatCurrency, supabase } from "@/integrations/supabase/client";

interface ClientData {
  id: string;
  full_name: string;
  phone: string;
  balance: number;
  country?: string;
}

export const useAgentWithdrawalEnhanced = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [isSearchingClient, setIsSearchingClient] = useState(false);
  const [agentBalance, setAgentBalance] = useState<number>(0);
  const [agentCommissionBalance, setAgentCommissionBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchAgentBalances = useCallback(async () => {
    if (!user?.id) return;
    
    console.log("🔍 [REFRESH] Récupération des soldes agent...");
    setIsLoadingBalance(true);
    
    try {
      // Récupérer le solde principal via RPC pour garantir la fraîcheur
      const { data: realBalance, error: balanceError } = await supabase.rpc('increment_balance', {
        user_id: user.id,
        amount: 0
      });
      
      if (balanceError) {
        console.error("❌ Erreur solde principal:", balanceError);
      } else {
        const newBalance = Number(realBalance) || 0;
        setAgentBalance(newBalance);
        console.log("✅ Solde principal récupéré:", newBalance);
      }
      
      // Récupérer le solde commission depuis la table agents
      const { data: agentData, error: commissionError } = await supabase
        .from('agents')
        .select('commission_balance')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (agentData && !commissionError) {
        setAgentCommissionBalance(agentData.commission_balance || 0);
        console.log("✅ Solde commission récupéré:", agentData.commission_balance || 0);
      } else {
        console.warn("⚠️ Pas de données commission agent:", commissionError);
        setAgentCommissionBalance(0);
      }
      
    } catch (error) {
      console.error("❌ Erreur lors du chargement des soldes:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos soldes",
        variant: "destructive"
      });
    } finally {
      setIsLoadingBalance(false);
    }
  }, [user?.id, toast]);

  const searchClientByPhone = useCallback(async (phone: string) => {
    if (!phone || phone.length < 6) {
      setClientData(null);
      return;
    }

    setIsSearchingClient(true);
    try {
      console.log("🔍 Recherche client:", phone);
      
      const client = await findUserByPhone(phone);
      
      if (client) {
        setClientData(client);
        console.log("✅ Client trouvé:", client.full_name);
        
        toast({
          title: "Client trouvé",
          description: `${client.full_name || 'Utilisateur'} identifié`,
        });
      } else {
        setClientData(null);
        toast({
          title: "Client non trouvé",
          description: "Aucun utilisateur trouvé avec ce numéro",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("❌ Erreur recherche:", error);
      setClientData(null);
      toast({
        title: "Erreur de recherche",
        description: "Impossible de rechercher le client",
        variant: "destructive"
      });
    } finally {
      setIsSearchingClient(false);
    }
  }, [toast]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("🚀 [DEBUG] Début de la soumission de demande de retrait");
    console.log("📋 [DEBUG] Données:", {
      amount,
      phoneNumber,
      clientData: clientData?.id,
      userId: user?.id,
      profileData: profile
    });
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      console.log("❌ [DEBUG] Montant invalide:", amount);
      toast({
        title: "Montant invalide",
        description: "Veuillez entrer un montant valide",
        variant: "destructive"
      });
      return;
    }

    if (!clientData) {
      console.log("❌ [DEBUG] Client non trouvé");
      toast({
        title: "Client requis",
        description: "Veuillez d'abord rechercher le client",
        variant: "destructive"
      });
      return;
    }

    if (!user?.id || !profile) {
      console.log("❌ [DEBUG] Authentification manquante:", { userId: user?.id, profile });
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour effectuer cette opération",
        variant: "destructive"
      });
      return;
    }

    const operationAmount = Number(amount);

    try {
      setIsProcessing(true);
      console.log("📨 [DEBUG] Création d'une demande de retrait avec les données:");
      
      // Récupérer les informations de l'agent
      const agentName = profile.full_name || 'Agent';
      const agentPhone = profile.phone || phoneNumber;
      
      console.log("👤 [DEBUG] Infos agent:", {
        agentName,
        agentPhone,
        userId: user.id,
        clientId: clientData.id,
        amount: operationAmount
      });

      const insertData = {
        user_id: clientData.id,
        agent_id: user.id,
        agent_name: agentName,
        agent_phone: agentPhone,
        withdrawal_phone: clientData.phone,
        amount: operationAmount,
        status: 'pending'
      };
      
      console.log("💾 [DEBUG] Données à insérer:", insertData);

      const { data, error } = await supabase
        .from('withdrawal_requests')
        .insert(insertData)
        .select();

      console.log("📤 [DEBUG] Résultat insertion:", { data, error });

      if (error) {
        console.error("❌ [DEBUG] Erreur lors de la création:", error);
        console.error("❌ [DEBUG] Détails de l'erreur:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log("✅ [DEBUG] Demande créée avec succès:", data);

      toast({
        title: "Demande envoyée",
        description: `Demande de retrait de ${formatCurrency(operationAmount, 'XAF')} envoyée à ${clientData.full_name}. En attente d'approbation.`,
      });

      // Reset form
      setAmount("");
      setPhoneNumber("");
      setClientData(null);
    } catch (error: any) {
      console.error("❌ [ERROR] Erreur complète demande de retrait:", error);
      console.error("❌ [ERROR] Stack trace:", error?.stack);
      
      let errorMessage = "Impossible d'envoyer la demande de retrait";
      if (error?.message) {
        errorMessage += `: ${error.message}`;
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [amount, clientData, phoneNumber, user?.id, profile, toast]);

  useEffect(() => {
    fetchAgentBalances();
  }, [fetchAgentBalances]);

  return {
    amount,
    setAmount,
    phoneNumber,
    setPhoneNumber,
    clientData,
    isSearchingClient,
    agentBalance,
    agentCommissionBalance,
    isLoadingBalance,
    isProcessing,
    fetchAgentBalances,
    searchClientByPhone,
    handleSubmit
  };
};
