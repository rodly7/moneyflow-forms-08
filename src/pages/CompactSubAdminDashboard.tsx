
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
  XCircle
} from 'lucide-react';
import { CompactHeader } from '@/components/dashboard/CompactHeader';
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

      // Récupérer les statistiques agents
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

      // Récupérer les statistiques messages
      if (canManageMessages) {
        const { data: messagesData } = await supabase
          .from('customer_support_messages')
          .select(`
            status,
            profiles:user_id (
              country
            )
          `);
        
        if (messagesData) {
          let filteredMessages = messagesData;
          if (userCountry) {
            filteredMessages = messagesData.filter(msg => 
              msg.profiles && msg.profiles.country === userCountry
            );
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto p-4">
          <div className="mb-6 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setShowFullInterface(false)}
              className="mb-4"
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-4">
        <CompactHeader
          title="Tableau de Bord Sous-Admin"
          subtitle={`Gestion territoriale${userCountry ? ` - ${userCountry}` : ''}`}
          icon={<Shield className="w-6 h-6 text-blue-600" />}
          onRefresh={handleRefresh}
          onSignOut={handleSignOut}
          isLoading={loading}
        />

        {/* Actions rapides */}
        <div className="mb-6">
          <Button
            onClick={() => setShowFullInterface(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            <Eye className="w-5 h-5 mr-2" />
            Interface Complète
          </Button>
        </div>

        {/* Cartes de statistiques */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
          {canManageUsers && (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">Total dans votre territoire</p>
              </CardContent>
            </Card>
          )}

          {canManageAgents && (
            <>
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Agents Actifs</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.activeAgents}</div>
                  <p className="text-xs text-muted-foreground">Sur {stats.totalAgents} agents</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">En Attente</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{stats.pendingAgents}</div>
                  <p className="text-xs text-muted-foreground">Agents à valider</p>
                </CardContent>
              </Card>
            </>
          )}

          {canManageMessages && (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Messages</CardTitle>
                <MessageSquare className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{stats.unreadMessages}</div>
                <p className="text-xs text-muted-foreground">Non lus sur {stats.totalMessages}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions principales */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {canManageUsers && (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <CardTitle className="text-lg">Utilisateurs</CardTitle>
                <CardDescription>Gestion des utilisateurs locaux</CardDescription>
              </CardHeader>
            </Card>
          )}

          {canManageAgents && (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <UserCog className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <CardTitle className="text-lg">Agents</CardTitle>
                <CardDescription>Validation et suivi des agents</CardDescription>
              </CardHeader>
            </Card>
          )}

          {canManageMessages && (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <MessageSquare className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <CardTitle className="text-lg">Support</CardTitle>
                <CardDescription>Messages et assistance clients</CardDescription>
              </CardHeader>
            </Card>
          )}

          {canViewReports && (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <BarChart3 className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                <CardTitle className="text-lg">Rapports</CardTitle>
                <CardDescription>Statistiques territoriales</CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>

        {/* Informations utilisateur */}
        <Card className="mt-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Informations Sous-Admin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Nom:</strong> {profile?.full_name}</p>
              <p><strong>Téléphone:</strong> {profile?.phone}</p>
              {userCountry && <p><strong>Territoire:</strong> {userCountry}</p>}
              <div className="flex items-center gap-2">
                <strong>Statut:</strong>
                <Badge className="bg-blue-100 text-blue-800">Sous-Administrateur</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompactSubAdminDashboard;
