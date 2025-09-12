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
  const [error, setError] = useState<string | null>(null);

  const fetchAllTransactions = async () => {
    if (!userId) {
      console.log("❌ DEBUG: Pas d'ID utilisateur fourni");
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      console.log("🔍 DEBUG: Récupération complète des transactions pour userId:", userId);
      setLoading(true);
      setError(null);

      const allTransactions: UnifiedTransaction[] = [];

      // 1. Récupérer les recharges (CRÉDIT) - DEBUG DÉTAILLÉ
      console.log("💳 DEBUG: Début récupération des recharges...");
      
      const rechargesQuery = supabase
        .from('recharges')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      console.log("💳 DEBUG: Requête recharges construite pour user_id:", userId);
      
      const { data: rechargesData, error: rechargesError } = await rechargesQuery;

      console.log("💳 DEBUG: Résultat requête recharges:");
      console.log("💳 DEBUG: - Erreur:", rechargesError);
      console.log("💳 DEBUG: - Données brutes:", rechargesData);
      console.log("💳 DEBUG: - Nombre de recharges trouvées:", rechargesData?.length || 0);

      if (rechargesError) {
        console.error('❌ DEBUG: Erreur détaillée recharges:', {
          message: rechargesError.message,
          details: rechargesError.details,
          hint: rechargesError.hint,
          code: rechargesError.code
        });
      } else if (rechargesData && rechargesData.length > 0) {
        console.log("✅ DEBUG: Traitement de", rechargesData.length, "recharges");
        rechargesData.forEach((recharge, index) => {
          console.log(`💳 DEBUG: Recharge ${index + 1}:`, {
            id: recharge.id,
            amount: recharge.amount,
            status: recharge.status,
            created_at: recharge.created_at,
            user_id: recharge.user_id,
            payment_method: recharge.payment_method
          });
          
          allTransactions.push({
            id: `recharge_${recharge.id}`,
            type: 'recharge',
            amount: recharge.amount || 0,
            date: new Date(recharge.created_at),
            description: `Recharge de compte via ${recharge.payment_method || 'Mobile Money'}`,
            currency: 'XAF',
            status: recharge.status || 'pending',
            created_at: recharge.created_at,
            userType: "user" as const,
            impact: "credit" as const,
            payment_method: recharge.payment_method,
            payment_phone: recharge.payment_phone,
            reference_id: recharge.id?.toString()
          });
        });
      } else {
        console.log("⚠️ DEBUG: Aucune recharge trouvée pour l'utilisateur");
      }

      // 2. Récupérer les retraits (DÉBIT) - DEBUG DÉTAILLÉ
      console.log("🏧 DEBUG: Début récupération des retraits...");
      
      const withdrawalsQuery = supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      console.log("🏧 DEBUG: Requête retraits construite pour user_id:", userId);
      
      const { data: withdrawalsData, error: withdrawalsError } = await withdrawalsQuery;

      console.log("🏧 DEBUG: Résultat requête retraits:");
      console.log("🏧 DEBUG: - Erreur:", withdrawalsError);
      console.log("🏧 DEBUG: - Données brutes:", withdrawalsData);
      console.log("🏧 DEBUG: - Nombre de retraits trouvés:", withdrawalsData?.length || 0);

      if (withdrawalsError) {
        console.error('❌ DEBUG: Erreur détaillée retraits:', {
          message: withdrawalsError.message,
          details: withdrawalsError.details,
          hint: withdrawalsError.hint,
          code: withdrawalsError.code
        });
      } else if (withdrawalsData && withdrawalsData.length > 0) {
        console.log("✅ DEBUG: Traitement de", withdrawalsData.length, "retraits");
        withdrawalsData.forEach((withdrawal, index) => {
          console.log(`🏧 DEBUG: Retrait ${index + 1}:`, {
            id: withdrawal.id,
            amount: withdrawal.amount,
            status: withdrawal.status,
            created_at: withdrawal.created_at,
            user_id: withdrawal.user_id,
            withdrawal_phone: withdrawal.withdrawal_phone
          });
          
          allTransactions.push({
            id: withdrawal.id,
            type: 'withdrawal',
            amount: withdrawal.amount || 0,
            date: new Date(withdrawal.created_at),
            description: `Retrait d'argent vers ${withdrawal.withdrawal_phone || 'N/A'}`,
            currency: 'XAF',
            status: withdrawal.status || 'pending',
            created_at: withdrawal.created_at,
            withdrawal_phone: withdrawal.withdrawal_phone,
            verification_code: withdrawal.verification_code,
            userType: "user" as const,
            impact: "debit" as const,
            reference_id: withdrawal.id
          });
        });
      } else {
        console.log("⚠️ DEBUG: Aucun retrait trouvé pour l'utilisateur");
      }

      // 3. Récupérer les transferts envoyés (DÉBIT)
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
            amount: transfer.amount || 0,
            date: new Date(transfer.created_at),
            description: `Transfert envoyé vers ${transfer.recipient_full_name || transfer.recipient_phone}`,
            currency: 'XAF',
            status: transfer.status || 'pending',
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

      // 4. Récupérer les transferts reçus (CRÉDIT)
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
          .neq('sender_id', userId) // Éviter les doublons avec les transferts envoyés
          .order('created_at', { ascending: false });

        if (receivedTransfersError) {
          console.error('❌ Erreur transferts reçus:', receivedTransfersError);
        } else if (receivedTransfersData) {
          console.log("✅ Transferts reçus trouvés:", receivedTransfersData.length);
          receivedTransfersData.forEach(transfer => {
            allTransactions.push({
              id: `received_${transfer.id}`,
              type: 'transfer_received',
              amount: transfer.amount || 0,
              date: new Date(transfer.created_at),
              description: `Transfert reçu d'un expéditeur`,
              currency: 'XAF',
              status: transfer.status || 'pending',
              created_at: transfer.created_at,
              sender_name: 'Expéditeur',
              userType: "user" as const,
              impact: "credit" as const,
              reference_id: transfer.id
            });
          });
        }
      }

      // 5. Récupérer les paiements de factures automatiques (DÉBIT)
      console.log("📄 Récupération des paiements de factures automatiques...");
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
            amount: payment.amount || 0,
            date: new Date(payment.created_at || payment.payment_date),
            description: `Paiement de facture`,
            currency: 'XAF',
            status: payment.status || 'completed',
            created_at: payment.created_at || payment.payment_date,
            userType: "user" as const,
            impact: "debit" as const,
            reference_id: payment.id?.toString()
          });
        });
      }


      // 6. Récupérer les transferts en attente (DÉBIT)
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
            amount: pending.amount || 0,
            date: new Date(pending.created_at),
            description: `Transfert en attente vers ${pending.recipient_phone}`,
            currency: 'XAF',
            status: 'pending',
            created_at: pending.created_at,
            verification_code: pending.claim_code,
            userType: "user" as const,
            impact: "debit" as const,
            fees: pending.fees || 0,
            reference_id: pending.id?.toString()
          });
        });
      }

      // 7. Récupérer les paiements par scanner/QR (DÉBIT)
      console.log("📱 Récupération des paiements par scanner...");
      const { data: merchantPayments, error: merchantError } = await supabase
        .from('merchant_payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (merchantError) {
        console.error("❌ Erreur paiements scanner:", merchantError);
      } else if (merchantPayments) {
        console.log("✅ Paiements par scanner trouvés:", merchantPayments.length);
        merchantPayments.forEach(payment => {
          allTransactions.push({
            id: `merchant_${payment.id}`,
            type: 'merchant_payment',
            amount: payment.amount || 0,
            date: new Date(payment.created_at),
            description: `Paiement par scanner de ${payment.amount?.toLocaleString() || '0'} XAF à ${payment.business_name}`,
            currency: payment.currency || 'XAF',
            status: payment.status || 'completed',
            created_at: payment.created_at,
            userType: "user" as const,
            impact: "debit" as const,
            reference_id: payment.id?.toString()
          });
        });
      }

      // Trier par date décroissante (plus récentes en premier)
      const sortedTransactions = allTransactions.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      console.log("📊 DEBUG: Résumé final des transactions:");
      console.log("📊 DEBUG: - Total transactions:", sortedTransactions.length);
      console.log("📊 DEBUG: - Recharges:", sortedTransactions.filter(t => t.type === 'recharge').length);
      console.log("📊 DEBUG: - Retraits:", sortedTransactions.filter(t => t.type === 'withdrawal').length);
      console.log("📊 DEBUG: - Transferts envoyés:", sortedTransactions.filter(t => t.type === 'transfer_sent').length);
      console.log("📊 DEBUG: - Transferts reçus:", sortedTransactions.filter(t => t.type === 'transfer_received').length);
      console.log("📊 DEBUG: - Paiements factures:", sortedTransactions.filter(t => t.type === 'bill_payment').length);
      console.log("📊 DEBUG: - En attente:", sortedTransactions.filter(t => t.type === 'transfer_pending').length);
      console.log("📊 DEBUG: - Paiements scanner:", sortedTransactions.filter(t => t.type === 'merchant_payment').length);

      // Afficher les 5 premières transactions pour debug
      console.log("📋 DEBUG: Les 5 premières transactions:", sortedTransactions.slice(0, 5).map(t => ({
        type: t.type,
        amount: t.amount,
        description: t.description,
        date: t.date
      })));

      setTransactions(sortedTransactions);
    } catch (error) {
      console.error("❌ DEBUG: Erreur générale lors de la récupération des transactions:", error);
      setError("Erreur lors du chargement des transactions");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      console.log("🚀 DEBUG: Démarrage fetchAllTransactions pour userId:", userId);
      fetchAllTransactions();
    } else {
      console.log("⚠️ DEBUG: Pas de userId, arrêt du loading");
      setLoading(false);
      setTransactions([]);
    }

    // Écouter les mises à jour de transactions
    const handleTransactionUpdate = () => {
      if (userId) {
        fetchAllTransactions();
      }
    };

    window.addEventListener('transactionUpdate', handleTransactionUpdate);
    return () => window.removeEventListener('transactionUpdate', handleTransactionUpdate);
  }, [userId]);

  return {
    transactions,
    loading,
    error,
    refetch: fetchAllTransactions
  };
};
