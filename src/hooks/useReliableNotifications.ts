
import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReliableNotification {
  id: string;
  title: string;
  message: string;
  type: 'transfer_received' | 'withdrawal_completed' | 'withdrawal_created' | 'admin_message' | 'system';
  priority: 'low' | 'normal' | 'high';
  amount?: number;
  created_at: string;
  read: boolean;
}

export const useReliableNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<ReliableNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  
  const channelRef = useRef<any>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout>();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const connectionCheckRef = useRef<NodeJS.Timeout>();

  // Clé pour localStorage
  const getReadNotificationsKey = () => `readNotifications_${user?.id}`;
  const getLastCheckKey = () => `lastNotificationCheck_${user?.id}`;

  // Gestion du localStorage avec gestion d'erreurs
  const getReadNotificationIds = (): Set<string> => {
    try {
      const stored = localStorage.getItem(getReadNotificationsKey());
      return new Set(stored ? JSON.parse(stored) : []);
    } catch {
      return new Set();
    }
  };

  const saveReadNotificationIds = (readIds: Set<string>) => {
    try {
      localStorage.setItem(getReadNotificationsKey(), JSON.stringify([...readIds]));
    } catch (error) {
      console.error('Erreur sauvegarde notifications lues:', error);
    }
  };

  const getLastCheckTime = (): Date => {
    try {
      const stored = localStorage.getItem(getLastCheckKey());
      return stored ? new Date(stored) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    } catch {
      return new Date(Date.now() - 24 * 60 * 60 * 1000);
    }
  };

  const saveLastCheckTime = (time: Date) => {
    try {
      localStorage.setItem(getLastCheckKey(), time.toISOString());
    } catch (error) {
      console.error('Erreur sauvegarde temps vérification:', error);
    }
  };

  // Afficher une notification avec tous les effets
  const showNotificationToast = useCallback((notification: ReliableNotification) => {
    console.log('🔔 Affichage notification fiable:', notification.title);
    
    // Vibration
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 400]);
    }

    // Son
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcCjWH0fPTgjEGJXfK7+OUQw==');
      audio.volume = 0.4;
      audio.play().catch(() => {});
    } catch {}

    // Toast avec couleurs appropriées
    const bgColor = notification.type === 'transfer_received' 
      ? 'bg-green-50 border-green-200 text-green-800'
      : notification.type.includes('withdrawal')
      ? 'bg-blue-50 border-blue-200 text-blue-800'
      : 'bg-purple-50 border-purple-200 text-purple-800';

    toast({
      title: notification.title,
      description: notification.message,
      duration: notification.priority === 'high' ? 12000 : 6000,
      className: bgColor
    });
  }, [toast]);

  // Charger les notifications avec retry automatique
  const loadNotifications = useCallback(async (retryCount = 0): Promise<void> => {
    if (!user?.id) return;

    console.log(`📥 Chargement notifications (tentative ${retryCount + 1})`);

    try {
      const readIds = getReadNotificationIds();
      const lastCheckTime = getLastCheckTime();

      // Charger depuis la base de données avec un délai plus large
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
        .gte('notifications.created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()) // 48h au lieu de 7 jours pour plus de rapidité
        .order('notifications.created_at', { ascending: false })
        .limit(20);

      if (error) {
        throw error;
      }

      // Transformer en notifications
      const unifiedNotifications: ReliableNotification[] = [];
      const newNotifications: ReliableNotification[] = [];

      notificationRecipients?.forEach(recipient => {
        if (recipient.notifications && !Array.isArray(recipient.notifications)) {
          const notification = recipient.notifications as any;
          const notificationId = `db_${notification.id}`;
          const notificationDate = new Date(notification.created_at);
          
          // Extraire le montant
          let amount: number | undefined;
          const amountMatch = notification.message.match(/(\d+(?:\.\d+)?)\s*(?:XAF|FCFA)/i);
          if (amountMatch) {
            amount = parseFloat(amountMatch[1].replace(/\s/g, ''));
          }

          const unifiedNotification: ReliableNotification = {
            id: notificationId,
            title: notification.title,
            message: notification.message,
            type: notification.notification_type as any || 'system',
            priority: notification.priority as any,
            amount,
            created_at: notification.created_at,
            read: !!recipient.read_at || readIds.has(notificationId)
          };

          unifiedNotifications.push(unifiedNotification);

          // Détecter les nouvelles notifications depuis la dernière vérification
          if (notificationDate > lastCheckTime && !unifiedNotification.read) {
            newNotifications.push(unifiedNotification);
          }
        }
      });

      // Trier par date décroissante
      const sortedNotifications = unifiedNotifications
        .filter(n => !n.read)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(sortedNotifications);

      // Afficher les nouvelles notifications
      newNotifications.forEach(notification => {
        showNotificationToast(notification);
      });

      // Sauvegarder le temps de vérification
      const now = new Date();
      setLastCheck(now);
      saveLastCheckTime(now);

      console.log(`✅ ${sortedNotifications.length} notifications chargées, ${newNotifications.length} nouvelles`);

    } catch (error: any) {
      console.error(`❌ Erreur chargement notifications (tentative ${retryCount + 1}):`, error);
      
      // Retry automatique avec backoff exponentiel
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 2000; // 2s, 4s, 8s
        setTimeout(() => loadNotifications(retryCount + 1), delay);
      }
    }
  }, [user?.id, showNotificationToast]);

  // Configuration temps réel avec reconnexion automatique
  const setupRealtimeConnection = useCallback(() => {
    if (!user?.id) return;

    console.log('🔗 Configuration connexion temps réel robuste');

    // Nettoyer l'ancien canal
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Créer un nouveau canal avec un nom unique
    const channelName = `reliable_notifications_${user.id}_${Date.now()}`;
    channelRef.current = supabase.channel(channelName, {
      config: {
        presence: { key: user.id },
        broadcast: { self: true }
      }
    });

    // Écouter les nouvelles notifications
    channelRef.current.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notification_recipients',
        filter: `user_id=eq.${user.id}`
      },
      async (payload: any) => {
        console.log('🔔 Notification temps réel reçue:', payload.new);
        
        // Petite pause pour s'assurer que la notification est bien en base
        setTimeout(() => loadNotifications(), 500);
      }
    );

    // S'abonner au canal avec gestion d'état
    channelRef.current.subscribe((status: string) => {
      console.log('📡 Statut connexion notifications:', status);
      setIsConnected(status === 'SUBSCRIBED');
      
      if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        setIsConnected(false);
        
        // Reconnexion automatique après 3 secondes
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Reconnexion automatique...');
          setupRealtimeConnection();
        }, 3000);
      }
    });
  }, [user?.id, loadNotifications]);

  // Polling de sauvegarde toutes les 30 secondes
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(() => {
      console.log('🔄 Vérification polling des notifications');
      loadNotifications();
    }, 30000); // 30 secondes
  }, [loadNotifications]);

  // Vérification de connexion toutes les 5 secondes
  const startConnectionCheck = useCallback(() => {
    if (connectionCheckRef.current) {
      clearInterval(connectionCheckRef.current);
    }

    connectionCheckRef.current = setInterval(() => {
      if (!isConnected && user?.id) {
        console.log('🔍 Connexion perdue, tentative de reconnexion');
        setupRealtimeConnection();
      }
    }, 5000);
  }, [isConnected, user?.id, setupRealtimeConnection]);

  // Initialisation
  useEffect(() => {
    if (user?.id) {
      console.log('🚀 Initialisation système notifications fiable');
      loadNotifications();
      setupRealtimeConnection();
      startPolling();
      startConnectionCheck();
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (connectionCheckRef.current) {
        clearInterval(connectionCheckRef.current);
      }
    };
  }, [user?.id, loadNotifications, setupRealtimeConnection, startPolling, startConnectionCheck]);

  // Marquer comme lue
  const markAsRead = useCallback((notificationId: string) => {
    const readIds = getReadNotificationIds();
    readIds.add(notificationId);
    saveReadNotificationIds(readIds);
    
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  // Marquer toutes comme lues
  const markAllAsRead = useCallback(() => {
    const readIds = getReadNotificationIds();
    notifications.forEach(n => readIds.add(n.id));
    saveReadNotificationIds(readIds);
    
    setNotifications([]);
  }, [notifications]);

  // Forcer le rechargement
  const refresh = useCallback(() => {
    console.log('🔄 Rechargement forcé des notifications');
    loadNotifications();
  }, [loadNotifications]);

  return {
    notifications: notifications.slice(0, 10),
    unreadCount: notifications.length,
    isConnected,
    lastCheck,
    markAsRead,
    markAllAsRead,
    refresh
  };
};
