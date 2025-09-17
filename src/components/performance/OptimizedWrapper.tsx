import React, { memo, useMemo } from 'react';
import { useOptimizedPerformance } from '@/hooks/useOptimizedPerformance';

interface OptimizedWrapperProps {
  children: React.ReactNode;
  enablePerformanceOptimizations?: boolean;
}

/**
 * Wrapper optimisé pour améliorer les performances de rendu
 * Utilise memo pour éviter les re-renders inutiles
 */
const OptimizedWrapper: React.FC<OptimizedWrapperProps> = memo(({ 
  children, 
  enablePerformanceOptimizations = true 
}) => {
  // Initialiser les optimisations de performance
  const { performanceMetrics } = useOptimizedPerformance();
  
  // Mémoriser le contenu pour éviter les re-renders
  const memoizedChildren = useMemo(() => {
    return children;
  }, [children]);
  
  // Afficher les métriques en mode développement
  if (process.env.NODE_ENV === 'development' && enablePerformanceOptimizations) {
    console.log('🎯 Performance Wrapper actif - Renders:', performanceMetrics.renderCount);
  }
  
  return (
    <div className="optimized-wrapper">
      {memoizedChildren}
    </div>
  );
});

OptimizedWrapper.displayName = 'OptimizedWrapper';

export default OptimizedWrapper;