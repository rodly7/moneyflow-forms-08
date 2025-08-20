import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  date: Date;
  description: string;
  currency: string;
  status: string;
  userType?: 'agent' | 'user';
}

interface Withdrawal {
  id: string;
  amount: number;
  created_at: string;
  withdrawal_phone: string;
  status: string;
  verification_code?: string;
  userType?: 'agent' | 'user';
}

export const useRealtimeTransactions = (userId?: string) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = async (currentUserId?: string) => {
    if (!currentUserId) return;
    
    try {
      // Récupérer les transferts envoyés récents
      const { data: sentTransfersData } = await supabase
        .from('transfers')
        .select(`
          id, 
          amount, 
          created_at, 
          recipient_full_name, 
          status,
          sender_id,
          profiles!transfers_sender_id_fkey(role)
        `)
        .eq('sender_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Récupérer les transferts reçus récents  
      const { data: receivedTransfersData } = await supabase
        .from('transfers')
        .select(`
          id, 
          amount, 
          created_at, 
          recipient_full_name, 
          status,
          recipient_id,
          sender_id
        `)
        .eq('recipient_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Récupérer les retraits récents
      const { data: withdrawalsData } = await supabase
        .from('withdrawals')
        .select(`
          id, 
          amount, 
          created_at, 
          withdrawal_phone, 
          status, 
          verification_code,
          user_id,
          profiles!withdrawals_user_id_fkey(role)
        `)
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Transformer les transferts envoyés
      const transformedSentTransfers: Transaction[] = (sentTransfersData || []).map(transfer => ({
        id: transfer.id,
        type: 'transfer_sent',
        amount: -transfer.amount,
        date: new Date(transfer.created_at),
        description: `Transfert vers ${transfer.recipient_full_name}`,
        currency: 'XAF',
        status: transfer.status,
        userType: (transfer.profiles as any)?.role === 'agent' ? 'agent' : 'user'
      }));

      // Transformer les transferts reçus - récupérer le nom de l'expéditeur
      const transformedReceivedTransfers: Transaction[] = await Promise.all(
        (receivedTransfersData || []).map(async (transfer) => {
          // Récupérer le nom de l'expéditeur
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', transfer.sender_id)
            .single();

          return {
            id: transfer.id,
            type: 'transfer_received',
            amount: transfer.amount,
            date: new Date(transfer.created_at),
            description: `Reçu de ${senderProfile?.full_name || 'un expéditeur'}`,
            currency: 'XAF',
            status: transfer.status,
            userType: 'user' as const
          };
        })
      );

      // Transformer les retraits
      const transformedWithdrawals: Withdrawal[] = (withdrawalsData || []).map(withdrawal => ({
        id: withdrawal.id,
        amount: withdrawal.amount,
        created_at: withdrawal.created_at,
        withdrawal_phone: withdrawal.withdrawal_phone,
        status: withdrawal.status,
        verification_code: withdrawal.verification_code,
        userType: (withdrawal.profiles as any)?.role === 'agent' ? 'agent' : 'user'
      }));

      setTransactions([...transformedSentTransfers, ...transformedReceivedTransfers]);
      setWithdrawals(transformedWithdrawals);
    } catch (error) {
      console.error('Erreur lors du chargement des transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchTransactions(userId);
    }

    // Écouter les changements en temps réel pour les transferts
    const transfersChannel = supabase
      .channel('realtime-transfers')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transfers'
        },
        () => {
          if (userId) {
            fetchTransactions(userId);
          }
        }
      )
      .subscribe();

    // Écouter les changements en temps réel pour les retraits
    const withdrawalsChannel = supabase
      .channel('realtime-withdrawals')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'withdrawals'
        },
        () => {
          if (userId) {
            fetchTransactions(userId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(transfersChannel);
      supabase.removeChannel(withdrawalsChannel);
    };
  }, [userId]);

  const deleteTransaction = async (id: string, type: string) => {
    try {
      if (type === 'withdrawal') {
        await supabase
          .from('withdrawals')
          .update({ is_deleted: true })
          .eq('id', id);
      } else {
        await supabase
          .from('transfers')
          .update({ is_deleted: true })
          .eq('id', id);
      }
      
      // Rafraîchir les données
      if (userId) {
        fetchTransactions(userId);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  return {
    transactions,
    withdrawals,
    isLoading,
    refetch: () => userId ? fetchTransactions(userId) : Promise.resolve(),
    deleteTransaction
  };
};