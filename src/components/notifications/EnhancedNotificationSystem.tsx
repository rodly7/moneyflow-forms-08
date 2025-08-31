import React, { useState, useEffect } from 'react';
import { Bell, Check, X, ArrowDownCircle, ArrowUpCircle, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, getCurrencyForCountry, convertCurrency } from '@/lib/utils/currency';

interface Notification {
  id: string;
  type: 'transfer_received' | 'withdrawal_completed' | 'bill_paid' | 'general';
  title: string;
  message: string;
  amount?: number;
  created_at: string;
  read: boolean;
}

const EnhancedNotificationSystem = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Récupérer les transferts reçus récents
  const { data: receivedTransfers } = useQuery({
    queryKey: ['received-transfers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('transfers')
        .select('*')
        .eq('recipient_phone', user.phone)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    refetchInterval: 3000, // 3 secondes pour plus de réactivité
    refetchIntervalInBackground: true, // Continue même en arrière-plan
  });

  // Récupérer les retraits récents
  const { data: recentWithdrawals } = useQuery({
    queryKey: ['recent-withdrawals', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    refetchInterval: 3000, // 3 secondes pour plus de réactivité
    refetchIntervalInBackground: true, // Continue même en arrière-plan
  });

  // Générer les notifications à partir des données
  useEffect(() => {
    const newNotifications: Notification[] = [];

    // Notifications pour les transferts reçus
    receivedTransfers?.forEach(transfer => {
      newNotifications.push({
        id: `transfer_${transfer.id}`,
        type: 'transfer_received',
        title: 'Argent reçu',
        message: `Vous avez reçu ${formatCurrency(transfer.amount, 'XAF')}`,
        amount: transfer.amount,
        created_at: transfer.created_at,
        read: false
      });
    });

    // Notifications pour les retraits
    recentWithdrawals?.forEach(withdrawal => {
      newNotifications.push({
        id: `withdrawal_${withdrawal.id}`,
        type: 'withdrawal_completed',
        title: 'Retrait effectué',
        message: `Retrait de ${formatCurrency(withdrawal.amount, 'XAF')} traité avec succès`,
        amount: withdrawal.amount,
        created_at: withdrawal.created_at,
        read: false
      });
    });

    // Trier par date décroissante
    newNotifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setNotifications(newNotifications);
  }, [receivedTransfers, recentWithdrawals]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'transfer_received':
        return <ArrowDownCircle className="w-4 h-4 text-green-600" />;
      case 'withdrawal_completed':
        return <ArrowUpCircle className="w-4 h-4 text-blue-600" />;
      case 'bill_paid':
        return <Zap className="w-4 h-4 text-orange-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 h-10 w-10 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-orange-600' : 'text-gray-700'}`} />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 border-white border-2"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </button>

      {showNotifications && (
        <div className="absolute top-12 right-0 w-80 bg-white rounded-lg shadow-lg border z-50 max-h-96 overflow-hidden">
          <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-sm">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Tout marquer lu
                </button>
              )}
              <button
                onClick={() => setShowNotifications(false)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                Aucune notification récente
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-2">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.created_at).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedNotificationSystem;