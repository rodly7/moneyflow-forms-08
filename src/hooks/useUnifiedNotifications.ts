
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UnifiedNotification {
  id: string;
  title: string;
  message: string;
  type: 'transfer_received' | 'withdrawal_completed' | 'recharge_completed' | 'admin_message' | 'system';
  priority: 'low' | 'normal' | 'high';
  amount?: number;
  created_at: string;
  read: boolean;
}

export const useUnifiedNotifications = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<UnifiedNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  // Clé pour stocker les notifications lues dans le localStorage
  const getReadNotificationsKey = () => `readNotifications_${user?.id}`;

  // Récupérer les IDs des notifications lues depuis le localStorage
  const getReadNotificationIds = (): Set<string> => {
    try {
      const stored = localStorage.getItem(getReadNotificationsKey());
      return new Set(stored ? JSON.parse(stored) : []);
    } catch {
      return new Set();
    }
  };

  // Sauvegarder les IDs des notifications lues dans le localStorage
  const saveReadNotificationIds = (readIds: Set<string>) => {
    try {
      localStorage.setItem(getReadNotificationsKey(), JSON.stringify([...readIds]));
    } catch (error) {
      console.error('Erreur sauvegarde notifications lues:', error);
    }
  };

  // Fonction pour afficher une notification toast avec vibration
  const showNotificationToast = (notification: UnifiedNotification) => {
    console.log('🔔 Affichage toast notification:', notification.title);
    
    // Vibration si disponible
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 400]);
    }

    // Son de notification si possible
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcCjWH0fPTgjEGJXfK7+OUQw==');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (error) {
      console.log('Son de notification non disponible');
    }

    const bgColor = notification.type === 'transfer_received' 
      ? 'bg-green-50 border-green-200 text-green-800'
      : notification.type === 'recharge_completed'
      ? 'bg-blue-50 border-blue-200 text-blue-800'
      : notification.type === 'withdrawal_completed'
      ? 'bg-purple-50 border-purple-200 text-purple-800'
      : 'bg-gray-50 border-gray-200 text-gray-800';

    toast({
      title: notification.title,
      description: notification.message,
      duration: notification.priority === 'high' ? 10000 : 5000,
      className: bgColor
    });
  };

  // Charger les notifications récentes depuis la base de données
  const loadRecentNotifications = async () => {
    if (!user?.id) return;

    console.log('📥 Chargement des notifications pour:', user.id);

    try {
      const readIds = getReadNotificationIds();
      const allNotifications: UnifiedNotification[] = [];

      // Charger les notifications administratives récentes
      const { data: adminNotifications, error: adminError } = await supabase
        .from('notification_recipients')
        .select(`
          notification_id,
          read_at,
          notifications (
            id,
            title,
            message,
            priority,
            created_at,
            notification_type
          )
        `)
        .eq('user_id', user.id)
        .gte('sent_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('sent_at', { ascending: false });

      if (adminError) {
        console.error('Erreur chargement notifications admin:', adminError);
      }

      // Charger les transferts reçus récents
      const { data: transfers, error: transferError } = await supabase
        .from('transfers')
        .select('*')
        .eq('recipient_phone', user.phone)
        .eq('status', 'completed')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (transferError) {
        console.error('Erreur chargement transferts:', transferError);
      }

      // Charger les recharges récentes
      const { data: recharges, error: rechargeError } = await supabase
        .from('recharges')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (rechargeError) {
        console.error('Erreur chargement recharges:', rechargeError);
      }

      // Charger les retraits récents
      const { data: withdrawals, error: withdrawalError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (withdrawalError) {
        console.error('Erreur chargement retraits:', withdrawalError);
      }

      // Ajouter les notifications admin
      adminNotifications?.forEach(item => {
        if (item.notifications && !Array.isArray(item.notifications)) {
          const notification = item.notifications as any;
          const notificationId = `admin_${notification.id}`;
          
          if (!readIds.has(notificationId)) {
            allNotifications.push({
              id: notificationId,
              title: notification.title,
              message: notification.message,
              type: 'admin_message',
              priority: notification.priority as any,
              created_at: notification.created_at,
              read: false
            });
          }
        }
      });

      // Ajouter les notifications de transferts reçus
      transfers?.forEach(transfer => {
        const notificationId = `transfer_${transfer.id}`;
        
        if (!readIds.has(notificationId)) {
          allNotifications.push({
            id: notificationId,
            title: '💰 Argent reçu',
            message: `Vous avez reçu ${transfer.amount?.toLocaleString('fr-FR') || 0} FCFA`,
            type: 'transfer_received',
            priority: 'high',
            amount: transfer.amount,
            created_at: transfer.created_at,
            read: false
          });
        }
      });

      // Ajouter les notifications de recharges
      recharges?.forEach(recharge => {
        const notificationId = `recharge_${recharge.id}`;
        
        if (!readIds.has(notificationId)) {
          if (recharge.status === 'completed') {
            allNotifications.push({
              id: notificationId,
              title: '✅ Recharge confirmée',
              message: `Recharge de ${recharge.amount?.toLocaleString('fr-FR') || 0} FCFA confirmée avec succès`,
              type: 'recharge_completed',
              priority: 'high',
              amount: recharge.amount,
              created_at: recharge.created_at,
              read: false
            });
          } else if (recharge.status === 'pending') {
            allNotifications.push({
              id: notificationId,
              title: '💳 Recharge initiée',
              message: `Recharge de ${recharge.amount?.toLocaleString('fr-FR') || 0} FCFA en cours de traitement`,
              type: 'recharge_completed',
              priority: 'normal',
              amount: recharge.amount,
              created_at: recharge.created_at,
              read: false
            });
          }
        }
      });

      // Ajouter les notifications de retraits
      withdrawals?.forEach(withdrawal => {
        const notificationId = `withdrawal_${withdrawal.id}`;
        
        if (!readIds.has(notificationId)) {
          if (withdrawal.status === 'completed') {
            allNotifications.push({
              id: notificationId,
              title: '✅ Retrait confirmé',
              message: `Retrait de ${withdrawal.amount?.toLocaleString('fr-FR') || 0} FCFA confirmé avec succès`,
              type: 'withdrawal_completed',
              priority: 'high',
              amount: withdrawal.amount,
              created_at: withdrawal.created_at,
              read: false
            });
          } else if (withdrawal.status === 'pending') {
            allNotifications.push({
              id: notificationId,
              title: '💸 Retrait initié',
              message: `Demande de retrait de ${withdrawal.amount?.toLocaleString('fr-FR') || 0} FCFA créée`,
              type: 'withdrawal_completed',
              priority: 'normal',
              amount: withdrawal.amount,
              created_at: withdrawal.created_at,
              read: false
            });
          }
        }
      });

      // Trier par date décroissante et ne garder que les non lues
      const unreadNotifications = allNotifications
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      setNotifications(unreadNotifications);
      console.log(`✅ ${unreadNotifications.length} notifications non lues chargées`);

    } catch (error) {
      console.error('❌ Erreur lors du chargement des notifications:', error);
    }
  };

  // Configuration de l'écoute temps réel avec reconnexion automatique
  const setupRealtimeConnection = () => {
    if (!user?.id) return;

    console.log('🔗 Configuration connexion temps réel pour:', user.id);

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channelName = `notifications_${user.id}_${Date.now()}`;
    channelRef.current = supabase.channel(channelName);

    // Écouter les nouveaux transferts reçus
    channelRef.current.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'transfers'
      },
      async (payload: any) => {
        console.log('🎯 Nouveau transfert détecté:', payload.new);
        
        const transfer = payload.new;
        
        if (transfer.recipient_phone === user.phone && transfer.status === 'completed') {
          console.log('✅ Transfert confirmé pour utilisateur actuel');
          
          const readIds = getReadNotificationIds();
          const notificationId = `transfer_${transfer.id}`;
          
          // Ne pas afficher si déjà lu
          if (readIds.has(notificationId)) return;
          
          const notification: UnifiedNotification = {
            id: notificationId,
            title: '💰 Argent reçu !',
            message: `Vous avez reçu ${transfer.amount?.toLocaleString('fr-FR') || 0} FCFA`,
            type: 'transfer_received',
            priority: 'high',
            amount: transfer.amount,
            created_at: transfer.created_at,
            read: false
          };

          setNotifications(prev => [notification, ...prev.slice(0, 9)]);
          showNotificationToast(notification);
        }
      }
    );

    // Écouter les nouvelles recharges et mises à jour
    channelRef.current.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'recharges',
        filter: `user_id=eq.${user.id}`
      },
      (payload: any) => {
        console.log('💳 Changement recharge détecté:', payload);
        
        const recharge = payload.new || payload.old;
        if (!recharge) return;

        const readIds = getReadNotificationIds();

        if (payload.eventType === 'INSERT') {
          const notificationId = `recharge_${recharge.id}`;
          
          if (readIds.has(notificationId)) return;
          
          const notification: UnifiedNotification = {
            id: notificationId,
            title: '💳 Recharge initiée',
            message: `Recharge de ${recharge.amount?.toLocaleString('fr-FR') || 0} FCFA en cours de traitement`,
            type: 'recharge_completed',
            priority: 'normal',
            amount: recharge.amount,
            created_at: new Date().toISOString(),
            read: false
          };

          setNotifications(prev => [notification, ...prev.slice(0, 9)]);
          showNotificationToast(notification);
        } else if (payload.eventType === 'UPDATE' && recharge.status === 'completed') {
          const notificationId = `recharge_${recharge.id}_completed`;
          
          if (readIds.has(notificationId)) return;
          
          const notification: UnifiedNotification = {
            id: notificationId,
            title: '✅ Recharge confirmée !',
            message: `Votre recharge de ${recharge.amount?.toLocaleString('fr-FR') || 0} FCFA a été confirmée`,
            type: 'recharge_completed',
            priority: 'high',
            amount: recharge.amount,
            created_at: new Date().toISOString(),
            read: false
          };

          setNotifications(prev => [notification, ...prev.slice(0, 9)]);
          showNotificationToast(notification);
        }
      }
    );

    // Écouter les nouveaux retraits
    channelRef.current.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'withdrawals',
        filter: `user_id=eq.${user.id}`
      },
      (payload: any) => {
        console.log('💸 Nouveau retrait détecté:', payload.new);
        
        const withdrawal = payload.new;
        
        const readIds = getReadNotificationIds();
        const notificationId = `withdrawal_${withdrawal.id}`;
        
        if (readIds.has(notificationId)) return;
        
        const notification: UnifiedNotification = {
          id: notificationId,
          title: '💸 Retrait initié',
          message: `Demande de retrait de ${withdrawal.amount?.toLocaleString('fr-FR') || 0} FCFA créée`,
          type: 'withdrawal_completed',
          priority: 'normal',
          amount: withdrawal.amount,
          created_at: withdrawal.created_at,
          read: false
        };

        setNotifications(prev => [notification, ...prev.slice(0, 9)]);
        showNotificationToast(notification);
      }
    );

    // Écouter les mises à jour des retraits
    channelRef.current.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'withdrawals',
        filter: `user_id=eq.${user.id}`
      },
      (payload: any) => {
        console.log('💸 Retrait mis à jour:', payload.new);
        
        const withdrawal = payload.new;
        
        if (withdrawal.status === 'completed') {
          const readIds = getReadNotificationIds();
          const notificationId = `withdrawal_update_${withdrawal.id}`;
          
          if (readIds.has(notificationId)) return;
          
          const notification: UnifiedNotification = {
            id: notificationId,
            title: '✅ Retrait confirmé',
            message: `Votre retrait de ${withdrawal.amount?.toLocaleString('fr-FR') || 0} FCFA a été traité avec succès`,
            type: 'withdrawal_completed',
            priority: 'high',
            amount: withdrawal.amount,
            created_at: new Date().toISOString(),
            read: false
          };

          setNotifications(prev => [notification, ...prev.slice(0, 9)]);
          showNotificationToast(notification);
        }
      }
    );

    // Écouter les nouvelles notifications admin
    channelRef.current.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notification_recipients',
        filter: `user_id=eq.${user.id}`
      },
      async (payload: any) => {
        console.log('📢 Nouvelle notification admin détectée:', payload.new);
        
        try {
          const { data: notification, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('id', payload.new.notification_id)
            .single();

          if (error || !notification) {
            console.error('Erreur récupération notification:', error);
            return;
          }

          const readIds = getReadNotificationIds();
          const notificationId = `admin_${notification.id}`;
          
          if (readIds.has(notificationId)) return;

          const unifiedNotification: UnifiedNotification = {
            id: notificationId,
            title: notification.title,
            message: notification.message,
            type: 'admin_message',
            priority: notification.priority as any,
            created_at: notification.created_at,
            read: false
          };

          setNotifications(prev => [unifiedNotification, ...prev.slice(0, 9)]);
          showNotificationToast(unifiedNotification);
        } catch (error) {
          console.error('Erreur traitement notification admin:', error);
        }
      }
    );

    // S'abonner au canal
    channelRef.current.subscribe((status: string) => {
      console.log('📡 Statut connexion notifications:', status);
      setIsConnected(status === 'SUBSCRIBED');
      
      if (status === 'CLOSED') {
        console.log('🔄 Connexion fermée, programmation reconnexion...');
        setIsConnected(false);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          setupRealtimeConnection();
        }, 3000);
      }
    });
  };

  // Initialisation
  useEffect(() => {
    if (user?.id) {
      console.log('🚀 Initialisation système notifications unifié');
      loadRecentNotifications();
      setupRealtimeConnection();
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [user?.id, user?.phone, user?.email]);

  // Marquer une notification comme lue
  const markAsRead = (notificationId: string) => {
    const readIds = getReadNotificationIds();
    readIds.add(notificationId);
    saveReadNotificationIds(readIds);
    
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  // Marquer toutes comme lues
  const markAllAsRead = () => {
    const readIds = getReadNotificationIds();
    notifications.forEach(n => readIds.add(n.id));
    saveReadNotificationIds(readIds);
    
    setNotifications([]);
  };

  // Forcer le rechargement
  const refresh = () => {
    loadRecentNotifications();
  };

  const unreadCount = notifications.length;

  return {
    notifications: notifications.slice(0, 10),
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    refresh
  };
};
