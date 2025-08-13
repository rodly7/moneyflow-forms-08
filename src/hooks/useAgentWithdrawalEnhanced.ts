
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getUserBalance, findUserByPhone } from "@/services/withdrawalService";
// import { processAgentWithdrawalWithCommission } from "@/services/agentWithdrawalService"; // No immediate transfers on request send
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
    } finally {
      setIsSearchingClient(false);
    }
  }, [toast]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
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
      console.log("📨 [REQUEST] Création d'une demande de retrait (pas de transfert immédiat)");

      const { error } = await supabase
        .from('withdrawal_requests')
        .insert({
          user_id: clientData.id,
          agent_id: user?.id || '',
          agent_name: 'Agent',
          agent_phone: phoneNumber,
          withdrawal_phone: phoneNumber,
          amount: operationAmount,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Demande envoyée",
        description: `Demande de retrait de ${formatCurrency(operationAmount, 'XAF')} envoyée à ${clientData.full_name}. En attente d'approbation.`,
      });

      // Reset form
      setAmount("");
      setPhoneNumber("");
      setClientData(null);
    } catch (error) {
      console.error("❌ [ERROR] Erreur demande de retrait:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la demande de retrait",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [amount, clientData, phoneNumber, user?.id, toast, fetchAgentBalances]);

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
