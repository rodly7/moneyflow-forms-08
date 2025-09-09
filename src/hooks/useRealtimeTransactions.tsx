
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
      console.log("❌ Pas d'ID utilisateur fourni - useRealtimeTransactions");
      setTransactions([]);
      setWithdrawals([]);
      setIsLoading(false);
      return;
    }
    
    try {
      console.log("🔄 Début récupération complète des transactions pour:", currentUserId);
      setIsLoading(true);
      
      const allTransactions: Transaction[] = [];

      // 1. Récupérer les recharges en premier (CRÉDIT)
      console.log("💳 Récupération des recharges...");
      const { data: rechargesData, error: rechargesError } = await supabase
        .from('recharges')
        .select('*')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false });

      if (rechargesError) {
        console.error('❌ Erreur recharges:', rechargesError);
      } else if (rechargesData) {
        console.log("✅ Recharges trouvées:", rechargesData.length);
        const transformedRecharges: Transaction[] = rechargesData.map(recharge => ({
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
        allTransactions.push(...transformedRecharges);
      }

      // 2. Récupérer les retraits (DÉBIT)
      console.log("🏧 Récupération des retraits...");
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false });

      if (withdrawalsError) {
        console.error('❌ Erreur retraits:', withdrawalsError);
      } else if (withdrawalsData) {
        console.log("✅ Retraits trouvés:", withdrawalsData.length);
        const transformedWithdrawals: Transaction[] = withdrawalsData.map(withdrawal => {
          const createdAt = new Date(withdrawal.created_at);
          const now = new Date();
          const timeDiffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
          const showCode = timeDiffMinutes <= 5 && withdrawal.verification_code && withdrawal.status === 'pending';
          
          return {
            id: `withdrawal_${withdrawal.id}`,
            type: 'withdrawal',
            amount: withdrawal.amount,
            date: new Date(withdrawal.created_at),
            description: `🏧 Retrait d'argent de ${withdrawal.amount?.toLocaleString() || '0'} XAF vers ${withdrawal.withdrawal_phone || 'N/A'}`,
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
        allTransactions.push(...transformedWithdrawals);

        // Liste séparée pour les retraits avec codes
        const transformedWithdrawalsList: Withdrawal[] = withdrawalsData.map(withdrawal => {
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
        setWithdrawals(transformedWithdrawalsList);
      }

      // 3. Récupérer les transferts envoyés
      console.log("📤 Récupération des transferts envoyés...");
      const { data: sentTransfersData, error: sentTransfersError } = await supabase
        .from('transfers')
        .select('*')
        .eq('sender_id', currentUserId)
        .order('created_at', { ascending: false });

      if (sentTransfersError) {
        console.error('❌ Erreur transferts envoyés:', sentTransfersError);
      } else if (sentTransfersData) {
        console.log("✅ Transferts envoyés trouvés:", sentTransfersData.length);
        const transformedSentTransfers: Transaction[] = sentTransfersData.map(transfer => ({
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
        allTransactions.push(...transformedSentTransfers);
      }

      // 4. Récupérer les transferts reçus
      console.log("📥 Récupération des transferts reçus...");
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', currentUserId)
        .single();

      if (userProfile?.phone) {
        const { data: receivedTransfersData, error: receivedTransfersError } = await supabase
          .from('transfers')
          .select('*')
          .eq('recipient_phone', userProfile.phone)
          .order('created_at', { ascending: false });

        if (receivedTransfersError) {
          console.error('❌ Erreur transferts reçus:', receivedTransfersError);
        } else if (receivedTransfersData) {
          console.log("✅ Transferts reçus trouvés:", receivedTransfersData.length);
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
          allTransactions.push(...transformedReceivedTransfers);
        }
      }

      // 5. Récupérer les paiements de factures (DÉBIT)
      console.log("📄 Récupération des paiements de factures...");
      const { data: billPaymentsData, error: billPaymentsError } = await supabase
        .from('bill_payment_history')
        .select('*')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false });

      if (billPaymentsError) {
        console.error('❌ Erreur paiements factures:', billPaymentsError);
      } else if (billPaymentsData) {
        console.log("✅ Paiements de factures trouvés:", billPaymentsData.length);
        const transformedBillPayments: Transaction[] = billPaymentsData.map(payment => ({
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
        allTransactions.push(...transformedBillPayments);
      }

      // 6. Récupérer les paiements par scanner/QR (DÉBIT)
      console.log("📱 Récupération des paiements par scanner...");
      const { data: merchantPaymentsData, error: merchantPaymentsError } = await supabase
        .from('merchant_payments')
        .select('*')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false });

      if (merchantPaymentsError) {
        console.error('❌ Erreur paiements scanner:', merchantPaymentsError);
      } else if (merchantPaymentsData) {
        console.log("✅ Paiements par scanner trouvés:", merchantPaymentsData.length);
        const transformedMerchantPayments: Transaction[] = merchantPaymentsData.map(payment => ({
          id: `merchant_${payment.id}`,
          type: 'merchant_payment',
          amount: payment.amount,
          date: new Date(payment.created_at),
          description: `📱 Paiement par scanner de ${payment.amount?.toLocaleString() || '0'} XAF à ${payment.business_name}`,
          currency: payment.currency || 'XAF',
          status: payment.status || 'completed',
          userType: 'user' as const,
          created_at: payment.created_at,
          impact: 'debit'
        }));
        allTransactions.push(...transformedMerchantPayments);
      }

      // Trier toutes les transactions par date décroissante
      const sortedTransactions = allTransactions.sort((a, b) => 
        new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
      );

      console.log("📊 Résumé final des transactions:", {
        total: sortedTransactions.length,
        recharges: sortedTransactions.filter(t => t.type === 'recharge').length,
        retraits: sortedTransactions.filter(t => t.type === 'withdrawal').length,
        transferts_envoyés: sortedTransactions.filter(t => t.type === 'transfer_sent').length,
        transferts_reçus: sortedTransactions.filter(t => t.type === 'transfer_received').length,
        paiements_factures: sortedTransactions.filter(t => t.type === 'bill_payment').length,
        paiements_scanner: sortedTransactions.filter(t => t.type === 'merchant_payment').length
      });

      setTransactions(sortedTransactions);
      console.log("✅ Transactions mises à jour dans l'état avec", sortedTransactions.length, "éléments");
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement des transactions:', error);
      setTransactions([]);
      setWithdrawals([]);
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
      setTransactions([]);
      setWithdrawals([]);
    }

    // Écouter les changements en temps réel
    const channels = [];

    // Transferts
    const transfersChannel = supabase
      .channel('realtime-transfers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transfers' }, () => {
        console.log('🔄 Changement détecté dans transfers, rechargement...');
        if (userId) fetchTransactions(userId);
      })
      .subscribe();
    channels.push(transfersChannel);

    // Retraits
    const withdrawalsChannel = supabase
      .channel('realtime-withdrawals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals' }, () => {
        console.log('🔄 Changement détecté dans withdrawals, rechargement...');
        if (userId) fetchTransactions(userId);
      })
      .subscribe();
    channels.push(withdrawalsChannel);

    // Recharges
    const rechargesChannel = supabase
      .channel('realtime-recharges')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recharges' }, () => {
        console.log('🔄 Changement détecté dans recharges, rechargement...');
        if (userId) fetchTransactions(userId);
      })
      .subscribe();
    channels.push(rechargesChannel);

    // Paiements de factures
    const billPaymentsChannel = supabase
      .channel('realtime-bill-payments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bill_payment_history' }, () => {
        console.log('🔄 Changement détecté dans bill_payment_history, rechargement...');
        if (userId) fetchTransactions(userId);
      })
      .subscribe();
    channels.push(billPaymentsChannel);

    // Paiements par scanner
    const merchantPaymentsChannel = supabase
      .channel('realtime-merchant-payments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'merchant_payments' }, () => {
        console.log('🔄 Changement détecté dans merchant_payments, rechargement...');
        if (userId) fetchTransactions(userId);
      })
      .subscribe();
    channels.push(merchantPaymentsChannel);

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
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
