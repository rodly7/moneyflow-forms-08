
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, Bell, Users, TrendingUp, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import SubAdminDashboardTabs from '@/components/admin/SubAdminDashboardTabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const CompactSubAdminDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  // Récupérer les demandes en attente
  const { data: pendingRequests } = useQuery({
    queryKey: ['pending-requests-count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_requests')
        .select('id')
        .eq('status', 'pending');

      if (error) throw error;
      return data?.length || 0;
    },
  });

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Tableau de Bord Sous-Administrateur</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Bienvenue, {profile?.full_name || 'Sous-Administrateur'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Sous-Admin
                </Badge>
                
                {pendingRequests && pendingRequests > 0 && (
                  <Badge variant="destructive" className="flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    {pendingRequests} demande{pendingRequests > 1 ? 's' : ''} en attente
                  </Badge>
                )}
                
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Paramètres
                </Button>
                
                <Button variant="destructive" size="sm" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Déconnexion
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Territoire</p>
                  <p className="text-2xl font-bold">{profile?.country || 'Non défini'}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Statut</p>
                  <p className="text-2xl font-bold text-green-600">Actif</p>
                </div>
                <Shield className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Demandes en Attente</p>
                  <p className="text-2xl font-bold text-orange-600">{pendingRequests || 0}</p>
                </div>
                <Bell className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard */}
        <Card>
          <CardContent className="p-6">
            <SubAdminDashboardTabs />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompactSubAdminDashboard;
