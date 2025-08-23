
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

      // Fetch withdrawals
      const { data: withdrawals } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('agent_id', userId)
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      // Fetch deposits
      const { data: deposits } = await supabase
        .from('recharges')
        .select('*')
        .eq('provider_transaction_id', userId)
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      // Fetch transfers
      const { data: transfers } = await supabase
        .from('transfers')
        .select('*')
        .eq('sender_id', userId)
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      // Fetch balance recharges
      const { data: recharges } = await supabase
        .from('admin_deposits')
        .select('*')
        .eq('target_user_id', userId)
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      // Get all user IDs for profile lookup
      const userIds = new Set<string>();
      withdrawals?.forEach(w => w.user_id && userIds.add(w.user_id));
      deposits?.forEach(d => d.user_id && userIds.add(d.user_id));

      // Fetch profiles separately
      let profilesMap = new Map();
      if (userIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, phone')
          .in('id', Array.from(userIds));
        
        profiles?.forEach(p => profilesMap.set(p.id, p));
      }

      // Process withdrawals
      withdrawals?.forEach(withdrawal => {
        const profile = profilesMap.get(withdrawal.user_id);
        allTransactions.push({
          id: withdrawal.id,
          type: 'client_withdrawal',
          amount: withdrawal.amount,
          time: new Date(withdrawal.created_at).toLocaleTimeString('fr-FR'),
          client_phone: profile?.phone || '',
          client_name: profile?.full_name || '',
          status: withdrawal.status,
          commission: withdrawal.amount * 0.005,
          created_at: withdrawal.created_at
        });
      });

      // Process deposits
      deposits?.forEach(deposit => {
        const profile = profilesMap.get(deposit.user_id);
        allTransactions.push({
          id: deposit.id,
          type: 'client_deposit',
          amount: deposit.amount,
          time: new Date(deposit.created_at).toLocaleTimeString('fr-FR'),
          client_phone: profile?.phone || '',
          client_name: profile?.full_name || '',
          status: deposit.status,
          commission: deposit.amount * 0.01,
          created_at: deposit.created_at
        });
      });

      // Process transfers
      transfers?.forEach(transfer => {
        allTransactions.push({
          id: transfer.id,
          type: 'commission_transfer',
          amount: transfer.amount,
          time: new Date(transfer.created_at).toLocaleTimeString('fr-FR'),
          status: transfer.status,
          created_at: transfer.created_at
        });
      });

      // Process balance recharges
      recharges?.forEach(recharge => {
        allTransactions.push({
          id: recharge.id,
          type: 'balance_recharge',
          amount: recharge.converted_amount,
          time: new Date(recharge.created_at).toLocaleTimeString('fr-FR'),
          status: recharge.status,
          created_at: recharge.created_at
        });
      });

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
