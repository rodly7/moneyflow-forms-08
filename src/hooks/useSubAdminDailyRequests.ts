
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

  const calculateDynamicQuota = useCallback(async (userId: string) => {
    try {
      // Compter le nombre total de demandes historiques traitées
      const { count: totalProcessedRequests } = await supabase
        .from('sub_admin_daily_requests')
        .select('*', { count: 'exact', head: true })
        .eq('sub_admin_id', userId);

      // Calculer le quota basé sur l'historique des demandes traitées
      // Formule: quota de base (300) + (total historique / 100) * 50 plafonné à 1000
      const baseQuota = 300;
      const bonusQuota = Math.floor((totalProcessedRequests || 0) / 100) * 50;
      const dynamicQuota = Math.min(1000, baseQuota + bonusQuota);

      console.log(`Quota dynamique calculé pour ${userId}: ${dynamicQuota} (base: ${baseQuota} + bonus: ${bonusQuota} basé sur ${totalProcessedRequests} demandes traitées)`);

      return dynamicQuota;
    } catch (error) {
      console.error('Erreur lors du calcul du quota dynamique:', error);
      return 300; // Quota par défaut en cas d'erreur
    }
  }, []);

  const fetchDailyStatus = useCallback(async () => {
    if (!user?.id || profile?.role !== 'sub_admin') return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Calculer le quota dynamique basé sur l'historique des demandes traitées
      const dynamicQuota = await calculateDynamicQuota(user.id);
      
      // Récupérer le plafond personnalisé depuis les paramètres (s'il existe)
      const { data: settings } = await supabase
        .from('sub_admin_settings')
        .select('daily_request_limit')
        .eq('user_id', user.id)
        .single();

      // Utiliser le quota personnalisé s'il existe, sinon le quota dynamique calculé
      const maxRequests = settings?.daily_request_limit || dynamicQuota;

      // Compter les demandes du jour actuel
      const { count: todayCount } = await supabase
        .from('sub_admin_daily_requests')
        .select('*', { count: 'exact', head: true })
        .eq('sub_admin_id', user.id)
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`);

      const todayRequests = todayCount || 0;
      const remainingRequests = Math.max(0, maxRequests - todayRequests);
      const canMakeRequest = todayRequests < maxRequests;

      console.log(`Statut des demandes pour ${user.id}:`, {
        todayRequests,
        maxRequests,
        remainingRequests,
        canMakeRequest
      });

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
  }, [user?.id, profile?.role, calculateDynamicQuota]);

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

      // Actualiser le statut après enregistrement
      await fetchDailyStatus();
      
      // Avertissement si peu de demandes restantes
      const updatedRemainingRequests = status.remainingRequests - 1;
      if (updatedRemainingRequests <= 10 && updatedRemainingRequests > 0) {
        toast.warning(`Plus que ${updatedRemainingRequests} demandes restantes aujourd'hui`);
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la demande:', error);
      toast.error('Erreur lors de l\'enregistrement de la demande');
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
