import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Bell, X, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  priority: string;
  created_at: string;
  read_at: string | null;
}

const NotificationSystem = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const fetchNotifications = async (maxRetries: number = 3) => {
    if (!user) return;

    setIsLoading(true);
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Chargement notifications (tentative ${attempt}/${maxRetries})`);
        
        const { data: recipients, error } = await supabase
          .from('notification_recipients')
          .select(`
            notification_id,
            read_at,
            notifications (
              id,
              title,
              message,
              notification_type,
              priority,
              created_at
            )
          `)
          .eq('user_id', user.id)
          .order('sent_at', { ascending: false })
          .limit(20);

        if (error) throw error;

        const formattedNotifications = recipients?.map(recipient => {
          if (!recipient.notifications) return null;
          return {
            id: recipient.notifications.id,
            title: recipient.notifications.title,
            message: recipient.notifications.message,
            notification_type: recipient.notifications.notification_type,
            priority: recipient.notifications.priority,
            created_at: recipient.notifications.created_at,
            read_at: recipient.read_at
          };
        }).filter(Boolean) || [];

        // Filtrer pour ne garder que les notifications non lues pour la cloche
        const unreadNotifications = formattedNotifications.filter(n => !n.read_at);
        
        setNotifications(formattedNotifications);
        setUnreadCount(unreadNotifications.length);
        setRetryCount(0);
        
        console.log(`✅ ${formattedNotifications.length} notifications chargées, ${unreadNotifications.length} non lues`);
        break; // Succès, sortir de la boucle

      } catch (error) {
        lastError = error;
        console.error(`❌ Tentative ${attempt}/${maxRetries} échouée:`, error);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    if (lastError) {
      console.error('❌ Échec définitif du chargement des notifications:', lastError);
      setRetryCount(prev => prev + 1);
    }

    setIsLoading(false);
  };

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notification_recipients')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('notification_id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      default:
        return 'border-l-blue-500';
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Écouter les nouvelles notifications en temps réel avec reconnexion automatique
  useEffect(() => {
    if (!user) return;

    let channel: any = null;
    let reconnectTimer: NodeJS.Timeout;
    let isSubscribed = true;

    const setupRealtimeSubscription = () => {
      console.log('🔗 Configuration écoute temps réel notifications');
      
      channel = supabase
        .channel('notification_changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notification_recipients',
            filter: `user_id=eq.${user.id}`
          },
          async (payload) => {
            if (!isSubscribed) return;
            
            console.log('🔔 Nouvelle notification reçue en temps réel');
            
            try {
              // Récupérer les détails de la notification
              const { data: notification } = await supabase
                .from('notifications')
                .select('*')
                .eq('id', payload.new.notification_id)
                .single();

              if (notification) {
                // Rafraîchir la liste des notifications
                await fetchNotifications();
                
                // Gérer spécialement les notifications d'argent reçu
                if (notification.title === 'Argent reçu' || notification.title.includes('💰')) {
                  toast({
                    title: "💰 " + notification.title,
                    description: notification.message,
                    duration: 10000,
                    action: (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          markAsRead(notification.id);
                          toast({
                            title: "✅ Réception confirmée",
                            description: "Merci d'avoir confirmé la réception",
                            duration: 3000
                          });
                        }}
                      >
                        Confirmer
                      </Button>
                    )
                  });
                } else {
                  toast({
                    title: "Nouvelle notification",
                    description: notification.message,
                  });
                }
              }
            } catch (error) {
              console.error('Erreur lors du traitement de la notification temps réel:', error);
            }
          }
        )
        .subscribe((status) => {
          console.log('📡 Statut subscription notifications:', status);
          
          if (status === 'CLOSED' && isSubscribed) {
            console.log('🔄 Connexion fermée, tentative de reconnexion...');
            reconnectTimer = setTimeout(() => {
              if (isSubscribed) {
                setupRealtimeSubscription();
              }
            }, 5000);
          }
        });
    };

    setupRealtimeSubscription();

    return () => {
      isSubscribed = false;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      if (channel) {
        supabase.removeChannel(channel);
      }
      console.log('🔄 Nettoyage écoute notifications');
    };
  }, [user, toast]);

  // Auto-retry pour les notifications qui n'arrivent pas
  useEffect(() => {
    if (retryCount > 0 && retryCount < 5) {
      const timer = setTimeout(() => {
        console.log(`🔄 Auto-retry ${retryCount}/5 du chargement des notifications`);
        fetchNotifications();
      }, 5000 * retryCount);

      return () => clearTimeout(timer);
    }
  }, [retryCount]);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {showNotifications && (
        <div className="absolute right-0 top-12 w-80 max-h-96 overflow-y-auto bg-white border shadow-lg rounded-lg z-50">
          <div className="p-3 border-b flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex gap-2">
              {retryCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchNotifications()}
                  className="text-xs"
                >
                  Réessayer
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNotifications(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                Chargement...
              </div>
            ) : notifications.filter(n => !n.read_at).length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                Aucune nouvelle notification
                {retryCount > 0 && (
                  <div className="text-xs text-yellow-600 mt-2">
                    Problème de connexion détecté
                  </div>
                )}
              </div>
            ) : (
              // Afficher seulement les notifications non lues
              notifications.filter(n => !n.read_at).map((notification) => (
                <Card
                  key={notification.id}
                  className={`m-2 cursor-pointer border-l-4 ${getPriorityColor(notification.priority)} bg-muted/50 hover:bg-muted transition-colors`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      {getNotificationIcon(notification.notification_type)}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-foreground">{notification.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                        <p className="text-xs text-muted-foreground/60 mt-2">
                          {new Date(notification.created_at).toLocaleString('fr-FR')}
                        </p>
                      </div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSystem;
