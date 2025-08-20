
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UnifiedNotification {
  id: string;
  title: string;
  message: string;
  type: 'transfer_received' | 'withdrawal_completed' | 'withdrawal_created' | 'admin_message' | 'system';
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
      : notification.type.includes('withdrawal')
      ? 'bg-blue-50 border-blue-200 text-blue-800'
      : 'bg-purple-50 border-purple-200 text-purple-800';

    toast({
      title: notification.title,
      description: notification.message,
      duration: notification.priority === 'high' ? 10000 : 5000,
      className: bgColor
    });
  };

  // Charger les notifications depuis la base de données
  const loadNotifications = async () => {
    if (!user?.id) return;

    console.log('📥 Chargement des notifications pour:', user.id);

    try {
      const readIds = getReadNotificationIds();

      // Charger les notifications récentes depuis la base de données
      const { data: notificationRecipients, error } = await supabase
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
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // 7 jours
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur chargement notifications:', error);
        return;
      }

      // Transformer en notifications unifiées
      const unifiedNotifications: UnifiedNotification[] = [];

      notificationRecipients?.forEach(recipient => {
        if (recipient.notifications && !Array.isArray(recipient.notifications)) {
          const notification = recipient.notifications as any;
          const notificationId = `db_${notification.id}`;
          
          if (!readIds.has(notificationId)) {
            // Extraire le montant du message si possible
            let amount: number | undefined;
            const amountMatch = notification.message.match(/(\d+(?:\.\d+)?)\s*(?:XAF|FCFA)/i);
            if (amountMatch) {
              amount = parseFloat(amountMatch[1].replace(/\s/g, ''));
            }

            unifiedNotifications.push({
              id: notificationId,
              title: notification.title,
              message: notification.message,
              type: notification.notification_type as any || 'system',
              priority: notification.priority as any,
              amount,
              created_at: notification.created_at,
              read: !!recipient.read_at || readIds.has(notificationId)
            });
          }
        }
      });

      // Trier par date décroissante et filtrer les lues
      const unreadNotifications = unifiedNotifications
        .filter(n => !n.read)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(unreadNotifications);
      console.log(`✅ ${unreadNotifications.length} notifications non lues chargées`);

    } catch (error) {
      console.error('❌ Erreur lors du chargement des notifications:', error);
    }
  };

  // Configuration de l'écoute temps réel
  const setupRealtimeConnection = () => {
    if (!user?.id) return;

    console.log('🔗 Configuration connexion temps réel pour:', user.id);

    // Nettoyer l'ancien canal s'il existe
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Créer un nouveau canal avec un nom unique
    const channelName = `notifications_${user.id}_${Date.now()}`;
    channelRef.current = supabase.channel(channelName);

    // Écouter les nouvelles entrées dans notification_recipients pour cet utilisateur
    channelRef.current.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notification_recipients',
        filter: `user_id=eq.${user.id}`
      },
      async (payload: any) => {
        console.log('🔔 Nouvelle notification reçue:', payload.new);
        
        try {
          // Récupérer les détails de la notification
          const { data: notification, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('id', payload.new.notification_id)
            .single();

          if (error || !notification) {
            console.error('Erreur récupération notification:', error);
            return;
          }

          console.log('📢 Détails notification:', notification);

          // Extraire le montant du message si possible
          let amount: number | undefined;
          const amountMatch = notification.message.match(/(\d+(?:\.\d+)?)\s*(?:XAF|FCFA)/i);
          if (amountMatch) {
            amount = parseFloat(amountMatch[1].replace(/\s/g, ''));
          }

          const unifiedNotification: UnifiedNotification = {
            id: `db_${notification.id}`,
            title: notification.title,
            message: notification.message,
            type: notification.notification_type as any || 'system',
            priority: notification.priority as any,
            amount,
            created_at: notification.created_at,
            read: false
          };

          // Ajouter à la liste des notifications
          setNotifications(prev => [unifiedNotification, ...prev.slice(0, 9)]);
          
          // Afficher le toast
          showNotificationToast(unifiedNotification);
          
        } catch (error) {
          console.error('Erreur traitement nouvelle notification:', error);
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
        
        // Réessayer la connexion après 3 secondes
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
      loadNotifications();
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
  }, [user?.id]);

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
    loadNotifications();
  };

  const unreadCount = notifications.length;

  return {
    notifications: notifications.slice(0, 10), // Limiter à 10 notifications
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    refresh
  };
};
