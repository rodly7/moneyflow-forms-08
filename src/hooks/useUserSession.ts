import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useUserSession = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    // Démarrer une session quand l'utilisateur se connecte
    const startSession = async () => {
      try {
        const userAgent = navigator.userAgent;
        const { error } = await supabase.rpc('start_user_session', {
          p_user_agent: userAgent
        });
        
        if (error) {
          console.error('Erreur lors du démarrage de session:', error);
        }
      } catch (error) {
        console.error('Erreur lors du démarrage de session:', error);
      }
    };

    // Mettre à jour l'activité de session périodiquement
    const updateActivity = async () => {
      try {
        const { error } = await supabase.rpc('update_session_activity');
        if (error) {
          console.error('Erreur lors de la mise à jour d\'activité:', error);
        }
      } catch (error) {
        console.error('Erreur lors de la mise à jour d\'activité:', error);
      }
    };

    // Terminer la session lors de la déconnexion/fermeture
    const endSession = async () => {
      try {
        const { error } = await supabase.rpc('end_user_session');
        if (error) {
          console.error('Erreur lors de la fin de session:', error);
        }
      } catch (error) {
        console.error('Erreur lors de la fin de session:', error);
      }
    };

    // Démarrer la session
    startSession();

    // Mettre à jour l'activité toutes les 5 minutes
    const activityInterval = setInterval(updateActivity, 5 * 60 * 1000);

    // Mettre à jour l'activité lors des interactions
    const handleActivity = () => updateActivity();
    
    // Écouter les événements d'activité
    document.addEventListener('click', handleActivity);
    document.addEventListener('keypress', handleActivity);
    document.addEventListener('scroll', handleActivity);

    // Gérer la fermeture de l'onglet/navigateur
    const handleBeforeUnload = () => {
      // Utiliser sendBeacon pour s'assurer que la requête est envoyée
      navigator.sendBeacon('/api/end-session', JSON.stringify({ user_id: user.id }));
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        endSession();
      } else {
        startSession();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Nettoyage
    return () => {
      clearInterval(activityInterval);
      document.removeEventListener('click', handleActivity);
      document.removeEventListener('keypress', handleActivity);
      document.removeEventListener('scroll', handleActivity);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      endSession();
    };
  }, [user?.id]);

  return null;
};