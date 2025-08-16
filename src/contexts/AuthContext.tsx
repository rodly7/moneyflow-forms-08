
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { profileService } from '@/services/profileService';
import { Profile, AuthContextType } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Optimisation: mémoriser les fonctions pour éviter les re-renders
  const refreshProfile = useCallback(async () => {
    if (!user?.id) {
      console.log('❌ No user ID for profile refresh');
      return;
    }

    try {
      console.log('🔄 Refreshing profile for user:', user.id);
      
      // Utiliser RPC pour obtenir le solde le plus récent
      const { data: currentBalance, error: balanceError } = await supabase.rpc('increment_balance', {
        user_id: user.id,
        amount: 0
      });

      if (balanceError) {
        console.error('Error fetching balance:', balanceError);
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (!data) {
        console.error('No profile data found');
        return;
      }

      // Mettre à jour avec le solde le plus récent si disponible
      const updatedProfile: Profile = {
        ...data,
        balance: currentBalance !== null ? Number(currentBalance) : (data.balance || 0)
      };

      console.log('✅ Profile refreshed:', updatedProfile);
      setProfile(updatedProfile);
    } catch (error) {
      console.error('Error in refreshProfile:', error);
    }
  }, [user?.id]);

  const signIn = useCallback(async (phone: string, password: string) => {
    console.log('🔐 Attempting sign in for:', phone);
    setLoading(true);
    
    try {
      // Normaliser le numéro - enlever espaces et garder seulement les chiffres et +
      const normalizedPhone = phone.replace(/[^\d+]/g, '');
      const email = `${normalizedPhone}@sendflow.app`;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('❌ Sign in error:', error);
        throw error;
      }

      console.log('✅ Sign in successful');
      return data;
    } catch (error) {
      console.error('❌ Sign in failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(async (phone: string, password: string, metadata: any) => {
    console.log('📝 Attempting sign up');
    setLoading(true);
    
    try {
      // Normaliser le numéro
      const normalizedPhone = phone.replace(/[^\d+]/g, '');
      const email = `${normalizedPhone}@sendflow.app`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            ...metadata,
            phone: normalizedPhone
          }
        }
      });

      if (error) {
        console.error('❌ Sign up error:', error);
        throw error;
      }

      console.log('✅ Sign up successful');
      return data;
    } catch (error) {
      console.error('❌ Sign up failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      console.log('🚪 Signing out...');
      
      // Nettoyer les états locaux d'abord
      setUser(null);
      setProfile(null);
      
      // Puis déconnecter de Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Sign out error:', error);
        throw error;
      }
      
      console.log('✅ Signed out successfully');
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      throw error;
    }
  }, []);

  // Fonctions de rôle mémorisées avec vérifications de sécurité
  const isAdmin = useCallback(() => {
    try {
      return profileService.isAdmin(profile);
    } catch (error) {
      console.error('Error checking admin role:', error);
      return false;
    }
  }, [profile]);

  const isAgent = useCallback(() => {
    try {
      return profileService.isAgent(profile);
    } catch (error) {
      console.error('Error checking agent role:', error);
      return false;
    }
  }, [profile]);

  const isAgentOrAdmin = useCallback(() => {
    try {
      return profileService.isAgentOrAdmin(profile);
    } catch (error) {
      console.error('Error checking agent or admin role:', error);
      return false;
    }
  }, [profile]);

  // Mémoriser userRole avec vérification de sécurité
  const userRole = useMemo(() => {
    return profile?.role || null;
  }, [profile?.role]);

  useEffect(() => {
    let mounted = true;
    
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
          if (mounted) {
            setLoading(false);
            setInitialized(true);
          }
          return;
        }

        if (mounted) {
          if (session?.user) {
            console.log('👤 Initial session found, setting user:', session.user.id);
            setUser(session.user);
          } else {
            console.log('❌ No initial session found');
          }
          setLoading(false);
          setInitialized(true);
        }
      } catch (error) {
        console.error('❌ Error in getSession:', error);
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('🔄 Auth state changed:', event, session?.user?.id);
        
        try {
          if (event === 'SIGNED_IN' && session?.user) {
            console.log('✅ User signed in:', session.user.id);
            setUser(session.user);
            setProfile(null); // Reset profile to trigger refresh
          } else if (event === 'SIGNED_OUT') {
            console.log('👋 User signed out');
            setUser(null);
            setProfile(null);
          }
        } catch (error) {
          console.error('❌ Error in auth state change:', error);
        }
        
        if (mounted && !loading) {
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Effet séparé pour refreshProfile pour éviter les boucles infinies
  useEffect(() => {
    if (initialized && user && !profile) {
      refreshProfile();
    }
  }, [user, profile, refreshProfile, initialized]);

  const value = useMemo(() => ({
    user,
    profile,
    userRole,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    isAdmin,
    isAgent,
    isAgentOrAdmin
  }), [user, profile, userRole, loading, signIn, signUp, signOut, refreshProfile, isAdmin, isAgent, isAgentOrAdmin]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
