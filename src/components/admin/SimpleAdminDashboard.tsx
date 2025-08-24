import React from 'react';
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownLeft, Users, PackageCheck, PackageX, UserPlus, UserMinus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CalendarRange } from 'lucide-react';
import { LineChart } from '@/components/admin/LineChart';
import { SimpleTransactionsList } from './SimpleTransactionsList';
import SubAdminTrafficMonitor from './SubAdminTrafficMonitor';
import SubAdminSummaryCard from './SubAdminSummaryCard';

export const SimpleAdminDashboard = () => {
  const { data, isLoading, refetch } = useAdminDashboardData();

  return (
    <div className="space-y-6 p-6">
      {/* Header avec statistiques principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalAgents || 0}</div>
            <p className="text-sm text-muted-foreground">
              {data?.activeAgents} actifs
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalUsers || 0}</div>
            <p className="text-sm text-muted-foreground">
              {data?.activeUsers} actifs
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance Admin</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data?.adminBalance || 0, 'XAF')}</div>
          </CardContent>
        </Card>
        
        {/* Nouvelle carte pour les sous-administrateurs */}
        <SubAdminSummaryCard />
      </div>

      {/* Nouvelles métriques */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volume Total</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data?.totalVolume || 0, 'XAF')}</div>
            <p className="text-sm text-muted-foreground">
              <span className="text-green-500">+20%</span> depuis le mois dernier
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions Aujourd'hui</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.todayTransactions || 0}</div>
            <p className="text-sm text-muted-foreground">
              <span className="text-red-500">-5%</span> depuis hier
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-pink-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nouveaux Utilisateurs</CardTitle>
            <CalendarRange className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.newUsersToday || 0}</div>
            <p className="text-sm text-muted-foreground">
              <span className="text-green-500">+10%</span> cette semaine
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trafic des Sous-Administrateurs - NOUVEAU */}
      <SubAdminTrafficMonitor />

      {/* Graphiques et tableaux existants */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenus Mensuels</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dernières Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleTransactionsList />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
