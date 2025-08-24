
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollText, Search, Filter, Clock, User, Activity } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  table_name: string;
  record_id: string;
  user_id: string;
  old_values: any;
  new_values: any;
  created_at: string;
  user_name?: string;
}

const SubAdminLogsTab = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const { data: logs, isLoading } = useQuery({
    queryKey: ['sub-admin-logs', user?.id, actionFilter],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          profiles!fk_audit_logs_user_id (full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Erreur lors de la récupération des journaux:', error);
        throw error;
      }

      return (data || []).map(log => ({
        ...log,
        user_name: log.profiles?.full_name || 'Utilisateur inconnu'
      })) as AuditLog[];
    },
    enabled: !!user?.id
  });

  const filteredLogs = logs?.filter(log => 
    log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.table_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getActionBadge = (action: string) => {
    switch (action.toLowerCase()) {
      case 'insert':
      case 'create':
        return <Badge className="bg-green-100 text-green-800">Création</Badge>;
      case 'update':
        return <Badge className="bg-blue-100 text-blue-800">Modification</Badge>;
      case 'delete':
        return <Badge className="bg-red-100 text-red-800">Suppression</Badge>;
      case 'admin_credit':
        return <Badge className="bg-purple-100 text-purple-800">Crédit Admin</Badge>;
      case 'transfer':
        return <Badge className="bg-orange-100 text-orange-800">Transfert</Badge>;
      default:
        return <Badge variant="secondary">{action}</Badge>;
    }
  };

  const getTableLabel = (tableName: string) => {
    switch (tableName) {
      case 'profiles': return 'Profils';
      case 'transfers': return 'Transferts';
      case 'withdrawals': return 'Retraits';
      case 'recharges': return 'Recharges';
      case 'agents': return 'Agents';
      default: return tableName;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ScrollText className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Journaux d'Audit</h2>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {filteredLogs.length} entrée(s)
        </Badge>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres et Recherche
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Rechercher dans les journaux..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Type d'action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les actions</SelectItem>
                <SelectItem value="insert">Créations</SelectItem>
                <SelectItem value="update">Modifications</SelectItem>
                <SelectItem value="delete">Suppressions</SelectItem>
                <SelectItem value="admin_credit">Crédits Admin</SelectItem>
                <SelectItem value="transfer">Transferts</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des journaux */}
      <div className="space-y-3">
        {filteredLogs.map((log) => (
          <Card key={log.id} className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getActionBadge(log.action)}
                  <span className="text-sm font-medium">{getTableLabel(log.table_name)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {formatDate(log.created_at)}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">{log.user_name}</span>
                    {log.user_id && (
                      <span className="text-muted-foreground ml-1">
                        ({log.user_id.slice(0, 8)}...)
                      </span>
                    )}
                  </span>
                </div>

                {log.record_id && (
                  <div className="flex items-center gap-2 text-sm">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Enregistrement: {log.record_id.slice(0, 8)}...
                    </span>
                  </div>
                )}

                {/* Détails des changements */}
                {(log.old_values || log.new_values) && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Détails des modifications :</h4>
                    <div className="text-xs space-y-1">
                      {log.old_values && (
                        <div>
                          <span className="font-medium text-red-600">Avant: </span>
                          <code className="bg-white px-1 rounded">
                            {JSON.stringify(log.old_values, null, 2)}
                          </code>
                        </div>
                      )}
                      {log.new_values && (
                        <div>
                          <span className="font-medium text-green-600">Après: </span>
                          <code className="bg-white px-1 rounded">
                            {JSON.stringify(log.new_values, null, 2)}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredLogs.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <ScrollText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Aucun journal trouvé</h3>
              <p className="text-muted-foreground">
                {searchTerm || actionFilter !== 'all' 
                  ? 'Aucun journal ne correspond aux filtres appliqués.' 
                  : 'Il n\'y a pas de journaux d\'audit à afficher.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SubAdminLogsTab;
