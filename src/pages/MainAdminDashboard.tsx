
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Activity,
  UserCog,
  FileText,
  Bell,
  Settings,
  BarChart3,
  Wrench
} from 'lucide-react';

// Import existing components
import { UsersDataTable } from '@/components/admin/UsersDataTable';
import { UserManagementActions } from '@/components/admin/UserManagementActions';
import { TransactionMonitor } from '@/components/admin/TransactionMonitor';
import { NotificationSender } from '@/components/admin/NotificationSender';
import { TreasuryDashboard } from '@/components/treasury/TreasuryDashboard';

// Import new advanced components
import { AdvancedAgentManagement } from '@/components/admin/AdvancedAgentManagement';
import { AdvancedReporting } from '@/components/admin/AdvancedReporting';
import { AdvancedNotificationSystem } from '@/components/admin/AdvancedNotificationSystem';

const MainAdminDashboard = () => {
  const { profile } = useAuth();
  const { data, isLoading, refetch } = useAdminDashboardData();
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [refetch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const stats = [
    {
      title: "Utilisateurs Totaux",
      value: data?.totalUsers || 0,
      change: "+12%",
      trend: "up",
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Agents Actifs",
      value: data?.totalAgents || 0,
      change: "+5%",
      trend: "up",
      icon: UserCog,
      color: "text-green-600"
    },
    {
      title: "Volume des Transactions",
      value: `${(data?.totalTransactionVolume || 0).toLocaleString()} FCFA`,
      change: "+23%",
      trend: "up",
      icon: DollarSign,
      color: "text-purple-600"
    },
    {
      title: "Transactions Aujourd'hui",
      value: data?.todayTransactions || 0,
      change: "+8%",
      trend: "up",
      icon: TrendingUp,
      color: "text-orange-600"
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Tableau de Bord Administrateur Principal
          </h1>
          <p className="text-muted-foreground">
            Bienvenue, {profile?.full_name}. Gérez votre plateforme MoneyFlow.
          </p>
        </div>
        <Badge variant="default" className="bg-red-600">
          Admin Principal
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <IconComponent className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className={stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                    {stat.change}
                  </span>{' '}
                  par rapport au mois dernier
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Navigation Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-8 lg:grid-cols-10">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Vue d'ensemble</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Utilisateurs</span>
          </TabsTrigger>
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <UserCog className="h-4 w-4" />
            <span className="hidden sm:inline">Agents</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Transactions</span>
          </TabsTrigger>
          <TabsTrigger value="treasury" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Trésorerie</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Rapports</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Paramètres</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Activité Récente</CardTitle>
                <CardDescription>Dernières actions sur la plateforme</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Nouveaux utilisateurs</span>
                    <span className="text-sm font-medium">+{data?.newUsersToday || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Transactions en attente</span>
                    <span className="text-sm font-medium">{data?.pendingTransactions || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Agents en validation</span>
                    <span className="text-sm font-medium">{data?.pendingAgents || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Système</CardTitle>
                <CardDescription>Indicateurs de santé de la plateforme</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Temps de réponse moyen</span>
                    <span className="text-sm font-medium text-green-600">125ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Disponibilité</span>
                    <span className="text-sm font-medium text-green-600">99.9%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Erreurs système</span>
                    <span className="text-sm font-medium text-red-600">2</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alertes Importantes</CardTitle>
                <CardDescription>Notifications nécessitant une attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data?.pendingAgents && data.pendingAgents > 0 && (
                    <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm">{data.pendingAgents} agent(s) en attente de validation</span>
                    </div>
                  )}
                  {data?.pendingTransactions && data.pendingTransactions > 5 && (
                    <div className="flex items-center gap-2 p-2 bg-red-50 rounded">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-sm">Volume élevé de transactions en attente</span>
                    </div>
                  )}
                  {(!data?.pendingAgents || data.pendingAgents === 0) && (!data?.pendingTransactions || data.pendingTransactions <= 5) && (
                    <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Système fonctionnel - Aucune alerte</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Gestion des Utilisateurs</h2>
            <UserManagementActions />
          </div>
          <UsersDataTable />
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <AdvancedAgentManagement />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <TransactionMonitor />
        </TabsContent>

        <TabsContent value="treasury" className="space-y-4">
          <TreasuryDashboard />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <AdvancedNotificationSystem />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <AdvancedReporting />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Paramètres Système
              </CardTitle>
              <CardDescription>
                Configuration avancée de la plateforme MoneyFlow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Limites de Transaction</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Limite quotidienne utilisateur</span>
                        <span className="text-sm font-medium">500,000 FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Limite quotidienne agent</span>
                        <span className="text-sm font-medium">2,000,000 FCFA</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Frais de Transaction</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Transfert national</span>
                        <span className="text-sm font-medium">1%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Transfert international</span>
                        <span className="text-sm font-medium">4.5-6.5%</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MainAdminDashboard;
