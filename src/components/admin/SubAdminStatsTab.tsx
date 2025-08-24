
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSubAdmin } from '@/hooks/useSubAdmin';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3, TrendingUp, Users, DollarSign, AlertCircle } from 'lucide-react';

interface TerritorialStats {
  totalUsers: number;
  totalAgents: number;
  activeAgents: number;
  totalTransactions: number;
  totalVolume: number;
  thisMonthTransactions: number;
  thisMonthVolume: number;
}

const SubAdminStatsTab = () => {
  const { canViewTerritorialStats, userCountry } = useSubAdmin();
  const [stats, setStats] = useState<TerritorialStats>({
    totalUsers: 0,
    totalAgents: 0,
    activeAgents: 0,
    totalTransactions: 0,
    totalVolume: 0,
    thisMonthTransactions: 0,
    thisMonthVolume: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (canViewTerritorialStats) {
      fetchStats();
    }
  }, [canViewTerritorialStats]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Statistiques des utilisateurs
      let usersQuery = supabase
        .from('profiles')
        .select('id, role')
        .neq('role', 'admin');

      if (userCountry) {
        usersQuery = usersQuery.eq('country', userCountry);
      }

      const { data: users } = await usersQuery;
      const totalUsers = users?.filter(u => u.role === 'user').length || 0;
      const totalAgents = users?.filter(u => u.role === 'agent').length || 0;

      // Agents actifs
      let agentsQuery = supabase
        .from('agents')
        .select('id')
        .eq('status', 'active');

      if (userCountry) {
        agentsQuery = agentsQuery.eq('country', userCountry);
      }

      const { data: activeAgentsData } = await agentsQuery;
      const activeAgents = activeAgentsData?.length || 0;

      // Transactions (simulation)
      const { data: transfers } = await supabase
        .from('transfers')
        .select('amount, created_at')
        .eq('status', 'completed');

      const totalTransactions = transfers?.length || 0;
      const totalVolume = transfers?.reduce((sum, t) => sum + t.amount, 0) || 0;

      // Ce mois
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const thisMonthTransfers = transfers?.filter(t => 
        new Date(t.created_at) >= startOfMonth
      ) || [];

      const thisMonthTransactions = thisMonthTransfers.length;
      const thisMonthVolume = thisMonthTransfers.reduce((sum, t) => sum + t.amount, 0);

      setStats({
        totalUsers,
        totalAgents,
        activeAgents,
        totalTransactions,
        totalVolume,
        thisMonthTransactions,
        thisMonthVolume,
      });
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!canViewTerritorialStats) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Accès limité</h3>
            <p className="text-muted-foreground">
              Vous n'avez pas les permissions pour voir les statistiques territoriales.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Statistiques Territoriales</h2>
          <p className="text-muted-foreground">
            Vue d'ensemble de votre territoire{userCountry && ` (${userCountry})`}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Statistiques générales */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Utilisateurs Totaux</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Dans votre territoire
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Agents Actifs</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.activeAgents}</div>
                <p className="text-xs text-muted-foreground">
                  Sur {stats.totalAgents} agents
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transactions Totales</CardTitle>
                <BarChart3 className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.totalTransactions}</div>
                <p className="text-xs text-muted-foreground">
                  Toutes transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Volume Total</CardTitle>
                <DollarSign className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {stats.totalVolume.toLocaleString()} FCFA
                </div>
                <p className="text-xs text-muted-foreground">
                  Volume traité
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Statistiques du mois */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance du Mois</CardTitle>
                <CardDescription>Statistiques du mois en cours</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Transactions ce mois</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {stats.thisMonthTransactions}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Volume ce mois</span>
                  <span className="text-2xl font-bold text-green-600">
                    {stats.thisMonthVolume.toLocaleString()} FCFA
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Moyenne par transaction</span>
                  <span className="text-lg font-semibold">
                    {stats.thisMonthTransactions > 0 
                      ? Math.round(stats.thisMonthVolume / stats.thisMonthTransactions).toLocaleString()
                      : 0
                    } FCFA
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Taux de Performance</CardTitle>
                <CardDescription>Indicateurs de performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Taux d'agents actifs</span>
                  <span className="text-2xl font-bold text-green-600">
                    {stats.totalAgents > 0 
                      ? Math.round((stats.activeAgents / stats.totalAgents) * 100)
                      : 0
                    }%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Croissance mensuelle</span>
                  <span className="text-lg font-semibold text-blue-600">
                    +{stats.thisMonthTransactions} trans.
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Couverture territoriale</span>
                  <span className="text-lg font-semibold text-purple-600">
                    {userCountry || 'Multi-pays'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default SubAdminStatsTab;
