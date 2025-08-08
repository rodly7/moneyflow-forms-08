
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, Users, MapPin, TrendingUp, 
  AlertTriangle, FileText, MessageSquare,
  CheckCircle, Clock, UserCheck, UserX
} from 'lucide-react';
import { useSubAdmin } from '@/hooks/useSubAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface TerritoryAgent {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  status: string;
  balance: number;
  country: string;
  created_at: string;
}

interface TerritoryStats {
  totalAgents: number;
  activeAgents: number;
  pendingValidations: number;
  totalTransactions: number;
  totalVolume: number;
  alertsCount: number;
}

const SubAdminAdvancedTools = () => {
  const { user } = useAuth();
  const { 
    isSubAdmin, 
    userCountry, 
    canValidateAgent, 
    canManageAgents,
    canSendNotifications,
    canViewTerritorialStats 
  } = useSubAdmin();
  const { toast } = useToast();
  
  const [agents, setAgents] = useState<TerritoryAgent[]>([]);
  const [stats, setStats] = useState<TerritoryStats>({
    totalAgents: 0,
    activeAgents: 0,
    pendingValidations: 0,
    totalTransactions: 0,
    totalVolume: 0,
    alertsCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Formulaire pour signaler des problèmes
  const [reportForm, setReportForm] = useState({
    type: 'bug' as 'bug' | 'improvement' | 'issue',
    title: '',
    description: '',
    priority: 'normal' as 'low' | 'normal' | 'high'
  });

  useEffect(() => {
    if (isSubAdmin && userCountry) {
      loadTerritoryData();
    }
  }, [isSubAdmin, userCountry]);

  const loadTerritoryData = async () => {
    if (!userCountry) return;

    try {
      setLoading(true);

      // Charger les profils d'agents de ce territoire
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'agent')
        .eq('country', userCountry);

      if (profilesError) throw profilesError;

      // Charger les informations des agents
      const { data: agentsData, error: agentsError } = await supabase
        .from('agents')
        .select('*');

      if (agentsError) throw agentsError;

      // Combiner les données
      const territoryAgents: TerritoryAgent[] = profilesData?.map(profile => {
        const agentInfo = agentsData?.find(agent => agent.user_id === profile.id);
        return {
          id: agentInfo?.id || profile.id,
          user_id: profile.id,
          full_name: profile.full_name || 'Nom inconnu',
          phone: profile.phone || '',
          status: agentInfo?.status || 'pending',
          balance: profile.balance || 0,
          country: profile.country || '',
          created_at: profile.created_at
        };
      }).filter(agent => agent.country === userCountry) || [];

      setAgents(territoryAgents);

      // Calculer les statistiques
      const totalAgents = territoryAgents.length;
      const activeAgents = territoryAgents.filter(a => a.status === 'active').length;
      const pendingValidations = territoryAgents.filter(a => a.status === 'pending').length;

      // Charger les transactions du territoire
      const agentIds = territoryAgents.map(a => a.user_id);
      if (agentIds.length > 0) {
        const { data: transfersData, error: transfersError } = await supabase
          .from('transfers')
          .select('amount')
          .in('agent_id', agentIds);

        if (!transfersError && transfersData) {
          const totalTransactions = transfersData.length;
          const totalVolume = transfersData.reduce((sum, t) => sum + t.amount, 0);

          setStats({
            totalAgents,
            activeAgents,
            pendingValidations,
            totalTransactions,
            totalVolume,
            alertsCount: pendingValidations + territoryAgents.filter(a => a.balance < 10000).length
          });
        }
      } else {
        setStats({
          totalAgents,
          activeAgents,
          pendingValidations,
          totalTransactions: 0,
          totalVolume: 0,
          alertsCount: pendingValidations
        });
      }

    } catch (error: any) {
      console.error('Erreur chargement données territoire:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des données du territoire",
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
        description: "Vous n'avez pas l'autorisation de valider les agents",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    try {
      const newStatus = action === 'approve' ? 'active' : 'rejected';
      
      const { error } = await supabase
        .from('agents')
        .update({
          status: newStatus,
          validated_at: new Date().toISOString(),
          validated_by: user?.id,
          validation_reason: `Validation par sous-admin du territoire ${userCountry}`
        })
        .eq('user_id', agentId);

      if (error) throw error;

      // Log de l'action
      await supabase
        .from('audit_logs')
        .insert({
          action: `sub_admin_agent_${action}`,
          table_name: 'agents',
          record_id: agentId,
          user_id: user?.id,
          new_values: { 
            status: newStatus, 
            territory: userCountry,
            validated_by_sub_admin: true
          }
        });

      toast({
        title: `Agent ${action === 'approve' ? 'approuvé' : 'rejeté'}`,
        description: "Action effectuée avec succès",
      });

      loadTerritoryData(); // Recharger les données

    } catch (error: any) {
      console.error('Erreur validation agent:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la validation de l'agent",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleSendReport = async () => {
    if (!reportForm.title || !reportForm.description) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    try {
      // Simuler l'enregistrement du rapport (utiliser la table notifications comme proxy)
      const reportMessage = `[${reportForm.type.toUpperCase()}] ${reportForm.title}\n\n${reportForm.description}\n\nTerritoire: ${userCountry}\nPriorité: ${reportForm.priority}`;

      const { error } = await supabase
        .from('notifications')
        .insert({
          title: `Rapport ${reportForm.type} - ${userCountry}`,
          message: reportMessage,
          notification_type: 'sub_admin_report',
          priority: reportForm.priority,
          created_by: user?.id,
          total_recipients: 1
        });

      if (error) throw error;

      setReportForm({
        type: 'bug',
        title: '',
        description: '',
        priority: 'normal'
      });

      toast({
        title: "Rapport envoyé",
        description: "Votre rapport a été transmis à l'administration principale",
      });

    } catch (error: any) {
      console.error('Erreur envoi rapport:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'envoi du rapport",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  if (!isSubAdmin) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Accès réservé aux sous-administrateurs</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Outils Avancés - Territoire {userCountry}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="agents">Gestion Agents</TabsTrigger>
              <TabsTrigger value="reports">Rapports</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Statistiques du territoire */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Agents</p>
                        <p className="text-xl font-bold">{stats.totalAgents}</p>
                      </div>
                      <Users className="w-6 h-6 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Actifs</p>
                        <p className="text-xl font-bold text-green-600">{stats.activeAgents}</p>
                      </div>
                      <UserCheck className="w-6 h-6 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">En attente</p>
                        <p className="text-xl font-bold text-yellow-600">{stats.pendingValidations}</p>
                      </div>
                      <Clock className="w-6 h-6 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Transactions</p>
                        <p className="text-xl font-bold">{stats.totalTransactions}</p>
                      </div>
                      <TrendingUp className="w-6 h-6 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Volume</p>
                        <p className="text-lg font-bold">{(stats.totalVolume / 1000000).toFixed(1)}M</p>
                      </div>
                      <TrendingUp className="w-6 h-6 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Alertes</p>
                        <p className="text-xl font-bold text-red-600">{stats.alertsCount}</p>
                      </div>
                      <AlertTriangle className="w-6 h-6 text-red-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Résumé des agents */}
              <Card>
                <CardHeader>
                  <CardTitle>Agents du Territoire</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {agents.map((agent) => (
                      <div key={agent.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{agent.full_name}</p>
                          <p className="text-sm text-gray-600">{agent.phone}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-medium">{agent.balance.toLocaleString()} FCFA</p>
                          <Badge className={`${
                            agent.status === 'active' ? 'bg-green-500' :
                            agent.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                          } text-white`}>
                            {agent.status === 'active' ? 'Actif' : 
                             agent.status === 'pending' ? 'En attente' : 'Inactif'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="agents" className="space-y-4">
              {canValidateAgent && (
                <Card>
                  <CardHeader>
                    <CardTitle>Validation des Agents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {agents.filter(a => a.status === 'pending').map((agent) => (
                        <div key={agent.id} className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50">
                          <div>
                            <p className="font-medium">{agent.full_name}</p>
                            <p className="text-sm text-gray-600">{agent.phone}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleValidateAgent(agent.user_id, 'approve')}
                              disabled={processing}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleValidateAgent(agent.user_id, 'reject')}
                              disabled={processing}
                            >
                              <UserX className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      {agents.filter(a => a.status === 'pending').length === 0 && (
                        <div className="text-center py-6 text-gray-500">
                          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>Aucun agent en attente de validation</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Signaler un Problème
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type de rapport</Label>
                      <select
                        className="w-full p-2 border rounded-md"
                        value={reportForm.type}
                        onChange={(e) => setReportForm(prev => ({ 
                          ...prev, type: e.target.value as 'bug' | 'improvement' | 'issue'
                        }))}
                      >
                        <option value="bug">Bug technique</option>
                        <option value="improvement">Amélioration suggérée</option>
                        <option value="issue">Problème opérationnel</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Priorité</Label>
                      <select
                        className="w-full p-2 border rounded-md"
                        value={reportForm.priority}
                        onChange={(e) => setReportForm(prev => ({ 
                          ...prev, priority: e.target.value as 'low' | 'normal' | 'high'
                        }))}
                      >
                        <option value="low">Faible</option>
                        <option value="normal">Normale</option>
                        <option value="high">Élevée</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Titre du rapport</Label>
                    <Input
                      placeholder="Résumé du problème"
                      value={reportForm.title}
                      onChange={(e) => setReportForm(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description détaillée</Label>
                    <Textarea
                      placeholder="Décrivez le problème en détail..."
                      value={reportForm.description}
                      onChange={(e) => setReportForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                    />
                  </div>

                  <Button
                    onClick={handleSendReport}
                    disabled={processing}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Envoyer le Rapport
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                  <p className="text-gray-700 font-medium mb-2">Notifications Territoriales</p>
                  <p className="text-sm text-gray-500">
                    Système de notification pour votre territoire en développement
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubAdminAdvancedTools;
