import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Activity,
  UserCog,
  Bell,
  BarChart3,
  LogOut,
  Crown,
  Settings,
  Shield,
  Eye
} from 'lucide-react';

// Import existing components
import UsersDataTable from '@/components/admin/UsersDataTable';
import TransactionMonitor from '@/components/admin/TransactionMonitor';
import TreasuryDashboard from '@/components/treasury/TreasuryDashboard';
import AdvancedAgentManagement from '@/components/admin/AdvancedAgentManagement';
import AdvancedReporting from '@/components/admin/AdvancedReporting';
import AdvancedNotificationSystem from '@/components/admin/AdvancedNotificationSystem';
import CustomerSupportMessages from '@/components/admin/CustomerSupportMessages';

const MainAdminDashboard = () => {
  const { profile, signOut } = useAuth();
  const { data, isLoading, refetch } = useAdminDashboardData();
  const [selectedTab, setSelectedTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  // Fetch users data for the users tab
  const fetchUsers = async () => {
    try {
      const { data: usersData, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, balance, country, role, is_banned, created_at')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsers(usersData || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  useEffect(() => {
    if (selectedTab === 'users') {
      fetchUsers();
    }
  }, [selectedTab]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header avec déconnexion */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Administration MoneyFlow
                </h1>
                <p className="text-sm text-gray-500">
                  Bienvenue, {profile?.full_name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                onClick={() => navigate('/admin-settings')}
                variant="outline"
                className="flex items-center space-x-2 hover:bg-gray-50"
              >
                <Settings className="w-4 h-4" />
                <span>Paramètres Système</span>
              </Button>
              <Badge variant="default" className="bg-red-600 hover:bg-red-700">
                Admin Principal
              </Badge>
              <Button 
                onClick={handleSignOut}
                variant="outline"
                className="flex items-center space-x-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
              >
                <LogOut className="w-4 h-4" />
                <span>Déconnexion</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const IconComponent = stat.icon;
            return (
              <Card key={stat.title} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg bg-gray-50 ${stat.color}`}>
                    <IconComponent className="h-4 w-4" />
                  </div>
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

        {/* Navigation Tabs Étendue */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <div className="bg-white rounded-xl p-1 shadow-sm">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 bg-transparent gap-1">
              <TabsTrigger 
                value="dashboard" 
                className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white text-xs lg:text-sm"
              >
                <Activity className="h-4 w-4" />
                <span className="hidden md:inline">Dashboard</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="advanced" 
                className="flex items-center gap-2 data-[state=active]:bg-purple-500 data-[state=active]:text-white text-xs lg:text-sm"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden md:inline">Avancé</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="users" 
                className="flex items-center gap-2 data-[state=active]:bg-green-500 data-[state=active]:text-white text-xs lg:text-sm"
              >
                <Users className="h-4 w-4" />
                <span className="hidden md:inline">Utilisateurs</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="agents" 
                className="flex items-center gap-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs lg:text-sm"
              >
                <UserCog className="h-4 w-4" />
                <span className="hidden md:inline">Agents</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="treasury" 
                className="flex items-center gap-2 data-[state=active]:bg-yellow-600 data-[state=active]:text-white text-xs lg:text-sm"
              >
                <DollarSign className="h-4 w-4" />
                <span className="hidden md:inline">Trésorerie</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="surveillance" 
                className="flex items-center gap-2 data-[state=active]:bg-indigo-500 data-[state=active]:text-white text-xs lg:text-sm"
              >
                <Eye className="h-4 w-4" />
                <span className="hidden md:inline">Surveillance</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="settings" 
                className="flex items-center gap-2 data-[state=active]:bg-gray-600 data-[state=active]:text-white text-xs lg:text-sm"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden md:inline">Paramètres</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="notifications" 
                className="flex items-center gap-2 data-[state=active]:bg-red-500 data-[state=active]:text-white text-xs lg:text-sm"
              >
                <Bell className="h-4 w-4" />
                <span className="hidden md:inline">Messages</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Dashboard Principal */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                    Activité Récente
                  </CardTitle>
                  <CardDescription>Dernières actions sur la plateforme</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                      <span className="text-sm">Nouveaux utilisateurs</span>
                      <span className="text-sm font-bold text-blue-600">+{data?.newUsersToday || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                      <span className="text-sm">Transactions en attente</span>
                      <span className="text-sm font-bold text-orange-600">{data?.pendingTransactions || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                      <span className="text-sm">Agents en validation</span>
                      <span className="text-sm font-bold text-green-600">{data?.pendingAgents || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Performance Système
                  </CardTitle>
                  <CardDescription>Indicateurs de santé</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                      <span className="text-sm">Temps de réponse</span>
                      <span className="text-sm font-bold text-green-600">125ms</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                      <span className="text-sm">Disponibilité</span>
                      <span className="text-sm font-bold text-green-600">99.9%</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                      <span className="text-sm">Erreurs système</span>
                      <span className="text-sm font-bold text-red-600">2</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-red-500" />
                    Alertes Importantes
                  </CardTitle>
                  <CardDescription>Notifications critiques</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data?.pendingAgents && data.pendingAgents > 0 && (
                      <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium">{data.pendingAgents} agent(s) en attente de validation</span>
                      </div>
                    )}
                    {data?.pendingTransactions && data.pendingTransactions > 5 && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium">Volume élevé de transactions en attente</span>
                      </div>
                    )}
                    {(!data?.pendingAgents || data.pendingAgents === 0) && (!data?.pendingTransactions || data.pendingTransactions <= 5) && (
                      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium">Système fonctionnel - Aucune alerte</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Dashboard Avancé */}
          <TabsContent value="advanced" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-500" />
                    Rapports Avancés
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AdvancedReporting />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-gray-500" />
                    Paramètres Système
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-2">Limites de Transaction</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Utilisateur quotidien</span>
                            <span className="font-medium">500,000 FCFA</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Agent quotidien</span>
                            <span className="font-medium">2,000,000 FCFA</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-2">Frais de Transaction</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>National</span>
                            <span className="font-medium">1%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>International</span>
                            <span className="font-medium">4.5-6.5%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Gestion Utilisateurs */}
          <TabsContent value="users" className="space-y-4">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Users className="h-6 w-6 text-green-500" />
                  Gestion des Utilisateurs
                </h2>
                <Badge variant="outline" className="text-green-600 border-green-200">
                  {users.length} utilisateurs
                </Badge>
              </div>
              <UsersDataTable
                users={users}
                onViewUser={() => {}}
                onQuickRoleChange={async (userId, newRole) => {
                  try {
                    const { error } = await supabase
                      .from('profiles')
                      .update({ role: newRole })
                      .eq('id', userId);
                    if (error) throw error;
                    fetchUsers();
                  } catch (error) {
                    console.error('Error updating user role:', error);
                  }
                }}
                onQuickBanToggle={async (userId, currentBanStatus) => {
                  try {
                    const { error } = await supabase
                      .from('profiles')
                      .update({ is_banned: !currentBanStatus })
                      .eq('id', userId);
                    if (error) throw error;
                    fetchUsers();
                  } catch (error) {
                    console.error('Error toggling user ban status:', error);
                  }
                }}
                onUserUpdated={fetchUsers}
              />
            </div>
          </TabsContent>

          {/* Gestion Agents */}
          <TabsContent value="agents" className="space-y-4">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <UserCog className="h-6 w-6 text-orange-500" />
                  Gestion Avancée des Agents
                </h2>
              </div>
              <AdvancedAgentManagement />
            </div>
          </TabsContent>

          {/* Trésorerie */}
          <TabsContent value="treasury" className="space-y-4">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <DollarSign className="h-6 w-6 text-yellow-600" />
                  Dashboard Trésorerie
                </h2>
              </div>
              <TreasuryDashboard onRefresh={refetch} />
            </div>
          </TabsContent>

          {/* Surveillance des Transactions */}
          <TabsContent value="surveillance" className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Eye className="h-6 w-6 text-indigo-500" />
                    Surveillance des Transactions
                  </h2>
                  <p className="text-gray-600 mt-1">Monitoring en temps réel de toutes les opérations</p>
                </div>
                <Button 
                  onClick={() => navigate('/admin-transaction-monitor')}
                  variant="outline"
                  className="bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Vue Détaillée
                </Button>
              </div>
              <TransactionMonitor />
            </div>
          </TabsContent>

          {/* Paramètres Système */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid gap-6">
              {/* Contrôles Système */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-red-500" />
                    Contrôles Système
                  </CardTitle>
                  <CardDescription>
                    Gérez les fonctionnalités critiques du système
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-3">Services de Transaction</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Transferts d'argent</span>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-green-600">Actif</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Retraits agents</span>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-green-600">Actif</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Dépôts mobiles</span>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-green-600">Actif</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-3">Limites et Restrictions</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Limite quotidienne utilisateur</span>
                          <span className="text-sm font-medium">500,000 FCFA</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Limite quotidienne agent</span>
                          <span className="text-sm font-medium">2,000,000 FCFA</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Frais de transaction</span>
                          <span className="text-sm font-medium">1-6.5%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Maintenance Système */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-gray-600" />
                    Maintenance Système
                  </CardTitle>
                  <CardDescription>
                    Outils de maintenance et configuration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Button 
                      onClick={() => navigate('/admin-settings')}
                      variant="outline" 
                      className="h-20 flex flex-col items-center gap-2"
                    >
                      <Settings className="w-6 h-6" />
                      <span>Configuration Avancée</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="h-20 flex flex-col items-center gap-2 opacity-50 cursor-not-allowed"
                      disabled
                    >
                      <Shield className="w-6 h-6" />
                      <span>Mode Maintenance</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="h-20 flex flex-col items-center gap-2 opacity-50 cursor-not-allowed"
                      disabled
                    >
                      <Activity className="w-6 h-6" />
                      <span>Diagnostic Système</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notifications & Messages */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-red-500" />
                    Système de Notifications Avancé
                  </CardTitle>
                  <CardDescription>
                    Envoyez des notifications ciblées aux utilisateurs et agents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AdvancedNotificationSystem />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-blue-500" />
                    Messages Support Client
                  </CardTitle>
                  <CardDescription>
                    Gérez les messages des utilisateurs et agents, et répondez directement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CustomerSupportMessages />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MainAdminDashboard;
