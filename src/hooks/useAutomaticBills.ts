import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AutomaticBill {
  id: string;
  bill_name: string;
  amount: number;
  due_date: string;
  recurrence: string;
  is_automated: boolean;
  priority: number;
  status: string;
  last_payment_date?: string;
  next_due_date?: string;
  payment_attempts: number;
  max_attempts: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  payment_number?: string;
  provider_number?: string;
  provider_name?: string;
  meter_number?: string;
}

interface PaymentResult {
  success: boolean;
  message: string;
  amount?: number;
  new_balance?: number;
}

interface BillPaymentHistory {
  id: string;
  bill_id: string;
  amount: number;
  payment_date: string;
  status: string;
  balance_before: number;
  balance_after?: number;
  attempt_number: number;
  error_message?: string;
  user_id: string;
}

export const useAutomaticBills = () => {
  const [bills, setBills] = useState<AutomaticBill[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<BillPaymentHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const fetchBills = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('automatic_bills')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des factures:', error);
        throw error;
      }
      setBills(data || []);
    } catch (error) {
      console.error('Error fetching bills:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les factures automatiques",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentHistory = async (billId?: string) => {
    if (!user) return;
    
    try {
      let query = supabase
        .from('bill_payment_history')
        .select('*')
        .eq('user_id', user.id)
        .order('payment_date', { ascending: false });

      if (billId) {
        query = query.eq('bill_id', billId);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Erreur lors de la récupération de l\'historique:', error);
        throw error;
      }
      setPaymentHistory(data || []);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger l'historique des paiements",
        variant: "destructive"
      });
    }
  };

  const payBillManually = async (billId: string) => {
    if (!user || !profile) {
      toast({
        title: "Erreur",
        description: "Utilisateur non connecté",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      // Trouver la facture
      const bill = bills.find(b => b.id === billId);
      if (!bill) {
        throw new Error('Facture introuvable');
      }

      // Vérifier le solde avant le paiement
      if (profile.balance < bill.amount) {
        toast({
          title: "Solde insuffisant",
          description: `Votre solde (${profile.balance.toLocaleString()} FCFA) est insuffisant pour payer cette facture (${bill.amount.toLocaleString()} FCFA)`,
          variant: "destructive"
        });
        return;
      }

      console.log('🔄 Paiement de facture automatique via Edge Function');

      // Utiliser exactement la même approche que useRobustBillPayment
      const paymentData = {
        user_id: user.id,
        amount: Number(bill.amount),
        bill_type: bill.bill_name || 'automatic_bill',
        provider: bill.bill_name || 'automatic',
        account_number: bill.meter_number || '',
        recipient_phone: bill.payment_number || bill.provider_number || '',
        bill_id: billId
      };

      console.log('📤 Données envoyées pour facture automatique:', paymentData);

      // Appeler l'Edge Function avec la même méthode que le paiement manuel
      const { data, error } = await supabase.functions.invoke('process-bill-payment', {
        body: paymentData,
      });

      console.log('📥 Réponse Edge Function facture:', { data, error });

      if (error) {
        console.error('🔄 Erreur Edge Function, utilisation du système de fallback', error);
        
        // Fallback: utiliser le système local comme le paiement manuel
        const { error: fallbackError } = await supabase.rpc('secure_increment_balance', {
          target_user_id: user.id,
          amount: -bill.amount,
          operation_type: 'bill_payment',
          performed_by: user.id
        });
        
        if (fallbackError) {
          throw new Error('Échec du paiement: ' + fallbackError.message);
        }
        
        // Mettre à jour le statut de la facture
        await supabase
          .from('automatic_bills')
          .update({ 
            status: 'paid',
            last_payment_date: new Date().toISOString(),
            payment_attempts: 0
          })
          .eq('id', billId);
        
        toast({
          title: "✅ Paiement réussi (Fallback)",
          description: `Facture ${bill.bill_name} payée avec succès (${bill.amount.toLocaleString()} FCFA)`,
        });
        
        // Actualiser les données et déclencher une actualisation des transactions
        await Promise.all([
          fetchBills(),
          fetchPaymentHistory()
        ]);
        
        // Déclencher un événement personnalisé pour actualiser les transactions
        window.dispatchEvent(new CustomEvent('transactionUpdate'));
        
        return { success: true };
      }

      const result = data as PaymentResult;
      
      if (result && result.success) {
        toast({
          title: "Paiement effectué",
          description: `Facture ${bill.bill_name} payée: ${result.amount?.toLocaleString()} FCFA`,
          variant: "default"
        });
        
        // Actualiser les données et déclencher une actualisation des transactions
        await Promise.all([
          fetchBills(),
          fetchPaymentHistory()
        ]);
        
        // Déclencher un événement personnalisé pour actualiser les transactions
        window.dispatchEvent(new CustomEvent('transactionUpdate'));
      } else {
        toast({
          title: "Paiement échoué",
          description: result?.message || 'Erreur inconnue lors du paiement',
          variant: "destructive"
        });
      }

      return result;
    } catch (error) {
      console.error('Error paying bill manually:', error);
      const errorMessage = error instanceof Error ? error.message : "Impossible de traiter le paiement";
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createBill = async (billData: Omit<AutomaticBill, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'payment_attempts' | 'max_attempts'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('automatic_bills')
        .insert({
          ...billData,
          user_id: user.id,
          payment_attempts: 0,
          max_attempts: 3
        })
        .select()
        .single();

      if (error) throw error;

      await fetchBills();
      toast({
        title: "Succès",
        description: "Facture automatique créée avec succès",
        variant: "default"
      });

      return data;
    } catch (error) {
      console.error('Error creating bill:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la facture automatique",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateBill = async (billId: string, updates: Partial<AutomaticBill>) => {
    try {
      const { error } = await supabase
        .from('automatic_bills')
        .update(updates)
        .eq('id', billId)
        .eq('user_id', user?.id);

      if (error) throw error;

      await fetchBills();
      toast({
        title: "Succès",
        description: "Facture mise à jour avec succès",
        variant: "default"
      });
    } catch (error) {
      console.error('Error updating bill:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la facture",
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteBill = async (billId: string) => {
    try {
      const { error } = await supabase
        .from('automatic_bills')
        .delete()
        .eq('id', billId)
        .eq('user_id', user?.id);

      if (error) throw error;

      await fetchBills();
      toast({
        title: "Succès",
        description: "Facture supprimée avec succès",
        variant: "default"
      });
    } catch (error) {
      console.error('Error deleting bill:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la facture",
        variant: "destructive"
      });
      throw error;
    }
  };

  const toggleAutomation = async (billId: string, isAutomated: boolean) => {
    try {
      const { error } = await supabase
        .from('automatic_bills')
        .update({ is_automated: isAutomated })
        .eq('id', billId)
        .eq('user_id', user?.id);

      if (error) throw error;

      await fetchBills();
      toast({
        title: "Succès",
        description: `Automation ${isAutomated ? 'activée' : 'désactivée'} avec succès`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error toggling automation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier l'automation",
        variant: "destructive"
      });
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      fetchBills();
      fetchPaymentHistory();
    }
  }, [user]);

  return {
    bills,
    paymentHistory,
    loading,
    createBill,
    updateBill,
    deleteBill,
    toggleAutomation,
    payBillManually,
    fetchBills,
    fetchPaymentHistory
  };
};
