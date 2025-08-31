
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/currency";
import { useAuth } from "@/contexts/AuthContext";
import { transactionLimitService } from "@/services/transactionLimitService";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, TrendingUp, AlertTriangle } from "lucide-react";

export default function MonthlyLimitCard() {
  const { user } = useAuth();

  // Récupérer les données de limite mensuelle
  const { data: limitData, refetch } = useQuery({
    queryKey: ['monthly-limit', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      console.log('Fetching monthly limit data...');
      const [remainingLimit, totalSent, monthlyLimit] = await Promise.all([
        transactionLimitService.getRemainingLimit(user.id),
        transactionLimitService.getTotalSentThisMonth(user.id),
        Promise.resolve(transactionLimitService.getMonthlyLimit())
      ]);

      return {
        remaining: remainingLimit,
        totalSent,
        limit: monthlyLimit,
        percentage: (totalSent / monthlyLimit) * 100
      };
    },
    enabled: !!user?.id,
    staleTime: 30000, // 30 secondes
    refetchInterval: 60000 // Actualiser chaque minute
  });

  const handleRefresh = () => {
    console.log('Refreshing monthly limit data...');
    refetch();
  };

  if (!limitData) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isNearLimit = limitData.percentage > 80;
  const isAtLimit = limitData.percentage >= 100;

  return (
    <Card className="w-full shadow-sm border border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            Limite Mensuelle
          </CardTitle>
          {(isNearLimit || isAtLimit) && (
            <AlertTriangle className="h-4 w-4 text-warning" />
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <Progress 
            value={limitData.percentage} 
            className="h-2"
            style={{
              background: limitData.percentage >= 100 
                ? 'hsl(var(--destructive))' 
                : limitData.percentage > 80 
                ? 'hsl(var(--warning))' 
                : 'hsl(var(--primary))'
            }}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{limitData.percentage.toFixed(1)}% utilisée</span>
            <span>Reset: 1er du mois</span>
          </div>
        </div>

        {/* Montants */}
        <div className="grid grid-cols-1 gap-3">
          <div className="flex justify-between items-center p-2 bg-muted/30 rounded-md">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Envoyé</span>
            </div>
            <span className="text-sm font-medium">
              {formatCurrency(limitData.totalSent, 'XAF')}
            </span>
          </div>

          <div className="flex justify-between items-center p-2 bg-primary/5 rounded-md">
            <span className="text-sm text-muted-foreground">Restant</span>
            <span className={`text-sm font-semibold ${
              limitData.remaining === 0 ? 'text-destructive' : 'text-primary'
            }`}>
              {formatCurrency(limitData.remaining, 'XAF')}
            </span>
          </div>
        </div>

        {/* Status message */}
        {isAtLimit && (
          <div className="p-2 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-xs text-destructive text-center">
              Limite mensuelle atteinte. Réinitialisation le 1er du mois.
            </p>
          </div>
        )}

        {isNearLimit && !isAtLimit && (
          <div className="p-2 bg-warning/10 border border-warning/20 rounded-md">
            <p className="text-xs text-warning text-center">
              Attention: proche de la limite mensuelle
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            className="flex-1 h-8 text-xs"
          >
            Actualiser
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
