import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils/currency";

export const useAgentWithdrawal = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [agentBalance, setAgentBalance] = useState(0);
  const [agentCommissionBalance, setAgentCommissionBalance] = useState(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  const fetchAgentBalances = async () => {
    if (!user?.id) return;

    setIsLoadingBalance(true);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('balance, commission_balance')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error("Erreur lors de la récupération du profil agent:", profileError);
        toast({
          title: "Erreur",
          description: "Impossible de charger le profil de l'agent",
          variant: "destructive"
        });
        return;
      }

      setAgentBalance(profileData?.balance || 0);
      setAgentCommissionBalance(profileData?.commission_balance || 0);

    } catch (error) {
      console.error("Erreur inattendue:", error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const { data: transactions, isLoading: isLoadingTransactions } = useQuery(
    ['agent-transactions', user?.id],
    async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    {
      enabled: !!user?.id,
    }
  );

  const withdrawalMutation = useMutation(
    async ({ amount, description }: { amount: number; description: string }) => {
      if (!user?.id) throw new Error("User not authenticated");

      // Optimistically update the agent's balance
      queryClient.setQueryData(['profile'], (old: any) => ({
        ...old,
        balance: old.balance - amount,
      }));

      const { data, error } = await supabase.from('withdrawals').insert([
        {
          user_id: user.id,
          amount: amount,
          status: 'pending',
          description: description,
        },
      ]);

      if (error) {
        // If the mutation fails, roll back the optimistic update
        queryClient.setQueryData(['profile'], (old: any) => old);
        throw error;
      }

      return data;
    },
    {
      onSuccess: () => {
        toast({
          title: "Demande de retrait soumise",
          description: "Votre demande de retrait a été soumise avec succès",
        });
        queryClient.invalidateQueries(['agent-transactions', user?.id]);
        queryClient.invalidateQueries(['profile']);
      },
      onError: (error: any) => {
        toast({
          title: "Erreur",
          description: error.message || "Une erreur s'est produite lors de la soumission de la demande de retrait",
          variant: "destructive"
        });
      },
    }
  );

  return {
    agentBalance,
    agentCommissionBalance,
    isLoadingBalance,
    fetchAgentBalances,
    transactions,
    isLoadingTransactions,
    withdrawalMutation,
  };
};
