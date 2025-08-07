import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Users, Shield, DollarSign, Activity, Eye, UserPlus, BarChart3, Bell, TrendingUp, Bug } from "lucide-react";
import AdminNotificationBell from "@/components/admin/AdminNotificationBell";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import UserProfileInfo from "@/components/profile/UserProfileInfo";
import UsersDataTable from "@/components/admin/UsersDataTable";
import BatchAgentDeposit from "@/components/admin/BatchAgentDeposit";
import UserManagementModal from "@/components/admin/UserManagementModal";
import { useSubAdmin } from "@/hooks/useSubAdmin";
import CompactHeader from "@/components/dashboard/CompactHeader";
import CompactStatsGrid from "@/components/dashboard/CompactStatsGrid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SystemMetricsCard from "@/components/dashboard/SystemMetricsCard";
import AnomaliesCard from "@/components/admin/AnomaliesCard";
import { useAdminDashboardData } from "@/hooks/useAdminDashboardData";
import NotificationsCard from "@/components/notifications/NotificationsCard";
import NotificationSender from "@/components/admin/NotificationSender";
import TransactionsCard from "@/components/dashboard/TransactionsCard";
import LowBalanceAgentsCard from "@/components/admin/LowBalanceAgentsCard";
import TopPerformerCard from "@/components/admin/TopPerformerCard";
import { useRealtimeTransactions } from "@/hooks/useRealtimeTransactions";

import CustomDepositSystem from "@/components/admin/CustomDepositSystem";
import AgentsPerformanceTable from "@/components/admin/AgentsPerformanceTable";
import CommissionSummaryCard from "@/components/admin/CommissionSummaryCard";
import { useActiveAgentLocations } from "@/hooks/useAgentLocations";
import AgentLocationMap from "@/components/admin/AgentLocationMap";
import { AgentQuotaTracker } from "@/components/admin/AgentQuotaTracker";
import { TerritorialAgentManager } from "@/components/admin/TerritorialAgentManager";
import { TerritorialStatsCard } from "@/components/admin/TerritorialStatsCard";
import { BugReportSystem } from "@/components/admin/BugReportSystem";

interface StatsData {
  totalUsers: number;
  totalAgents: number;
  totalTransactions: number;
  totalBalance: number;
}

interface UserData {
  id: string;
  full_name: string | null;
  phone: string;
  balance: number;
  country: string | null;
  role: 'user' | 'agent' | 'admin' | 'sub_admin';
  is_banned?: boolean;
  banned_reason?: string | null;
  created_at: string;
}

const CompactSubAdminDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isSubAdmin, canDepositToAgent, userCountry } = useSubAdmin();
  const { data: dashboardData, isLoading: isLoadingDashboard } = useAdminDashboardData();
  const { transactions, withdrawals, isLoading: isLoadingTransactions, deleteTransaction } = useRealtimeTransactions(user?.id);
  const { data: agentLocations, isLoading: isLoadingLocations } = useActiveAgentLocations();
  
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 0,
    totalAgents: 0,
    totalTransactions: 0,
    totalBalance: 0
  });
  const [users, setUsers] = useState<UserData[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showBatchDeposit, setShowBatchDeposit] = useState(false);

  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const { data: allUsers } = await supabase
        .from('profiles')
        .select('id, role, balance, country')
        .order('created_at', { ascending: false });

      const { data: transactions } = await supabase
        .from('transfers')
        .select('amount');

      if (allUsers) {
        const totalUsers = allUsers.filter(u => u.role === 'user').length;
        const totalAgents = allUsers.filter(u => u.role === 'agent').length;
        const totalBalance = allUsers.reduce((sum, u) => sum + (u.balance || 0), 0);
        const totalTransactions = transactions?.length || 0;

        setStats({
          totalUsers,
          totalAgents,
          totalTransactions,
          totalBalance
        });
      }
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques",
        variant: "destructive"
      });
    }
    setIsLoadingStats(false);
  }, [toast]);

  const fetchUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleViewUser = useCallback((user: UserData) => {
    setSelectedUser(user);
    setShowUserModal(true);
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      navigate('/auth');
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la déconnexion",
        variant: "destructive"
      });
    }
  }, [signOut, navigate, toast]);

  useEffect(() => {
    if (profile?.role !== 'sub_admin') {
      navigate('/dashboard');
      return;
    }
    fetchStats();
    fetchUsers();
  }, [profile, navigate]);

  if (!profile || profile.role !== 'sub_admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-destructive rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-destructive-foreground" />
            </div>
            <h2 className="text-xl font-bold text-destructive mb-2">Accès refusé</h2>
            <p className="text-muted-foreground mb-4">Cette page est réservée aux sous-administrateurs.</p>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour au tableau de bord
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statsData = useMemo(() => [
    {
      label: "Utilisateurs",
      value: stats.totalUsers,
      icon: Users,
      gradient: "bg-gradient-to-r from-blue-600 to-indigo-600",
      textColor: "text-blue-100"
    },
    {
      label: "Agents",
      value: stats.totalAgents,
      icon: Shield,
      gradient: "bg-gradient-to-r from-emerald-600 to-teal-600",
      textColor: "text-emerald-100"
    },
    {
      label: "Transactions",
      value: stats.totalTransactions,
      icon: Activity,
      gradient: "bg-gradient-to-r from-purple-600 to-pink-600",
      textColor: "text-purple-100"
    }
  ], [stats]);

  return (
    <div className="min-h-screen bg-background p-3">
      <div className="max-w-7xl mx-auto space-y-4">

        <div className="flex items-center justify-between bg-card rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Sous-Administration</h1>
              <p className="text-sm text-muted-foreground">Panneau de contrôle</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <AdminNotificationBell />
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchStats();
                fetchUsers();
              }}
              disabled={isLoadingStats}
              className="flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Rafraîchir</span>
            </Button>
            
            <Button
              variant="destructive"
              size="sm"
              onClick={handleSignOut}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </Button>
          </div>
        </div>

        <div className="bg-card p-3 rounded-lg">
          <UserProfileInfo />
        </div>

        {/* Affichage du solde personnel du sous-administrateur */}
        <Card className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80">Mon Solde Personnel</p>
                <p className="text-2xl font-bold">
                  {profile?.balance !== undefined ? `${Number(profile.balance).toLocaleString()} XAF` : "Chargement..."}
                </p>
                <p className="text-xs text-white/60 mt-1">
                  Solde du sous-administrateur: {profile?.full_name || 'Utilisateur'}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-white/80" />
            </div>
          </CardContent>
        </Card>

        <CompactStatsGrid stats={statsData} />

        <Tabs value={activeTab} onValueChange={(value) => {
          console.log('Changing tab to:', value);
          setActiveTab(value);
        }} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 h-12">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Tableau de bord</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Utilisateurs</span>
            </TabsTrigger>
            <TabsTrigger value="agents" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Agents</span>
            </TabsTrigger>
            <TabsTrigger value="territorial" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Territoire</span>
            </TabsTrigger>
            <TabsTrigger value="quotas" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Quotas</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Transactions</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <Bug className="w-4 h-4" />
              <span className="hidden sm:inline">Rapports</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            {/* Statistiques territoriales */}
            <TerritorialStatsCard />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <LowBalanceAgentsCard 
                onDepositToAgent={(agent) => {
                  setActiveTab("deposits");
                }}
                threshold={-100000}
              />
              <TopPerformerCard />
              <TransactionsCard 
                transactions={transactions}
                withdrawals={withdrawals}
                onDeleteTransaction={deleteTransaction}
                isLoading={isLoadingTransactions}
              />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SystemMetricsCard />
              <AnomaliesCard 
                anomalies={dashboardData?.anomalies || []} 
                isLoading={isLoadingDashboard} 
              />
            </div>

          </TabsContent>


          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="mb-4">
                  <h3 className="font-semibold text-lg">Gestion des utilisateurs</h3>
                  <p className="text-sm text-muted-foreground">
                    Liste des utilisateurs (lecture seule pour les sous-administrateurs)
                  </p>
                </div>
                <UsersDataTable 
                  users={users}
                  onViewUser={handleViewUser}
                  onQuickRoleChange={() => {}}
                  onQuickBanToggle={() => {}}
                  isSubAdmin={true}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agents" className="space-y-4">
            {/* Gestion territoriale des agents */}
            <TerritorialAgentManager />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="mb-4">
                    <h3 className="font-semibold text-lg">Performances des Agents - {userCountry}</h3>
                    <p className="text-sm text-muted-foreground">
                      Tableau de bord de performance des agents de votre territoire
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Performance des agents à venir</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="mb-4">
                    <h3 className="font-semibold text-lg">Commissions Territoriales</h3>
                    <p className="text-sm text-muted-foreground">
                      Résumé des commissions dans votre zone
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <DollarSign className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Relevés des commissions à venir</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="mb-4">
                  <h3 className="font-semibold text-lg">Localisation des Agents - {userCountry}</h3>
                  <p className="text-sm text-muted-foreground">
                    Carte géographique des agents de votre territoire
                  </p>
                </div>
                <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                  {isLoadingLocations ? (
                    <p className="text-muted-foreground">Chargement de la carte...</p>
                  ) : (
                    <div className="text-center">
                      <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Carte des agents à venir</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quotas" className="space-y-4">
            <AgentQuotaTracker />
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="mb-4">
                    <h3 className="font-semibold text-lg">Transactions Récentes</h3>
                    <p className="text-sm text-muted-foreground">
                      Liste des dernières transactions effectuées
                    </p>
                  </div>
                  <TransactionsCard 
                    transactions={transactions}
                    withdrawals={withdrawals}
                    onDeleteTransaction={deleteTransaction}
                    isLoading={isLoadingTransactions}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="mb-4">
                    <h3 className="font-semibold text-lg">Statistiques Transactionnelles</h3>
                    <p className="text-sm text-muted-foreground">
                      Métriques et analyses des transactions
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-700">Transferts Totaux</p>
                          <p className="text-xl font-bold text-blue-900">{transactions?.length || 0}</p>
                        </div>
                        <Activity className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                    
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-amber-700">Retraits Totaux</p>
                          <p className="text-xl font-bold text-amber-900">{withdrawals?.length || 0}</p>
                        </div>
                        <TrendingUp className="w-6 h-6 text-amber-600" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-emerald-700">Volume Total</p>
                        <p className="text-xl font-bold text-emerald-900">
                          {((transactions || []).reduce((sum, t) => sum + (t.amount || 0), 0) + 
                            (withdrawals || []).reduce((sum, w) => sum + (w.amount || 0), 0)).toLocaleString()} XAF
                        </p>
                      </div>
                      <DollarSign className="w-6 h-6 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <div className="space-y-6">
              <NotificationSender />
              <NotificationsCard />
            </div>
          </TabsContent>

          <TabsContent value="territorial" className="space-y-4">
            <div className="space-y-4">
              <TerritorialStatsCard />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <CustomDepositSystem />
                <Card>
                  <CardContent className="p-4">
                    <div className="mb-4">
                      <h3 className="font-semibold text-lg">Dépôts Agents - {userCountry}</h3>
                      <p className="text-sm text-muted-foreground">
                        Dépôts pour les agents de votre territoire
                      </p>
                    </div>
                    <BatchAgentDeposit onBack={() => setActiveTab("dashboard")} />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <BugReportSystem />
          </TabsContent>
        </Tabs>

        {showUserModal && selectedUser && (
          <UserManagementModal
            user={selectedUser}
            isOpen={showUserModal}
            onClose={() => {
              setShowUserModal(false);
              setSelectedUser(null);
            }}
            onUserUpdated={fetchUsers}
          />
        )}
      </div>
    </div>
  );
};

export default CompactSubAdminDashboard;