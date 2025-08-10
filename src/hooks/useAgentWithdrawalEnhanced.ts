
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getUserBalance, findUserByPhone } from "@/services/withdrawalService";
import { processAgentWithdrawalWithCommission } from "@/services/agentWithdrawalService";
import { formatCurrency, supabase } from "@/integrations/supabase/client";
import { useAutoBalanceRefresh } from "@/hooks/useAutoBalanceRefresh";

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

  // Utiliser le hook de rafraîchissement automatique
  const { refreshBalance } = useAutoBalanceRefresh({
    intervalMs: 3000, // Rafraîchir toutes les 3 secondes
    onBalanceChange: (newBalance) => {
      console.log("💰 Solde agent mis à jour automatiquement:", newBalance);
      setAgentBalance(newBalance);
    },
    enableRealtime: true
  });

  const fetchAgentBalances = useCallback(async () => {
    if (user?.id) {
      setIsLoadingBalance(true);
      try {
        console.log("🔍 Récupération des soldes agent...");
        
        // Récupérer le solde principal
        const balanceData = await getUserBalance(user.id);
        setAgentBalance(balanceData.balance);
        
        // Récupérer le solde commission depuis la table agents
        const { data: agentData, error } = await supabase
          .from('agents')
          .select('commission_balance')
          .eq('user_id', user.id)
          .single();
        
        if (agentData && !error) {
          setAgentCommissionBalance(agentData.commission_balance || 0);
        }
        
        console.log("✅ Soldes récupérés:", {
          principal: balanceData.balance,
          commission: agentData?.commission_balance || 0
        });
      } catch (error) {
        console.error("❌ Erreur lors du chargement des soldes:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger vos soldes",
          variant: "destructive"
        });
      }
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

    if (operationAmount > clientData.balance) {
      toast({
        title: "Solde insuffisant",
        description: `Le client n'a que ${formatCurrency(clientData.balance, 'XAF')}`,
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessing(true);

      const result = await processAgentWithdrawalWithCommission(
        user?.id || '',
        clientData.id,
        operationAmount,
        phoneNumber
      );

      toast({
        title: "Retrait effectué avec succès",
        description: `Retrait de ${formatCurrency(operationAmount, 'XAF')} effectué. Commission: ${formatCurrency(result.agentCommission, 'XAF')}`,
      });

      // Reset form
      setAmount("");
      setPhoneNumber("");
      setClientData(null);
      
      // Refresh balances automatically
      await fetchAgentBalances();
      
      // Force refresh balance with the auto-refresh hook
      refreshBalance();
      
    } catch (error) {
      console.error("❌ Erreur retrait:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors du retrait",
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
