
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
  payment_method?: string;
  payment_phone?: string;
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
      console.log("❌ Pas d'ID utilisateur fourni");
      setIsLoading(false);
      return;
    }
    
    try {
      console.log("🔄 Début récupération des transactions pour:", currentUserId);
      setIsLoading(true);
      
      const allTransactions: Transaction[] = [];

      // 1. Récupérer les transferts envoyés récents
      console.log("📤 Récupération des transferts envoyés...");
      const { data: sentTransfersData, error: sentTransfersError } = await supabase
        .from('transfers')
        .select('*')
        .eq('sender_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(10);

      console.log("📤 Transferts envoyés:", sentTransfersData?.length || 0, "erreur:", sentTransfersError);

      if (sentTransfersError) {
        console.error('❌ Erreur transferts envoyés:', sentTransfersError);
      }

      // 2. Récupérer le profil utilisateur pour les transferts reçus
      console.log("👤 Récupération du profil utilisateur...");
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', currentUserId)
        .single();

      console.log("👤 Profil utilisateur:", userProfile, "erreur:", profileError);

      let receivedTransfersData = [];
      if (userProfile?.phone) {
        console.log("📥 Récupération des transferts reçus pour:", userProfile.phone);
        const { data, error: receivedTransfersError } = await supabase
          .from('transfers')
          .select('*')
          .eq('recipient_phone', userProfile.phone)
          .order('created_at', { ascending: false })
          .limit(10);

        console.log("📥 Transferts reçus:", data?.length || 0, "erreur:", receivedTransfersError);

        if (receivedTransfersError) {
          console.error('❌ Erreur transferts reçus:', receivedTransfersError);
        } else {
          receivedTransfersData = data || [];
        }
      }

      // 3. Récupérer les retraits récents
      console.log("🏧 Récupération des retraits...");
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(10);

      console.log("🏧 Retraits:", withdrawalsData?.length || 0, "erreur:", withdrawalsError);

      if (withdrawalsError) {
        console.error('❌ Erreur retraits:', withdrawalsError);
      }

      // 4. Récupérer les recharges récentes
      console.log("💳 Récupération des recharges...");
      const { data: rechargesData, error: rechargesError } = await supabase
        .from('recharges')
        .select('*')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(10);

      console.log("💳 Recharges:", rechargesData?.length || 0, "erreur:", rechargesError);

      if (rechargesError) {
        console.error('❌ Erreur recharges:', rechargesError);
      }

      // 5. Récupérer les paiements de factures récents
      console.log("📄 Récupération des paiements de factures...");
      const { data: billPaymentsData, error: billPaymentsError } = await supabase
        .from('bill_payment_history')
        .select('*')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(10);

      console.log("📄 Paiements factures:", billPaymentsData?.length || 0, "erreur:", billPaymentsError);

      if (billPaymentsError) {
        console.error('❌ Erreur paiements factures:', billPaymentsError);
      }

      // Transformer les transferts envoyés
      const transformedSentTransfers: Transaction[] = (sentTransfersData || []).map(transfer => ({
        id: transfer.id,
        type: 'transfer_sent',
        amount: transfer.amount,
        date: new Date(transfer.created_at),
        description: `💸 Transfert envoyé de ${transfer.amount?.toLocaleString() || '0'} XAF vers ${transfer.recipient_full_name || transfer.recipient_phone}`,
        currency: 'XAF',
        status: transfer.status,
        userType: 'user' as const,
        recipient_full_name: transfer.recipient_full_name,
        recipient_phone: transfer.recipient_phone,
        fees: transfer.fees,
        created_at: transfer.created_at,
        impact: 'debit'
      }));

      // Transformer les transferts reçus
      const transformedReceivedTransfers: Transaction[] = receivedTransfersData.map(transfer => ({
        id: `received_${transfer.id}`,
        type: 'transfer_received',
        amount: transfer.amount,
        date: new Date(transfer.created_at),
        description: `💰 Transfert reçu de ${transfer.amount?.toLocaleString() || '0'} XAF d'un expéditeur`,
        currency: 'XAF',
        status: transfer.status,
        userType: 'user' as const,
        sender_name: 'Expéditeur',
        created_at: transfer.created_at,
        impact: 'credit'
      }));

      // Transformer les recharges (CRÉDIT)
      const transformedRecharges: Transaction[] = (rechargesData || []).map(recharge => ({
        id: `recharge_${recharge.id}`,
        type: 'recharge',
        amount: recharge.amount,
        date: new Date(recharge.created_at),
        description: `💳 Recharge de compte de ${recharge.amount?.toLocaleString() || '0'} XAF via ${recharge.payment_method || 'Mobile Money'}`,
        currency: 'XAF',
        status: recharge.status,
        userType: 'user' as const,
        created_at: recharge.created_at,
        impact: 'credit',
        payment_method: recharge.payment_method,
        payment_phone: recharge.payment_phone
      }));

      // Transformer les retraits (DÉBIT)
      const transformedWithdrawals: Transaction[] = (withdrawalsData || []).map(withdrawal => {
        const createdAt = new Date(withdrawal.created_at);
        const now = new Date();
        const timeDiffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
        const showCode = timeDiffMinutes <= 5 && withdrawal.verification_code && withdrawal.status === 'pending';
        
        return {
          id: `withdrawal_${withdrawal.id}`,
          type: 'withdrawal',
          amount: withdrawal.amount,
          date: new Date(withdrawal.created_at),
          description: `🏧 Retrait d'argent de ${withdrawal.amount?.toLocaleString() || '0'} XAF vers le numéro ${withdrawal.withdrawal_phone || 'N/A'}`,
          currency: 'XAF',
          status: withdrawal.status,
          userType: 'user' as const,
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
        date: new Date(payment.created_at || payment.payment_date),
        description: `📄 Paiement de facture de ${payment.amount?.toLocaleString() || '0'} XAF effectué avec succès`,
        currency: 'XAF',
        status: payment.status,
        userType: 'user' as const,
        created_at: payment.created_at || payment.payment_date,
        impact: 'debit'
      }));

      // Transformer les retraits avec gestion du code de vérification pour la liste séparée
      const transformedWithdrawalsList: Withdrawal[] = (withdrawalsData || []).map(withdrawal => {
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
          userType: 'user' as const,
          showCode
        };
      });

      // Combiner toutes les transactions et trier par date
      const allCombined = [
        ...transformedSentTransfers, 
        ...transformedReceivedTransfers,
        ...transformedRecharges,
        ...transformedWithdrawals,
        ...transformedBillPayments
      ].sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());

      console.log("📊 Résumé final des transactions:", {
        total: allCombined.length,
        transferts_envoyés: transformedSentTransfers.length,
        transferts_reçus: transformedReceivedTransfers.length,
        recharges: transformedRecharges.length,
        retraits: transformedWithdrawals.length,
        paiements: transformedBillPayments.length,
        retraits_séparés: transformedWithdrawalsList.length
      });

      setTransactions(allCombined);
      setWithdrawals(transformedWithdrawalsList);
      
      console.log("✅ Transactions mises à jour dans l'état");
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement des transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log("🔄 useEffect déclenché avec userId:", userId);
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
          console.log('🔄 Changement détecté dans transfers, rechargement...');
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
          console.log('🔄 Changement détecté dans withdrawals, rechargement...');
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
          console.log('🔄 Changement détecté dans recharges, rechargement...');
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
          console.log('🔄 Changement détecté dans bill_payment_history, rechargement...');
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
