
import { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useAuthSession = () => {
  const { user, signOut } = useAuth();

  const checkSessionValidity = useCallback(async () => {
    if (!user) return false;

    try {
      // Tester la validité de la session avec une requête simple
      const { data, error } = await supabase.auth.getUser();
      
      if (error || !data.user) {
        console.log('🔒 Session invalide détectée, déconnexion forcée');
        return false;
      }

      // Vérifier que l'utilisateur peut accéder à son profil
      const { error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.log('🔒 Erreur d\'accès au profil, session corrompue');
        return false;
      }

      return true;
    } catch (error) {
      console.error('🔒 Erreur lors de la vérification de session:', error);
      return false;
    }
  }, [user]);

  const forceReauthentication = useCallback(async () => {
    try {
      console.log('🔄 Forçage de la reconnexion...');
      
      // Nettoyer complètement la session
      await supabase.auth.signOut({ scope: 'local' });
      
      // Forcer le nettoyage du localStorage
      localStorage.removeItem('supabase.auth.token');
      localStorage.clear();
      
      // Déconnecter via le contexte
      await signOut();
      
      toast.info('Session expirée. Veuillez vous reconnecter.');
      
      // Rediriger vers la page d'authentification
      window.location.href = '/auth';
    } catch (error) {
      console.error('🔒 Erreur lors de la déconnexion forcée:', error);
      // En cas d'erreur, forcer quand même la redirection
      window.location.href = '/auth';
    }
  }, [signOut]);

  const handlePermissionError = useCallback(async () => {
    console.log('🔒 Gestion d\'erreur de permissions...');
    
    const isValidSession = await checkSessionValidity();
    
    if (!isValidSession) {
      await forceReauthentication();
      return false;
    }

    // Si la session est valide mais il y a une erreur de permissions,
    // essayer de rafraîchir la session
    try {
      const { error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('🔒 Erreur refresh session:', error);
        await forceReauthentication();
        return false;
      }
      
      toast.success('Session rafraîchie, veuillez réessayer.');
      return true;
    } catch (error) {
      console.error('🔒 Erreur lors du refresh:', error);
      await forceReauthentication();
      return false;
    }
  }, [checkSessionValidity, forceReauthentication]);

  return {
    checkSessionValidity,
    forceReauthentication,
    handlePermissionError
  };
};
