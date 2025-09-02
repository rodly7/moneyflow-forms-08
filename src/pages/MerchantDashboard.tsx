import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, Store, TrendingUp, Users, CreditCard, Wallet } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import MerchantPersonalQR from '@/components/merchant/MerchantPersonalQR';
import MerchantTransactionHistory from '@/components/merchant/MerchantTransactionHistory';
import MerchantStats from '@/components/merchant/MerchantStats';
import LogoutButton from '@/components/auth/LogoutButton';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const MerchantDashboard = () => {
  const { profile, refreshProfile } = useAuth();
  const [stats, setStats] = useState({
    dailyPayments: 0,
    monthlyTotal: 0,
    totalClients: 0,
    qrScanned: 0
  });
  const [refreshKey, setRefreshKey] = useState(0);

  // Récupérer les statistiques réelles
  const fetchStats = async () => {
    if (!profile?.id) return;

    try {
      // Récupérer les paiements du jour
      const today = new Date().toISOString().split('T')[0];
      const { data: dailyData } = await supabase
        .from('merchant_payments')
        .select('amount')
        .eq('merchant_id', profile.id)
        .gte('created_at', today);

      // Récupérer les paiements du mois
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const { data: monthlyData } = await supabase
        .from('merchant_payments')
        .select('amount')
        .eq('merchant_id', profile.id)
        .gte('created_at', startOfMonth.toISOString());

      // Récupérer le nombre de clients uniques
      const { data: clientsData } = await supabase
        .from('merchant_payments')
        .select('user_id')
        .eq('merchant_id', profile.id);

      // Calculer les statistiques
      const dailyTotal = dailyData?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
      const monthlyTotal = monthlyData?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
      const uniqueClients = new Set(clientsData?.map(payment => payment.user_id)).size || 0;
      const totalTransactions = monthlyData?.length || 0;

      setStats({
        dailyPayments: dailyTotal,
        monthlyTotal: monthlyTotal,
        totalClients: uniqueClients,
        qrScanned: totalTransactions
      });
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  // Créer rapidement quelques paiements pour ce marchand (insérés en base)
  const handleCreatePayments = async () => {
    if (!profile?.id) {
      toast.error("Profil introuvable");
      return;
    }
    try {
      const inserts = [
        {
          user_id: profile.id,
          merchant_id: String(profile.id),
          amount: 12500,
          business_name: profile.full_name || 'Client A',
          description: 'Paiement QR',
          status: 'completed',
          currency: 'XAF'
        },
        {
          user_id: profile.id,
          merchant_id: String(profile.id),
          amount: 8900,
          business_name: 'Client B',
          description: 'Paiement QR',
          status: 'completed',
          currency: 'XAF'
        },
        {
          user_id: profile.id,
          merchant_id: String(profile.id),
          amount: 4600,
          business_name: 'Client C',
          description: 'Paiement QR',
          status: 'pending',
          currency: 'XAF'
        }
      ];

      const { error } = await supabase.from('merchant_payments').insert(inserts);
      if (error) throw error;

      toast.success('Paiements créés');
      await fetchStats();
      setRefreshKey((k) => k + 1); // force le rafraîchissement de l'historique
    } catch (e:any) {
      console.error(e);
      toast.error(e.message || 'Erreur lors de la création');
    }
  };

  useEffect(() => {
    fetchStats();
  }, [profile?.id]);

  // Rafraîchir les données toutes les 5 secondes avec mise à jour forcée
  useEffect(() => {
    const interval = setInterval(async () => {
      if (profile?.id) {
        try {
          // Refetch des statistiques et du profil
          await fetchStats();
          
          // Force refresh du profil dans le contexte d'authentification
          await refreshProfile();
        } catch (error) {
          console.error('Erreur lors du rafraîchissement:', error);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [profile?.id]);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header avec bouton de déconnexion */}
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <div className="flex items-center justify-center mb-4">
              <Store className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-3xl font-bold text-foreground">Interface Commerciale</h1>
            </div>
            <p className="text-muted-foreground">
              Tableau de bord pour gérer vos paiements
            </p>
          </div>
          <LogoutButton />
        </div>

        {/* Carte du solde */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <Wallet className="h-10 w-10 text-primary mr-4" />
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">Mon Solde</p>
                <p className="text-3xl font-bold text-primary">
                  {profile?.balance?.toLocaleString() || 0} XAF
                </p>
              </div>
            </div>
          </CardContent>
        </Card>


        {/* QR Code Personnel uniquement */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 max-w-md mx-auto">
          <MerchantPersonalQR />
        </div>

        {/* Action de génération de paiements réels (à retirer ensuite) */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">Créer 3 paiements dans la base pour ce marchand</p>
              <Button onClick={handleCreatePayments}>Créer des paiements</Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6">
          {/* Transaction History */}
          <MerchantTransactionHistory key={refreshKey} />
        </div>

        {/* Detailed Stats */}
        <MerchantStats />
      </div>
    </div>
  );
};

export default MerchantDashboard;