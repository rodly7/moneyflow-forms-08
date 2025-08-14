
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSubAdmin } from '@/hooks/useSubAdmin';
import { supabase } from '@/integrations/supabase/client';
import { UserCog, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface AgentData {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  status: string;
  commission_balance: number;
  country: string;
  created_at: string;
}

const SubAdminAgentsTab = () => {
  const { toast } = useToast();
  const { canManageAgents, canValidateAgent, userCountry } = useSubAdmin();
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (canManageAgents) {
      fetchAgents();
    }
  }, [canManageAgents]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: false });

      // Filtrer par territoire si applicable
      if (userCountry) {
        query = query.eq('country', userCountry);
      }

      const { data, error } = await query;

      if (error) throw error;

      setAgents(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des agents:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les agents",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleValidateAgent = async (agentId: string, action: 'approve' | 'reject') => {
    if (!canValidateAgent) {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les permissions pour valider les agents",
        variant: "destructive"
      });
      return;
    }

    try {
      const updateData = action === 'approve' 
        ? { status: 'active' }
        : { status: 'rejected' };
      
      const { error } = await supabase
        .from('agents')
        .update(updateData)
        .eq('id', agentId);

      if (error) throw error;

      toast({
        title: "Agent mis à jour",
        description: `Agent ${action === 'approve' ? 'approuvé' : 'rejeté'} avec succès`,
      });

      fetchAgents();
    } catch (error) {
      console.error('Erreur validation agent:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la validation de l'agent",
        variant: "destructive"
      });
    }
  };

  if (!canManageAgents) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Accès limité</h3>
            <p className="text-muted-foreground">
              Vous n'avez pas les permissions pour gérer les agents.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = {
    total: agents.length,
    active: agents.filter(a => a.status === 'active').length,
    pending: agents.filter(a => a.status === 'pending').length,
    rejected: agents.filter(a => a.status === 'rejected').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestion des Agents</h2>
          <p className="text-muted-foreground">
            Supervision des agents de votre territoire{userCountry && ` (${userCountry})`}
          </p>
        </div>
        <Button onClick={fetchAgents} disabled={loading} variant="outline">
          <UserCog className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Statistiques des agents */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actifs</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejetés</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des agents */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Agents</CardTitle>
          <CardDescription>
            Agents de votre territoire avec possibilité de validation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {agents.map((agent) => (
                <div key={agent.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-medium">{agent.full_name}</p>
                      <p className="text-sm text-muted-foreground">{agent.phone}</p>
                      <p className="text-sm text-muted-foreground">{agent.country}</p>
                    </div>
                    <Badge className={`${getStatusColor(agent.status)} flex items-center gap-1`}>
                      {getStatusIcon(agent.status)}
                      {agent.status}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {agent.commission_balance.toLocaleString()} FCFA
                      </p>
                      <p className="text-xs text-muted-foreground">Commissions</p>
                    </div>
                    {agent.status === 'pending' && canValidateAgent && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleValidateAgent(agent.id, 'approve')}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approuver
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleValidateAgent(agent.id, 'reject')}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Rejeter
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {agents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun agent trouvé dans votre territoire
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubAdminAgentsTab;
