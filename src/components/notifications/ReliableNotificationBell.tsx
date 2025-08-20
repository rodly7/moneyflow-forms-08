
import React, { useState, useEffect } from "react";
import { Bell, BellRing, Check, CheckCheck, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useReliableNotifications } from "@/hooks/useReliableNotifications";

export const ReliableNotificationBell = () => {
  const { 
    notifications, 
    unreadCount, 
    isConnected, 
    lastCheck,
    markAsRead, 
    markAllAsRead,
    refresh 
  } = useReliableNotifications();
  
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'normal': return 'text-orange-600';
      default: return 'text-blue-600';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'transfer_received': return '💰';
      case 'withdrawal_completed': return '✅';
      case 'withdrawal_created': return '⏳';
      case 'admin_message': return '📢';
      default: return '📩';
    }
  };

  const getNotificationBgColor = (type: string) => {
    switch (type) {
      case 'transfer_received': return 'bg-green-50 border-green-100';
      case 'withdrawal_completed': return 'bg-blue-50 border-blue-100';
      case 'withdrawal_created': return 'bg-yellow-50 border-yellow-100';
      case 'admin_message': return 'bg-purple-50 border-purple-100';
      default: return 'bg-gray-50 border-gray-100';
    }
  };

  const handleMarkAsRead = (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    markAsRead(notificationId);
    toast({
      title: "Notification marquée comme lue",
      duration: 2000
    });
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    toast({
      title: "Toutes les notifications marquées comme lues",
      duration: 2000
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    refresh();
    
    setTimeout(() => {
      setIsRefreshing(false);
      toast({
        title: "Notifications actualisées",
        duration: 2000
      });
    }, 1000);
  };

  // Animation pour le badge
  const [badgeAnimate, setBadgeAnimate] = useState(false);

  useEffect(() => {
    if (unreadCount > 0) {
      setBadgeAnimate(true);
      const timer = setTimeout(() => setBadgeAnimate(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="relative hover:bg-accent transition-colors">
            {unreadCount > 0 ? (
              <BellRing className="h-4 w-4 text-orange-500" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className={`absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs ${
                  badgeAnimate ? 'animate-pulse' : ''
                }`}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-80" align="end">
          <DropdownMenuLabel className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>Notifications fiables</span>
              {isConnected ? (
                <Wifi className="w-3 h-3 text-green-500" title="Connexion temps réel active" />
              ) : (
                <WifiOff className="w-3 h-3 text-red-500 animate-pulse" title="Connexion temps réel déconnectée" />
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-auto p-1 text-xs hover:bg-gray-100"
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleMarkAllAsRead}
                  className="h-auto p-1 text-xs hover:bg-gray-100"
                >
                  <CheckCheck className="w-3 h-3 mr-1" />
                  Tout lire
                </Button>
              )}
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          <div className="px-2 py-1">
            <p className="text-xs text-gray-500">
              Dernière vérification: {formatDistanceToNow(lastCheck, { addSuffix: true, locale: fr })}
            </p>
          </div>
          
          <DropdownMenuSeparator />
          
          <ScrollArea className="h-80">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>Aucune nouvelle notification</p>
                <p className="text-xs mt-1 text-gray-400">
                  Système fiable avec vérifications automatiques
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer relative group transition-colors border-l-2 ${getNotificationBgColor(notification.type)}`}
                  >
                    <div className="text-lg flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`font-medium text-sm ${getPriorityColor(notification.priority)}`}>
                          {notification.title}
                        </h4>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                          onClick={(e) => handleMarkAsRead(notification.id, e)}
                          title="Marquer comme lue"
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(notification.created_at), { 
                            addSuffix: true, 
                            locale: fr 
                          })}
                        </p>
                        
                        <div className="flex items-center gap-1">
                          {notification.amount && (
                            <span className="text-xs font-semibold text-gray-600">
                              {notification.amount.toLocaleString('fr-FR')} FCFA
                            </span>
                          )}
                          {notification.priority === 'high' && (
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
