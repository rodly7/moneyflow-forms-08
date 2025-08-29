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
        // Vérifier d'abord que l'utilisateur est bien connecté
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          console.log('⚠️ Pas de session active, skip du démarrage de session');
          return;
        }

        const userAgent = navigator.userAgent;
        const { error } = await supabase.rpc('start_user_session', {
          p_user_agent: userAgent
        });
        
        if (error) {
          console.error('❌ Erreur lors du démarrage de session:', error);
          // Ne pas afficher l'erreur si c'est juste un problème d'auth
          if (!error.message.includes('must be authenticated')) {
            console.error('Erreur session non liée à l\'auth:', error);
          }
        } else {
          console.log('✅ Session utilisateur démarrée');
        }
      } catch (error) {
        console.error('❌ Exception lors du démarrage de session:', error);
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

    // Démarrer la session seulement si on a un utilisateur
    startSession();

    // Mettre à jour l'activité toutes les 10 minutes (réduit la fréquence)
    const activityInterval = setInterval(updateActivity, 10 * 60 * 1000);

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