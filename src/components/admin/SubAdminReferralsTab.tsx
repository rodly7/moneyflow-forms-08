
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Gift, TrendingUp, Users } from 'lucide-react';
import { formatCurrency } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  const { data: stats, isLoading } = useQuery({
    queryKey: ['referral-stats'],
    queryFn: async (): Promise<ReferralStats> => {
      try {
        // Récupérer le nombre total de parrainages
        const { count: totalReferrals } = await supabase
          .from('referrals')
          .select('*', { count: 'exact', head: true });

        // Récupérer le nombre de parrainages actifs (complétés)
        const { count: activeReferrals } = await supabase
          .from('referrals')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed');

        // Calculer le total des récompenses payées
        const { data: rewards } = await supabase
          .from('referral_rewards')
          .select('amount')
          .eq('status', 'paid');

        const totalRewards = rewards?.reduce((sum, reward) => sum + (reward.amount || 0), 0) || 0;

        // Récupérer les meilleurs parraineurs
        const { data: topReferrersData } = await supabase
          .from('referrals')
          .select(`
            referrer_id,
            profiles!referrals_referrer_id_fkey(full_name, phone)
          `)
          .eq('status', 'completed');

        // Compter les parrainages par utilisateur
        const referrerCounts = new Map();
        topReferrersData?.forEach((referral: any) => {
          const referrerId = referral.referrer_id;
          referrerCounts.set(referrerId, (referrerCounts.get(referrerId) || 0) + 1);
        });

        // Créer la liste des top parraineurs
        const topReferrers = Array.from(referrerCounts.entries())
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([referrerId, count]) => {
            const referralData = topReferrersData?.find((r: any) => r.referrer_id === referrerId);
            return {
              id: referrerId,
              full_name: referralData?.profiles?.full_name || 'Utilisateur inconnu',
              phone: referralData?.profiles?.phone || 'N/A',
              referral_count: count
            };
          });

        return {
          totalReferrals: totalReferrals || 0,
          activeReferrals: activeReferrals || 0,
          totalRewards: totalRewards,
          topReferrers: topReferrers
        };
      } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        return {
          totalReferrals: 0,
          activeReferrals: 0,
          totalRewards: 0,
          topReferrers: []
        };
      }
    },
    refetchInterval: 30000, // Actualiser toutes les 30 secondes
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const currentStats = stats || {
    totalReferrals: 0,
    activeReferrals: 0,
    totalRewards: 0,
    topReferrers: []
  };

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
            <div className="text-2xl font-bold">{currentStats.totalReferrals}</div>
            <p className="text-sm text-muted-foreground">Parrainages créés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Parrainages Actifs</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStats.activeReferrals}</div>
            <p className="text-sm text-muted-foreground">Parrainages complétés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Récompenses Distribuées</CardTitle>
            <Gift className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentStats.totalRewards, 'XAF')}</div>
            <p className="text-sm text-muted-foreground">Montant total payé</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Conversion</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentStats.totalReferrals ? Math.round((currentStats.activeReferrals / currentStats.totalReferrals) * 100) : 0}%
            </div>
            <p className="text-sm text-muted-foreground">Parrainages complétés</p>
          </CardContent>
        </Card>
      </div>

      {/* Top parraineurs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Top Parraineurs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currentStats.topReferrers && currentStats.topReferrers.length > 0 ? (
              currentStats.topReferrers.map((referrer, index) => (
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
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Aucun parrainage complété pour le moment
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
