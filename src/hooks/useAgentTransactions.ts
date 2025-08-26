
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AgentTransaction {
  id: string;
  type: 'client_deposit' | 'client_withdrawal' | 'commission_transfer' | 'balance_recharge';
  amount: number;
  time: string;
  client_phone?: string;
  client_name?: string;
  status: string;
  commission?: number;
  created_at: string;
}

export const useAgentTransactions = (userId: string | undefined, selectedDate: string) => {
  const [transactions, setTransactions] = useState<AgentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const startDate = new Date(selectedDate);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);

      const allTransactions: AgentTransaction[] = [];

      // Fetch withdrawals where the agent processed them (using user_id as agent reference)
      try {
        const { data: withdrawals, error: withdrawalsError } = await supabase
          .from('withdrawals')
          .select('*')
          .eq('user_id', userId) // This should be the correct column
          .gte('created_at', startDate.toISOString())
          .lt('created_at', endDate.toISOString())
          .order('created_at', { ascending: false });

        if (withdrawalsError) {
          console.error('Withdrawals query error:', withdrawalsError);
        } else if (withdrawals) {
          withdrawals.forEach((withdrawal: any) => {
            allTransactions.push({
              id: withdrawal.id,
              type: 'client_withdrawal',
              amount: withdrawal.amount,
              time: new Date(withdrawal.created_at).toLocaleTimeString('fr-FR'),
              client_phone: withdrawal.withdrawal_phone || '',
              client_name: '',
              status: withdrawal.status,
              commission: withdrawal.amount * 0.005,
              created_at: withdrawal.created_at
            });
          });
        }
      } catch (error) {
        console.error('Error fetching withdrawals:', error);
      }

      // Fetch deposits where agent processed them (using provider_transaction_id)
      try {
        const { data: deposits, error: depositsError } = await supabase
          .from('recharges')
          .select('*')
          .eq('provider_transaction_id', userId)
          .gte('created_at', startDate.toISOString())
          .lt('created_at', endDate.toISOString())
          .order('created_at', { ascending: false });

        if (depositsError) {
          console.error('Deposits query error:', depositsError);
        } else if (deposits) {
          deposits.forEach((deposit: any) => {
            allTransactions.push({
              id: deposit.id,
              type: 'client_deposit',
              amount: deposit.amount,
              time: new Date(deposit.created_at).toLocaleTimeString('fr-FR'),
              client_phone: deposit.payment_phone || '',
              client_name: '',
              status: deposit.status,
              commission: deposit.amount * 0.01,
              created_at: deposit.created_at
            });
          });
        }
      } catch (error) {
        console.error('Error fetching deposits:', error);
      }

      // Fetch transfers sent by the agent
      try {
        const { data: transfers, error: transfersError } = await supabase
          .from('transfers')
          .select('*')
          .eq('sender_id', userId)
          .gte('created_at', startDate.toISOString())
          .lt('created_at', endDate.toISOString())
          .order('created_at', { ascending: false });

        if (transfersError) {
          console.error('Transfers query error:', transfersError);
        } else if (transfers) {
          transfers.forEach((transfer: any) => {
            allTransactions.push({
              id: transfer.id,
              type: 'commission_transfer',
              amount: transfer.amount,
              time: new Date(transfer.created_at).toLocaleTimeString('fr-FR'),
              status: transfer.status,
              created_at: transfer.created_at
            });
          });
        }
      } catch (error) {
        console.error('Error fetching transfers:', error);
      }

      // Fetch balance recharges for the agent
      try {
        const { data: recharges, error: rechargesError } = await supabase
          .from('admin_deposits')
          .select('*')
          .eq('target_user_id', userId)
          .gte('created_at', startDate.toISOString())
          .lt('created_at', endDate.toISOString())
          .order('created_at', { ascending: false });

        if (rechargesError) {
          console.error('Recharges query error:', rechargesError);
        } else if (recharges) {
          recharges.forEach((recharge: any) => {
            allTransactions.push({
              id: recharge.id,
              type: 'balance_recharge',
              amount: recharge.converted_amount,
              time: new Date(recharge.created_at).toLocaleTimeString('fr-FR'),
              status: recharge.status,
              created_at: recharge.created_at
            });
          });
        }
      } catch (error) {
        console.error('Error fetching recharges:', error);
      }

      // Sort by date descending
      allTransactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setTransactions(allTransactions);

    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique agent:', error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, [userId, selectedDate]);

  return {
    transactions,
    isLoading,
    refetch: fetchTransactions
  };
};
