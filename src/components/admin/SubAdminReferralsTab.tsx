
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Gift, TrendingUp, Users } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';

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
  // Mock referral statistics until the database tables are available
  const stats: ReferralStats = {
    totalReferrals: 156,
    activeReferrals: 89,
    totalRewards: 445000,
    topReferrers: [
      {
        id: '1',
        full_name: 'Mamadou Diallo',
        phone: '+221701234567',
        referral_count: 23
      },
      {
        id: '2',
        full_name: 'Fatou Sall',
        phone: '+221702345678',
        referral_count: 18
      },
      {
        id: '3',
        full_name: 'Ousmane Ba',
        phone: '+221703456789',
        referral_count: 15
      },
      {
        id: '4',
        full_name: 'Awa Ndoye',
        phone: '+221704567890',
        referral_count: 12
      },
      {
        id: '5',
        full_name: 'Ibrahima Fall',
        phone: '+221705678901',
        referral_count: 10
      }
    ]
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
            <div className="text-2xl font-bold">{stats.totalReferrals}</div>
            <p className="text-sm text-muted-foreground">Parrainages créés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Parrainages Actifs</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeReferrals}</div>
            <p className="text-sm text-muted-foreground">Parrainages complétés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Récompenses Distribuées</CardTitle>
            <Gift className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRewards, 'XAF')}</div>
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
              {stats.totalReferrals ? Math.round((stats.activeReferrals / stats.totalReferrals) * 100) : 0}%
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
            {stats.topReferrers && stats.topReferrers.length > 0 ? (
              stats.topReferrers.map((referrer, index) => (
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
