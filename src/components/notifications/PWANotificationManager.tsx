import React, { useEffect } from 'react';
import { usePWANotifications } from '@/hooks/usePWANotifications';
import { useUnifiedNotifications } from '@/hooks/useUnifiedNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

export const PWANotificationManager = () => {
  const { user } = useAuth();
  const { 
    permission, 
    badgeCount, 
    requestPermission, 
    sendLocalNotification, 
    resetBadge,
    isSupported 
  } = usePWANotifications();
  
  const { notifications, unreadCount } = useUnifiedNotifications();

  // Demander la permission automatiquement si l'utilisateur est connecté
  useEffect(() => {
    if (user && permission.default && isSupported) {
      // Attendre un peu avant de demander pour ne pas être intrusif
      const timer = setTimeout(() => {
        requestPermission();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [user, permission.default, isSupported]);

  // Écouter les nouvelles notifications et les afficher
  useEffect(() => {
    if (notifications.length > 0 && permission.granted) {
      const latestNotification = notifications[0];
      
      // Vérifier si c'est une nouvelle notification (créée il y a moins de 10 secondes)
      const isNew = new Date().getTime() - new Date(latestNotification.created_at).getTime() < 10000;
      
      if (isNew && !latestNotification.read) {
        // Envoyer une notification native avec son
        sendLocalNotification(
          latestNotification.title,
          latestNotification.message,
          {
            tag: `notification-${latestNotification.id}`,
            data: { notificationId: latestNotification.id },
            requireInteraction: true
          }
        );

        // Jouer un son personnalisé si possible
        playNotificationSound();
      }
    }
  }, [notifications, permission.granted]);

  // Fonction pour jouer un son de notification
  const playNotificationSound = () => {
    try {
      // Créer un son de notification simple avec Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Son de notification agréable
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Impossible de jouer le son:', error);
    }
  };

  // Réinitialiser le badge quand l'utilisateur ouvre l'app
  useEffect(() => {
    if (document.visibilityState === 'visible' && badgeCount > 0) {
      resetBadge();
    }
  }, [document.visibilityState, badgeCount]);

  if (!isSupported) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      {!permission.granted && user && (
        <Button
          onClick={requestPermission}
          variant="outline"
          size="sm"
          className="bg-primary/10 border-primary/20 hover:bg-primary/20"
        >
          <Bell className="w-4 h-4 mr-2" />
          Activer les notifications 📲
        </Button>
      )}
      
      {permission.granted && (unreadCount > 0 || badgeCount > 0) && (
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="relative"
            onClick={() => {
              resetBadge();
              toast({
                title: "📲 Notifications",
                description: `${unreadCount} notification(s) non lue(s)`,
              });
            }}
          >
            <Bell className="w-5 h-5" />
            {(unreadCount > 0 || badgeCount > 0) && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 text-xs p-0 flex items-center justify-center animate-pulse"
              >
                {Math.max(unreadCount, badgeCount)}
              </Badge>
            )}
          </Button>
          
          {permission.granted && (
            <div className="absolute top-0 right-0">
              <Volume2 className="w-3 h-3 text-green-500 animate-pulse" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};