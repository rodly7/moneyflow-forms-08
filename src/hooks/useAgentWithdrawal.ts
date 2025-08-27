
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getUserBalance, findUserByPhone, processAgentWithdrawal } from "@/services/withdrawalService";
import { formatCurrency } from "@/integrations/supabase/client";

interface ClientData {
  id: string;
  full_name: string;
  phone: string;
  balance: number;
}

export const useAgentWithdrawal = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [isSearchingClient, setIsSearchingClient] = useState(false);
  const [agentBalance, setAgentBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchAgentBalance = async () => {
    if (user?.id) {
      setIsLoadingBalance(true);
      try {
        console.log("🔍 Récupération du solde agent...");
        const balanceData = await getUserBalance(user.id);
        setAgentBalance(balanceData.balance);
        console.log("✅ Solde agent:", balanceData.balance, "FCFA");
      } catch (error) {
        console.error("❌ Erreur lors du chargement du solde:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger votre solde",
          variant: "destructive"
        });
      }
      setIsLoadingBalance(false);
    }
  };

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

      const result = await processAgentWithdrawal(
        user?.id || '',
        clientData.id,
        operationAmount,
        phoneNumber
      );

      toast({
        title: "Retrait effectué",
        description: `Retrait de ${formatCurrency(operationAmount, 'XAF')} effectué`,
      });

      // Reset form
      setAmount("");
      setPhoneNumber("");
      setClientData(null);
      
      // Refresh balance
      fetchAgentBalance();
      
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
    console.log("useEffect - fetchAgentBalance");
    fetchAgentBalance();
  }, [user]);

  return {
    amount,
    setAmount,
    phoneNumber,
    setPhoneNumber,
    clientData,
    isSearchingClient,
    agentBalance,
    isLoadingBalance,
    isProcessing,
    fetchAgentBalance,
    searchClientByPhone,
    handleSubmit
  };
};
