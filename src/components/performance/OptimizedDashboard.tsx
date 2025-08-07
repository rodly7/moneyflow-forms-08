
import { memo, Suspense, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { usePerformanceMonitor } from "@/hooks/usePerformanceOptimization";
import { LazySection } from "@/components/performance/LazyComponent";

// Simple loading component
const SimpleLoader = memo(() => (
  <Card className="animate-pulse">
    <CardContent className="p-6">
      <div className="h-32 bg-gray-200 rounded-lg"></div>
    </CardContent>
  </Card>
));

// Optimized components with proper memo
const OptimizedBalanceCard = memo(() => {
  return (
    <LazySection>
      <Card className="animate-fade-in">
        <CardContent className="p-6">
          <div className="h-32 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">Solde optimisé</span>
          </div>
        </CardContent>
      </Card>
    </LazySection>
  );
});

const OptimizedTransactionsList = memo(() => {
  return (
    <LazySection>
      <Card className="animate-fade-in">
        <CardContent className="p-6">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    </LazySection>
  );
});

const OptimizedActionButtons = memo(() => {
  return (
    <LazySection>
      <div className="grid grid-cols-2 gap-4 animate-fade-in">
        {['Transférer', 'QR Code', 'Épargnes', 'Historique'].map((action) => (
          <button
            key={action}
            className="h-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:scale-105 transition-transform duration-200"
          >
            {action}
          </button>
        ))}
      </div>
    </LazySection>
  );
});

interface OptimizedDashboardProps {
  userBalance: number;
  userCountry: string;
}

const OptimizedDashboard = memo(({ userBalance, userCountry }: OptimizedDashboardProps) => {
  const { profile } = useAuth();
  const { renderCount } = usePerformanceMonitor('OptimizedDashboard');

  const dashboardConfig = useMemo(() => ({
    showBalance: true,
    showTransactions: true,
    showActions: true,
    animationDelay: renderCount > 1 ? 0 : 200,
  }), [renderCount]);

  if (!profile) {
    return <SimpleLoader />;
  }

  return (
    <div className="space-y-6 p-4">
      {dashboardConfig.showBalance && (
        <Suspense fallback={<SimpleLoader />}>
          <OptimizedBalanceCard />
        </Suspense>
      )}

      {dashboardConfig.showActions && (
        <Suspense fallback={<div className="h-32 bg-gray-100 rounded-xl animate-pulse"></div>}>
          <OptimizedActionButtons />
        </Suspense>
      )}

      {dashboardConfig.showTransactions && (
        <Suspense fallback={<div className="h-48 bg-gray-100 rounded-xl animate-pulse"></div>}>
          <OptimizedTransactionsList />
        </Suspense>
      )}

      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black text-white p-2 rounded text-xs">
          Renders: {renderCount}
        </div>
      )}
    </div>
  );
});

// Set display names
OptimizedDashboard.displayName = 'OptimizedDashboard';
OptimizedBalanceCard.displayName = 'OptimizedBalanceCard';
OptimizedTransactionsList.displayName = 'OptimizedTransactionsList';
OptimizedActionButtons.displayName = 'OptimizedActionButtons';
SimpleLoader.displayName = 'SimpleLoader';

export default OptimizedDashboard;
