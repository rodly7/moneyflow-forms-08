import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Users, TrendingUp, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';

interface UserQuotaInfo {
  user_id: string;
  full_name: string;
  phone: string;
  country: string;
  dailyNationalTransfers: number;
  monthlyInternationalTransfers: number;
  dailyQuotaUsed: number;
  monthlyQuotaUsed: number;
  isDailyQuotaExceeded: boolean;
  isMonthlyQuotaExceeded: boolean;
  recentTransactions: any[];
}

const DAILY_NATIONAL_LIMIT = 200000; // 200,000 XAF par jour
const MONTHLY_INTERNATIONAL_LIMIT = 3000000; // 3,000,000 XAF par mois

export const UserTransactionsQuotaList = () => {
  const [users, setUsers] = useState<UserQuotaInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadUserQuotas = async () => {
    try {
      setLoading(true);
      
      // Obtenir tous les utilisateurs
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, phone, country')
        .order('full_name');

      if (profileError) throw profileError;

      const userQuotas: UserQuotaInfo[] = [];

      for (const profile of profiles || []) {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // Calculer les transferts nationaux du jour
        const { data: dailyNationalTransfers, error: dailyError } = await supabase
          .from('transfers')
          .select('amount, created_at, recipient_full_name, recipient_phone, status')
          .eq('sender_id', profile.id)
          .eq('status', 'completed')
          .gte('created_at', startOfDay.toISOString())
          .is('recipient_id', null); // Transferts sans destinataire enregistré = nationaux

        if (dailyError) throw dailyError;

        // Calculer les transferts internationaux du mois
        const { data: monthlyInternationalTransfers, error: monthlyError } = await supabase
          .from('transfers')
          .select('amount, created_at, recipient_full_name, recipient_phone, status')
          .eq('sender_id', profile.id)
          .eq('status', 'completed')
          .gte('created_at', startOfMonth.toISOString())
          .not('recipient_id', 'is', null); // Transferts avec destinataire enregistré = internationaux

        if (monthlyError) throw monthlyError;

        // Obtenir les transactions récentes (7 derniers jours)
        const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const { data: recentTransactions, error: recentError } = await supabase
          .from('transfers')
          .select('amount, created_at, recipient_full_name, recipient_phone, status')
          .eq('sender_id', profile.id)
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(10);

        if (recentError) throw recentError;

        const dailyNationalAmount = dailyNationalTransfers?.reduce((sum, t) => sum + t.amount, 0) || 0;
        const monthlyInternationalAmount = monthlyInternationalTransfers?.reduce((sum, t) => sum + t.amount, 0) || 0;

        const dailyQuotaUsed = (dailyNationalAmount / DAILY_NATIONAL_LIMIT) * 100;
        const monthlyQuotaUsed = (monthlyInternationalAmount / MONTHLY_INTERNATIONAL_LIMIT) * 100;

        userQuotas.push({
          user_id: profile.id,
          full_name: profile.full_name || 'N/A',
          phone: profile.phone,
          country: profile.country || 'N/A',
          dailyNationalTransfers: dailyNationalAmount,
          monthlyInternationalTransfers: monthlyInternationalAmount,
          dailyQuotaUsed,
          monthlyQuotaUsed,
          isDailyQuotaExceeded: dailyNationalAmount > DAILY_NATIONAL_LIMIT,
          isMonthlyQuotaExceeded: monthlyInternationalAmount > MONTHLY_INTERNATIONAL_LIMIT,
          recentTransactions: recentTransactions || []
        });
      }

      // Trier par quota utilisé (les plus élevés en premier)
      userQuotas.sort((a, b) => Math.max(b.dailyQuotaUsed, b.monthlyQuotaUsed) - Math.max(a.dailyQuotaUsed, a.monthlyQuotaUsed));
      
      setUsers(userQuotas);
    } catch (error) {
      console.error('Erreur lors du chargement des quotas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserQuotas();
  }, []);

  const filteredUsers = users.filter(user => {
    return searchTerm === '' || 
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm);
  });

  const getQuotaStatus = (quotaUsed: number, isExceeded: boolean) => {
    if (isExceeded) {
      return { color: 'bg-red-500', label: 'Dépassé', variant: 'destructive' as const };
    } else if (quotaUsed > 80) {
      return { color: 'bg-orange-500', label: 'Critique', variant: 'secondary' as const };
    } else if (quotaUsed > 60) {
      return { color: 'bg-yellow-500', label: 'Attention', variant: 'secondary' as const };
    } else {
      return { color: 'bg-green-500', label: 'Normal', variant: 'default' as const };
    }
  };

  const exceedingUsersCount = users.filter(u => u.isDailyQuotaExceeded || u.isMonthlyQuotaExceeded).length;
  const highUsageUsersCount = users.filter(u => u.dailyQuotaUsed > 80 || u.monthlyQuotaUsed > 80).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        <span className="ml-2">Chargement des quotas utilisateurs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Quotas Utilisateurs</h2>
          <p className="text-muted-foreground">
            Surveillance des limites de transferts nationaux et internationaux
          </p>
        </div>
        <Button onClick={loadUserQuotas} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Alertes et statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Utilisateurs</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Quotas Dépassés</p>
                <p className="text-2xl font-bold text-red-600">{exceedingUsersCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Usage Élevé (&gt;80%)</p>
                <p className="text-2xl font-bold text-orange-600">{highUsageUsersCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                ✓
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Dans les Limites</p>
                <p className="text-2xl font-bold text-green-600">
                  {users.length - highUsageUsersCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Limites de référence */}
      <Card>
        <CardHeader>
          <CardTitle>Limites de Référence</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-blue-600">Transferts Nationaux (Quotidien)</h4>
              <p className="text-2xl font-bold">{formatCurrency(DAILY_NATIONAL_LIMIT)}</p>
              <p className="text-sm text-muted-foreground">
                Par jour • Renouvellement automatique à minuit
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-purple-600">Transferts Internationaux (Mensuel)</h4>
              <p className="text-2xl font-bold">{formatCurrency(MONTHLY_INTERNATIONAL_LIMIT)}</p>
              <p className="text-sm text-muted-foreground">
                Par mois • Renouvellement le 1er du mois
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtre de recherche */}
      <Card>
        <CardContent className="pt-6">
          <Input
            placeholder="Rechercher par nom ou téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </CardContent>
      </Card>

      {/* Liste des utilisateurs */}
      <Card>
        <CardHeader>
          <CardTitle>Utilisateurs et Quotas ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => {
              const dailyStatus = getQuotaStatus(user.dailyQuotaUsed, user.isDailyQuotaExceeded);
              const monthlyStatus = getQuotaStatus(user.monthlyQuotaUsed, user.isMonthlyQuotaExceeded);
              
              return (
                <div key={user.user_id} className="border rounded-lg p-4 hover:bg-muted/50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{user.full_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {user.phone} • {user.country}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={dailyStatus.variant} className={`${dailyStatus.color} text-white`}>
                        Quotidien: {dailyStatus.label}
                      </Badge>
                      <Badge variant={monthlyStatus.variant} className={`${monthlyStatus.color} text-white`}>
                        Mensuel: {monthlyStatus.label}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    {/* Quota quotidien */}
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">Transferts Nationaux (Aujourd'hui)</h4>
                      <p className="text-lg font-bold text-blue-900">
                        {formatCurrency(user.dailyNationalTransfers)}
                      </p>
                      <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${user.isDailyQuotaExceeded ? 'bg-red-500' : 'bg-blue-500'}`}
                          style={{ width: `${Math.min(user.dailyQuotaUsed, 100)}%` }}
                        />
                      </div>
                      <p className="text-sm text-blue-600 mt-1">
                        {user.dailyQuotaUsed.toFixed(1)}% utilisé
                        {user.isDailyQuotaExceeded && (
                          <span className="text-red-600 font-semibold"> • DÉPASSÉ</span>
                        )}
                      </p>
                    </div>

                    {/* Quota mensuel */}
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <h4 className="font-medium text-purple-800 mb-2">Transferts Internationaux (Ce mois)</h4>
                      <p className="text-lg font-bold text-purple-900">
                        {formatCurrency(user.monthlyInternationalTransfers)}
                      </p>
                      <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${user.isMonthlyQuotaExceeded ? 'bg-red-500' : 'bg-purple-500'}`}
                          style={{ width: `${Math.min(user.monthlyQuotaUsed, 100)}%` }}
                        />
                      </div>
                      <p className="text-sm text-purple-600 mt-1">
                        {user.monthlyQuotaUsed.toFixed(1)}% utilisé
                        {user.isMonthlyQuotaExceeded && (
                          <span className="text-red-600 font-semibold"> • DÉPASSÉ</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Transactions récentes */}
                  {user.recentTransactions.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Transactions Récentes (7 derniers jours)</h4>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {user.recentTransactions.slice(0, 5).map((transaction, index) => (
                          <div key={index} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                            <span>{transaction.recipient_full_name || transaction.recipient_phone}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{formatCurrency(transaction.amount)}</span>
                              <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                                {transaction.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                        {user.recentTransactions.length > 5 && (
                          <p className="text-xs text-muted-foreground text-center">
                            +{user.recentTransactions.length - 5} autres transactions
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};