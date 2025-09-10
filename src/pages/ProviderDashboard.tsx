import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, Building2, Receipt, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import BillPaymentRequests from '@/components/merchant/BillPaymentRequests';
import MerchantBillStats from '@/components/merchant/MerchantBillStats';
import LogoutButton from '@/components/auth/LogoutButton';
import { UnifiedNotificationBell } from '@/components/notifications/UnifiedNotificationBell';
import { useAutoBalanceRefresh } from '@/hooks/useAutoBalanceRefresh';
import { ProviderBalanceCard } from '@/components/provider/ProviderBalanceCard';
import { ProviderPaymentHistory } from '@/components/provider/ProviderPaymentHistory';

const ProviderDashboard = () => {
  const { profile } = useAuth();
  
  // Rafraîchir le solde toutes les 5 secondes
  const { refreshBalance } = useAutoBalanceRefresh({ 
    intervalMs: 5000,
    enableRealtime: true
  });

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header avec logo et navigation */}
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <div className="flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-3xl font-bold text-foreground">Interface Fournisseur</h1>
            </div>
            <p className="text-muted-foreground">
              Tableau de bord pour recevoir et gérer les paiements de factures
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Entreprise: {profile?.full_name || 'Non défini'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <UnifiedNotificationBell />
            <LogoutButton />
          </div>
        </div>

        {/* Informations du fournisseur */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Informations de l'entreprise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-primary/5 rounded-lg">
                <Building2 className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium text-muted-foreground">Nom de l'entreprise</p>
                <p className="text-lg font-bold text-foreground">
                  {profile?.full_name || 'Non défini'}
                </p>
              </div>
              <div className="text-center p-4 bg-secondary/5 rounded-lg">
                <Receipt className="h-8 w-8 text-secondary mx-auto mb-2" />
                <p className="text-sm font-medium text-muted-foreground">Type de service</p>
                <p className="text-lg font-bold text-foreground">
                  Fournisseur de factures
                </p>
              </div>
              <div className="text-center p-4 bg-accent/5 rounded-lg">
                <CreditCard className="h-8 w-8 text-accent mx-auto mb-2" />
                <p className="text-sm font-medium text-muted-foreground">Statut</p>
                <p className="text-lg font-bold text-green-600">
                  Actif
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Solde du fournisseur */}
        <ProviderBalanceCard onRefresh={refreshBalance} />

        {/* Statistiques des paiements de factures */}
        <MerchantBillStats />

        {/* Paiements de factures reçus */}
        <ProviderPaymentHistory />
      </div>
    </div>
  );
};

export default ProviderDashboard;