
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
}

export const useAllTransactions = (userId?: string) => {
  const [transactions, setTransactions] = useState<UnifiedTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllTransactions = async () => {
    if (!userId) return;

    try {
      console.log("🔍 Récupération complète des transactions pour:", userId);
      setLoading(true);

      const allTransactions: UnifiedTransaction[] = [];

      // 1. Récupérer les retraits
      console.log("📤 Récupération des retraits...");
      const { data: withdrawals, error: withdrawalError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (withdrawalError) {
        console.error("❌ Erreur retraits:", withdrawalError);
      } else if (withdrawals) {
        console.log("✅ Retraits trouvés:", withdrawals.length);
        withdrawals.forEach(withdrawal => {
          allTransactions.push({
            id: withdrawal.id,
            type: 'withdrawal',
            amount: withdrawal.amount,
            date: new Date(withdrawal.created_at),
            description: `Retrait de ${withdrawal.amount?.toLocaleString() || '0'} XAF vers ${withdrawal.withdrawal_phone || 'N/A'}`,
            currency: 'XAF',
            status: withdrawal.status || 'pending',
            verification_code: withdrawal.verification_code || '',
            created_at: withdrawal.created_at,
            withdrawal_phone: withdrawal.withdrawal_phone || '',
            fees: 0,
            userType: "user" as const,
            impact: "debit" as const,
            reference_id: withdrawal.id
          });
        });
      }

      // 2. Récupérer les transferts envoyés
      console.log("📤 Récupération des transferts envoyés...");
      const { data: sentTransfers, error: sentError } = await supabase
        .from('transfers')
        .select('*')
        .eq('sender_id', userId)
        .order('created_at', { ascending: false });

      if (sentError) {
        console.error("❌ Erreur transferts envoyés:", sentError);
      } else if (sentTransfers) {
        console.log("✅ Transferts envoyés trouvés:", sentTransfers.length);
        sentTransfers.forEach(transfer => {
          allTransactions.push({
            id: transfer.id,
            type: 'transfer_sent',
            amount: transfer.amount,
            date: new Date(transfer.created_at),
            description: `Transfert envoyé à ${transfer.recipient_full_name || transfer.recipient_phone}`,
            currency: 'XAF',
            status: transfer.status,
            created_at: transfer.created_at,
            recipient_full_name: transfer.recipient_full_name,
            recipient_phone: transfer.recipient_phone,
            userType: "user" as const,
            impact: "debit" as const,
            fees: transfer.fees || 0,
            reference_id: transfer.id
          });
        });
      }

      // 3. Récupérer les transferts reçus (avec expéditeur)
      console.log("📥 Récupération des transferts reçus...");
      const { data: receivedTransfers, error: receivedError } = await supabase
        .from('transfers')
        .select(`
          id, 
          amount, 
          created_at, 
          recipient_full_name, 
          status,
          sender_id,
          fees,
          profiles!transfers_sender_id_fkey(full_name, phone)
        `)
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false });

      if (receivedError) {
        console.error("❌ Erreur transferts reçus:", receivedError);
      } else if (receivedTransfers) {
        console.log("✅ Transferts reçus trouvés:", receivedTransfers.length);
        receivedTransfers.forEach(transfer => {
          const senderName = (transfer.profiles as any)?.full_name || 'Expéditeur inconnu';
          allTransactions.push({
            id: `received_${transfer.id}`,
            type: 'transfer_received',
            amount: transfer.amount,
            date: new Date(transfer.created_at),
            description: `Transfert reçu de ${senderName}`,
            currency: 'XAF',
            status: transfer.status,
            created_at: transfer.created_at,
            sender_name: senderName,
            userType: "user" as const,
            impact: "credit" as const,
            fees: 0,
            reference_id: transfer.id
          });
        });
      }

      // 4. Récupérer les dépôts/recharges - CORRECTION ICI
      console.log("🔋 Récupération des dépôts...");
      const { data: recharges, error: rechargeError } = await supabase
        .from('recharges')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (rechargeError) {
        console.error("❌ Erreur dépôts:", rechargeError);
      } else if (recharges) {
        console.log("✅ Dépôts trouvés:", recharges.length);
        recharges.forEach(recharge => {
          allTransactions.push({
            id: `deposit_${recharge.id}`,
            type: 'deposit',
            amount: recharge.amount,
            date: new Date(recharge.created_at),
            description: `Recharge de ${recharge.amount?.toLocaleString() || '0'} XAF via ${recharge.payment_method || 'Mobile Money'}`,
            currency: 'XAF',
            status: recharge.status,
            created_at: recharge.created_at,
            userType: "user" as const,
            impact: "credit" as const,
            reference_id: recharge.id
          });
        });
      }

      // 5. Récupérer les paiements de factures
      console.log("🧾 Récupération des paiements de factures...");
      const { data: billPayments, error: billError } = await supabase
        .from('bill_payment_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (billError) {
        console.error("❌ Erreur paiements factures:", billError);
      } else if (billPayments) {
        console.log("✅ Paiements de factures trouvés:", billPayments.length);
        billPayments.forEach(payment => {
          allTransactions.push({
            id: `bill_${payment.id}`,
            type: 'bill_payment',
            amount: payment.amount,
            date: new Date(payment.created_at),
            description: `Paiement de facture de ${payment.amount?.toLocaleString() || '0'} XAF`,
            currency: 'XAF',
            status: payment.status,
            created_at: payment.created_at,
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
            description: `Transfert en attente vers ${pending.recipient_email}`,
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
        retraits: sortedTransactions.filter(t => t.type === 'withdrawal').length,
        transferts_envoyés: sortedTransactions.filter(t => t.type === 'transfer_sent').length,
        transferts_reçus: sortedTransactions.filter(t => t.type === 'transfer_received').length,
        transferts_en_attente: sortedTransactions.filter(t => t.type === 'transfer_pending').length,
        dépôts: sortedTransactions.filter(t => t.type === 'deposit').length,
        paiements_factures: sortedTransactions.filter(t => t.type === 'bill_payment').length
      });

      setTransactions(sortedTransactions);
    } catch (error) {
      console.error("❌ Erreur générale lors de la récupération des transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchAllTransactions();
    }
  }, [userId]);

  return {
    transactions,
    loading,
    refetch: fetchAllTransactions
  };
};
