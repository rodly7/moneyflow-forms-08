
import { lazy, Suspense, ComponentType, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface LazyLoadProps {
  children: ReactNode;
  fallback?: ReactNode;
}

// Simple loading component
const OptimizedLoader = () => (
  <Card className="w-full shadow-lg border-0 bg-white/80 backdrop-blur-sm animate-pulse">
    <CardContent className="pt-8 text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600 text-sm font-medium">Chargement...</p>
    </CardContent>
  </Card>
);

// HOC for lazy loading with error handling
export const withLazyLoading = <P extends object>(
  Component: ComponentType<P>,
  fallback?: ReactNode
) => {
  const LazyComponent = lazy(async () => {
    try {
      return { default: Component };
    } catch (error) {
      console.error('Error loading component:', error);
      return {
        default: () => (
          <div className="text-center p-4 text-red-600">
            Erreur de chargement du composant
          </div>
        )
      };
    }
  });

  const WrappedComponent = (props: P) => (
    <Suspense fallback={fallback || <OptimizedLoader />}>
      <LazyComponent {...(props as any)} />
    </Suspense>
  );

  WrappedComponent.displayName = `withLazyLoading(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Wrapper for sections that can be loaded lazily
export const LazySection = ({ children, fallback }: LazyLoadProps) => (
  <Suspense fallback={fallback || <OptimizedLoader />}>
    {children}
  </Suspense>
);

// Simple hook for conditional lazy loading
export const useLazyLoad = (condition: boolean) => {
  return condition;
};

export default LazySection;
