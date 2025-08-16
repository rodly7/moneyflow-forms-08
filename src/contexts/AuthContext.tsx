
import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile, AuthContextType, SignUpMetadata } from '@/types/auth';
import { authService } from '@/services/authService';
import { useUserSession } from '@/hooks/useUserSession';
import SessionManager from '@/components/SessionManager';
import { toast } from 'sonner';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Mémoriser la fonction de rafraîchissement pour éviter les re-renders inutiles
  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      console.log('🔄 Rafraîchissement du profil pour:', user.id);
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('❌ Erreur lors du rafraîchissement du profil:', error);
        return;
      }
      
      console.log('✅ Profil rafraîchi:', profileData);
      setProfile(profileData);
    } catch (error) {
      console.error('❌ Erreur lors du rafraîchissement du profil:', error);
    }
  }, [user?.id]);

  // Fonction utilitaire pour charger le profil avec optimisation
  const loadProfile = useCallback(async (userId: string) => {
    try {
      console.log('📊 Chargement du profil pour:', userId);
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (!error && profileData) {
        console.log('✅ Profil chargé:', profileData);
        setProfile(profileData);
        return true;
      } else {
        console.error('❌ Erreur profil:', error);
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du profil:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        console.log('🚀 Initialisation de l\'authentification...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Erreur lors de la récupération de la session:', error);
          if (mounted) setLoading(false);
          return;
        }
        
        if (session?.user && mounted) {
          console.log('👤 Session utilisateur trouvée:', session.user.id);
          setUser(session.user);
          await loadProfile(session.user.id);
        } else {
          console.log('❌ Aucune session utilisateur trouvée');
        }
        
        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de l\'auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Optimiser la gestion des changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('🔄 Changement d\'état auth:', event, session?.user?.id);
      
      if (event === 'SIGNED_OUT' || !session) {
        console.log('🚪 Utilisateur déconnecté');
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      
      if (session?.user) {
        console.log('✅ Utilisateur connecté:', session.user.id);
        setUser(session.user);
        await loadProfile(session.user.id);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  // Optimiser les fonctions d'authentification avec useCallback
  const signIn = useCallback(async (phone: string, password: string) => {
    try {
      console.log('🔐 Début de la connexion...');
      setLoading(true);
      await authService.signIn(phone, password);
      console.log('✅ Connexion terminée');
    } catch (error) {
      console.error('❌ Erreur de connexion:', error);
      setLoading(false);
      throw error;
    }
  }, []);

  const signUp = useCallback(async (phone: string, password: string, metadata: SignUpMetadata) => {
    try {
      console.log('📝 Début de l\'inscription...');
      setLoading(true);
      await authService.signUp(phone, password, metadata);
      console.log('✅ Inscription terminée');
    } catch (error) {
      console.error('❌ Erreur d\'inscription:', error);
      setLoading(false);
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      console.log('🚪 Début de la déconnexion...');
      setLoading(true);
      
      // Nettoyer d'abord l'état local
      setUser(null);
      setProfile(null);
      
      // Puis appeler Supabase pour la déconnexion
      await authService.signOut();
      
      // Forcer un nettoyage complet de la session
      await supabase.auth.signOut({ scope: 'local' });
      
      console.log('✅ Déconnexion réussie');
      setLoading(false);
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);
      // Même en cas d'erreur, nettoyer l'état local
      setUser(null);
      setProfile(null);
      setLoading(false);
      
      // Ne pas relancer l'erreur pour éviter de bloquer la déconnexion
      toast.error('Déconnexion effectuée avec nettoyage forcé');
    }
  }, []);

  // Mémoriser les fonctions utilitaires pour éviter les re-renders
  const isAdmin = useCallback(() => profile?.role === 'admin', [profile?.role]);
  const isAgent = useCallback(() => profile?.role === 'agent', [profile?.role]);
  const isAgentOrAdmin = useCallback(() => 
    profile?.role === 'agent' || profile?.role === 'admin' || profile?.role === 'sub_admin'
  , [profile?.role]);
  
  const userRole = profile?.role || null;

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
