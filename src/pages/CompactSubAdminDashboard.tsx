
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSubAdmin } from '@/hooks/useSubAdmin';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  UserCog, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  Shield,
  ArrowLeft,
  RefreshCw,
  LogOut,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  Globe,
  Zap,
  Activity
} from 'lucide-react';
import CompactHeader from '@/components/dashboard/CompactHeader';
import SubAdminDashboardTabs from '@/components/admin/SubAdminDashboardTabs';

const CompactSubAdminDashboard = () => {
  const { signOut, profile } = useAuth();
  const { toast } = useToast();
  const { 
    canManageUsers, 
    canManageAgents, 
    canManageMessages, 
    canViewReports,
    userCountry 
  } = useSubAdmin();

  const [loading, setLoading] = useState(true);
  const [showFullInterface, setShowFullInterface] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAgents: 0,
    activeAgents: 0,
    pendingAgents: 0,
    unreadMessages: 0,
    totalMessages: 0
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      // Récupérer les statistiques utilisateurs
      if (canManageUsers) {
        let usersQuery = supabase
          .from('profiles')
          .select('id', { count: 'exact' })
          .eq('role', 'user');
        
        if (userCountry) {
          usersQuery = usersQuery.eq('country', userCountry);
        }
        
        const { count: usersCount } = await usersQuery;
        stats.totalUsers = usersCount || 0;
      }

      if (canManageAgents) {
        let agentsQuery = supabase
          .from('agents')
          .select('status', { count: 'exact' });
        
        if (userCountry) {
          agentsQuery = agentsQuery.eq('country', userCountry);
        }
        
        const { data: agentsData } = await agentsQuery;
        if (agentsData) {
          stats.totalAgents = agentsData.length;
          stats.activeAgents = agentsData.filter(a => a.status === 'active').length;
          stats.pendingAgents = agentsData.filter(a => a.status === 'pending').length;
        }
      }

      if (canManageMessages) {
        const { data: messagesData } = await supabase
          .from('customer_support_messages')
          .select('status, user_id');
        
        if (messagesData) {
          let filteredMessages = messagesData;
          if (userCountry) {
            const userIds = messagesData.map(m => m.user_id);
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, country')
              .in('id', userIds);
            
            const territoryUserIds = profiles?.filter(p => p.country === userCountry)?.map(p => p.id) || [];
            filteredMessages = messagesData.filter(msg => territoryUserIds.includes(msg.user_id));
          }
          stats.totalMessages = filteredMessages.length;
          stats.unreadMessages = filteredMessages.filter(m => m.status === 'unread').length;
        }
      }

      setStats({...stats});
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchDashboardStats();
    toast({
      title: "Actualisé",
      description: "Les données ont été mises à jour",
    });
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  if (showFullInterface) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto p-4">
          <div className="mb-6 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setShowFullInterface(false)}
              className="mb-4 hover:scale-105 transition-transform duration-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Vue Compacte
            </Button>
          </div>
          <SubAdminDashboardTabs />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto p-4 space-y-6">
        {/* Header amélioré */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl opacity-10"></div>
          <Card className="relative bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Tableau de Bord Sous-Admin
                    </CardTitle>
                    <CardDescription className="text-lg">
                      Gestion territoriale{userCountry && ` - ${userCountry}`}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={loading}
                    className="hover:scale-105 transition-transform duration-200"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Actualiser
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Action principale - Interface complète */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group">
          <CardContent className="p-6">
            <Button
              onClick={() => setShowFullInterface(true)}
              className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm text-lg py-6 group-hover:scale-[1.02] transition-all duration-300"
              size="lg"
            >
              <Eye className="w-6 h-6 mr-3" />
              <span className="font-semibold">Interface Complète</span>
              <Zap className="w-5 h-5 ml-3 group-hover:animate-pulse" />
            </Button>
          </CardContent>
        </Card>

        {/* Cartes de statistiques améliorées */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {canManageUsers && (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 group-hover:text-blue-600 transition-colors">
                  Utilisateurs Actifs
                </CardTitle>
                <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 mb-1">{stats.totalUsers}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Globe className="w-3 h-3 mr-1" />
                  Total dans votre territoire
                </div>
              </CardContent>
            </Card>
          )}

          {canManageAgents && (
            <>
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 group-hover:text-green-600 transition-colors">
                    Agents Actifs
                  </CardTitle>
                  <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600 mb-1">{stats.activeAgents}</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Sur {stats.totalAgents} agents
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 group-hover:text-yellow-600 transition-colors">
                    En Validation
                  </CardTitle>
                  <div className="p-2 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600 mb-1">{stats.pendingAgents}</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Activity className="w-3 h-3 mr-1" />
                    Agents à valider
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {canManageMessages && (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 group-hover:text-purple-600 transition-colors">
                  Messages Support
                </CardTitle>
                <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600 mb-1">{stats.unreadMessages}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Activity className="w-3 h-3 mr-1" />
                  Non lus sur {stats.totalMessages}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions principales améliorées */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {canManageUsers && (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-105">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full group-hover:from-blue-600 group-hover:to-blue-700 transition-all duration-300">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                  Utilisateurs
                </CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  Gestion des utilisateurs locaux
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {canManageAgents && (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-105">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-full group-hover:from-green-600 group-hover:to-green-700 transition-all duration-300">
                  <UserCog className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-800 group-hover:text-green-600 transition-colors">
                  Agents
                </CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  Validation et suivi des agents
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {canManageMessages && (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-105">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full group-hover:from-purple-600 group-hover:to-purple-700 transition-all duration-300">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-800 group-hover:text-purple-600 transition-colors">
                  Support Client
                </CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  Messages et assistance clients
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {canViewReports && (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-105">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full group-hover:from-indigo-600 group-hover:to-indigo-700 transition-all duration-300">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
                  Rapports
                </CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  Statistiques territoriales
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>

        {/* Informations utilisateur améliorées */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Informations Sous-Admin
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Nom complet</p>
                  <p className="font-semibold text-gray-800">{profile?.full_name}</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Téléphone</p>
                  <p className="font-semibold text-gray-800">{profile?.phone}</p>
                </div>
              </div>
              <div className="space-y-4">
                {userCountry && (
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Territoire</p>
                    <div className="flex items-center">
                      <Globe className="w-4 h-4 mr-2 text-purple-600" />
                      <p className="font-semibold text-gray-800">{userCountry}</p>
                    </div>
                  </div>
                )}
                <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Statut</p>
                  <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1">
                    <Shield className="w-3 h-3 mr-1" />
                    Sous-Administrateur
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompactSubAdminDashboard;
