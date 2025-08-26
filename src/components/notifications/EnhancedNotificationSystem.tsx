import React, { useState, useEffect } from 'react';
import { Bell, X, Check, AlertCircle, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, getCurrencyForCountry, convertCurrency } from '@/lib/utils/currency';

interface Notification {
  id: string;
  type: 'transfer_received' | 'transfer_sent' | 'deposit' | 'withdrawal' | 'system';
  message: string;
  amount?: number;
  currency?: string;
  timestamp: string;
  isRead: boolean;
}

const EnhancedNotificationSystem = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Dummy data for demonstration
    const dummyNotifications: Notification[] = [
      {
        id: '1',
        type: 'transfer_received',
        message: 'Transfert reçu de John Doe',
        amount: 5000,
        currency: 'XAF',
        timestamp: '2024-07-26T10:00:00',
        isRead: false,
      },
      {
        id: '2',
        type: 'transfer_sent',
        message: 'Transfert envoyé à Alice Smith',
        amount: 2500,
        currency: 'XAF',
        timestamp: '2024-07-25T18:30:00',
        isRead: true,
      },
      {
        id: '3',
        type: 'deposit',
        message: 'Dépôt réussi',
        amount: 10000,
        currency: 'XAF',
        timestamp: '2024-07-24T12:00:00',
        isRead: false,
      },
      {
        id: '4',
        type: 'system',
        message: 'Bienvenue sur SendFlow !',
        timestamp: '2024-07-23T08:00:00',
        isRead: true,
      },
    ];
    setNotifications(dummyNotifications);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map((notification) =>
        notification.id === id ? { ...notification, isRead: true } : notification
      )
    );
  };

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            className="absolute -top-1 -right-1 rounded-full px-2 py-0 text-xs font-bold"
            variant="destructive"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 rounded-md shadow-lg z-50">
          <Card className="ring-1 ring-black/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Notifications</h3>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune notification</p>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-md ${
                        !notification.isRead ? 'bg-secondary' : 'bg-muted'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {notification.type === 'transfer_received' && (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            )}
                            {notification.type === 'transfer_sent' && (
                              <TrendingUp className="h-4 w-4 text-red-500" />
                            )}
                            {notification.type === 'deposit' && (
                              <Check className="h-4 w-4 text-blue-500" />
                            )}
                            {notification.type === 'withdrawal' && (
                              <AlertCircle className="h-4 w-4 text-orange-500" />
                            )}
                            {notification.type === 'system' && (
                              <Users className="h-4 w-4 text-purple-500" />
                            )}
                            <p className="text-sm font-medium">{notification.message}</p>
                          </div>
                          {notification.amount && notification.currency && (
                            <p className="text-xs text-muted-foreground">
                              Montant: {formatCurrency(notification.amount, notification.currency)}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EnhancedNotificationSystem;
