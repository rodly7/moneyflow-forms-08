
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
      // Obtenir la date d'aujourd'hui en format YYYY-MM-DD (heure locale)
      const today = new Date();
      const todayDateString = today.getFullYear() + '-' + 
        String(today.getMonth() + 1).padStart(2, '0') + '-' + 
        String(today.getDate()).padStart(2, '0');
      
      console.log(`📅 Recherche des demandes pour la date: ${todayDateString}`);
      
      // Compter SEULEMENT les enregistrements d'AUJOURD'HUI dans sub_admin_daily_requests
      const { count: todayCount, error: todayError } = await supabase
        .from('sub_admin_daily_requests')
        .select('*', { count: 'exact', head: true })
        .eq('sub_admin_id', user.id)
        .eq('date', todayDateString);

      if (todayError) {
        console.error('❌ Erreur lors du comptage des demandes du jour:', todayError);
        throw todayError;
      }

      const todayRequests = todayCount || 0;
      console.log(`📊 Demandes d'aujourd'hui (${todayDateString}) trouvées: ${todayRequests}`);

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
      
      // Utiliser la date locale au format YYYY-MM-DD
      const today = new Date();
      const todayDateString = today.getFullYear() + '-' + 
        String(today.getMonth() + 1).padStart(2, '0') + '-' + 
        String(today.getDate()).padStart(2, '0');
      
      const { error } = await supabase
        .from('sub_admin_daily_requests')
        .insert({
          sub_admin_id: user.id,
          request_type: requestType,
          date: todayDateString
        });

      if (error) throw error;

      console.log(`✅ Demande enregistrée avec succès pour la date: ${todayDateString}`);

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
