import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/utils/currency';

interface ProviderBalanceCardProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const ProviderBalanceCard = ({ onRefresh, isRefreshing = false }: ProviderBalanceCardProps) => {
  const { profile } = useAuth();
  const balance = profile?.balance || 0;

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <span>Solde Fournisseur</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <div className="text-3xl font-bold text-primary mb-2">
            {formatCurrency(balance, "XAF")}
          </div>
          <p className="text-sm text-muted-foreground">
            Solde disponible pour les services
          </p>
        </div>
      </CardContent>
    </Card>
  );
};