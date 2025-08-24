
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubAdminDailyRequests } from './useSubAdminDailyRequests';

interface TabNotification {
  hasNewData: boolean;
  hasNew: boolean;
  lastUpdate: Date;
  count?: number;
  tabId: string;
}

interface TabNotifications {
  'user-requests': TabNotification;
  users: TabNotification;
  agents: TabNotification;
  stats: TabNotification;
  recharge: TabNotification;
  messages: TabNotification;
  settings: TabNotification;
}

export const useSubAdminTabNotifications = () => {
  const { user, profile } = useAuth();
  const { recordRequest, status } = useSubAdminDailyRequests();
  const [notifications, setNotifications] = useState<TabNotifications>({
    'user-requests': { hasNewData: false, hasNew: false, lastUpdate: new Date(), tabId: 'user-requests', count: 0 },
    users: { hasNewData: false, hasNew: false, lastUpdate: new Date(), tabId: 'users', count: 0 },
    agents: { hasNewData: false, hasNew: false, lastUpdate: new Date(), tabId: 'agents', count: 0 },
    stats: { hasNewData: false, hasNew: false, lastUpdate: new Date(), tabId: 'stats', count: 0 },
    recharge: { hasNewData: false, hasNew: false, lastUpdate: new Date(), tabId: 'recharge', count: 0 },
    messages: { hasNewData: false, hasNew: false, lastUpdate: new Date(), tabId: 'messages', count: 0 },
    settings: { hasNewData: false, hasNew: false, lastUpdate: new Date(), tabId: 'settings', count: 0 }
  });

  const [lastChecked, setLastChecked] = useState<Record<string, Date>>({});

  const checkForUpdates = useCallback(async () => {
    if (!user?.id || profile?.role !== 'sub_admin') return;

    const now = new Date();
    const country = profile?.country;

    try {
      // Enregistrer la demande de vérification (sans vérification de quota)
      await recordRequest('data_check');

      // Vérifier les demandes utilisateurs en attente
      const { count: pendingUserRequestsCount } = await supabase
        .from('user_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Vérifier le total des demandes utilisateurs
      const { count: totalUserRequestsCount } = await supabase
        .from('user_requests')
        .select('*', { count: 'exact', head: true });

      // Vérifier les nouveaux utilisateurs
      const { count: newUsersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('country', country)
        .gt('created_at', lastChecked.users?.toISOString() || new Date(Date.now() - 5 * 60 * 1000).toISOString());

      // Vérifier les nouveaux agents
      const { count: newAgentsCount } = await supabase
        .from('agents')
        .select('*', { count: 'exact', head: true })
        .eq('country', country)
        .gt('created_at', lastChecked.agents?.toISOString() || new Date(Date.now() - 5 * 60 * 1000).toISOString());

      // Vérifier les nouveaux messages
      const { count: newMessagesCount } = await supabase
        .from('customer_support_messages')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'unread')
        .gt('created_at', lastChecked.messages?.toISOString() || new Date(Date.now() - 5 * 60 * 1000).toISOString());

      setNotifications(prev => ({
        'user-requests': {
          hasNewData: (pendingUserRequestsCount || 0) > 0,
          hasNew: (pendingUserRequestsCount || 0) > (prev['user-requests'].count || 0),
          lastUpdate: now,
          tabId: 'user-requests',
          count: pendingUserRequestsCount || 0
        },
        users: {
          hasNewData: (newUsersCount || 0) > 0,
          hasNew: (newUsersCount || 0) > 0,
          lastUpdate: now,
          tabId: 'users',
          count: newUsersCount || 0
        },
        agents: {
          hasNewData: (newAgentsCount || 0) > 0,
          hasNew: (newAgentsCount || 0) > 0,
          lastUpdate: now,
          tabId: 'agents',
          count: newAgentsCount || 0
        },
        stats: {
          hasNewData: false,
          hasNew: false,
          lastUpdate: now,
          tabId: 'stats',
          count: 0
        },
        recharge: {
          hasNewData: false,
          hasNew: false,
          lastUpdate: now,
          tabId: 'recharge',
          count: 0
        },
        messages: {
          hasNewData: (newMessagesCount || 0) > 0,
          hasNew: (newMessagesCount || 0) > 0,
          lastUpdate: now,
          tabId: 'messages',
          count: newMessagesCount || 0
        },
        settings: {
          hasNewData: prev.settings.hasNewData,
          hasNew: prev.settings.hasNew,
          lastUpdate: prev.settings.lastUpdate,
          tabId: 'settings',
          count: 0
        }
      }));

      setLastChecked(prev => ({
        ...prev,
        'user-requests': now,
        users: now,
        agents: now,
        messages: now
      }));

    } catch (error) {
      console.error('Erreur lors de la vérification des mises à jour:', error);
    }
  }, [user?.id, profile?.country, profile?.role, lastChecked, recordRequest]);

  const markTabAsSeen = useCallback((tabId: keyof TabNotifications) => {
    setNotifications(prev => ({
      ...prev,
      [tabId]: {
        ...prev[tabId],
        hasNewData: false,
        hasNew: false
      }
    }));
  }, []);

  const markTabAsViewed = useCallback((tab: keyof TabNotifications) => {
    markTabAsSeen(tab);
  }, [markTabAsSeen]);

  // Vérification automatique toutes les 5 secondes
  useEffect(() => {
    if (profile?.role !== 'sub_admin') return;

    const interval = setInterval(checkForUpdates, 5000);
    
    // Vérification initiale
    checkForUpdates();

    return () => clearInterval(interval);
  }, [checkForUpdates, profile?.role]);

  return {
    notifications,
    markTabAsSeen,
    markTabAsViewed,
    refresh: checkForUpdates,
    dailyRequestsStatus: status
  };
};
