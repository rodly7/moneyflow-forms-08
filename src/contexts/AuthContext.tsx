
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { profileService } from '@/services/profileService';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  phone: string;
  address: string;
  country: string;
  role: 'user' | 'agent' | 'admin' | 'sub_admin';
  is_verified: boolean;
  balance: number;
  created_at: string;
}

interface SignUpData {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  country: string;
  address?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  userRole: 'user' | 'agent' | 'admin' | 'sub_admin' | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (signUpData: SignUpData) => Promise<any>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAdmin: () => boolean;
  isAgent: () => boolean;
  isAgentOrAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Optimisation: mémoriser les fonctions pour éviter les re-renders
  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;

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

      // Mettre à jour avec le solde le plus récent si disponible
      const updatedProfile = {
        ...data,
        email: user.email || '',
        balance: currentBalance !== null ? Number(currentBalance) : data.balance
      };

      console.log('✅ Profile refreshed:', updatedProfile);
      setProfile(updatedProfile);
    } catch (error) {
      console.error('Error in refreshProfile:', error);
    }
  }, [user?.id, user?.email]);

  const signIn = useCallback(async (email: string, password: string) => {
    console.log('🔐 Attempting sign in for:', email);
    setLoading(true);
    
    try {
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

  const signUp = useCallback(async (signUpData: SignUpData) => {
    console.log('📝 Attempting sign up');
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          data: {
            full_name: signUpData.full_name,
            phone: signUpData.phone,
            country: signUpData.country,
            address: signUpData.address || ''
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
    console.log('🚪 Signing out...');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('❌ Sign out error:', error);
      throw error;
    }
    console.log('✅ Signed out successfully');
  }, []);

  // Fonctions de rôle mémorisées
  const isAdmin = useCallback(() => {
    return profileService.isAdmin(profile);
  }, [profile]);

  const isAgent = useCallback(() => {
    return profileService.isAgent(profile);
  }, [profile]);

  const isAgentOrAdmin = useCallback(() => {
    return profileService.isAgentOrAdmin(profile);
  }, [profile]);

  // Mémoriser userRole
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
          return;
        }

        if (mounted) {
          if (session?.user) {
            console.log('👤 Initial session found, setting user:', session.user.id);
            setUser(session.user);
          } else {
            console.log('❌ No initial session found');
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('❌ Error in getSession:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('🔄 Auth state changed:', event, session?.user?.id);
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ User signed in:', session.user.id);
          setUser(session.user);
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user && !profile) {
      refreshProfile();
    }
  }, [user, profile, refreshProfile]);

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
