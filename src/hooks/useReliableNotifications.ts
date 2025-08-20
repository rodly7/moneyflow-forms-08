
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  read_at: string | null;
  type: string;
  user_id: string;
}

export const useReliableNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [retryCount, setRetryCount] = useState(0);

  // Fetch notifications with simplified query
  const { data: notifications = [], isLoading, error } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      console.log('Fetching notifications for user:', user?.id);
      
      if (!user?.id) {
        console.log('No user ID, returning empty array');
        return [];
      }

      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) {
          console.error('Error fetching notifications:', error);
          throw error;
        }

        console.log('Fetched notifications:', data?.length || 0);
        return data || [];
      } catch (err) {
        console.error('Exception in notification fetch:', err);
        throw err;
      }
    },
    enabled: !!user?.id,
    staleTime: 30000, // 30 seconds
    retry: (failureCount, error) => {
      console.log('Query retry:', failureCount, error);
      return failureCount < 3;
    },
  });

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read_at).length;

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    console.log('Marking notification as read:', notificationId);
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        throw error;
      }

      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      console.log('Notification marked as read successfully');
    } catch (err) {
      console.error('Exception marking notification as read:', err);
      throw err;
    }
  }, [user?.id, queryClient]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    console.log('Marking all notifications as read');
    
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('read_at', null);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
      }

      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      console.log('All notifications marked as read successfully');
    } catch (err) {
      console.error('Exception marking all notifications as read:', err);
      throw err;
    }
  }, [user?.id, queryClient]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    console.log('Setting up notification subscription for user:', user.id);

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Real-time notification update:', payload);
          queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up notification subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Error handling with retry
  useEffect(() => {
    if (error && retryCount < 3) {
      console.log('Notification error, retrying...', retryCount + 1);
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      }, 2000 * (retryCount + 1));

      return () => clearTimeout(timer);
    }
  }, [error, retryCount, queryClient, user?.id]);

  return {
    notifications: notifications as Notification[],
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] }),
  };
};
