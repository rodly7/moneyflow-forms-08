
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface TabNotification {
  tabId: string;
  count: number;
  hasNew: boolean;
  lastSeen: string;
}

export const useSubAdminTabNotifications = () => {
  const { user, profile } = useAuth();
  const [notifications, setNotifications] = useState<Record<string, TabNotification>>({
    'user-requests': { tabId: 'user-requests', count: 0, hasNew: false, lastSeen: new Date().toISOString() },
    'users': { tabId: 'users', count: 0, hasNew: false, lastSeen: new Date().toISOString() },
    'stats': { tabId: 'stats', count: 0, hasNew: false, lastSeen: new Date().toISOString() },
    'messages': { tabId: 'messages', count: 0, hasNew: false, lastSeen: new Date().toISOString() },
  });

  // Marquer un onglet comme vu
  const markTabAsSeen = useCallback((tabId: string) => {
    setNotifications(prev => ({
      ...prev,
      [tabId]: {
        ...prev[tabId],
        hasNew: false,
        lastSeen: new Date().toISOString()
      }
    }));
  }, []);

  // Vérifier les nouvelles demandes utilisateur
  const checkUserRequests = useCallback(async () => {
    if (!user?.id || !profile?.country) return;

    try {
      const { data, error } = await supabase
        .from('password_reset_requests')
        .select('*')
        .eq('status', 'pending')
        .gte('created_at', notifications['user-requests'].lastSeen);

      if (error) throw error;

      const newCount = data?.length || 0;
      if (newCount > notifications['user-requests'].count) {
        setNotifications(prev => ({
          ...prev,
          'user-requests': {
            ...prev['user-requests'],
            count: newCount,
            hasNew: true
          }
        }));
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des demandes:', error);
    }
  }, [user?.id, profile?.country, notifications]);

  // Vérifier les nouveaux utilisateurs
  const checkNewUsers = useCallback(async () => {
    if (!user?.id || !profile?.country) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, created_at')
        .eq('country', profile.country)
        .gte('created_at', notifications['users'].lastSeen);

      if (error) throw error;

      const newCount = data?.length || 0;
      if (newCount > notifications['users'].count) {
        setNotifications(prev => ({
          ...prev,
          'users': {
            ...prev['users'],
            count: newCount,
            hasNew: true
          }
        }));
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des nouveaux utilisateurs:', error);
    }
  }, [user?.id, profile?.country, notifications]);

  // Vérifier les nouveaux messages de support
  const checkSupportMessages = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('customer_support_messages')
        .select('id, created_at')
        .eq('status', 'unread')
        .gte('created_at', notifications['messages'].lastSeen);

      if (error) throw error;

      const newCount = data?.length || 0;
      if (newCount > notifications['messages'].count) {
        setNotifications(prev => ({
          ...prev,
          'messages': {
            ...prev['messages'],
            count: newCount,
            hasNew: true
          }
        }));
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des messages:', error);
    }
  }, [user?.id, notifications]);

  // Actualisation automatique toutes les 5 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      checkUserRequests();
      checkNewUsers();
      checkSupportMessages();
    }, 5000);

    // Vérification initiale
    checkUserRequests();
    checkNewUsers();
    checkSupportMessages();

    return () => clearInterval(interval);
  }, [checkUserRequests, checkNewUsers, checkSupportMessages]);

  return {
    notifications,
    markTabAsSeen,
    hasNewNotifications: Object.values(notifications).some(n => n.hasNew)
  };
};
