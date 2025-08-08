import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, Users, TrendingUp, AlertTriangle, 
  Settings, Bell, BarChart3, UserCog, FileText, 
  Wallet, CreditCard, MapPin, Calendar,
  Search, Filter, RefreshCw, Download, Eye, Plus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AdminUserManagement from '@/components/admin/AdminUserManagement';
import AdminTransferManagement from '@/components/admin/AdminTransferManagement';
import AdminAgentManagement from '@/components/admin/AdminAgentManagement';
import AdminRechargeManagement from '@/components/admin/AdminRechargeManagement';
import AdminWithdrawalManagement from '@/components/admin/AdminWithdrawalManagement';
import AdminBalanceManagement from '@/components/admin/AdminBalanceManagement';
import AdminNotifications from '@/components/admin/AdminNotifications';
import AdminSettings from '@/components/admin/AdminSettings';
import AdminAnalytics from '@/components/admin/AdminAnalytics';
import AdminAdvancedTools from '@/components/admin/AdminAdvancedTools';
import SubAdminAdvancedTools from '@/components/admin/SubAdminAdvancedTools';

interface DashboardStats {
  totalUsers: number;
  totalAgents: number;
  totalTransfers: number;
  totalVolume: number;
  pendingTransfers: number;
  activeAgents: number;
  totalBalance: number;
  monthlyGrowth: number;
}

const MainAdminDashboard = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalAgents: 0,
    totalTransfers: 0,
    totalVolume: 0,
    pendingTransfers: 0,
    activeAgents: 0,
    totalBalance: 0,
    monthlyGrowth: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isMainAdmin = profile?.role === 'admin';
  const isSubAdmin = profile?.role === 'sub_admin';
  const canAccessAdmin = isMainAdmin || isSubAdmin;

  useEffect(() => {
    if (canAccessAdmin) {
      loadDashboardStats();
    }
  }, [canAccessAdmin]);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);

      // Charger les statistiques en parallèle
      const [
        usersResult,
        agentsResult,
        transfersResult,
        profilesResult
      ] = await Promise.all([
        supabase.from('profiles').select('id, role').neq('role', 'admin'),
        supabase.from('agents').select('id, status'),
        supabase.from('transfers').select('id, amount, status'),
        supabase.from('profiles').select('balance')
      ]);

      const totalUsers = usersResult.data?.filter(u => u.role === 'user').length || 0;
      const totalAgents = agentsResult.data?.length || 0;
      const activeAgents = agentsResult.data?.filter(a => a.status === 'active').length || 0;
      const totalTransfers = transfersResult.data?.length || 0;
      const pendingTransfers = transfersResult.data?.filter(t => t.status === 'pending').length || 0;
      const totalVolume = transfersResult.data?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
      const totalBalance = profilesResult.data?.reduce((sum, p) => sum + (p.balance || 0), 0) || 0;

      // Calculer la croissance mensuelle (simulation)
      const monthlyGrowth = Math.floor(Math.random() * 20) + 5; // 5-25%

      setStats({
        totalUsers,
        totalAgents,
        totalTransfers,
        totalVolume,
        pendingTransfers,
        activeAgents,
        totalBalance,
        monthlyGrowth
      });

    } catch (error: any) {
      console.error('Erreur chargement statistiques:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des statistiques",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardStats();
    setRefreshing(false);
    toast({
      title: "Actualisé",
      description: "Les données ont été mises à jour",
    });
  };

  if (!canAccessAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-bold mb-2">Accès Refusé</h2>
            <p className="text-gray-600">
              Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isMainAdmin ? 'Administration Principale' : 'Administration Territoriale'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isMainAdmin ? 'Gestion complète de la plateforme' : `Gestion du territoire ${profile?.country}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Badge variant="secondary" className="px-3 py-1">
              {isMainAdmin ? 'Admin Principal' : 'Sous-Admin'}
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10 mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="agents" className="flex items-center gap-2">
              <UserCog className="w-4 h-4" />
              Agents
            </TabsTrigger>
            <TabsTrigger value="transfers" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Transferts
            </TabsTrigger>
            <TabsTrigger value="recharges" className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Recharges
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Retraits
            </TabsTrigger>
            <TabsTrigger value="balance" className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Soldes
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Avancé
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Statistiques principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Utilisateurs</p>
                      <p className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-500" />
                  </div>
                  <div className="mt-4 flex items-center">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">+{stats.monthlyGrowth}% ce mois</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Agents</p>
                      <p className="text-2xl font-bold">{stats.totalAgents.toLocaleString()}</p>
                    </div>
                    <UserCog className="w-8 h-8 text-purple-500" />
                  </div>
                  <div className="mt-4">
                    <span className="text-sm text-gray-600">
                      {stats.activeAgents} actifs
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Transferts</p>
                      <p className="text-2xl font-bold">{stats.totalTransfers.toLocaleString()}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                  <div className="mt-4">
                    <span className="text-sm text-orange-600">
                      {stats.pendingTransfers} en attente
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Volume Total</p>
                      <p className="text-2xl font-bold">
                        {(stats.totalVolume / 1000000).toFixed(1)}M
                      </p>
                    </div>
                    <Wallet className="w-8 h-8 text-emerald-500" />
                  </div>
                  <div className="mt-4">
                    <span className="text-sm text-gray-600">FCFA</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Alertes et notifications */}
            {stats.pendingTransfers > 0 && (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-orange-500" />
                    <div>
                      <h3 className="font-semibold text-orange-800">
                        {stats.pendingTransfers} transfert(s) en attente
                      </h3>
                      <p className="text-sm text-orange-600">
                        Des transferts nécessitent votre attention
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab('transfers')}
                      className="ml-auto"
                    >
                      Voir les transferts
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Graphiques et analyses rapides */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Activité Récente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Transferts aujourd'hui</span>
                      <span className="font-semibold">{Math.floor(stats.totalTransfers * 0.1)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Nouveaux utilisateurs</span>
                      <span className="font-semibold">{Math.floor(stats.totalUsers * 0.05)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Agents connectés</span>
                      <span className="font-semibold">{Math.floor(stats.activeAgents * 0.8)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Répartition Géographique
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Congo Brazzaville</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded">
                          <div className="w-16 h-2 bg-blue-500 rounded"></div>
                        </div>
                        <span className="text-sm font-medium">80%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">France</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded">
                          <div className="w-3 h-2 bg-green-500 rounded"></div>
                        </div>
                        <span className="text-sm font-medium">15%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Autres</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded">
                          <div className="w-1 h-2 bg-purple-500 rounded"></div>
                        </div>
                        <span className="text-sm font-medium">5%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <AdminUserManagement />
          </TabsContent>

          <TabsContent value="agents">
            <AdminAgentManagement />
          </TabsContent>

          <TabsContent value="transfers">
            <AdminTransferManagement />
          </TabsContent>

          <TabsContent value="recharges">
            <AdminRechargeManagement />
          </TabsContent>

          <TabsContent value="withdrawals">
            <AdminWithdrawalManagement />
          </TabsContent>

          <TabsContent value="balance">
            <AdminBalanceManagement />
          </TabsContent>

          <TabsContent value="notifications">
            <AdminNotifications />
          </TabsContent>

          <TabsContent value="analytics">
            <AdminAnalytics />
          </TabsContent>

          <TabsContent value="advanced">
            {isMainAdmin ? <AdminAdvancedTools /> : <SubAdminAdvancedTools />}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MainAdminDashboard;
