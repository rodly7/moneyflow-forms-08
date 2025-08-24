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
  recipient_full_name?: string;
  recipient_phone?: string;
  withdrawal_phone?: string;
  fees?: number;
  verification_code?: string;
  created_at?: string;
  showCode?: boolean;
  sender_name?: string;
  impact?: 'credit' | 'debit';
}

interface Withdrawal {
  id: string;
  amount: number;
  created_at: string;
  withdrawal_phone: string;
  status: string;
  verification_code?: string;
  userType?: 'agent' | 'user';
  showCode?: boolean;
}

export const useRealtimeTransactions = (userId?: string) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = async (currentUserId?: string) => {
    if (!currentUserId) return;
    
    try {
      console.log("🔄 Récupération des transactions temps réel pour:", currentUserId);
      
      const allTransactions: Transaction[] = [];

      // 1. Récupérer les transferts envoyés récents
      const { data: sentTransfersData } = await supabase
        .from('transfers')
        .select(`
          id, 
          amount, 
          created_at, 
          recipient_full_name, 
          recipient_phone,
          status,
          sender_id,
          fees,
          profiles!transfers_sender_id_fkey(role)
        `)
        .eq('sender_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(10);

      // 2. Récupérer les transferts reçus récents  
      const { data: receivedTransfersData } = await supabase
        .from('transfers')
        .select(`
          id, 
          amount, 
          created_at, 
          recipient_full_name, 
          status,
          recipient_id,
          sender_id,
          profiles!transfers_sender_id_fkey(full_name)
        `)
        .eq('recipient_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(10);

      // 3. Récupérer les retraits récents
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

      // 4. Récupérer les dépôts/recharges récents
      const { data: depositsData } = await supabase
        .from('recharges')
        .select(`
          id, 
          amount, 
          created_at, 
          status,
          user_id,
          payment_phone,
          payment_method
        `)
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(10);

      // 5. Récupérer les paiements de factures récents
      const { data: billPaymentsData } = await supabase
        .from('bill_payment_history')
        .select(`
          id, 
          amount, 
          created_at, 
          status,
          user_id
        `)
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Transformer les transferts envoyés
      const transformedSentTransfers: Transaction[] = (sentTransfersData || []).map(transfer => ({
        id: transfer.id,
        type: 'transfer_sent',
        amount: transfer.amount,
        date: new Date(transfer.created_at),
        description: `Transfert envoyé à ${transfer.recipient_full_name || transfer.recipient_phone}`,
        currency: 'XAF',
        status: transfer.status,
        userType: (transfer.profiles as any)?.role === 'agent' ? 'agent' : 'user',
        recipient_full_name: transfer.recipient_full_name,
        recipient_phone: transfer.recipient_phone,
        fees: transfer.fees,
        created_at: transfer.created_at,
        impact: 'debit'
      }));

      // Transformer les transferts reçus
      const transformedReceivedTransfers: Transaction[] = (receivedTransfersData || []).map(transfer => {
        const senderName = (transfer.profiles as any)?.full_name || 'Expéditeur inconnu';
        return {
          id: `received_${transfer.id}`,
          type: 'transfer_received',
          amount: transfer.amount,
          date: new Date(transfer.created_at),
          description: `Transfert reçu de ${senderName}`,
          currency: 'XAF',
          status: transfer.status,
          userType: 'user' as const,
          sender_name: senderName,
          created_at: transfer.created_at,
          impact: 'credit'
        };
      });

      // Transformer les dépôts/recharges (CRÉDIT)
      const transformedDeposits: Transaction[] = (depositsData || []).map(deposit => ({
        id: `recharge_${deposit.id}`,
        type: 'recharge',
        amount: deposit.amount,
        date: new Date(deposit.created_at),
        description: `Recharge de ${deposit.amount?.toLocaleString() || '0'} XAF via ${deposit.payment_method || 'Mobile Money'}`,
        currency: 'XAF',
        status: deposit.status,
        userType: 'user' as const,
        created_at: deposit.created_at,
        impact: 'credit'
      }));

      // Transformer les retraits (DÉBIT)
      const transformedWithdrawalTransactions: Transaction[] = (withdrawalsData || []).map(withdrawal => {
        const createdAt = new Date(withdrawal.created_at);
        const now = new Date();
        const timeDiffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
        const showCode = timeDiffMinutes <= 5 && withdrawal.verification_code && withdrawal.status === 'pending';
        
        return {
          id: `withdrawal_${withdrawal.id}`,
          type: 'withdrawal',
          amount: withdrawal.amount,
          date: new Date(withdrawal.created_at),
          description: `Retrait de ${withdrawal.amount?.toLocaleString() || '0'} XAF vers ${withdrawal.withdrawal_phone || 'N/A'}`,
          currency: 'XAF',
          status: withdrawal.status,
          userType: (withdrawal.profiles as any)?.role === 'agent' ? 'agent' : 'user',
          withdrawal_phone: withdrawal.withdrawal_phone,
          verification_code: withdrawal.verification_code,
          created_at: withdrawal.created_at,
          showCode,
          impact: 'debit'
        };
      });

      // Transformer les paiements de factures (DÉBIT)
      const transformedBillPayments: Transaction[] = (billPaymentsData || []).map(payment => ({
        id: `bill_${payment.id}`,
        type: 'bill_payment',
        amount: payment.amount,
        date: new Date(payment.created_at),
        description: `Paiement de facture de ${payment.amount?.toLocaleString() || '0'} XAF`,
        currency: 'XAF',
        status: payment.status,
        userType: 'user' as const,
        created_at: payment.created_at,
        impact: 'debit'
      }));

      // Transformer les retraits avec gestion du code de vérification pour la liste séparée
      const transformedWithdrawals: Withdrawal[] = (withdrawalsData || []).map(withdrawal => {
        const createdAt = new Date(withdrawal.created_at);
        const now = new Date();
        const timeDiffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
        const showCode = timeDiffMinutes <= 5 && withdrawal.verification_code && withdrawal.status === 'pending';
        
        return {
          id: withdrawal.id,
          amount: withdrawal.amount,
          created_at: withdrawal.created_at,
          withdrawal_phone: withdrawal.withdrawal_phone,
          status: withdrawal.status,
          verification_code: withdrawal.verification_code,
          userType: (withdrawal.profiles as any)?.role === 'agent' ? 'agent' : 'user',
          showCode
        };
      });

      // Combiner toutes les transactions et trier par date
      const allCombined = [
        ...transformedSentTransfers, 
        ...transformedReceivedTransfers,
        ...transformedDeposits,
        ...transformedWithdrawalTransactions,
        ...transformedBillPayments
      ].sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());

      setTransactions(allCombined);
      setWithdrawals(transformedWithdrawals);
      
      console.log("✅ Transactions temps réel chargées:", {
        total: allCombined.length,
        transferts_envoyés: transformedSentTransfers.length,
        transferts_reçus: transformedReceivedTransfers.length,
        recharges: transformedDeposits.length,
        retraits: transformedWithdrawalTransactions.length,
        paiements: transformedBillPayments.length,
        retraits_séparés: transformedWithdrawals.length
      });
      
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

    // Écouter les changements en temps réel pour les recharges
    const rechargesChannel = supabase
      .channel('realtime-recharges')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'recharges'
        },
        () => {
          if (userId) {
            fetchTransactions(userId);
          }
        }
      )
      .subscribe();

    // Écouter les changements en temps réel pour les paiements de factures
    const billPaymentsChannel = supabase
      .channel('realtime-bill-payments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bill_payment_history'
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
      supabase.removeChannel(rechargesChannel);
      supabase.removeChannel(billPaymentsChannel);
    };
  }, [userId]);

  const deleteTransaction = async (id: string, type: string) => {
    try {
      if (type === 'withdrawal') {
        await supabase
          .from('withdrawals')
          .update({ is_deleted: true })
          .eq('id', id);
      } else if (type.includes('bill_')) {
        console.log('Les paiements de factures ne peuvent pas être supprimés');
        return;
      } else {
        const actualId = id.startsWith('received_') ? id.replace('received_', '') : id;
        await supabase
          .from('transfers')
          .update({ is_deleted: true })
          .eq('id', actualId);
      }
      
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
