
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  UserCheck, UserX, Clock, AlertTriangle, 
  CheckCircle, XCircle, Users, Settings,
  TrendingUp, Shield
} from 'lucide-react';
import { useAdvancedAdmin } from '@/hooks/useAdvancedAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Agent {
  id: string;
  user_id: string;
  status: string;
  full_name: string;
  phone: string;
  country: string;
  balance: number;
  created_at: string;
}

const AdvancedAgentManagement = () => {
  const { suspendAgent, batchValidateAgents, isProcessing } = useAdvancedAdmin();
  const { toast } = useToast();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // États pour la suspension
  const [suspensionForm, setSuspensionForm] = useState({
    agentId: '',
    type: 'temporary' as 'temporary' | 'indefinite',
    duration: 7,
    reason: ''
  });

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select(`
          *,
          profiles!inner(full_name, phone, country, balance)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedAgents = data?.map(agent => ({
        id: agent.id,
        user_id: agent.user_id,
        status: agent.status,
        full_name: agent.profiles.full_name,
        phone: agent.profiles.phone,
        country: agent.profiles.country,
        balance: agent.profiles.balance,
        created_at: agent.created_at
      })) || [];

      setAgents(formattedAgents);
    } catch (error: any) {
      console.error('Erreur chargement agents:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des agents",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendAgent = async () => {
    if (!suspensionForm.agentId || !suspensionForm.reason) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs requis",
        variant: "destructive"
      });
      return;
    }

    const result = await suspendAgent({
      agentId: suspensionForm.agentId,
      suspensionType: suspensionForm.type,
      duration: suspensionForm.type === 'temporary' ? suspensionForm.duration : undefined,
      reason: suspensionForm.reason,
      suspendedBy: 'current-admin'
    });

    if (result.success) {
      setSuspensionForm({ agentId: '', type: 'temporary', duration: 7, reason: '' });
      fetchAgents();
    }
  };

  const handleBatchAction = async (action: 'approve' | 'reject') => {
    if (selectedAgents.length === 0) {
      toast({
        title: "Erreur",
        description: "Aucun agent sélectionné",
        variant: "destructive"
      });
      return;
    }

    const result = await batchValidateAgents(
      selectedAgents, 
      action, 
      action === 'reject' ? 'Validation en lot par administrateur' : undefined
    );

    if (result.success) {
      setSelectedAgents([]);
      fetchAgents();
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-500', label: 'Actif', icon: CheckCircle },
      pending: { color: 'bg-yellow-500', label: 'En attente', icon: Clock },
      suspended: { color: 'bg-red-500', label: 'Suspendu', icon: XCircle },
      rejected: { color: 'bg-gray-500', label: 'Rejeté', icon: UserX }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const pendingAgents = agents.filter(a => a.status === 'pending');
  const activeAgents = agents.filter(a => a.status === 'active');
  const suspendedAgents = agents.filter(a => a.status === 'suspended');

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
            Gestion Avancée des Agents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="validation">Validation</TabsTrigger>
              <TabsTrigger value="suspension">Suspension</TabsTrigger>
              <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Agents</p>
                        <p className="text-2xl font-bold">{agents.length}</p>
                      </div>
                      <Users className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Actifs</p>
                        <p className="text-2xl font-bold text-green-600">{activeAgents.length}</p>
                      </div>
                      <UserCheck className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">En attente</p>
                        <p className="text-2xl font-bold text-yellow-600">{pendingAgents.length}</p>
                      </div>
                      <Clock className="w-8 h-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Suspendus</p>
                        <p className="text-2xl font-bold text-red-600">{suspendedAgents.length}</p>
                      </div>
                      <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Liste des Agents</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {agents.map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedAgents.includes(agent.user_id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedAgents([...selectedAgents, agent.user_id]);
                            } else {
                              setSelectedAgents(selectedAgents.filter(id => id !== agent.user_id));
                            }
                          }}
                        />
                        <div>
                          <p className="font-medium">{agent.full_name}</p>
                          <p className="text-sm text-gray-600">{agent.phone} • {agent.country}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-medium">{agent.balance.toLocaleString()} FCFA</p>
                          <p className="text-xs text-gray-500">
                            {new Date(agent.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        {getStatusBadge(agent.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="validation" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Validation en Lot</h3>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleBatchAction('approve')}
                    disabled={isProcessing || selectedAgents.length === 0}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approuver ({selectedAgents.length})
                  </Button>
                  <Button
                    onClick={() => handleBatchAction('reject')}
                    disabled={isProcessing || selectedAgents.length === 0}
                    variant="destructive"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Rejeter ({selectedAgents.length})
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Agents en attente de validation ({pendingAgents.length})</h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {pendingAgents.map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedAgents.includes(agent.user_id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedAgents([...selectedAgents, agent.user_id]);
                            } else {
                              setSelectedAgents(selectedAgents.filter(id => id !== agent.user_id));
                            }
                          }}
                        />
                        <div>
                          <p className="font-medium">{agent.full_name}</p>
                          <p className="text-sm text-gray-600">{agent.phone} • {agent.country}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleBatchAction('approve')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleBatchAction('reject')}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="suspension" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Suspendre un Agent</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="agent-select">Sélectionner l'agent</Label>
                      <Select
                        value={suspensionForm.agentId}
                        onValueChange={(value) => setSuspensionForm(prev => ({ ...prev, agentId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir un agent" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeAgents.map((agent) => (
                            <SelectItem key={agent.user_id} value={agent.user_id}>
                              {agent.full_name} - {agent.phone}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="suspension-type">Type de suspension</Label>
                      <Select
                        value={suspensionForm.type}
                        onValueChange={(value: 'temporary' | 'indefinite') => 
                          setSuspensionForm(prev => ({ ...prev, type: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="temporary">Temporaire</SelectItem>
                          <SelectItem value="indefinite">Indéfinie</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {suspensionForm.type === 'temporary' && (
                    <div className="space-y-2">
                      <Label htmlFor="duration">Durée (jours)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="365"
                        value={suspensionForm.duration}
                        onChange={(e) => setSuspensionForm(prev => ({ 
                          ...prev, 
                          duration: parseInt(e.target.value) 
                        }))}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="reason">Raison de la suspension</Label>
                    <Textarea
                      placeholder="Expliquez la raison de la suspension..."
                      value={suspensionForm.reason}
                      onChange={(e) => setSuspensionForm(prev => ({ ...prev, reason: e.target.value }))}
                    />
                  </div>

                  <Button
                    onClick={handleSuspendAgent}
                    disabled={isProcessing}
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Suspendre l'Agent
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <h4 className="font-medium">Agents Suspendus ({suspendedAgents.length})</h4>
                <div className="space-y-2">
                  {suspendedAgents.map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between p-3 border rounded-lg bg-red-50">
                      <div>
                        <p className="font-medium">{agent.full_name}</p>
                        <p className="text-sm text-gray-600">{agent.phone} • {agent.country}</p>
                      </div>
                      <Badge variant="destructive">Suspendu</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="monitoring" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Monitoring en Temps Réel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-medium">Activité Récente</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {agents.slice(0, 5).map((agent) => (
                          <div key={agent.id} className="p-2 border rounded text-sm">
                            <div className="flex items-center justify-between">
                              <span>{agent.full_name}</span>
                              <span className="text-xs text-gray-500">
                                {new Date(agent.created_at).toLocaleTimeString('fr-FR')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">Alertes Système</h4>
                      <div className="space-y-2">
                        {suspendedAgents.length > 0 && (
                          <div className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                            <div className="flex items-center gap-2 text-red-700">
                              <AlertTriangle className="w-4 h-4" />
                              {suspendedAgents.length} agent(s) suspendu(s)
                            </div>
                          </div>
                        )}
                        {pendingAgents.length > 0 && (
                          <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                            <div className="flex items-center gap-2 text-yellow-700">
                              <Clock className="w-4 h-4" />
                              {pendingAgents.length} agent(s) en attente de validation
                            </div>
                          </div>
                        )}
                        {pendingAgents.length === 0 && suspendedAgents.length === 0 && (
                          <div className="p-2 bg-green-50 border border-green-200 rounded text-sm">
                            <div className="flex items-center gap-2 text-green-700">
                              <CheckCircle className="w-4 h-4" />
                              Tous les agents sont en ordre
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedAgentManagement;
