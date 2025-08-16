
import { useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAgentWithdrawalEnhanced } from './useAgentWithdrawalEnhanced';
import { useAutoBalanceRefresh } from './useAutoBalanceRefresh';

export const useOptimizedAgent = () => {
  const { user, profile } = useAuth();
  
  const {
    agentBalance,
    agentCommissionBalance,
    isLoadingBalance,
    fetchAgentBalances
  } = useAgentWithdrawalEnhanced();

  // Auto-refresh optimisé toutes les 5 secondes
  useAutoBalanceRefresh({
    intervalMs: 5000,
    onBalanceChange: useCallback((newBalance: number) => {
      console.log('💰 Agent balance updated:', newBalance);
    }, [])
  });

  // Mémoriser les données agent
  const agentData = useMemo(() => ({
    id: user?.id,
    name: profile?.full_name || 'Agent',
    avatar: profile?.avatar_url,
    balance: profile?.balance || 0,
    commissionBalance: agentCommissionBalance || 0,
    isLoading: isLoadingBalance
  }), [user?.id, profile?.full_name, profile?.avatar_url, profile?.balance, agentCommissionBalance, isLoadingBalance]);

  // Actions optimisées
  const actions = useMemo(() => ({
    refreshBalances: fetchAgentBalances,
    formatBalance: (amount: number, showBalance: boolean = true) => {
      if (!showBalance) return "••••••••";
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XAF'
      }).format(amount);
    }
  }), [fetchAgentBalances]);

  return {
    agentData,
    actions,
    isLoading: isLoadingBalance
  };
};
