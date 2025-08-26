
import React, { useState, useEffect } from "react";
import { Bell, BellRing, Check, CheckCheck } from "lucide-react";
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
import { useUnifiedNotifications } from "@/hooks/useUnifiedNotifications";

export const UnifiedNotificationBell = () => {
  const { 
    notifications, 
    unreadCount, 
    isConnected, 
    markAsRead, 
    markAllAsRead,
    refresh 
  } = useUnifiedNotifications();
  
  const { toast } = useToast();

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
      case 'recharge_completed': return '💳';
      case 'withdrawal_completed': return '💸';
      case 'admin_message': return '📢';
      default: return '📩';
    }
  };

  const getNotificationBgColor = (type: string) => {
    switch (type) {
      case 'transfer_received': return 'hover:bg-green-50';
      case 'recharge_completed': return 'hover:bg-blue-50';
      case 'withdrawal_completed': return 'hover:bg-purple-50';
      case 'admin_message': return 'hover:bg-yellow-50';
      default: return 'hover:bg-gray-50';
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

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="relative">
            {unreadCount > 0 ? (
              <BellRing className="h-4 w-4 text-orange-500" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-80" align="end">
          <DropdownMenuLabel className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>Notifications</span>
              {!isConnected && (
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" title="Connexion temps réel déconnectée" />
              )}
            </div>
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
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          <ScrollArea className="h-80">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>Aucune nouvelle notification</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-3 p-3 cursor-pointer relative group ${getNotificationBgColor(notification.type)}`}
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
                        
                        {notification.priority === 'high' && (
                          <div className="w-2 h-2 bg-red-500 rounded-full" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          {notifications.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <div className="p-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={refresh}
                  className="w-full text-xs"
                >
                  Actualiser
                </Button>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
