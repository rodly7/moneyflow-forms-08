import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getCurrencyForCountry, convertCurrency } from "@/lib/utils/currency";
import { Bell, X, CheckCircle, AlertTriangle, Info, DollarSign } from "lucide-react";

interface Notification {
  id: string;
  created_at: string;
  type: 'transfer' | 'deposit' | 'withdrawal' | 'system';
  message: string;
  user_id: string;
  is_read: boolean;
  amount?: number;
  currency?: string;
}

interface EnhancedNotificationSystemProps {
  userId: string | undefined;
}

export const EnhancedNotificationSystem: React.FC<EnhancedNotificationSystemProps> = ({ userId }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const { data: profile, refetch: refetchProfile } = useQuery(
    ['profile', userId],
    async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) {
        console.error("Error fetching profile:", error);
        throw error;
      }
      return data;
    },
    {
      enabled: !!userId,
    }
  );

  const { data, refetch } = useQuery(
    ['notifications', userId],
    async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) {
        console.error("Error fetching notifications:", error);
        throw error;
      }
      return data;
    },
    {
      enabled: !!userId,
    }
  );

  useEffect(() => {
    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(notification => !notification.is_read).length);
    }
  }, [data]);

  useEffect(() => {
    // Subscribe to real-time updates
    if (!userId) return;

    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          console.log('Change received!', payload)
          refetch(); // Refresh notifications
          refetchProfile(); // Refresh profile
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, refetch, refetchProfile]);

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (error) {
      console.error("Error marking as read:", error);
    } else {
      setNotifications(
        notifications.map((notification) =>
          notification.id === id ? { ...notification, is_read: true } : notification
        )
      );
      setUnreadCount(unreadCount - 1);
      refetch();
    }
  };

  const clearAll = async () => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId);

    if (error) {
      console.error("Error clearing all notifications:", error);
    } else {
      setNotifications(
        notifications.map((notification) => ({ ...notification, is_read: true }))
      );
      setUnreadCount(0);
      refetch();
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'transfer':
        return <DollarSign className="h-4 w-4 text-blue-500" />;
      case 'deposit':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'withdrawal':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'transfer':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'deposit':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'withdrawal':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!userId) {
    return <div>Loading...</div>;
  }

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 rounded-full px-2 py-0 text-xs">
            {unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            <div className="px-4 py-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Notifications</span>
              <Button variant="ghost" size="sm" onClick={clearAll}>
                Tout effacer
              </Button>
            </div>
            {notifications.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500">
                Aucune notification
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="px-4 py-2 text-sm hover:bg-gray-100 flex items-center justify-between"
                  role="menuitem"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-1 rounded-full ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{notification.message}</p>
                      <p className="text-xs text-gray-500">{formatDate(notification.created_at)}</p>
                      {notification.amount && notification.currency && (
                        <p className="text-xs text-gray-500">
                          Montant: {formatCurrency(notification.amount, notification.currency)}
                        </p>
                      )}
                    </div>
                  </div>
                  {!notification.is_read && (
                    <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
