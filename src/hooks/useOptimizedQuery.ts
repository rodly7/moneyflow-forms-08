import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

interface OptimizedQueryConfig<T> {
  queryKey: (string | number)[];
  queryFn: () => Promise<T>;
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchInterval?: number;
  enabled?: boolean;
}

/**
 * Hook optimisé pour les requêtes avec cache intelligent et gestion des performances
 */
export const useOptimizedQuery = <T>({
  queryKey,
  queryFn,
  staleTime = 5 * 60 * 1000, // 5 minutes par défaut
  cacheTime = 10 * 60 * 1000, // 10 minutes par défaut  
  refetchOnWindowFocus = false,
  refetchInterval,
  enabled = true
}: OptimizedQueryConfig<T>) => {
  
  // Mémoriser la fonction de requête pour éviter les re-renders
  const memoizedQueryFn = useCallback(queryFn, []);
  
  // Configuration optimisée par défaut
  const queryOptions: UseQueryOptions<T, Error> = useMemo(() => ({
    queryKey,
    queryFn: memoizedQueryFn,
    staleTime,
    cacheTime,
    refetchOnWindowFocus,
    refetchInterval,
    enabled,
    // Optimisations supplémentaires
    refetchOnMount: 'always',
    refetchOnReconnect: 'always',
    retry: (failureCount, error) => {
      // Retry intelligent basé sur le type d'erreur
      if (error.message?.includes('Network Error')) return failureCount < 3;
      if (error.message?.includes('timeout')) return failureCount < 2;
      return failureCount < 1;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  }), [queryKey, memoizedQueryFn, staleTime, cacheTime, refetchOnWindowFocus, refetchInterval, enabled]);

  return useQuery(queryOptions);
};

/**
 * Hook spécialisé pour les données en temps réel (soldes, transactions, etc.)
 */
export const useRealTimeQuery = <T>(config: OptimizedQueryConfig<T>) => {
  return useOptimizedQuery({
    ...config,
    staleTime: 0, // Toujours considérer comme périmé
    cacheTime: 2 * 60 * 1000, // 2 minutes de cache
    refetchInterval: 30000, // Actualisation toutes les 30 secondes
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook pour les données statiques (pays, devises, etc.)
 */
export const useStaticQuery = <T>(config: OptimizedQueryConfig<T>) => {
  return useOptimizedQuery({
    ...config,
    staleTime: 24 * 60 * 60 * 1000, // 24 heures
    cacheTime: 7 * 24 * 60 * 60 * 1000, // 7 jours
    refetchInterval: undefined,
    refetchOnWindowFocus: false,
  });
};