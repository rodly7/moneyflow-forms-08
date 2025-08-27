import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile, AuthContextType, SignUpMetadata } from '@/types/auth';
import { authService } from '@/services/authService';
import { useUserSession } from '@/hooks/useUserSession';
import SessionManager from '@/components/SessionManager';
import RequiredFieldsModal from '@/components/auth/RequiredFieldsModal';
import KYCRequiredModal from '@/components/auth/KYCRequiredModal';
import { toast } from 'sonner';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRequiredFieldsModal, setShowRequiredFieldsModal] = useState(false);
  const [showKYCModal, setShowKYCModal] = useState(false);

  // Vérifier si les champs obligatoires sont manquants
  const hasRequiredFields = useCallback((profile: Profile | null) => {
    if (!profile) return true;
    return !!(profile.birth_date && profile.id_card_url);
  }, []);

  // Vérifier si KYC est requis - modifié pour permettre l'utilisation après soumission
  const requiresKYC = useCallback((profile: Profile | null) => {
    if (!profile) return false;
    // L'utilisateur peut utiliser l'app si:
    // - KYC n'est pas requis, OU
    // - KYC est approuvé, OU 
    // - KYC est en attente (pending) - nouveau comportement
    // - KYC nécessite une révision (requires_review) - nouveau comportement
    // Seuls les statuts 'not_started', 'rejected' ou null empêchent l'utilisation
    return profile.requires_kyc && 
           (!profile.kyc_status || 
            profile.kyc_status === 'not_started' || 
            profile.kyc_status === 'rejected');
  }, []);

  // Mémoriser la fonction de rafraîchissement pour éviter les re-renders inutiles
  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      // Vérifier d'abord la validité de la session
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !currentUser) {
        console.log('🔒 Session invalide lors du refresh profil, déconnexion');
        await signOut();
        return;
      }

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Erreur lors du rafraîchissement du profil:', error);
        
        // Si erreur de permissions, forcer la reconnexion
        if (error.message?.includes('row-level security') || 
            error.message?.includes('permission')) {
          console.log('🔒 Erreur de permissions détectée, déconnexion forcée');
          await signOut();
        }
        return;
      }
      
      setProfile(profileData);
      
      // Vérifier si les champs obligatoires sont manquants
      if (!hasRequiredFields(profileData)) {
        setShowRequiredFieldsModal(true);
      } else if (requiresKYC(profileData)) {
        // Si les champs de base sont OK mais KYC requis
        setShowKYCModal(true);
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du profil:', error);
    }
  }, [user?.id, hasRequiredFields, requiresKYC]);

  // Fonction utilitaire pour charger le profil avec cast de type sûr
  const loadProfile = useCallback(async (userId: string) => {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (!error && profileData) {
        const typedProfile = profileData as Profile;
        setProfile(typedProfile);
        
        // Vérifier si les champs obligatoires sont manquants
        if (!hasRequiredFields(typedProfile)) {
          setShowRequiredFieldsModal(true);
        } else if (requiresKYC(typedProfile)) {
          // Si les champs de base sont OK mais KYC requis
          setShowKYCModal(true);
        }
        
        return true;
      } else {
        console.error('Erreur profil:', error);
        
        // Si erreur de permissions, forcer la reconnexion
        if (error?.message?.includes('row-level security') || 
            error?.message?.includes('permission')) {
          console.log('🔒 Erreur de permissions lors du chargement profil');
          setTimeout(() => signOut(), 1000);
        }
        
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      return false;
    }
  }, [hasRequiredFields, requiresKYC]);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erreur lors de la récupération de la session:', error);
          if (mounted) setLoading(false);
          return;
        }
        
        if (session?.user && mounted) {
          setUser(session.user);
          await loadProfile(session.user.id);
        }
        
        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Utiliser un timeout pour éviter le blocage de l'UI
    timeoutId = setTimeout(initAuth, 0);

    // Optimiser la gestion des changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      // Traitement différé pour éviter le blocage de l'UI
      setTimeout(async () => {
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          setProfile(null);
          setShowRequiredFieldsModal(false);
          setLoading(false);
          return;
        }
        
        if (session?.user) {
          setUser(session.user);
          await loadProfile(session.user.id);
          setLoading(false);
        }
      }, 0);
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  // Optimiser les fonctions d'authentification avec useCallback
  const signIn = useCallback(async (phone: string, password: string) => {
    try {
      setLoading(true);
      await authService.signIn(phone, password);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  }, []);

  const signUp = useCallback(async (phone: string, password: string, metadata: SignUpMetadata) => {
    try {
      setLoading(true);
      await authService.signUp(phone, password, metadata);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      
      // Nettoyer d'abord l'état local
      setUser(null);
      setProfile(null);
      setShowRequiredFieldsModal(false);
      
      // Nettoyer le localStorage
      localStorage.removeItem('supabase.auth.token');
      
      // Puis appeler Supabase pour la déconnexion
      await authService.signOut();
      
      // Forcer un nettoyage complet de la session
      await supabase.auth.signOut({ scope: 'local' });
      
      setLoading(false);
      
      // Rediriger vers la page d'authentification
      window.location.href = '/auth';
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // Même en cas d'erreur, nettoyer l'état local
      setUser(null);
      setProfile(null);
      setShowRequiredFieldsModal(false);
      setLoading(false);
      
      // Redirection forcée
      window.location.href = '/auth';
    }
  }, []);

  // Mémoriser les fonctions utilitaires pour éviter les re-renders
  const isAdmin = useCallback(() => profile?.role === 'admin', [profile?.role]);
  const isAgent = useCallback(() => profile?.role === 'agent', [profile?.role]);
  const isAgentOrAdmin = useCallback(() => 
    profile?.role === 'agent' || profile?.role === 'admin' || profile?.role === 'sub_admin'
  , [profile?.role]);
  
  const userRole = profile?.role || null;

  const handleRequiredFieldsComplete = useCallback(() => {
    setShowRequiredFieldsModal(false);
    refreshProfile();
  }, [refreshProfile]);

  const handleKYCComplete = useCallback(() => {
    setShowKYCModal(false);
    refreshProfile();
  }, [refreshProfile]);

  // Mémoriser la valeur du contexte pour éviter les re-renders inutiles
  const contextValue = useMemo(() => ({
    user,
    profile,
    userRole,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin,
    isAgent,
    isAgentOrAdmin,
    refreshProfile,
  }), [
    user,
    profile,
    userRole,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin,
    isAgent,
    isAgentOrAdmin,
    refreshProfile,
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      <SessionManager />
      {children}
      <RequiredFieldsModal 
        isOpen={showRequiredFieldsModal}
        profile={profile}
        onComplete={handleRequiredFieldsComplete}
      />
      <KYCRequiredModal
        isOpen={showKYCModal}
        onStartKYC={handleKYCComplete}
      />
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.warn('useAuth called outside AuthProvider. Providing safe defaults.');
    return {
      user: null,
      profile: null,
      userRole: null,
      loading: true,
      signIn: async () => {},
      signUp: async () => {},
      signOut: async () => {},
      isAdmin: () => false,
      isAgent: () => false,
      isAgentOrAdmin: () => false,
      refreshProfile: async () => {}
    } as AuthContextType;
  }
  return context;
};
