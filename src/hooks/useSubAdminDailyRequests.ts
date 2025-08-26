
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface DailyRequestsStatus {
  todayRequests: number;
  totalRequests: number;
  dailyLimit: number;
  canMakeRequest: boolean;
  remainingRequests: number;
}

const MAX_APPROVAL_AMOUNT = 500000; // Limite maximale d'approbation

export const useSubAdminDailyRequests = () => {
  const { user, profile } = useAuth();
  const [status, setStatus] = useState<DailyRequestsStatus>({
    todayRequests: 0,
    totalRequests: 0,
    dailyLimit: 300, // Nouvelle limite par défaut
    canMakeRequest: true,
    remainingRequests: 300
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
      
      console.log(`📅 Recherche des demandes traitées pour la date: ${todayDateString}`);
      
      // Récupérer les paramètres de quota
      const { data: quotaSettings, error: quotaError } = await supabase
        .from('sub_admin_quota_settings')
        .select('daily_limit')
        .eq('sub_admin_id', user.id)
        .single();

      if (quotaError && quotaError.code !== 'PGRST116') { // PGRST116 = no rows
        console.error('❌ Erreur lors de la récupération du quota:', quotaError);
        throw quotaError;
      }

      const dailyLimit = quotaSettings?.daily_limit || 50;
      console.log(`📏 Limite quotidienne: ${dailyLimit}`);
      
      // Compter les vraies demandes traitées AUJOURD'HUI dans user_requests
      const { count: todayCount, error: todayError } = await supabase
        .from('user_requests')
        .select('*', { count: 'exact', head: true })
        .eq('processed_by', user.id)
        .gte('processed_at', `${todayDateString}T00:00:00.000Z`)
        .lt('processed_at', `${todayDateString}T23:59:59.999Z`);

      if (todayError) {
        console.error('❌ Erreur lors du comptage des demandes du jour:', todayError);
        throw todayError;
      }

      const todayRequests = todayCount || 0;
      console.log(`📊 Vraies demandes traitées aujourd'hui (${todayDateString}): ${todayRequests}`);

      // Compter le total historique des demandes traitées par ce sous-admin
      const { count: totalHistoricCount, error: totalError } = await supabase
        .from('user_requests')
        .select('*', { count: 'exact', head: true })
        .eq('processed_by', user.id);

      if (totalError) {
        console.error('❌ Erreur lors du comptage total:', totalError);
        throw totalError;
      }

      const totalRequests = totalHistoricCount || 0;
      console.log(`📈 Total historique des demandes traitées: ${totalRequests}`);

      const remainingRequests = Math.max(0, dailyLimit - todayRequests);
      const canMakeRequest = todayRequests < dailyLimit;

      const finalStatus = {
        todayRequests,
        totalRequests,
        dailyLimit,
        canMakeRequest,
        remainingRequests
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

    // Vérifier le quota avant d'enregistrer
    if (!status.canMakeRequest && requestType !== 'data_check') {
      toast.error(`Quota journalier atteint (${status.dailyLimit}). Revenez demain.`);
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

      // Actualiser le statut après enregistrement (pour les vraies demandes traitées)
      if (requestType !== 'data_check') {
        await fetchDailyStatus();
        
        // Afficher un avertissement si proche de la limite
        if (status.remainingRequests <= 5 && status.remainingRequests > 1) {
          toast.warning(`Plus que ${status.remainingRequests - 1} demandes aujourd'hui`);
        } else if (status.remainingRequests === 1) {
          toast.warning('Dernière demande de la journée !');
        }
      }

      return true;
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement de la demande:', error);
      toast.error('Erreur lors de l\'enregistrement de la demande');
      return false;
    }
  }, [user?.id, fetchDailyStatus, status.canMakeRequest, status.dailyLimit, status.remainingRequests]);

  const validateAmount = useCallback((amount: number) => {
    if (amount > MAX_APPROVAL_AMOUNT) {
      toast.error(`Montant trop élevé. Limite maximale: ${MAX_APPROVAL_AMOUNT.toLocaleString()} XAF`);
      return false;
    }
    return true;
  }, []);

  useEffect(() => {
    fetchDailyStatus();
  }, [fetchDailyStatus]);

  return {
    status,
    loading,
    recordRequest,
    refreshStatus: fetchDailyStatus,
    validateAmount,
    maxApprovalAmount: MAX_APPROVAL_AMOUNT
  };
};
