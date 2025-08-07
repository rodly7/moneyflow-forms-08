import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Users, DollarSign, TrendingUp, Activity, MapPin, Wifi, LogOut, User, Bell, 
  Settings, Menu, Wallet, UserPlus, MessageSquare, BarChart3, Database, Send,
  Wrench, Shield, CreditCard, AlertTriangle
} from 'lucide-react';
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';
import { useActiveAgentLocations } from '@/hooks/useAgentLocations';
import { useAuth } from '@/contexts/AuthContext';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import AgentsPerformanceTable from '@/components/admin/AgentsPerformanceTable';
import CommissionSummaryCard from '@/components/admin/CommissionSummaryCard';
import AnomaliesCard from '@/components/admin/AnomaliesCard';
import AgentLocationMap from '@/components/admin/AgentLocationMap';
import UsersDataTable from '@/components/admin/UsersDataTable';
import AdminSelfRecharge from '@/components/admin/AdminSelfRecharge';
import NotificationSender from '@/components/admin/NotificationSender';
import CustomDepositSystem from '@/components/admin/CustomDepositSystem';
import SystemMetricsCard from '@/components/dashboard/SystemMetricsCard';
import LowBalanceAgentsCard from '@/components/admin/LowBalanceAgentsCard';
import TopPerformerCard from '@/components/admin/TopPerformerCard';
import SubAdminBalanceRecharge from '@/components/admin/SubAdminBalanceRecharge';
import AdminNotificationBell from '@/components/admin/AdminNotificationBell';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { AdminUserService, AdminUserData } from '@/services/adminUserService';
import { AgentQuotaTracker } from '@/components/admin/AgentQuotaTracker';

