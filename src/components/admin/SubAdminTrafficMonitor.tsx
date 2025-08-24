
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Users, Activity, Eye, Clock, TrendingUp, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface SubAdminActivity {
  id: string;
  full_name: string;
  phone: string;
  country: string;
  last_activity: string;
  daily_requests_count: number;
  daily_limit: number;
  total_users_managed: number;
  agents_managed: number;
  recent_actions: Array<{
    action: string;
    timestamp: string;
    details: string;
  }>;
  status: 'active' | 'inactive' | 'limited';
}

const SubAdminTrafficMonitor = () => {
  const [timeFilter, setTimeFilter] = useState('today');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: subAdminTraffic, isLoading } = useQuery({
    queryKey: ['sub-admin-traffic', timeFilter, statusFilter],
    queryFn: async () => {
      console.log('🔍 Récupération du trafic des sous-administrateurs...');

      // Récupérer tous les sous-administrateurs
      const { data: subAdmins, error: subAdminError } = await supabase
        .from('profiles')
        .select('id, full_name, phone, country, created_at')
        .eq('role', 'sub_admin');

      if (subAdminError) {
        console.error('Erreur récupération sous-admins:', subAdminError);
        throw subAdminError;
      }

      if (!subAdmins || subAdmins.length === 0) {
        return [];
      }

      const activities: SubAdminActivity[] = [];

      // Pour chaque sous-admin, récupérer ses activités et statistiques
      for (const subAdmin of subAdmins) {
        try {
          // Récupérer le quota journalier
          const { data: quotaData } = await supabase
            .from('sub_admin_quota_settings')
            .select('daily_limit')
            .eq('sub_admin_id', subAdmin.id)
            .single();

          const dailyLimit = quotaData?.daily_limit || 50;

          // Compter les demandes du jour
          const today = new Date().toISOString().split('T')[0];
          const { count: dailyRequests } = await supabase
            .from('sub_admin_daily_requests')
            .select('*', { count: 'exact', head: true })
            .eq('sub_admin_id', subAdmin.id)
            .eq('date', today);

          // Compter les utilisateurs gérés (même pays)
          const { count: usersManaged } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('country', subAdmin.country)
            .neq('role', 'admin');

          // Compter les agents gérés
          const { count: agentsManaged } = await supabase
            .from('agents')
            .select('*', { count: 'exact', head: true })
            .eq('country', subAdmin.country);

          // Récupérer les actions récentes depuis les audit_logs
          const { data: recentActions } = await supabase
            .from('audit_logs')
            .select('action, created_at, new_values')
            .eq('user_id', subAdmin.id)
            .order('created_at', { ascending: false })
            .limit(5);

          // Déterminer le statut
          let status: 'active' | 'inactive' | 'limited' = 'inactive';
          if (dailyRequests && dailyRequests > 0) {
            status = dailyRequests >= dailyLimit ? 'limited' : 'active';
          }

          activities.push({
            id: subAdmin.id,
            full_name: subAdmin.full_name || 'Nom inconnu',
            phone: subAdmin.phone || '',
            country: subAdmin.country || '',
            last_activity: recentActions?.[0]?.created_at || subAdmin.created_at,
            daily_requests_count: dailyRequests || 0,
            daily_limit: dailyLimit,
            total_users_managed: usersManaged || 0,
            agents_managed: agentsManaged || 0,
            recent_actions: (recentActions || []).map(action => ({
              action: action.action,
              timestamp: action.created_at,
              details: JSON.stringify(action.new_values || {})
            })),
            status
          });
        } catch (error) {
          console.error(`Erreur pour sous-admin ${subAdmin.id}:`, error);
          // Ajouter quand même avec des valeurs par défaut
          activities.push({
            id: subAdmin.id,
            full_name: subAdmin.full_name || 'Nom inconnu',
            phone: subAdmin.phone || '',
            country: subAdmin.country || '',
            last_activity: subAdmin.created_at,
            daily_requests_count: 0,
            daily_limit: 50,
            total_users_managed: 0,
            agents_managed: 0,
            recent_actions: [],
            status: 'inactive'
          });
        }
      }

      // Filtrer selon le statut si nécessaire
      const filteredActivities = statusFilter === 'all' 
        ? activities 
        : activities.filter(activity => activity.status === statusFilter);

      console.log('✅ Trafic sous-admins chargé:', filteredActivities.length);
      return filteredActivities;
    },
    refetchInterval: 30000 // Actualiser toutes les 30 secondes
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Actif</Badge>;
      case 'limited':
        return <Badge className="bg-orange-100 text-orange-800"><AlertCircle className="w-3 h-3 mr-1" />Quota atteint</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800"><XCircle className="w-3 h-3 mr-1" />Inactif</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatLastActivity = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'À l\'instant';
    if (diffMinutes < 60) return `Il y a ${diffMinutes}min`;
    if (diffMinutes < 1440) return `Il y a ${Math.floor(diffMinutes / 60)}h`;
    return `Il y a ${Math.floor(diffMinutes / 1440)}j`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Trafic des Sous-Administrateurs</h2>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {subAdminTraffic?.length || 0} sous-admin(s)
        </Badge>
      </div>

      {/* Filtres */}
      <div className="flex gap-4">
        <Select value={timeFilter} onValueChange={setTimeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Aujourd'hui</SelectItem>
            <SelectItem value="week">Cette semaine</SelectItem>
            <SelectItem value="month">Ce mois</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="active">Actifs</SelectItem>
            <SelectItem value="limited">Quota atteint</SelectItem>
            <SelectItem value="inactive">Inactifs</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Liste des sous-administrateurs */}
      <div className="grid gap-4">
        {subAdminTraffic?.map((subAdmin) => (
          <Card key={subAdmin.id} className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <CardTitle className="text-lg">{subAdmin.full_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {subAdmin.phone} • {subAdmin.country}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(subAdmin.status)}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {formatLastActivity(subAdmin.last_activity)}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Statistiques */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {subAdmin.daily_requests_count}/{subAdmin.daily_limit}
                  </div>
                  <div className="text-xs text-blue-600">Quota journalier</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {subAdmin.total_users_managed}
                  </div>
                  <div className="text-xs text-green-600">Utilisateurs gérés</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {subAdmin.agents_managed}
                  </div>
                  <div className="text-xs text-purple-600">Agents gérés</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round((subAdmin.daily_requests_count / subAdmin.daily_limit) * 100)}%
                  </div>
                  <div className="text-xs text-orange-600">Utilisation quota</div>
                </div>
              </div>

              {/* Actions récentes */}
              {subAdmin.recent_actions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Actions récentes
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {subAdmin.recent_actions.slice(0, 3).map((action, index) => (
                      <div key={index} className="text-xs p-2 bg-gray-50 rounded flex items-center justify-between">
                        <span className="font-medium">{action.action}</span>
                        <span className="text-muted-foreground">
                          {formatLastActivity(action.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {(!subAdminTraffic || subAdminTraffic.length === 0) && (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Aucun sous-administrateur</h3>
              <p className="text-muted-foreground">
                Il n'y a pas de sous-administrateurs à afficher pour le moment.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SubAdminTrafficMonitor;
