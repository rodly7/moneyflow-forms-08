
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

      // Charger les retraits récents (où l'utilisateur est le client)
      const { data: withdrawals, error: withdrawalError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (withdrawalError) {
        console.error('Erreur chargement retraits:', withdrawalError);
      }

      // Charger les retraits récents (où l'utilisateur est l'agent/merchant)
      const { data: agentWithdrawals, error: agentWithdrawalError } = await (supabase as any)
        .from('withdrawals')
        .select('id, amount, status, created_at, agent_id, user_id')
        .eq('agent_id', user.id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (agentWithdrawalError) {
        console.error('Erreur chargement retraits agent:', agentWithdrawalError);
      }

      // Ajouter les notifications admin (seulement si non lues ET non marquées comme lues en BDD)
      adminNotifications?.forEach(item => {
        if (item.notifications && !Array.isArray(item.notifications)) {
          const notification = item.notifications as any;
          const notificationId = `admin_${notification.id}`;
          
          // Ne pas ajouter si déjà marquée comme lue dans localStorage OU dans la BDD
          const isReadInStorage = readIds.has(notificationId);
          const isReadInDb = item.read_at !== null;
          
          if (!isReadInStorage && !isReadInDb) {
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

      // Ajouter les notifications de transferts reçus (seulement si non lues)
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

      // Ajouter les notifications de recharges (seulement si non lues)
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

      // Ajouter les notifications de retraits (client)
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

      // Ajouter les notifications de retraits (agent/merchant)
      agentWithdrawals?.forEach((withdrawal: any) => {
        const notificationId = `agent_withdrawal_${withdrawal.id}`;
        if (!readIds.has(notificationId)) {
          if (withdrawal.status === 'completed') {
            allNotifications.push({
              id: notificationId,
              title: '💼 Retrait client confirmé',
              message: `Retrait client de ${Number(withdrawal.amount || 0).toLocaleString('fr-FR')} FCFA effectué`,
              type: 'withdrawal_completed',
              priority: 'high',
              amount: Number(withdrawal.amount) || 0,
              created_at: withdrawal.created_at,
              read: false
            });
          } else if (withdrawal.status === 'pending') {
            allNotifications.push({
              id: notificationId,
              title: '⏳ Retrait client en attente',
              message: `Retrait client de ${Number(withdrawal.amount || 0).toLocaleString('fr-FR')} FCFA en cours`,
              type: 'withdrawal_completed',
              priority: 'normal',
              amount: Number(withdrawal.amount) || 0,
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
      
      if (unreadNotifications.length === 0) {
        console.log('🔕 Aucune notification non lue trouvée');
      } else {
        console.log('📋 Types de notifications:', unreadNotifications.map(n => `${n.type}:${n.id}`).join(', '));
      }

    } catch (error) {
      console.error('❌ Erreur lors du chargement des notifications:', error);
    }
  };

  // Configuration de l'écoute temps réel plus robuste
  const setupRealtimeConnection = () => {
    if (!user?.id) return;

    console.log('🔗 Configuration connexion temps réel pour:', user.id);

    // Nettoyer l'ancien canal
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Limiter les reconnexions automatiques
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const channelName = `notifications_${user.id}`;
    channelRef.current = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    // Écouter les nouveaux transferts reçus avec gestion d'erreur
    channelRef.current.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'transfers'
      },
      async (payload: any) => {
        try {
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
        } catch (error) {
          console.error('❌ Erreur traitement transfert:', error);
        }
      }
    );

    // Écouter les retraits effectués par l'agent (merchant)
    channelRef.current.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'withdrawals',
        filter: `agent_id=eq.${user.id}`
      },
      (payload: any) => {
        try {
          const row = payload.new as any;
          if (!row) return;
          const amt = Number(row.amount) || 0;
          const baseNotification = {
            id: `agent_withdrawal_${row.id}`,
            type: 'withdrawal_completed' as const,
            priority: 'high' as const,
            amount: amt,
            created_at: row.created_at,
            read: false
          };

          if (row.status === 'completed') {
            const notification: UnifiedNotification = {
              ...baseNotification,
              title: '💼 Retrait client confirmé',
              message: `Retrait client de ${amt.toLocaleString('fr-FR')} FCFA effectué`
            };
            setNotifications(prev => [notification, ...prev.slice(0, 9)]);
            showNotificationToast(notification);
          } else if (row.status === 'pending') {
            const notification: UnifiedNotification = {
              ...baseNotification,
              title: '⏳ Retrait client en attente',
              message: `Retrait client de ${amt.toLocaleString('fr-FR')} FCFA en cours`
            };
            setNotifications(prev => [notification, ...prev.slice(0, 9)]);
            showNotificationToast(notification);
          }
        } catch (e) {
          console.error('❌ Erreur traitement retrait agent:', e);
        }
      }
    );

    // Écouter les retraits du client (utilisateur)
    channelRef.current.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'withdrawals',
        filter: `user_id=eq.${user.id}`
      },
      (payload: any) => {
        try {
          const row = payload.new as any;
          if (!row) return;
          const amt = Number(row.amount) || 0;

          const baseNotification = {
            id: `withdrawal_${row.id}`,
            type: 'withdrawal_completed' as const,
            priority: row.status === 'completed' ? ('high' as const) : ('normal' as const),
            amount: amt,
            created_at: row.created_at,
            read: false
          };

          if (row.status === 'completed') {
            const notification: UnifiedNotification = {
              ...baseNotification,
              title: '✅ Retrait confirmé',
              message: `Retrait de ${amt.toLocaleString('fr-FR')} FCFA confirmé avec succès`
            };
            setNotifications(prev => [notification, ...prev.slice(0, 9)]);
            showNotificationToast(notification);
          } else if (row.status === 'pending') {
            const notification: UnifiedNotification = {
              ...baseNotification,
              title: '💸 Retrait initié',
              message: `Demande de retrait de ${amt.toLocaleString('fr-FR')} FCFA créée`
            };
            setNotifications(prev => [notification, ...prev.slice(0, 9)]);
            showNotificationToast(notification);
          }
        } catch (e) {
          console.error('❌ Erreur traitement retrait client:', e);
        }
      }
    );

    // S'abonner au canal avec gestion d'erreur améliorée
    channelRef.current.subscribe((status: string) => {
      console.log('📡 Statut connexion notifications:', status);
      setIsConnected(status === 'SUBSCRIBED');
      
      if (status === 'CLOSED') {
        console.log('🔄 Connexion fermée, programmation reconnexion...');
        setIsConnected(false);
        
        // Limiter les reconnexions à une toutes les 10 secondes
        reconnectTimeoutRef.current = setTimeout(() => {
          if (user?.id) {
            setupRealtimeConnection();
          }
        }, 10000); // 10 secondes au lieu de 3
      }
    });
  };

  // Rafraîchissement automatique des notifications toutes les 30 secondes
  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(() => {
      console.log('🔄 Actualisation automatique des notifications');
      loadRecentNotifications();
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, [user?.id]);

  // Initialisation avec résilience améliorée
  useEffect(() => {
    if (user?.id) {
      console.log('🚀 Initialisation système notifications unifié');
      loadRecentNotifications();
      
      // Délai avant d'établir la connexion temps réel
      const timer = setTimeout(() => {
        setupRealtimeConnection();
      }, 2000);

      return () => {
        clearTimeout(timer);
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
        }
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };
    }
  }, [user?.id, user?.phone, user?.email]);

  // Marquer une notification comme lue avec persistance complète
  const markAsRead = async (notificationId: string) => {
    try {
      // Marquer dans localStorage
      const readIds = getReadNotificationIds();
      readIds.add(notificationId);
      saveReadNotificationIds(readIds);
      
      // Si c'est une notification admin, marquer dans la base de données aussi
      if (notificationId.startsWith('admin_') && user?.id) {
        const adminNotificationId = notificationId.replace('admin_', '');
        await supabase
          .from('notification_recipients')
          .update({ read_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('notification_id', adminNotificationId);
      }
      
      // Retirer de la liste affichée
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      console.log(`✅ Notification ${notificationId} marquée comme lue et supprimée`);
    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error);
    }
  };

  // Marquer toutes les notifications comme lues
  const markAllAsRead = async () => {
    try {
      const readIds = getReadNotificationIds();
      const adminNotificationIds: string[] = [];
      
      // Collecter les IDs et marquer dans localStorage
      notifications.forEach(notification => {
        readIds.add(notification.id);
        if (notification.id.startsWith('admin_')) {
          adminNotificationIds.push(notification.id.replace('admin_', ''));
        }
      });
      
      saveReadNotificationIds(readIds);
      
      // Marquer les notifications admin dans la base de données
      if (adminNotificationIds.length > 0 && user?.id) {
        await supabase
          .from('notification_recipients')
          .update({ read_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .in('notification_id', adminNotificationIds);
      }
      
      // Vider la liste des notifications
      setNotifications([]);
      
      console.log(`✅ Toutes les notifications marquées comme lues et supprimées`);
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications:', error);
    }
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
