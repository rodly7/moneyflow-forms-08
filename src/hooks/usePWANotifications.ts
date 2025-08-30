import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';

export interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

export const usePWANotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>({
    granted: false,
    denied: false,
    default: true
  });
  const [badgeCount, setBadgeCount] = useState(0);

  // Vérifier et demander les permissions
  useEffect(() => {
    checkNotificationPermission();
  }, []);

  const checkNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.log('Ce navigateur ne supporte pas les notifications');
      return;
    }

    const currentPermission = Notification.permission;
    setPermission({
      granted: currentPermission === 'granted',
      denied: currentPermission === 'denied',
      default: currentPermission === 'default'
    });
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      toast({
        title: "Notifications non supportées",
        description: "Votre navigateur ne supporte pas les notifications",
        variant: "destructive"
      });
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      
      setPermission({
        granted,
        denied: permission === 'denied',
        default: permission === 'default'
      });

      if (granted) {
        toast({
          title: "🔔 Notifications activées",
          description: "Vous recevrez désormais les notifications même quand l'app est fermée",
        });
        
        // Enregistrer pour les notifications push si service worker disponible
        await registerForPushNotifications();
      } else {
        toast({
          title: "Notifications refusées",
          description: "Vous pouvez activer les notifications dans les paramètres du navigateur",
          variant: "destructive"
        });
      }

      return granted;
    } catch (error) {
      console.error('Erreur lors de la demande de permission:', error);
      return false;
    }
  };

  const registerForPushNotifications = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications non supportées');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Vérifier si déjà abonné
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('Déjà abonné aux notifications push');
        return;
      }

      // S'abonner aux notifications push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: generateVAPIDKey()
      });

      console.log('Abonné aux notifications push:', subscription);
      
      // Ici vous pourriez envoyer la subscription à votre serveur
      // await sendSubscriptionToServer(subscription);
      
    } catch (error) {
      console.error('Erreur lors de l\'abonnement push:', error);
    }
  };

  // Générer une clé VAPID simple pour les tests
  const generateVAPIDKey = () => {
    return new Uint8Array([
      0x04, 0x37, 0x77, 0xfe, 0x14, 0x32, 0x74, 0xf8, 0x12, 0x0a, 
      0x58, 0x0c, 0x42, 0x2d, 0x4a, 0x1b, 0xc4, 0x5e, 0x32, 0x45,
      0x67, 0x89, 0xab, 0xcd, 0xef, 0x12, 0x34, 0x56, 0x78, 0x9a,
      0xbc, 0xde, 0xf0, 0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde,
      0xf0, 0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0, 0x12,
      0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0, 0x12, 0x34, 0x56,
      0x78, 0x9a, 0xbc, 0xde, 0xf0
    ]);
  };

  // Envoyer une notification locale
  const sendLocalNotification = (title: string, body: string, options: Partial<NotificationOptions> = {}) => {
    if (!permission.granted) {
      console.log('Permission de notification non accordée');
      return;
    }

    const notificationOptions: NotificationOptions = {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      requireInteraction: true,
      ...options
    };

    const notification = new Notification(title, notificationOptions);

    // Fermer automatiquement après 5 secondes
    setTimeout(() => {
      notification.close();
    }, 5000);

    // Incrémenter le badge
    incrementBadge();

    return notification;
  };

  // Gérer le compteur de badge
  const incrementBadge = async () => {
    const newCount = badgeCount + 1;
    setBadgeCount(newCount);
    
    // Mettre à jour le badge via le service worker
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        registration.active?.postMessage({
          type: 'UPDATE_BADGE',
          count: newCount
        });
      } catch (error) {
        console.log('Erreur mise à jour badge:', error);
      }
    }
  };

  const resetBadge = async () => {
    setBadgeCount(0);
    
    // Réinitialiser le badge via le service worker
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        registration.active?.postMessage({
          type: 'RESET_BADGE'
        });
      } catch (error) {
        console.log('Erreur reset badge:', error);
      }
    }
  };

  const getBadgeCount = async (): Promise<number> => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const messageChannel = new MessageChannel();
        
        return new Promise((resolve) => {
          messageChannel.port1.onmessage = (event) => {
            resolve(event.data.count || 0);
          };
          
          registration.active?.postMessage(
            { type: 'GET_BADGE_COUNT' },
            [messageChannel.port2]
          );
        });
      } catch (error) {
        console.log('Erreur récupération badge:', error);
      }
    }
    return badgeCount;
  };

  return {
    permission,
    badgeCount,
    requestPermission,
    sendLocalNotification,
    incrementBadge,
    resetBadge,
    getBadgeCount,
    isSupported: 'Notification' in window
  };
};