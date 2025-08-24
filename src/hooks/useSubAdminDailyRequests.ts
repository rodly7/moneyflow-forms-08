
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface DailyRequestsStatus {
  todayRequests: number;
  maxRequests: number;
  canMakeRequest: boolean;
  remainingRequests: number;
}

export const useSubAdminDailyRequests = () => {
  const { user, profile } = useAuth();
  const [status, setStatus] = useState<DailyRequestsStatus>({
    todayRequests: 0,
    maxRequests: 300,
    canMakeRequest: true,
    remainingRequests: 300
  });
  const [loading, setLoading] = useState(true);

  const fetchDailyStatus = useCallback(async () => {
    if (!user?.id || profile?.role !== 'sub_admin') return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Récupérer le plafond personnalisé depuis les paramètres
      const { data: settings } = await supabase
        .from('sub_admin_settings')
        .select('daily_request_limit')
        .eq('user_id', user.id)
        .single();

      const maxRequests = settings?.daily_request_limit || 300;

      // Compter les demandes du jour
      const { count: todayCount } = await supabase
        .from('sub_admin_daily_requests')
        .select('*', { count: 'exact', head: true })
        .eq('sub_admin_id', user.id)
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`);

      const todayRequests = todayCount || 0;
      const remainingRequests = Math.max(0, maxRequests - todayRequests);
      const canMakeRequest = todayRequests < maxRequests;

      setStatus({
        todayRequests,
        maxRequests,
        canMakeRequest,
        remainingRequests
      });

    } catch (error) {
      console.error('Erreur lors du chargement du statut des demandes:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, profile?.role]);

  const recordRequest = useCallback(async (requestType: string) => {
    if (!user?.id || !status.canMakeRequest) {
      toast.error('Plafond de demandes quotidiennes atteint');
      return false;
    }

    try {
      const { error } = await supabase
        .from('sub_admin_daily_requests')
        .insert({
          sub_admin_id: user.id,
          request_type: requestType,
          date: new Date().toISOString().split('T')[0]
        });

      if (error) throw error;

      // Actualiser le statut
      await fetchDailyStatus();
      
      if (status.remainingRequests <= 10) {
        toast.warning(`Plus que ${status.remainingRequests - 1} demandes restantes aujourd'hui`);
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la demande:', error);
      return false;
    }
  }, [user?.id, status.canMakeRequest, status.remainingRequests, fetchDailyStatus]);

  const updateDailyLimit = useCallback(async (newLimit: number) => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('sub_admin_settings')
        .upsert({
          user_id: user.id,
          daily_request_limit: newLimit,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      await fetchDailyStatus();
      toast.success(`Plafond mis à jour à ${newLimit} demandes par jour`);
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du plafond:', error);
      toast.error('Erreur lors de la mise à jour du plafond');
      return false;
    }
  }, [user?.id, fetchDailyStatus]);

  useEffect(() => {
    fetchDailyStatus();
  }, [fetchDailyStatus]);

  return {
    status,
    loading,
    recordRequest,
    updateDailyLimit,
    refreshStatus: fetchDailyStatus
  };
};
