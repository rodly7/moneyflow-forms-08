import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { NotificationService } from '@/services/notificationService';

export const useTransferNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    console.log('🔔 Configuration écoute transferts reçus pour:', user.id);

    // Écouter les transferts reçus
    const transfersChannel = supabase
      .channel('transfers_received')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transfers',
          filter: `recipient_phone=eq.${user.phone}`
        },
        async (payload) => {
          console.log('💰 Transfert reçu détecté:', payload.new);
          
          try {
            const transfer = payload.new;
            
            // Créer une notification automatique
            await NotificationService.createAutoNotification(
              '💰 Argent reçu',
              `Vous avez reçu ${transfer.amount?.toLocaleString('fr-FR')} FCFA`,
              'high',
              [user.id],
              undefined,
              true
            );
            
            // Afficher un toast immédiat
            toast({
              title: "💰 Argent reçu !",
              description: `Vous avez reçu ${transfer.amount?.toLocaleString('fr-FR')} FCFA`,
              duration: 10000,
              className: "bg-green-50 border-green-200 text-green-800"
            });
            
          } catch (error) {
            console.error('Erreur lors de la notification de transfert reçu:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Statut écoute transferts:', status);
      });

    // Écouter les retraits confirmés
    const withdrawalsChannel = supabase
      .channel('withdrawals_confirmed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'withdrawals',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          console.log('💸 Retrait confirmé:', payload.new);
          
          try {
            const withdrawal = payload.new;
            
            // Créer une notification automatique
            await NotificationService.createAutoNotification(
              '✅ Retrait confirmé',
              `Retrait de ${withdrawal.amount?.toLocaleString('fr-FR')} FCFA traité avec succès`,
              'normal',
              [user.id],
              undefined,
              true
            );
            
            // Afficher un toast
            toast({
              title: "✅ Retrait confirmé",
              description: `Retrait de ${withdrawal.amount?.toLocaleString('fr-FR')} FCFA traité`,
              duration: 5000,
              className: "bg-blue-50 border-blue-200 text-blue-800"
            });
            
          } catch (error) {
            console.error('Erreur lors de la notification de retrait:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Statut écoute retraits:', status);
      });

    return () => {
      console.log('🔄 Nettoyage écoute notifications transferts');
      supabase.removeChannel(transfersChannel);
      supabase.removeChannel(withdrawalsChannel);
    };
  }, [user, toast]);
};