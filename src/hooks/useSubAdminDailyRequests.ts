
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface DailyRequestsStatus {
  todayRequests: number;
  totalRequests: number;
}

export const useSubAdminDailyRequests = () => {
  const { user, profile } = useAuth();
  const [status, setStatus] = useState<DailyRequestsStatus>({
    todayRequests: 0,
    totalRequests: 0
  });
  const [loading, setLoading] = useState(true);

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

      // Compter le total historique
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

      const finalStatus = {
        todayRequests,
        totalRequests
      };

      console.log(`✅ Statut final calculé:`, finalStatus);

      setStatus(finalStatus);

    } catch (error) {
      console.error('💥 Erreur lors du chargement du statut des demandes:', error);
      toast.error('Erreur lors du chargement du statut des demandes');
    } finally {
      setLoading(false);
    }
  }, [user?.id, profile?.role]);

  const recordRequest = useCallback(async (requestType: string) => {
    if (!user?.id) {
      toast.error('Utilisateur non connecté');
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

      return true;
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement de la demande:', error);
      toast.error('Erreur lors de l\'enregistrement de la demande');
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
    refreshStatus: fetchDailyStatus
  };
};
