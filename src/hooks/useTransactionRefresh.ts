import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook pour forcer le rafraîchissement des transactions quand une notification arrive
 */
export const useTransactionRefresh = (refreshCallback: () => void) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    console.log('🔄 Configuration listeners pour rafraîchissement transactions');

    // Écouter les nouvelles notifications pour rafraîchir les transactions
    const notificationsChannel = supabase
      .channel(`transaction_refresh_${user.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `target_users=cs.{${user.id}}`
      }, (payload) => {
        console.log('🔔 Nouvelle notification détectée, rafraîchissement transactions:', payload);
        refreshCallback();
      })
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'transfers' 
      }, (payload) => {
        console.log('📥 Nouveau transfert détecté, rafraîchissement transactions:', payload);
        refreshCallback();
      })
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'withdrawals',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('💸 Nouveau retrait détecté, rafraîchissement transactions:', payload);
        refreshCallback();
      })
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'bill_payment_history',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('📄 Nouveau paiement facture détecté, rafraîchissement transactions:', payload);
        refreshCallback();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(notificationsChannel);
    };
  }, [user?.id, refreshCallback]);
};