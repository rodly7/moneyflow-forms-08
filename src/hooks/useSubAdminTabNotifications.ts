
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubAdminDailyRequests } from './useSubAdminDailyRequests';

interface TabNotification {
  hasNewData: boolean;
  lastUpdate: Date;
  count?: number;
}

interface TabNotifications {
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
    users: { hasNewData: false, lastUpdate: new Date() },
    agents: { hasNewData: false, lastUpdate: new Date() },
    stats: { hasNewData: false, lastUpdate: new Date() },
    recharge: { hasNewData: false, lastUpdate: new Date() },
    messages: { hasNewData: false, lastUpdate: new Date() },
    settings: { hasNewData: false, lastUpdate: new Date() }
  });

  const [lastChecked, setLastChecked] = useState<Record<string, Date>>({});

  const checkForUpdates = useCallback(async () => {
    if (!user?.id || profile?.role !== 'sub_admin' || !status.canMakeRequest) return;

    const now = new Date();
    const country = profile?.country;

    try {
      // Enregistrer la demande de vérification
      await recordRequest('data_check');

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
        users: {
          hasNewData: (newUsersCount || 0) > 0,
          lastUpdate: now,
          count: newUsersCount || 0
        },
        agents: {
          hasNewData: (newAgentsCount || 0) > 0,
          lastUpdate: now,
          count: newAgentsCount || 0
        },
        stats: {
          hasNewData: false, // Les stats sont toujours mises à jour
          lastUpdate: now
        },
        recharge: {
          hasNewData: false,
          lastUpdate: now
        },
        messages: {
          hasNewData: (newMessagesCount || 0) > 0,
          lastUpdate: now,
          count: newMessagesCount || 0
        },
        settings: {
          hasNewData: prev.settings.hasNewData,
          lastUpdate: prev.settings.lastUpdate
        }
      }));

      setLastChecked(prev => ({
        ...prev,
        users: now,
        agents: now,
        messages: now
      }));

    } catch (error) {
      console.error('Erreur lors de la vérification des mises à jour:', error);
    }
  }, [user?.id, profile?.country, profile?.role, lastChecked, recordRequest, status.canMakeRequest]);

  const markTabAsViewed = useCallback((tab: keyof TabNotifications) => {
    setNotifications(prev => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        hasNewData: false
      }
    }));
  }, []);

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
    markTabAsViewed,
    refresh: checkForUpdates,
    dailyRequestsStatus: status
  };
};
