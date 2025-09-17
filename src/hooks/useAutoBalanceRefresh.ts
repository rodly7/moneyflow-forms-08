
import { useEffect, useCallback, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface UseAutoBalanceRefreshOptions {
  intervalMs?: number;
  onBalanceChange?: (newBalance: number) => void;
  enableRealtime?: boolean;
}

export const useAutoBalanceRefresh = ({
  intervalMs = 5000, // Optimisé : 5 secondes au lieu de 3
  onBalanceChange,
  enableRealtime = true
}: UseAutoBalanceRefreshOptions = {}) => {
  const { user, profile, refreshProfile } = useAuth();
  const [lastBalance, setLastBalance] = useState<number | null>(null);

  // Fonction optimisée pour récupérer le solde le plus récent
  const refreshBalance = useCallback(async () => {
    if (!user?.id) return;

    try {
      console.log('🔄 Rafraîchissement automatique du solde toutes les 5 secondes...');
      
      // Utiliser la fonction RPC pour obtenir le solde exact
      const { data: realBalance, error: rpcError } = await supabase.rpc('increment_balance', {
        user_id: user.id,
        amount: 0
      });

      if (!rpcError && realBalance !== null) {
        const newBalance = Number(realBalance);
        console.log('💰 Nouveau solde récupéré:', newBalance);
        
        // Vérifier si le solde a changé
        if (lastBalance !== null && lastBalance !== newBalance) {
          onBalanceChange?.(newBalance);
        }
        setLastBalance(newBalance);
        
        // Mettre à jour le profil local si nécessaire
        if (profile && Number(profile.balance) !== newBalance) {
          console.log('🔄 Mise à jour du profil local');
          await refreshProfile();
        }
      }
    } catch (error) {
      // Erreur silencieuse pour éviter le spam
      console.debug('Rafraîchissement du solde:', error);
    }
  }, [user?.id, profile, refreshProfile, onBalanceChange, lastBalance]);

  // Rafraîchissement périodique
  useEffect(() => {
    if (!user?.id) return;

    // Rafraîchir immédiatement
    refreshBalance();

    // Configurer l'intervalle - 5 secondes optimisé pour la performance
    const interval = setInterval(refreshBalance, intervalMs);

    return () => {
      clearInterval(interval);
    };
  }, [user?.id, intervalMs, refreshBalance]);

  // Écoute en temps réel des changements de profil
  useEffect(() => {
    if (!enableRealtime || !user?.id) return;

    console.log('🔄 Configuration écoute temps réel pour le solde...');

    const channel = supabase
      .channel('profile-balance-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔄 Changement détecté dans le profil:', payload);
          const newBalance = payload.new?.balance;
          if (newBalance !== undefined && newBalance !== profile?.balance) {
            console.log('💰 Nouveau solde en temps réel:', newBalance);
            refreshProfile();
            onBalanceChange?.(Number(newBalance));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transfers',
          filter: `recipient_id=eq.${user.id}`
        },
        () => {
          console.log('💸 Nouveau transfert reçu, rafraîchissement du solde...');
          setTimeout(refreshBalance, 1000); // Délai pour permettre la transaction
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transfers',
          filter: `sender_id=eq.${user.id}`
        },
        () => {
          console.log('💸 Transfert mis à jour, rafraîchissement du solde...');
          setTimeout(refreshBalance, 1000);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'withdrawals',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          console.log('💳 Nouveau retrait, rafraîchissement du solde...');
          setTimeout(refreshBalance, 1000);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'recharges',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          console.log('💰 Recharge mise à jour, rafraîchissement du solde...');
          setTimeout(refreshBalance, 1000);
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 Nettoyage des écoutes temps réel');
      supabase.removeChannel(channel);
    };
  }, [enableRealtime, user?.id, profile?.balance, refreshBalance, refreshProfile, onBalanceChange]);

  // Rafraîchissement manuel
  const forceRefresh = useCallback(async () => {
    console.log('🔄 Rafraîchissement forcé du solde...');
    await refreshBalance();
  }, [refreshBalance]);

  return {
    refreshBalance: forceRefresh,
    currentBalance: profile?.balance || 0
  };
};
