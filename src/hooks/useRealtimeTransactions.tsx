
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
    if (!currentUserId) {
      console.log("❌ Pas d'utilisateur connecté");
      setIsLoading(false);
      return;
    }
    
    try {
      console.log("🔄 Récupération des transactions pour:", currentUserId);
      
      const allTransactions: Transaction[] = [];

      // 1. Récupérer les transferts envoyés récents
      console.log("📤 Récupération des transferts envoyés...");
      const { data: sentTransfersData, error: sentError } = await supabase
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

      if (sentError) {
        console.error("❌ Erreur transferts envoyés:", sentError);
      } else {
        console.log("✅ Transferts envoyés récupérés:", sentTransfersData?.length || 0);
      }

      // 2. Récupérer les transferts reçus récents  
      console.log("📥 Récupération des transferts reçus...");
      const { data: receivedTransfersData, error: receivedError } = await supabase
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

      if (receivedError) {
        console.error("❌ Erreur transferts reçus:", receivedError);
      } else {
        console.log("✅ Transferts reçus récupérés:", receivedTransfersData?.length || 0);
      }

      // 3. Récupérer les demandes de retrait utilisateur récentes
      console.log("💸 Récupération des demandes de retraits...");
      const { data: userRequestsData, error: userRequestsError } = await supabase
        .from('user_requests')
        .select(`
          id, 
          amount, 
          created_at, 
          status,
          operation_type,
          payment_phone,
          payment_method,
          user_id
        `)
        .eq('user_id', currentUserId)
        .eq('operation_type', 'withdrawal')
        .order('created_at', { ascending: false })
        .limit(10);

      if (userRequestsError) {
        console.error("❌ Erreur demandes retrait:", userRequestsError);
      } else {
        console.log("✅ Demandes retrait récupérées:", userRequestsData?.length || 0);
      }

      // 4. Récupérer les demandes de recharge utilisateur récentes
      console.log("💰 Récupération des demandes de recharges...");
      const { data: rechargeRequestsData, error: rechargeRequestsError } = await supabase
        .from('user_requests')
        .select(`
          id, 
          amount, 
          created_at, 
          status,
          operation_type,
          payment_phone,
          payment_method,
          user_id
        `)
        .eq('user_id', currentUserId)
        .eq('operation_type', 'recharge')
        .order('created_at', { ascending: false })
        .limit(10);

      if (rechargeRequestsError) {
        console.error("❌ Erreur demandes recharge:", rechargeRequestsError);
      } else {
        console.log("✅ Demandes recharge récupérées:", rechargeRequestsData?.length || 0);
      }

      // 5. Récupérer les retraits directs (table withdrawals)
      console.log("💸 Récupération des retraits directs...");
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
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

      if (withdrawalsError) {
        console.error("❌ Erreur retraits directs:", withdrawalsError);
      } else {
        console.log("✅ Retraits directs récupérés:", withdrawalsData?.length || 0);
      }

      // 6. Récupérer les recharges directes (table recharges)
      console.log("💰 Récupération des recharges directes...");
      const { data: depositsData, error: depositsError } = await supabase
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

      if (depositsError) {
        console.error("❌ Erreur recharges directes:", depositsError);
      } else {
        console.log("✅ Recharges directes récupérées:", depositsData?.length || 0);
      }

      // 7. Récupérer les paiements de factures récents
      console.log("🧾 Récupération des paiements de factures...");
      const { data: billPaymentsData, error: billError } = await supabase
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

      if (billError) {
        console.error("❌ Erreur paiements factures:", billError);
      } else {
        console.log("✅ Paiements factures récupérés:", billPaymentsData?.length || 0);
      }

      // Transformer les transferts envoyés
      const transformedSentTransfers: Transaction[] = (sentTransfersData || []).map(transfer => ({
        id: transfer.id,
        type: 'transfer_sent',
        amount: transfer.amount,
        date: new Date(transfer.created_at),
        description: `Transfert vers ${transfer.recipient_full_name || transfer.recipient_phone}`,
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
          description: `Reçu de ${senderName}`,
          currency: 'XAF',
          status: transfer.status,
          userType: 'user' as const,
          sender_name: senderName,
          created_at: transfer.created_at,
          impact: 'credit'
        };
      });

      // Transformer les demandes de recharge (CRÉDIT)
      const transformedRechargeRequests: Transaction[] = (rechargeRequestsData || []).map(request => ({
        id: `recharge_request_${request.id}`,
        type: 'deposit',
        amount: request.amount,
        date: new Date(request.created_at),
        description: `Demande de recharge (${request.payment_method || 'Mobile Money'})`,
        currency: 'XAF',
        status: request.status,
        userType: 'user' as const,
        created_at: request.created_at,
        impact: 'credit'
      }));

      // Transformer les demandes de retrait (DÉBIT)
      const transformedWithdrawalRequests: Transaction[] = (userRequestsData || []).map(request => ({
        id: `withdrawal_request_${request.id}`,
        type: 'withdrawal',
        amount: request.amount,
        date: new Date(request.created_at),
        description: `Demande de retrait vers ${request.payment_phone || 'N/A'}`,
        currency: 'XAF',
        status: request.status,
        userType: 'user' as const,
        withdrawal_phone: request.payment_phone,
        created_at: request.created_at,
        impact: 'debit'
      }));

      // Transformer les recharges directes (CRÉDIT)
      const transformedDeposits: Transaction[] = (depositsData || []).map(deposit => ({
        id: `deposit_${deposit.id}`,
        type: 'deposit',
        amount: deposit.amount,
        date: new Date(deposit.created_at),
        description: `Recharge par ${deposit.payment_method || 'Mobile Money'}`,
        currency: 'XAF',
        status: deposit.status,
        userType: 'user' as const,
        created_at: deposit.created_at,
        impact: 'credit'
      }));

      // Transformer les retraits directs (DÉBIT)
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
          description: `Retrait vers ${withdrawal.withdrawal_phone || 'N/A'}`,
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
        description: 'Paiement de facture',
        currency: 'XAF',
        status: payment.status,
        userType: 'user' as const,
        created_at: payment.created_at,
        impact: 'debit'
      }));

      // Transformer les retraits pour la liste séparée
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
        ...transformedRechargeRequests,
        ...transformedWithdrawalRequests,
        ...transformedDeposits,
        ...transformedWithdrawalTransactions,
        ...transformedBillPayments
      ].sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());

      console.log("📊 Transactions combinées:", {
        total: allCombined.length,
        transferts_envoyés: transformedSentTransfers.length,
        transferts_reçus: transformedReceivedTransfers.length,
        demandes_recharge: transformedRechargeRequests.length,
        demandes_retrait: transformedWithdrawalRequests.length,
        recharges_directes: transformedDeposits.length,
        retraits_directs: transformedWithdrawalTransactions.length,
        paiements: transformedBillPayments.length,
        retraits_séparés: transformedWithdrawals.length
      });

      setTransactions(allCombined);
      setWithdrawals(transformedWithdrawals);
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement des transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log("🔄 useEffect déclenché, userId:", userId);
    if (userId) {
      fetchTransactions(userId);
    } else {
      setIsLoading(false);
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
          console.log("🔄 Changement détecté dans transfers");
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
          console.log("🔄 Changement détecté dans withdrawals");
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
          console.log("🔄 Changement détecté dans recharges");
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
          console.log("🔄 Changement détecté dans bill_payment_history");
          if (userId) {
            fetchTransactions(userId);
          }
        }
      )
      .subscribe();

    return () => {
      console.log("🧹 Nettoyage des canaux en temps réel");
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
