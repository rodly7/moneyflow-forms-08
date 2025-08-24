
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface DailyRequestsStatus {
  todayRequests: number;
  totalRequests: number;
  maxRequests: number;
  canMakeRequest: boolean;
  remainingRequests: number;
}

export const useSubAdminDailyRequests = () => {
  const { user, profile } = useAuth();
  const [status, setStatus] = useState<DailyRequestsStatus>({
    todayRequests: 0,
    totalRequests: 0,
    maxRequests: 300,
    canMakeRequest: true,
    remainingRequests: 300
  });
  const [loading, setLoading] = useState(true);

  const calculateDynamicQuota = useCallback((totalRequests: number) => {
    const baseQuota = 300;
    const bonusQuota = Math.floor(totalRequests / 100) * 50;
    const dynamicQuota = Math.min(1000, baseQuota + bonusQuota);
    
    console.log(`🧮 Calcul du quota dynamique:`, {
      totalRequests,
      baseQuota,
      bonusQuota,
      dynamicQuota,
      formula: `${baseQuota} + ${Math.floor(totalRequests / 100)} * 50 = ${dynamicQuota}`
    });

    return dynamicQuota;
  }, []);

  const fetchDailyStatus = useCallback(async () => {
    if (!user?.id || profile?.role !== 'sub_admin') {
      console.log('❌ Utilisateur non autorisé ou pas sous-admin');
      setLoading(false);
      return;
    }

    console.log(`🔍 Récupération du statut quotidien pour: ${user.id}`);
    
    try {
      // Obtenir les dates précises pour aujourd'hui en UTC
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000); // +24h
      
      console.log(`📅 Période de recherche:`, {
        todayStart: todayStart.toISOString(),
        todayEnd: todayEnd.toISOString(),
        currentTime: now.toISOString()
      });
      
      // Compter SEULEMENT les enregistrements d'AUJOURD'HUI dans sub_admin_daily_requests
      const { count: todayCount, error: todayError } = await supabase
        .from('sub_admin_daily_requests')
        .select('*', { count: 'exact', head: true })
        .eq('sub_admin_id', user.id)
        .gte('created_at', todayStart.toISOString())
        .lt('created_at', todayEnd.toISOString());

      if (todayError) {
        console.error('❌ Erreur lors du comptage des demandes du jour:', todayError);
        throw todayError;
      }

      const todayRequests = todayCount || 0;
      console.log(`📊 Demandes d'aujourd'hui trouvées: ${todayRequests}`);

      // Compter le total historique pour calculer le quota dynamique
      const { count: totalHistoricCount, error: totalError } = await supabase
        .from('sub_admin_daily_requests')
        .select('*', { count: 'exact', head: true })
        .eq('sub_admin_id', user.id);

      if (totalError) {
        console.error('❌ Erreur lors du comptage total:', totalError);
        throw totalError;
      }

      const totalRequests = totalHistoricCount || 0;
      console.log(`📈 Total historique des demandes: ${totalRequests}`);

      // Calculer le quota dynamique basé sur l'historique
      const calculatedQuota = calculateDynamicQuota(totalRequests);
      
      // Vérifier s'il y a des paramètres personnalisés
      const { data: settings, error: settingsError } = await supabase
        .from('sub_admin_settings')
        .select('daily_request_limit')
        .eq('user_id', user.id)
        .maybeSingle();

      if (settingsError) {
        console.error('⚠️ Erreur lors de la récupération des paramètres:', settingsError);
      }

      // Utiliser le quota personnalisé s'il existe, sinon le quota calculé
      const maxRequests = settings?.daily_request_limit || calculatedQuota;

      const remainingRequests = Math.max(0, maxRequests - todayRequests);
      const canMakeRequest = todayRequests < maxRequests;

      const finalStatus = {
        todayRequests,
        totalRequests,
        maxRequests,
        remainingRequests,
        canMakeRequest
      };

      console.log(`✅ Statut final calculé:`, finalStatus);

      setStatus(finalStatus);

    } catch (error) {
      console.error('💥 Erreur lors du chargement du statut des demandes:', error);
      toast.error('Erreur lors du chargement du statut des demandes');
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
      console.log(`📝 Enregistrement d'une nouvelle demande de type: ${requestType}`);
      
      const { error } = await supabase
        .from('sub_admin_daily_requests')
        .insert({
          sub_admin_id: user.id,
          request_type: requestType,
          date: new Date().toISOString().split('T')[0]
        });

      if (error) throw error;

      console.log('✅ Demande enregistrée avec succès');

      // Actualiser le statut après enregistrement
      await fetchDailyStatus();
      
      // Avertissement si peu de demandes restantes
      const updatedRemainingRequests = status.remainingRequests - 1;
      if (updatedRemainingRequests <= 10 && updatedRemainingRequests > 0) {
        toast.warning(`Plus que ${updatedRemainingRequests} demandes restantes aujourd'hui`);
      }

      return true;
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement de la demande:', error);
      toast.error('Erreur lors de l\'enregistrement de la demande');
      return false;
    }
  }, [user?.id, status.canMakeRequest, status.remainingRequests, fetchDailyStatus]);

  const updateDailyLimit = useCallback(async (newLimit: number) => {
    if (!user?.id) return false;

    try {
      console.log(`⚙️ Mise à jour du plafond quotidien à: ${newLimit}`);
      
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
      console.error('❌ Erreur lors de la mise à jour du plafond:', error);
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
