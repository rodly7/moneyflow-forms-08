
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserPlus, Gift, TrendingUp, Users } from 'lucide-react';

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  totalRewards: number;
  topReferrers: Array<{
    id: string;
    full_name: string;
    phone: string;
    referral_count: number;
  }>;
}

const SubAdminReferralsTab = () => {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['sub-admin-referrals', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Simuler les données de parrainage pour l'instant
      // Dans une vraie implémentation, ces données viendraient d'une table referrals
      const mockStats: ReferralStats = {
        totalReferrals: 147,
        activeReferrals: 132,
        totalRewards: 73500,
        topReferrers: [
          { id: '1', full_name: 'Marie Dubois', phone: '+237650123456', referral_count: 15 },
          { id: '2', full_name: 'Jean Martin', phone: '+237651234567', referral_count: 12 },
          { id: '3', full_name: 'Sophie Bernard', phone: '+237652345678', referral_count: 9 },
        ]
      };

      return mockStats;
    },
    enabled: !!user?.id
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserPlus className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Système de Parrainage</h2>
        </div>
      </div>

      {/* Statistiques générales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Parrainages</CardTitle>
            <UserPlus className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalReferrals || 0}</div>
            <p className="text-sm text-muted-foreground">+8 ce mois-ci</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Parrainages Actifs</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeReferrals || 0}</div>
            <p className="text-sm text-muted-foreground">89% du total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Récompenses Distribuées</CardTitle>
            <Gift className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalRewards || 0)}</div>
            <p className="text-sm text-muted-foreground">+15% ce mois-ci</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Conversion</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">72%</div>
            <p className="text-sm text-muted-foreground">+5% vs mois dernier</p>
          </CardContent>
        </Card>
      </div>

      {/* Top parraineurs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Top Parraineurs du Mois
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.topReferrers.map((referrer, index) => (
              <div key={referrer.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold">{referrer.full_name}</h4>
                    <p className="text-sm text-muted-foreground">{referrer.phone}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {referrer.referral_count} parrainages
                </Badge>
              </div>
            )) || (
              <div className="text-center py-8 text-muted-foreground">
                Aucune donnée de parrainage disponible
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Informations sur le système */}
      <Card>
        <CardHeader>
          <CardTitle>Comment Fonctionne le Parrainage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-semibold text-green-600">Récompenses Parrain</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• 500 XAF par inscription réussie</li>
                <li>• Bonus de 1000 XAF si le filleul effectue sa première transaction</li>
                <li>• Commission de 0,1% sur les transactions du filleul pendant 30 jours</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-600">Récompenses Filleul</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• 250 XAF de bonus à l'inscription</li>
                <li>• Réduction de 50% sur les frais pendant 7 jours</li>
                <li>• Support prioritaire pendant 30 jours</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubAdminReferralsTab;
