
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UnifiedTransaction {
  id: string;
  type: string;
  amount: number;
  date: Date;
  description: string;
  currency: string;
  status: string;
  verification_code?: string;
  created_at: string;
  withdrawal_phone?: string;
  recipient_full_name?: string;
  recipient_phone?: string;
  fees?: number;
  userType: "agent" | "user";
  impact: "credit" | "debit";
  sender_name?: string;
  reference_id?: string;
  payment_method?: string;
  payment_phone?: string;
}

export const useAllTransactions = (userId?: string) => {
  const [transactions, setTransactions] = useState<UnifiedTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllTransactions = async () => {
    if (!userId) {
      console.log("❌ Pas d'ID utilisateur fourni");
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      console.log("🔍 Récupération complète des transactions pour:", userId);
      setLoading(true);

      const allTransactions: UnifiedTransaction[] = [];

      // 1. Récupérer les recharges (CRÉDIT)
      console.log("💳 Récupération des recharges...");
      const { data: rechargesData, error: rechargesError } = await supabase
        .from('recharges')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (rechargesError) {
        console.error('❌ Erreur recharges:', rechargesError);
      } else if (rechargesData) {
        console.log("✅ Recharges trouvées:", rechargesData.length);
        rechargesData.forEach(recharge => {
          allTransactions.push({
            id: `recharge_${recharge.id}`,
            type: 'recharge',
            amount: recharge.amount,
            date: new Date(recharge.created_at),
            description: `💳 Recharge de compte de ${recharge.amount?.toLocaleString() || '0'} XAF via ${recharge.payment_method || 'Mobile Money'}`,
            currency: 'XAF',
            status: recharge.status,
            created_at: recharge.created_at,
            userType: "user" as const,
            impact: "credit" as const,
            payment_method: recharge.payment_method,
            payment_phone: recharge.payment_phone,
            reference_id: recharge.id
          });
        });
      }

      // 2. Récupérer les retraits (DÉBIT)
      console.log("🏧 Récupération des retraits...");
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (withdrawalsError) {
        console.error('❌ Erreur retraits:', withdrawalsError);
      } else if (withdrawalsData) {
        console.log("✅ Retraits trouvés:", withdrawalsData.length);
        withdrawalsData.forEach(withdrawal => {
          const createdAt = new Date(withdrawal.created_at);
          const now = new Date();
          const timeDiffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
          const showCode = timeDiffMinutes <= 5 && withdrawal.verification_code && withdrawal.status === 'pending';
          
          allTransactions.push({
            id: withdrawal.id,
            type: 'withdrawal',
            amount: withdrawal.amount,
            date: new Date(withdrawal.created_at),
            description: `🏧 Retrait d'argent de ${withdrawal.amount?.toLocaleString() || '0'} XAF vers ${withdrawal.withdrawal_phone || 'N/A'}`,
            currency: 'XAF',
            status: withdrawal.status,
            created_at: withdrawal.created_at,
            withdrawal_phone: withdrawal.withdrawal_phone,
            verification_code: withdrawal.verification_code,
            userType: "user" as const,
            impact: "debit" as const,
            reference_id: withdrawal.id
          });
        });
      }

      // 3. Récupérer les transferts envoyés
      console.log("📤 Récupération des transferts envoyés...");
      const { data: sentTransfersData, error: sentTransfersError } = await supabase
        .from('transfers')
        .select('*')
        .eq('sender_id', userId)
        .order('created_at', { ascending: false });

      if (sentTransfersError) {
        console.error('❌ Erreur transferts envoyés:', sentTransfersError);
      } else if (sentTransfersData) {
        console.log("✅ Transferts envoyés trouvés:", sentTransfersData.length);
        sentTransfersData.forEach(transfer => {
          allTransactions.push({
            id: transfer.id,
            type: 'transfer_sent',
            amount: transfer.amount,
            date: new Date(transfer.created_at),
            description: `💸 Transfert envoyé de ${transfer.amount?.toLocaleString() || '0'} XAF vers ${transfer.recipient_full_name || transfer.recipient_phone}`,
            currency: 'XAF',
            status: transfer.status,
            created_at: transfer.created_at,
            recipient_full_name: transfer.recipient_full_name,
            recipient_phone: transfer.recipient_phone,
            fees: transfer.fees,
            userType: "user" as const,
            impact: "debit" as const,
            reference_id: transfer.id
          });
        });
      }

      // 4. Récupérer les transferts reçus
      console.log("📥 Récupération des transferts reçus...");
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', userId)
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
          receivedTransfersData.forEach(transfer => {
            allTransactions.push({
              id: `received_${transfer.id}`,
              type: 'transfer_received',
              amount: transfer.amount,
              date: new Date(transfer.created_at),
              description: `💰 Transfert reçu de ${transfer.amount?.toLocaleString() || '0'} XAF d'un expéditeur`,
              currency: 'XAF',
              status: transfer.status,
              created_at: transfer.created_at,
              sender_name: 'Expéditeur',
              userType: "user" as const,
              impact: "credit" as const,
              reference_id: transfer.id
            });
          });
        }
      }

      // 5. Récupérer les paiements de factures (DÉBIT)
      console.log("📄 Récupération des paiements de factures...");
      const { data: billPaymentsData, error: billPaymentsError } = await supabase
        .from('bill_payment_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (billPaymentsError) {
        console.error('❌ Erreur paiements factures:', billPaymentsError);
      } else if (billPaymentsData) {
        console.log("✅ Paiements de factures trouvés:", billPaymentsData.length);
        billPaymentsData.forEach(payment => {
          allTransactions.push({
            id: `bill_${payment.id}`,
            type: 'bill_payment',
            amount: payment.amount,
            date: new Date(payment.created_at || payment.payment_date),
            description: `📄 Paiement de facture de ${payment.amount?.toLocaleString() || '0'} XAF effectué avec succès`,
            currency: 'XAF',
            status: payment.status,
            created_at: payment.created_at || payment.payment_date,
            userType: "user" as const,
            impact: "debit" as const,
            reference_id: payment.id
          });
        });
      }

      // 6. Récupérer les transferts en attente (pending_transfers)
      console.log("⏳ Récupération des transferts en attente...");
      const { data: pendingTransfers, error: pendingError } = await supabase
        .from('pending_transfers')
        .select('*')
        .eq('sender_id', userId)
        .order('created_at', { ascending: false });

      if (pendingError) {
        console.error("❌ Erreur transferts en attente:", pendingError);
      } else if (pendingTransfers) {
        console.log("✅ Transferts en attente trouvés:", pendingTransfers.length);
        pendingTransfers.forEach(pending => {
          allTransactions.push({
            id: `pending_${pending.id}`,
            type: 'transfer_pending',
            amount: pending.amount,
            date: new Date(pending.created_at),
            description: `⏳ Transfert en attente vers ${pending.recipient_phone} - Code: ${pending.claim_code}`,
            currency: 'XAF',
            status: 'pending',
            created_at: pending.created_at,
            verification_code: pending.claim_code,
            userType: "user" as const,
            impact: "debit" as const,
            fees: pending.fees || 0,
            reference_id: pending.id
          });
        });
      }

      // Trier par date décroissante
      const sortedTransactions = allTransactions.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      console.log("📊 Total transactions récupérées:", sortedTransactions.length);
      console.log("📋 Détail par type:", {
        recharges: sortedTransactions.filter(t => t.type === 'recharge').length,
        retraits: sortedTransactions.filter(t => t.type === 'withdrawal').length,
        transferts_envoyés: sortedTransactions.filter(t => t.type === 'transfer_sent').length,
        transferts_reçus: sortedTransactions.filter(t => t.type === 'transfer_received').length,
        transferts_en_attente: sortedTransactions.filter(t => t.type === 'transfer_pending').length,
        paiements_factures: sortedTransactions.filter(t => t.type === 'bill_payment').length
      });

      setTransactions(sortedTransactions);
    } catch (error) {
      console.error("❌ Erreur générale lors de la récupération des transactions:", error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchAllTransactions();
    } else {
      setLoading(false);
      setTransactions([]);
    }
  }, [userId]);

  return {
    transactions,
    loading,
    refetch: fetchAllTransactions
  };
};
