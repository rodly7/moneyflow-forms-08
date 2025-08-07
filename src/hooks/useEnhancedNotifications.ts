import { useEffect, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  read: boolean;
}

export const useEnhancedNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [lastNotificationCount, setLastNotificationCount] = useState(0);

  // Récupérer les transferts récents comme notifications
  const { data: transferNotifications = [] } = useQuery({
    queryKey: ['transfer-notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('transfers')
        .select('*')
        .or(`recipient_phone.eq.${user.phone},recipient_email.eq.${user.email}`)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des notifications de transfert:', error);
        return [];
      }

      return data?.map(transfer => ({
        id: `transfer-${transfer.id}`,
        title: '💰 Transfert reçu',
        message: `Vous avez reçu ${transfer.amount.toLocaleString()} FCFA`,
        type: 'transfer_received',
        priority: 'high' as const,
        created_at: transfer.created_at,
        read: false
      })) || [];
    },
    enabled: !!user?.id,
    refetchInterval: 2000, // 2 secondes pour détecter rapidement
    refetchIntervalInBackground: true,
  });

  // Récupérer les retraits récents
  const { data: withdrawalNotifications = [] } = useQuery({
    queryKey: ['withdrawal-notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des notifications de retrait:', error);
        return [];
      }

      return data?.map(withdrawal => ({
        id: `withdrawal-${withdrawal.id}`,
        title: '💳 Retrait effectué',
        message: `Retrait de ${withdrawal.amount.toLocaleString()} FCFA ${withdrawal.status === 'completed' ? 'réussi' : 'en cours'}`,
        type: 'withdrawal',
        priority: 'medium' as const,
        created_at: withdrawal.created_at,
        read: false
      })) || [];
    },
    enabled: !!user?.id,
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
  });

  // Combiner toutes les notifications
  const allNotifications = [
    ...transferNotifications,
    ...withdrawalNotifications
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Détecter les nouvelles notifications et afficher des toasts
  useEffect(() => {
    if (allNotifications.length > lastNotificationCount && lastNotificationCount > 0) {
      const newNotifications = allNotifications.slice(0, allNotifications.length - lastNotificationCount);
      
      newNotifications.forEach(notification => {
        toast({
          title: notification.title,
          description: notification.message,
          duration: 5000,
        });
      });
    }
    
    setLastNotificationCount(allNotifications.length);
  }, [allNotifications.length, lastNotificationCount, toast]);

  // Écoute en temps réel pour les nouveaux transferts
  useEffect(() => {
    if (!user?.id) return;

    const transferChannel = supabase
      .channel('new-transfers')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transfers',
        },
        (payload) => {
          const transfer = payload.new;
          
          // Vérifier si c'est pour l'utilisateur actuel
          if (transfer.recipient_phone === user.phone || transfer.recipient_email === user.email) {
            console.log('🎉 Nouveau transfert reçu en temps réel:', transfer);
            
            toast({
              title: '🎉 Transfert reçu !',
              description: `Vous avez reçu ${transfer.amount.toLocaleString()} FCFA`,
              duration: 8000,
            });

            // Forcer un refresh des notifications
            setTimeout(() => {
              setLastNotificationCount(prev => prev + 1);
            }, 1000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(transferChannel);
    };
  }, [user?.id, user?.phone, user?.email, toast]);

  const markAsRead = useCallback((notificationId: string) => {
    // Pour les notifications dynamiques, on pourrait maintenir un état local
    console.log('Notification marquée comme lue:', notificationId);
  }, []);

  const markAllAsRead = useCallback(() => {
    console.log('Toutes les notifications marquées comme lues');
  }, []);

  return {
    notifications: allNotifications.slice(0, 10), // Limiter à 10 notifications récentes
    unreadCount: allNotifications.length,
    markAsRead,
    markAllAsRead
  };
};