// Widget pour dépôt rapide aux agents
const QuickAgentDepositWidget = () => {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAutoBatchDeposit = async () => {
    if (!profile?.id) {
      toast({
        title: "Erreur",
        description: "Profil administrateur non trouvé",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const result = await AdminUserService.performAutoBatchDeposit(
        profile.id,
        profile.balance || 0,
        50000,
        50000
      );

      if (result.success) {
        toast({
          title: "✅ Dépôts automatiques effectués",
          description: result.message,
        });
      } else {
        toast({
          title: "Information",
          description: result.message,
          variant: result.message.includes("Solde insuffisant") ? "destructive" : "default"
        });
      }
    } catch (error: any) {
      console.error('Erreur lors du dépôt automatique:', error);
      toast({
        title: "Erreur critique",
        description: error.message || "Erreur lors du dépôt automatique",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
        <p className="text-xs text-green-700 mb-2">
          <strong>Dépôt automatique:</strong> Crédite 50,000 FCFA aux agents ayant un solde inférieur à 50,000 FCFA
        </p>
      </div>
      
      <div className="space-y-3">
        <Button
          onClick={handleAutoBatchDeposit}
          disabled={isProcessing}
          className="w-full bg-orange-600 hover:bg-orange-700"
          size="sm"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          {isProcessing ? 'Traitement...' : 'Dépôt Auto (Agents < 50k)'}
        </Button>
        
      </div>
    </div>
  );
};

// Widget pour afficher les notifications récentes
const RecentNotificationsWidget = () => {
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['recent-notifications'],
    queryFn: async () => {
      console.log('🔔 Chargement des notifications récentes...');
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('❌ Erreur lors du chargement des notifications:', error);
        throw error;
      }
      console.log('✅ Notifications chargées:', data);
      return data || [];
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!notifications?.length) {
    return (
      <div className="text-center py-4 text-gray-500">
        <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        <p className="text-sm">Aucune notification récente</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <div key={notification.id} className="border border-gray-200 rounded-lg p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{notification.title}</h4>
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  {notification.total_recipients} destinataire(s)
                </Badge>
                {notification.notification_type === 'individual' && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    Auto-générée
                  </Badge>
                )}
              </div>
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {new Date(notification.created_at).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

interface OnlineUser {
  id: string;
  full_name: string;
  role: string;
  country: string;
  last_sign_in_at: string;
}

const OnlineUsersCard = () => {
  const { data: onlineUsers, isLoading } = useQuery({
    queryKey: ['online-users'],
    queryFn: async () => {
      console.log('🔍 Recherche des utilisateurs en ligne...');
      
      // Utiliser les sessions actives au lieu de la vue auth_users_agents_view
      const fifteenMinutesAgo = new Date();
      fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);

      const { data: activeSessions, error } = await supabase
        .from('user_sessions')
        .select(`
          user_id,
          last_activity,
          is_active,
          profiles!inner(id, full_name, role, country)
        `)
        .eq('is_active', true)
        .gte('last_activity', fifteenMinutesAgo.toISOString())
        .order('last_activity', { ascending: false });

      if (error) {
        console.error('❌ Erreur lors du chargement des sessions actives:', error);
        throw error;
      }

      console.log(`✅ Sessions actives trouvées: ${activeSessions?.length || 0}`, activeSessions);

      if (!activeSessions?.length) {
        console.log('ℹ️ Aucune session active trouvée');
        return { agents: [], users: [], total: 0 };
      }

      const onlineUsersWithProfiles = activeSessions.map(session => ({
        id: session.user_id,
        full_name: session.profiles.full_name,
        role: session.profiles.role,
        country: session.profiles.country,
        last_sign_in_at: session.last_activity
      })) as OnlineUser[];

      const agents = onlineUsersWithProfiles.filter(u => u.role === 'agent');
      const users = onlineUsersWithProfiles.filter(u => u.role === 'user');
      const admins = onlineUsersWithProfiles.filter(u => u.role === 'admin' || u.role === 'sub_admin');

      console.log(`📊 Utilisateurs en ligne: ${onlineUsersWithProfiles.length} total (${agents.length} agents, ${users.length} clients, ${admins.length} admins)`);

      return {
        agents: [...agents, ...admins], // Inclure les admins avec les agents
        users,
        total: onlineUsersWithProfiles.length
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="w-5 h-5 text-green-500" />
            Utilisateurs en Ligne
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="w-5 h-5 text-green-500" />
          Utilisateurs en Ligne
          <Badge variant="outline" className="ml-auto">
            {onlineUsers?.total || 0}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-700">Agents</span>
              <Badge className="bg-blue-500">
                {onlineUsers?.agents.length || 0}
              </Badge>
            </div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-700">Clients</span>
              <Badge className="bg-green-500">
                {onlineUsers?.users.length || 0}
              </Badge>
            </div>
          </div>
        </div>

        {/* Liste détaillée des utilisateurs en ligne */}
        <div className="space-y-3 max-h-80 overflow-y-auto">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Utilisateurs Connectés
          </h4>
          
          {/* Agents en ligne */}
          {onlineUsers?.agents && onlineUsers.agents.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs font-medium text-blue-700 uppercase tracking-wide">
                AGENTS ({onlineUsers.agents.length})
              </h5>
              {onlineUsers.agents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-900 truncate">
                      {agent.full_name}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-blue-600 mt-1">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{agent.country}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        <span>
                          {new Date(agent.last_sign_in_at).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <Badge className="bg-blue-500 text-white">
                      Agent
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Utilisateurs en ligne */}
          {onlineUsers?.users && onlineUsers.users.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs font-medium text-green-700 uppercase tracking-wide">
                CLIENTS ({onlineUsers.users.length})
              </h5>
              {onlineUsers.users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-900 truncate">
                      {user.full_name}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-green-600 mt-1">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{user.country}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        <span>
                          {new Date(user.last_sign_in_at).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <Badge className="bg-green-500 text-white">
                      Client
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(!onlineUsers || onlineUsers.total === 0) && (
            <div className="text-center py-4 text-gray-500">
              <Wifi className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Aucun utilisateur en ligne</p>
            </div>
          )}
        </div>

        <div className="text-xs text-gray-500 text-center pt-2 border-t">
          Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR')}
        </div>
      </CardContent>
    </Card>
  );
};

const MainAdminDashboard = () => {
  const { data: dashboardData, isLoading } = useAdminDashboardData();
  const { data: agentLocations, isLoading: isLoadingLocations } = useActiveAgentLocations();
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isMobile, isTablet } = useDeviceDetection();
  
  const [activeTab, setActiveTab] = useState("dashboard");
  const [users, setUsers] = useState<AdminUserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch users function
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const result = await AdminUserService.fetchAllUsers();
      if (result.success) {
        setUsers(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  React.useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Erreur déconnexion:', error);
      // Force la redirection même en cas d'erreur
      navigate('/auth');
    }
  };

  // Navigation items
  const navItems = [
    { id: "dashboard", label: "Tableau de Bord", icon: BarChart3 },
    { id: "users", label: "Gestion Utilisateurs", icon: Users },
    { id: "quotas", label: "Quotas Agents", icon: TrendingUp },
    { id: "finance", label: "Finance", icon: Wallet },
    { id: "notifications", label: "Notifications", icon: MessageSquare },
    { id: "settings", label: "Paramètres", icon: Settings }
  ];

  // Mobile navigation
  const MobileNav = () => (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="md:hidden">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <div className="space-y-4 py-4">
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold">Navigation</h2>
            <div className="space-y-1">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header responsive amélioré */}
      <div className="bg-white/90 backdrop-blur-md border-b border-gray-200/50 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            {/* Logo et titre */}
            <div className="flex items-center gap-4">
              <MobileNav />
              <div className="min-w-0 flex-1">
                <h1 className={`font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent ${
                  isMobile ? 'text-lg' : isTablet ? 'text-xl' : 'text-2xl'
                } truncate`}>
                  Admin Dashboard
                </h1>
                {!isMobile && (
                  <p className="text-gray-600 text-xs sm:text-sm mt-0.5">Vue d'ensemble et gestion complète</p>
                )}
              </div>
            </div>

            {/* Profil administrateur responsive */}
            <div className="flex items-center gap-2 sm:gap-3">
              <AdminNotificationBell />
              <Avatar className={`${isMobile ? 'h-8 w-8' : 'h-9 w-9 sm:h-10 sm:w-10'}`}>
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback>
                  <User className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                </AvatarFallback>
              </Avatar>
              
              {(isTablet || !isMobile) && (
                <div className="text-right hidden sm:block">
                  <p className="font-semibold text-gray-900 text-xs sm:text-sm truncate max-w-24 sm:max-w-32">
                    {profile?.full_name || 'Administrateur'}
                  </p>
                  <Badge variant="outline" className="text-xs mt-0.5">
                    {profile?.role === 'admin' ? 'Admin' : 'Sub-Admin'}
                  </Badge>
                </div>
              )}
              
              <div className="flex gap-1 sm:gap-2">
                {!isMobile && (
                  <Button size="sm" variant="outline" className="p-2 hidden sm:flex">
                    <Bell className="h-4 w-4" />
                  </Button>
                )}
                <Button 
                  size={isMobile ? "sm" : "default"}
                  variant="destructive"
                  onClick={handleSignOut}
                  className={`${isMobile ? 'p-2' : 'px-3 py-2'} flex items-center gap-1`}
                >
                  <LogOut className="h-4 w-4" />
                  {!isMobile && <span className="hidden sm:inline text-xs">Déconnexion</span>}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation responsive améliorée */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Navigation Desktop et Tablette */}
          {!isMobile && (
            <TabsList className="grid w-full grid-cols-6 mb-6 sm:mb-8 bg-white/60 backdrop-blur-sm shadow-sm">
              {navItems.map((item) => (
                <TabsTrigger 
                  key={item.id} 
                  value={item.id} 
                  className="flex items-center gap-2 text-xs sm:text-sm py-2.5 sm:py-3 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200"
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span className={`${isTablet ? 'hidden lg:inline' : 'inline'} truncate`}>
                    {item.label}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          )}

          {/* Indicateur d'onglet actif sur mobile */}
          {isMobile && (
            <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2">
                {navItems.find(item => item.id === activeTab) && (
                  <>
                    {React.createElement(navItems.find(item => item.id === activeTab)!.icon, { className: "h-5 w-5 text-blue-600" })}
                    <span className="font-medium text-blue-900">{navItems.find(item => item.id === activeTab)!.label}</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Contenu des onglets */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Statistiques principales - Commission Summary Cards */}
            <div className="mb-6">
              <CommissionSummaryCard data={dashboardData} isLoading={isLoading} />
            </div>

            {/* Métriques temps réel et utilisateurs en ligne */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 mb-6">
              <SystemMetricsCard />
              <OnlineUsersCard />
              <LowBalanceAgentsCard 
                onDepositToAgent={(agent) => {
                  // Rediriger vers l'onglet finance pour effectuer un dépôt
                  setActiveTab("finance");
                }}
                threshold={-100000}
              />
              <TopPerformerCard />
            </div>

            {/* Journal des anomalies élargi */}
            <div className="mb-6">
              <AnomaliesCard anomalies={dashboardData?.anomalies || []} isLoading={isLoading} />
            </div>

            {/* Section principale - disposition optimisée */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
              {/* Géolocalisation */}
              <Card className="xl:col-span-1 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-4">
                  <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <span className="text-sm sm:text-base font-semibold">Géolocalisation des Agents</span>
                    </div>
                    <Badge variant="outline" className="self-start sm:ml-auto bg-green-50 border-green-200">
                      <Wifi className="w-3 h-3 mr-1 text-green-600" />
                      <span className="text-green-700">{agentLocations?.filter(a => a.is_active).length || 0} actifs</span>
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-64 sm:h-72 lg:h-80 xl:h-72 2xl:h-80 rounded-lg overflow-hidden bg-gray-50">
                    <AgentLocationMap 
                      agents={agentLocations || []} 
                      isLoading={isLoadingLocations}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Performance des agents */}
              <Card className="xl:col-span-1 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600 flex-shrink-0" />
                    <span className="text-sm sm:text-base font-semibold">Performance des Agents</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="overflow-x-auto">
                    <div className="min-w-[500px]">
                      <AgentsPerformanceTable agents={dashboardData?.agents || []} isLoading={isLoading} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
            </div>
          </TabsContent>

          {/* Gestion des utilisateurs */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span className="text-sm sm:text-base">Gestion des Utilisateurs</span>
                </CardTitle>
                <Button onClick={fetchUsers} disabled={loadingUsers} size="sm" className="self-start sm:self-auto">
                  Actualiser
                </Button>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <div className="animate-pulse space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-12 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <UsersDataTable 
                      users={users} 
                      onViewUser={(user) => console.log('View user:', user)}
                      onQuickRoleChange={async (userId, newRole) => {
                        try {
                          const result = await AdminUserService.changeUserRole(userId, newRole, profile?.id);
                          if (result.success) {
                            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
                            toast({ title: "Rôle mis à jour", description: result.message });
                          }
                        } catch (error) {
                          toast({ title: "Erreur", variant: "destructive" });
                        }
                      }}
                      onQuickBanToggle={async (userId, currentBanStatus) => {
                        try {
                          const result = await AdminUserService.toggleUserBan(userId, currentBanStatus, 'Action administrative', profile?.id);
                          if (result.success) {
                            setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_banned: !currentBanStatus } : u));
                            toast({ title: "Statut mis à jour", description: result.message });
                          }
                        } catch (error) {
                          toast({ title: "Erreur", variant: "destructive" });
                        }
                      }}
                      onUserUpdated={fetchUsers}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quotas Agents */}
          <TabsContent value="quotas" className="space-y-6">
            <AgentQuotaTracker />
          </TabsContent>

          {/* Finance */}
          <TabsContent value="finance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Première colonne */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="w-5 h-5" />
                      Recharge Administrateur
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AdminSelfRecharge />
                  </CardContent>
                </Card>

                {/* Dépôt Rapide aux Agents - Déplacé ici */}
                <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200/60">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-700">
                      <UserPlus className="w-5 h-5" />
                      Dépôt Rapide Agents
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <QuickAgentDepositWidget />
                  </CardContent>
                </Card>
              </div>

                {/* Deuxième colonne */}
              <div className="space-y-6">
                {/* Recharge des Sous-Administrateurs */}
                <SubAdminBalanceRecharge />

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Statistiques Financières
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-600">Commissions Totales</p>
                          <p className="text-xl font-bold text-blue-800">
                            {dashboardData?.totalCommissions?.toLocaleString() || 0} XAF
                          </p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <p className="text-sm text-green-600">Volume Total</p>
                          <p className="text-xl font-bold text-green-800">
                            {((dashboardData?.totalVolume || 0) / 1000000).toFixed(1)}M XAF
                          </p>
                        </div>
                      </div>
                     </div>
                   </CardContent>
                </Card>

                {/* Système de Trésorerie */}
                <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200/60">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-emerald-700">
                      <Database className="w-5 h-5" />
                      Système de Trésorerie
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Button
                        onClick={() => navigate('/admin/treasury')}
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                        size="sm"
                      >
                        <Database className="w-4 h-4 mr-2" />
                        Accéder à la Trésorerie
                      </Button>
                      <p className="text-xs text-emerald-700">
                        Gestion des flux de trésorerie, agents fiables et équilibrage des soldes
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Monitoring des Transactions */}
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200/60">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-700">
                      <Activity className="w-5 h-5" />
                      Monitoring Transactions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Button
                        onClick={() => navigate('/admin/transaction-monitor')}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        size="sm"
                      >
                        <Activity className="w-4 h-4 mr-2" />
                        Voir le Monitoring
                      </Button>
                      <p className="text-xs text-blue-700">
                        Surveillance en temps réel des transactions et opérations
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Section pleine largeur pour le système de dépôt personnalisé */}
            <div className="mt-6">
              <CustomDepositSystem />
            </div>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Envoi de Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <NotificationSender />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-5 h-5 text-blue-600" />
                      <span>Notifications Récentes</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate('/admin-notifications')}
                      className="flex items-center gap-1"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Voir tout
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-700">
                      💡 <strong>Les notifications automatiques</strong> apparaissent ici quand vous effectuez des dépôts aux agents.
                    </p>
                  </div>
                  <RecentNotificationsWidget />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Paramètres */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Configuration Système
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span>Base de données</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-green-600">Opérationnelle</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>API Supabase</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-green-600">Connectée</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Authentification</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-green-600">Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
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