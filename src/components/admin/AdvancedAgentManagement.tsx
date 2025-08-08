
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Agent {
  id: string;
  full_name: string;
  phone: string;
  country: string;
  balance: number;
  role: string;
  created_at: string;
}

const AdvancedAgentManagement = () => {
  const { toast } = useToast();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'agent')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedAgents = data?.map(profile => ({
        id: profile.id,
        full_name: profile.full_name || 'N/A',
        phone: profile.phone,
        country: profile.country || 'N/A',
        balance: profile.balance,
        role: profile.role,
        created_at: profile.created_at
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

  const handleBatchAction = async (action: 'approve' | 'suspend') => {
    if (selectedAgents.length === 0) {
      toast({
        title: "Erreur",
        description: "Aucun agent sélectionné",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Simulation d'une action sur les agents sélectionnés
      // En réalité, vous ajouteriez ici la logique de validation/suspension
      
      toast({
        title: `Action ${action} effectuée`,
        description: `${selectedAgents.length} agent(s) traité(s) avec succès`,
      });

      setSelectedAgents([]);
      fetchAgents();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'action en lot",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (role: string) => {
    return (
      <Badge className="bg-green-500 text-white flex items-center gap-1">
        <CheckCircle className="w-3 h-3" />
        {role === 'agent' ? 'Actif' : 'Inactif'}
      </Badge>
    );
  };

  const activeAgents = agents.filter(a => a.role === 'agent');

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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="management">Gestion</TabsTrigger>
              <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        <p className="text-sm text-gray-600">Solde Total</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {agents.reduce((sum, a) => sum + a.balance, 0).toLocaleString()} FCFA
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-blue-500" />
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
                          checked={selectedAgents.includes(agent.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedAgents([...selectedAgents, agent.id]);
                            } else {
                              setSelectedAgents(selectedAgents.filter(id => id !== agent.id));
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
                        {getStatusBadge(agent.role)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="management" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Actions en Lot</h3>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleBatchAction('approve')}
                    disabled={isProcessing || selectedAgents.length === 0}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Valider ({selectedAgents.length})
                  </Button>
                  <Button
                    onClick={() => handleBatchAction('suspend')}
                    disabled={isProcessing || selectedAgents.length === 0}
                    variant="destructive"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Suspendre ({selectedAgents.length})
                  </Button>
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
                      <h4 className="font-medium">Statistiques</h4>
                      <div className="space-y-2">
                        <div className="p-2 bg-green-50 border border-green-200 rounded text-sm">
                          <div className="flex items-center gap-2 text-green-700">
                            <CheckCircle className="w-4 h-4" />
                            {activeAgents.length} agent(s) actif(s)
                          </div>
                        </div>
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
