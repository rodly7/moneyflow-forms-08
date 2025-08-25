
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UnifiedTransaction {
  id: string;
  type: 'recharge' | 'withdrawal' | 'transfer_sent' | 'transfer_received' | 'bill_payment' | 'transfer_pending';
  amount: number;
  date: Date;
  description: string;
  currency: string;
  status: string;
  created_at: string;
  impact: 'credit' | 'debit';
  userType: 'user' | 'agent';
  verification_code?: string;
  withdrawal_phone?: string;
  recipient_full_name?: string;
  recipient_phone?: string;
  fees?: number;
  sender_name?: string;
  payment_method?: string;
  payment_phone?: string;
  reference_id?: string;
}

export const useUnifiedTransactions = (userId?: string) => {
  const [transactions, setTransactions] = useState<UnifiedTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllTransactions = async () => {
    if (!userId) {
      console.log("❌ UNIFIED - Pas d'ID utilisateur fourni");
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    try {
      console.log("🔄 UNIFIED - Début récupération pour:", userId);
      setIsLoading(true);
      
      const allTransactions: UnifiedTransaction[] = [];

      // 1. Recharges
      console.log("💳 UNIFIED - Récupération recharges...");
      const { data: recharges, error: rechargesError } = await supabase
        .from('recharges')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!rechargesError && recharges) {
        console.log("✅ UNIFIED - Recharges trouvées:", recharges.length);
        recharges.forEach(recharge => {
          allTransactions.push({
            id: `recharge_${recharge.id}`,
            type: 'recharge',
            amount: recharge.amount,
            date: new Date(recharge.created_at),
            description: `💳 Recharge de ${recharge.amount?.toLocaleString()} XAF via ${recharge.payment_method || 'Mobile Money'}`,
            currency: 'XAF',
            status: recharge.status,
            created_at: recharge.created_at,
            impact: 'credit',
            userType: 'user',
            payment_method: recharge.payment_method,
            payment_phone: recharge.payment_phone,
            reference_id: recharge.id
          });
        });
      }

      // 2. Retraits
      console.log("🏧 UNIFIED - Récupération retraits...");
      const { data: withdrawals, error: withdrawalsError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!withdrawalsError && withdrawals) {
        console.log("✅ UNIFIED - Retraits trouvés:", withdrawals.length);
        withdrawals.forEach(withdrawal => {
          allTransactions.push({
            id: `withdrawal_${withdrawal.id}`,
            type: 'withdrawal',
            amount: withdrawal.amount,
            date: new Date(withdrawal.created_at),
            description: `🏧 Retrait de ${withdrawal.amount?.toLocaleString()} XAF vers ${withdrawal.withdrawal_phone}`,
            currency: 'XAF',
            status: withdrawal.status,
            created_at: withdrawal.created_at,
            impact: 'debit',
            userType: 'user',
            withdrawal_phone: withdrawal.withdrawal_phone,
            verification_code: withdrawal.verification_code,
            reference_id: withdrawal.id
          });
        });
      }

      // 3. Transferts envoyés
      console.log("📤 UNIFIED - Récupération transferts envoyés...");
      const { data: sentTransfers, error: sentError } = await supabase
        .from('transfers')
        .select('*')
        .eq('sender_id', userId)
        .order('created_at', { ascending: false });

      if (!sentError && sentTransfers) {
        console.log("✅ UNIFIED - Transferts envoyés trouvés:", sentTransfers.length);
        sentTransfers.forEach(transfer => {
          allTransactions.push({
            id: `sent_${transfer.id}`,
            type: 'transfer_sent',
            amount: transfer.amount,
            date: new Date(transfer.created_at),
            description: `💸 Transfert envoyé de ${transfer.amount?.toLocaleString()} XAF vers ${transfer.recipient_full_name || transfer.recipient_phone}`,
            currency: 'XAF',
            status: transfer.status,
            created_at: transfer.created_at,
            impact: 'debit',
            userType: 'user',
            recipient_full_name: transfer.recipient_full_name,
            recipient_phone: transfer.recipient_phone,
            fees: transfer.fees,
            reference_id: transfer.id
          });
        });
      }

      // 4. Transferts reçus
      console.log("📥 UNIFIED - Récupération transferts reçus...");
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', userId)
        .single();

      if (userProfile?.phone) {
        const { data: receivedTransfers, error: receivedError } = await supabase
          .from('transfers')
          .select('*')
          .eq('recipient_phone', userProfile.phone)
          .order('created_at', { ascending: false });

        if (!receivedError && receivedTransfers) {
          console.log("✅ UNIFIED - Transferts reçus trouvés:", receivedTransfers.length);
          receivedTransfers.forEach(transfer => {
            allTransactions.push({
              id: `received_${transfer.id}`,
              type: 'transfer_received',
              amount: transfer.amount,
              date: new Date(transfer.created_at),
              description: `💰 Transfert reçu de ${transfer.amount?.toLocaleString()} XAF d'un expéditeur`,
              currency: 'XAF',
              status: transfer.status,
              created_at: transfer.created_at,
              impact: 'credit',
              userType: 'user',
              sender_name: 'Expéditeur',
              reference_id: transfer.id
            });
          });
        }
      }

      // 5. Paiements de factures
      console.log("📄 UNIFIED - Récupération paiements factures...");
      const { data: bills, error: billsError } = await supabase
        .from('bill_payment_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!billsError && bills) {
        console.log("✅ UNIFIED - Paiements factures trouvés:", bills.length);
        bills.forEach(bill => {
          allTransactions.push({
            id: `bill_${bill.id}`,
            type: 'bill_payment',
            amount: bill.amount,
            date: new Date(bill.created_at || bill.payment_date),
            description: `📄 Paiement facture de ${bill.amount?.toLocaleString()} XAF`,
            currency: 'XAF',
            status: bill.status,
            created_at: bill.created_at || bill.payment_date,
            impact: 'debit',
            userType: 'user',
            reference_id: bill.id
          });
        });
      }

      // Trier toutes les transactions par date décroissante
      const sortedTransactions = allTransactions.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      console.log("📊 UNIFIED - Résumé final:", {
        total: sortedTransactions.length,
        recharges: sortedTransactions.filter(t => t.type === 'recharge').length,
        retraits: sortedTransactions.filter(t => t.type === 'withdrawal').length,
        transferts_envoyés: sortedTransactions.filter(t => t.type === 'transfer_sent').length,
        transferts_reçus: sortedTransactions.filter(t => t.type === 'transfer_received').length,
        factures: sortedTransactions.filter(t => t.type === 'bill_payment').length
      });

      setTransactions(sortedTransactions);
      
    } catch (error) {
      console.error('❌ UNIFIED - Erreur:', error);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchAllTransactions();
    } else {
      setIsLoading(false);
      setTransactions([]);
    }

    // Configuration du temps réel optimisée
    const channels: any[] = [];
    
    if (userId) {
      // Canal pour les recharges
      const rechargesChannel = supabase
        .channel('unified-recharges')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'recharges' }, () => {
          console.log('🔄 UNIFIED - Changement recharges détecté');
          fetchAllTransactions();
        })
        .subscribe();
      channels.push(rechargesChannel);

      // Canal pour les retraits
      const withdrawalsChannel = supabase
        .channel('unified-withdrawals')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals' }, () => {
          console.log('🔄 UNIFIED - Changement retraits détecté');
          fetchAllTransactions();
        })
        .subscribe();
      channels.push(withdrawalsChannel);

      // Canal pour les transferts
      const transfersChannel = supabase
        .channel('unified-transfers')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transfers' }, () => {
          console.log('🔄 UNIFIED - Changement transferts détecté');
          fetchAllTransactions();
        })
        .subscribe();
      channels.push(transfersChannel);

      // Canal pour les factures
      const billsChannel = supabase
        .channel('unified-bills')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bill_payment_history' }, () => {
          console.log('🔄 UNIFIED - Changement factures détecté');
          fetchAllTransactions();
        })
        .subscribe();
      channels.push(billsChannel);
    }

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [userId]);

  return {
    transactions,
    isLoading,
    refetch: fetchAllTransactions
  };
};
