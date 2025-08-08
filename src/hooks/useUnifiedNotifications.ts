
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UnifiedNotification {
  id: string;
  title: string;
  message: string;
  type: 'transfer_received' | 'withdrawal_completed' | 'admin_message' | 'system';
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
      : notification.type === 'withdrawal_completed'
      ? 'bg-blue-50 border-blue-200 text-blue-800'
      : 'bg-purple-50 border-purple-200 text-purple-800';

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

    console.log('📥 Chargement des notifications récentes pour:', user.id);

    try {
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
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (adminError) {
        console.error('Erreur chargement notifications admin:', adminError);
      }

      // Charger les transferts reçus récents
      const { data: transfers, error: transferError } = await supabase
        .from('transfers')
        .select('*')
        .or(`recipient_phone.eq.${user.phone},recipient_email.eq.${user.email}`)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (transferError) {
        console.error('Erreur chargement transferts:', transferError);
      }

      // Charger les retraits récents
      const { data: withdrawals, error: withdrawalError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (withdrawalError) {
        console.error('Erreur chargement retraits:', withdrawalError);
      }

      // Combiner toutes les notifications
      const allNotifications: UnifiedNotification[] = [];

      // Ajouter les notifications admin
      adminNotifications?.forEach(item => {
        if (item.notifications) {
          allNotifications.push({
            id: `admin_${item.notifications.id}`,
            title: item.notifications.title,
            message: item.notifications.message,
            type: 'admin_message',
            priority: item.notifications.priority as any,
            created_at: item.notifications.created_at,
            read: !!item.read_at
          });
        }
      });

      // Ajouter les notifications de transferts
      transfers?.forEach(transfer => {
        allNotifications.push({
          id: `transfer_${transfer.id}`,
          title: '💰 Argent reçu',
          message: `Vous avez reçu ${transfer.amount?.toLocaleString('fr-FR')} FCFA`,
          type: 'transfer_received',
          priority: 'high',
          amount: transfer.amount,
          created_at: transfer.created_at,
          read: false
        });
      });

      // Ajouter les notifications de retraits
      withdrawals?.forEach(withdrawal => {
        allNotifications.push({
          id: `withdrawal_${withdrawal.id}`,
          title: '💳 Retrait effectué',
          message: `Retrait de ${withdrawal.amount?.toLocaleString('fr-FR')} FCFA ${withdrawal.status === 'completed' ? 'réussi' : 'en cours'}`,
          type: 'withdrawal_completed',
          priority: 'normal',
          amount: withdrawal.amount,
          created_at: withdrawal.created_at,
          read: false
        });
      });

      // Trier par date décroissante
      allNotifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(allNotifications);
      console.log(`✅ ${allNotifications.length} notifications chargées`);

    } catch (error) {
      console.error('❌ Erreur lors du chargement des notifications:', error);
    }
  };

  // Configuration de l'écoute temps réel avec reconnexion automatique
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
        
        // Vérifier si c'est pour l'utilisateur actuel
        if (transfer.recipient_phone === user.phone || transfer.recipient_email === user.email) {
          console.log('✅ Transfert confirmé pour utilisateur actuel');
          
          const notification: UnifiedNotification = {
            id: `transfer_${transfer.id}`,
            title: '💰 Argent reçu !',
            message: `Vous avez reçu ${transfer.amount?.toLocaleString('fr-FR')} FCFA`,
            type: 'transfer_received',
            priority: 'high',
            amount: transfer.amount,
            created_at: transfer.created_at,
            read: false
          };

          // Ajouter à la liste
          setNotifications(prev => [notification, ...prev.slice(0, 9)]);
          
          // Afficher le toast
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
        
        const notification: UnifiedNotification = {
          id: `withdrawal_${withdrawal.id}`,
          title: '💳 Retrait confirmé',
          message: `Retrait de ${withdrawal.amount?.toLocaleString('fr-FR')} FCFA traité`,
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

          const unifiedNotification: UnifiedNotification = {
            id: `admin_${notification.id}`,
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
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  // Marquer toutes comme lues
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Forcer le rechargement
  const refresh = () => {
    loadRecentNotifications();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications: notifications.slice(0, 10), // Limiter à 10 notifications
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    refresh
  };
};
