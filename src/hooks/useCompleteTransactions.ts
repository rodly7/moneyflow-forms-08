
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CompleteTransaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'transfer_sent' | 'transfer_received' | 'bill_payment';
  amount: number;
  currency: string;
  date: Date;
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  description: string;
  sender?: string;
  recipient?: string;
  reference_id?: string;
  fees?: number;
  created_at: string;
}

export const useCompleteTransactions = (userId?: string) => {
  const [transactions, setTransactions] = useState<CompleteTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllTransactions = async () => {
    if (!userId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const allTransactions: CompleteTransaction[] = [];

      // 1. Récupérer les recharges (dépôts)
      const { data: rechargesData } = await supabase
        .from('recharges')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (rechargesData) {
        rechargesData.forEach(recharge => {
          allTransactions.push({
            id: `recharge_${recharge.id}`,
            type: 'deposit',
            amount: recharge.amount,
            currency: 'XAF',
            date: new Date(recharge.created_at),
            status: recharge.status as any,
            description: `Recharge de compte via ${recharge.payment_method || 'Mobile Money'}`,
            sender: recharge.payment_phone || 'Mobile Money',
            reference_id: recharge.id,
            created_at: recharge.created_at
          });
        });
      }

      // 2. Récupérer les retraits
      const { data: withdrawalsData } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (withdrawalsData) {
        withdrawalsData.forEach(withdrawal => {
          allTransactions.push({
            id: withdrawal.id,
            type: 'withdrawal',
            amount: withdrawal.amount,
            currency: 'XAF',
            date: new Date(withdrawal.created_at),
            status: withdrawal.status as any,
            description: `Retrait d'argent`,
            recipient: withdrawal.withdrawal_phone,
            reference_id: withdrawal.id,
            created_at: withdrawal.created_at
          });
        });
      }

      // 3. Récupérer les transferts envoyés
      const { data: sentTransfersData } = await supabase
        .from('transfers')
        .select('*')
        .eq('sender_id', userId)
        .order('created_at', { ascending: false });

      if (sentTransfersData) {
        sentTransfersData.forEach(transfer => {
          allTransactions.push({
            id: transfer.id,
            type: 'transfer_sent',
            amount: transfer.amount,
            currency: transfer.currency || 'XAF',
            date: new Date(transfer.created_at),
            status: transfer.status as any,
            description: `Transfert envoyé`,
            recipient: transfer.recipient_full_name || transfer.recipient_phone,
            fees: transfer.fees,
            reference_id: transfer.id,
            created_at: transfer.created_at
          });
        });
      }

      // 4. Récupérer les transferts reçus
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', userId)
        .single();

      if (userProfile?.phone) {
        const { data: receivedTransfersData } = await supabase
          .from('transfers')
          .select('*')
          .eq('recipient_phone', userProfile.phone)
          .neq('sender_id', userId)
          .order('created_at', { ascending: false });

        if (receivedTransfersData) {
          receivedTransfersData.forEach(transfer => {
            allTransactions.push({
              id: `received_${transfer.id}`,
              type: 'transfer_received',
              amount: transfer.amount,
              currency: transfer.currency || 'XAF',
              date: new Date(transfer.created_at),
              status: transfer.status as any,
              description: `Transfert reçu`,
              sender: 'Expéditeur',
              reference_id: transfer.id,
              created_at: transfer.created_at
            });
          });
        }
      }

      // 5. Récupérer les paiements de factures
      const { data: billPaymentsData } = await supabase
        .from('bill_payment_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (billPaymentsData) {
        billPaymentsData.forEach(payment => {
          allTransactions.push({
            id: `bill_${payment.id}`,
            type: 'bill_payment',
            amount: payment.amount,
            currency: 'XAF',
            date: new Date(payment.created_at || payment.payment_date),
            status: payment.status as any,
            description: `Paiement de facture`,
            recipient: 'Prestataire de service',
            reference_id: payment.id,
            created_at: payment.created_at || payment.payment_date
          });
        });
      }

      // Trier par date décroissante
      const sortedTransactions = allTransactions.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setTransactions(sortedTransactions);
    } catch (error) {
      console.error('Erreur lors du chargement des transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTransactions();
  }, [userId]);

  return {
    transactions,
    loading,
    refetch: fetchAllTransactions
  };
};
