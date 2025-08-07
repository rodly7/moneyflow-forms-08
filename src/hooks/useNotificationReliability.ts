
import { useEffect, useRef } from 'react';
import { NotificationService } from '@/services/notificationService';

// Hook pour améliorer la fiabilité des notifications
export const useNotificationReliability = () => {
  const retryIntervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Vérifier et renvoyer les notifications non livrées toutes les 2 minutes
    const startRetryService = () => {
      retryIntervalRef.current = setInterval(async () => {
        try {
          await NotificationService.retryFailedNotifications();
        } catch (error) {
          console.error('Erreur dans le service de retry des notifications:', error);
        }
      }, 2 * 60 * 1000); // 2 minutes
    };

    startRetryService();

    return () => {
      if (retryIntervalRef.current) {
        clearInterval(retryIntervalRef.current);
      }
    };
  }, []);

  return {
    retryFailedNotifications: () => NotificationService.retryFailedNotifications()
  };
};
