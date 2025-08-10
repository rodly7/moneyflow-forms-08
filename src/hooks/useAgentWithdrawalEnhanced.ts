
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getUserBalance, findUserByPhone } from "@/services/withdrawalService";
import { processAgentWithdrawalWithCommission } from "@/services/agentWithdrawalService";
import { formatCurrency, supabase } from "@/integrations/supabase/client";

interface ClientData {
  id: string;
  full_name: string;
  phone: string;
  balance: number;
  country?: string;
}

export const useAgentWithdrawalEnhanced = () => {
  const { user } = useAuth();
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
    
    setIsLoadingBalance(true);
    try {
      console.log("🔍 [REFRESH] Récupération des soldes agent...");
      
      // Récupérer le solde principal avec RPC pour garantir la fraîcheur
      const { data: realBalance, error: balanceError } = await supabase.rpc('increment_balance', {
        user_id: user.id,
        amount: 0
      });
      
      if (balanceError) {
        console.error("❌ Erreur solde principal:", balanceError);
        throw balanceError;
      }
      
      const newBalance = Number(realBalance) || 0;
      setAgentBalance(newBalance);
      console.log("✅ Solde principal récupéré:", newBalance);
      
      // Récupérer le solde commission depuis la table agents
      const { data: agentData, error: commissionError } = await supabase
        .from('agents')
        .select('commission_balance')
        .eq('user_id', user.id)
        .single();
      
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

  const searchClientByPhone = async (phone: string) => {
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
          description: `${client.full_name || 'Utilisateur'} - Solde: ${formatCurrency(client.balance || 0, 'XAF')}`,
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
    }
    setIsSearchingClient(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: "Montant invalide",
        description: "Veuillez entrer un montant valide",
        variant: "destructive"
      });
      return;
    }

    if (!clientData) {
      toast({
        title: "Client requis",
        description: "Veuillez d'abord rechercher le client",
        variant: "destructive"
      });
      return;
    }

    const operationAmount = Number(amount);

    // Vérifier le solde client en temps réel
    console.log("🔍 Vérification finale du solde client...");
    try {
      const currentClientData = await getUserBalance(clientData.id);
      if (operationAmount > currentClientData.balance) {
        toast({
          title: "Solde client insuffisant",
          description: `Le client n'a que ${formatCurrency(currentClientData.balance, 'XAF')}`,
          variant: "destructive"
        });
        return;
      }
    } catch (error) {
      console.error("❌ Erreur vérification solde client:", error);
      toast({
        title: "Erreur",
        description: "Impossible de vérifier le solde du client",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessing(true);
      console.log("🚀 [START] Début du processus de retrait agent");

      const result = await processAgentWithdrawalWithCommission(
        user?.id || '',
        clientData.id,
        operationAmount,
        phoneNumber
      );

      console.log("✅ [SUCCESS] Retrait terminé avec succès:", result);

      toast({
        title: "Retrait effectué avec succès ✅",
        description: `Retrait de ${formatCurrency(operationAmount, 'XAF')} effectué pour ${clientData.full_name}. Commission: ${formatCurrency(result.agentCommission, 'XAF')}`,
      });

      // Reset form
      setAmount("");
      setPhoneNumber("");
      setClientData(null);
      
      // Forcer le rafraîchissement immédiat des soldes
      console.log("🔄 Rafraîchissement forcé des soldes...");
      await fetchAgentBalances();
      
    } catch (error) {
      console.error("❌ [ERROR] Erreur retrait:", error);
      toast({
        title: "Erreur lors du retrait",
        description: error instanceof Error ? error.message : "Erreur inconnue lors du retrait",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

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
