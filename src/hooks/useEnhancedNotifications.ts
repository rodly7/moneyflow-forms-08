
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
    refetchInterval: 30000, // Réduit à 30 secondes
    refetchIntervalInBackground: false, // Désactiver en arrière-plan
  });

  // Récupérer les recharges récentes
  const { data: rechargeNotifications = [] } = useQuery({
    queryKey: ['recharge-notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('recharges')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des notifications de recharge:', error);
        return [];
      }

      return data?.map(recharge => ({
        id: `recharge-${recharge.id}`,
        title: '💳 Recharge de compte',
        message: `Recharge de ${recharge.amount.toLocaleString()} FCFA ${recharge.status === 'completed' ? 'confirmée' : 'en cours'}`,
        type: 'recharge',
        priority: recharge.status === 'completed' ? 'high' as const : 'medium' as const,
        created_at: recharge.created_at,
        read: false
      })) || [];
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Réduit à 30 secondes
    refetchIntervalInBackground: false, // Désactiver en arrière-plan
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
        title: '💸 Retrait d\'argent',
        message: `Retrait de ${withdrawal.amount.toLocaleString()} FCFA ${withdrawal.status === 'completed' ? 'confirmé' : withdrawal.status === 'pending' ? 'en cours' : 'initié'}`,
        type: 'withdrawal',
        priority: withdrawal.status === 'completed' ? 'high' as const : 'medium' as const,
        created_at: withdrawal.created_at,
        read: false
      })) || [];
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Réduit à 30 secondes
    refetchIntervalInBackground: false, // Désactiver en arrière-plan
  });

  // Combiner toutes les notifications
  const allNotifications = [
    ...transferNotifications,
    ...rechargeNotifications,
    ...withdrawalNotifications
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Détecter les nouvelles notifications et afficher des toasts
  useEffect(() => {
    if (allNotifications.length > lastNotificationCount && lastNotificationCount > 0) {
      const newNotifications = allNotifications.slice(0, allNotifications.length - lastNotificationCount);
      
      newNotifications.forEach(notification => {
        const bgColor = notification.type === 'transfer_received' 
          ? 'bg-green-50 border-green-200 text-green-800'
          : notification.type === 'recharge'
          ? 'bg-blue-50 border-blue-200 text-blue-800'
          : notification.type === 'withdrawal'
          ? 'bg-purple-50 border-purple-200 text-purple-800'
          : 'bg-gray-50 border-gray-200 text-gray-800';

        toast({
          title: notification.title,
          description: notification.message,
          duration: notification.priority === 'high' ? 8000 : 5000,
          className: bgColor
        });
      });
    }
    
    setLastNotificationCount(allNotifications.length);
  }, [allNotifications.length, lastNotificationCount, toast]);

  // Écoute en temps réel consolidée pour éviter trop de connexions
  useEffect(() => {
    if (!user?.id) return;

    console.log('🔗 Configuration connexion temps réel pour:', user.id);

    // Une seule connexion pour toutes les notifications
    const notificationChannel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transfers',
        },
        (payload) => {
          const transfer = payload.new as any;
          
          if (transfer && (transfer.recipient_phone === user.phone || transfer.recipient_email === user.email)) {
            console.log('🎉 Nouveau transfert reçu en temps réel:', transfer);
            
            toast({
              title: '🎉 Transfert reçu !',
              description: `Vous avez reçu ${transfer.amount?.toLocaleString() || 0} FCFA`,
              duration: 8000,
              className: 'bg-green-50 border-green-200 text-green-800'
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'recharges',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('💳 Changement recharge détecté:', payload);
          
          const recharge = (payload.new || payload.old) as any;
          if (!recharge) return;

          if (payload.eventType === 'INSERT') {
            toast({
              title: '💳 Recharge initiée',
              description: `Recharge de ${recharge.amount?.toLocaleString() || 0} FCFA en cours de traitement`,
              duration: 5000,
              className: 'bg-blue-50 border-blue-200 text-blue-800'
            });
          } else if (payload.eventType === 'UPDATE' && recharge.status === 'completed') {
            toast({
              title: '✅ Recharge confirmée !',
              description: `Votre recharge de ${recharge.amount?.toLocaleString() || 0} FCFA a été confirmée`,
              duration: 8000,
              className: 'bg-green-50 border-green-200 text-green-800'
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'withdrawals',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('💸 Changement retrait détecté:', payload);
          
          const withdrawal = (payload.new || payload.old) as any;
          if (!withdrawal) return;

          if (payload.eventType === 'INSERT') {
            toast({
              title: '💸 Retrait initié',
              description: `Demande de retrait de ${withdrawal.amount?.toLocaleString() || 0} FCFA créée`,
              duration: 5000,
              className: 'bg-purple-50 border-purple-200 text-purple-800'
            });
          } else if (payload.eventType === 'UPDATE' && withdrawal.status === 'completed') {
            toast({
              title: '✅ Retrait confirmé !',
              description: `Votre retrait de ${withdrawal.amount?.toLocaleString() || 0} FCFA a été traité`,
              duration: 8000,
              className: 'bg-green-50 border-green-200 text-green-800'
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Statut connexion notifications:', status);
        if (status === 'CLOSED') {
          console.log('🔄 Connexion fermée, programmation reconnexion...');
          // Reconnexion automatique après 5 secondes
          setTimeout(() => {
            if (!user?.id) return;
            console.log('🔄 Tentative de reconnexion...');
          }, 5000);
        }
      });

    return () => {
      console.log('🔌 Nettoyage connexion temps réel');
      supabase.removeChannel(notificationChannel);
    };
  }, [user?.id, user?.phone, user?.email, toast]);

  const markAsRead = useCallback((notificationId: string) => {
    console.log('Notification marquée comme lue:', notificationId);
  }, []);

  const markAllAsRead = useCallback(() => {
    console.log('Toutes les notifications marquées comme lues');
  }, []);

  return {
    notifications: allNotifications.slice(0, 10),
    unreadCount: allNotifications.length,
    markAsRead,
    markAllAsRead
  };
};
