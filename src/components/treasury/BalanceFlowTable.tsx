
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, ArrowRight, Plus, Minus } from "lucide-react";

interface BalanceFlow {
  id: string;
  from_country: string;
  to_country: string;
  from_agent_id: string;
  to_agent_id: string;
  from_agent_name: string;
  to_agent_name: string;
  amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  completed_at?: string;
  reason: string;
}

interface BalanceFlowTableProps {
  onUpdate: () => void;
}

const BalanceFlowTable = ({ onUpdate }: BalanceFlowTableProps) => {
  const { toast } = useToast();
  const [flows, setFlows] = useState<BalanceFlow[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form states for new flow
  const [fromAgent, setFromAgent] = useState("");
  const [toAgent, setToAgent] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchBalanceFlows(), fetchAgents()]);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBalanceFlows = async () => {
    // For now, we'll simulate balance flows since we don't have a dedicated table
    // In a real implementation, you'd have a balance_flows table
    const mockFlows: BalanceFlow[] = [
      {
        id: '1',
        from_country: 'Sénégal',
        to_country: 'Mali',
        from_agent_id: 'agent1',
        to_agent_id: 'agent2',
        from_agent_name: 'Agent Dakar',
        to_agent_name: 'Agent Bamako',
        amount: 500000,
        status: 'completed',
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        reason: 'Rééquilibrage mensuel'
      }
    ];
    
    setFlows(mockFlows);
  };

  const fetchAgents = async () => {
    try {
      // Get agents first
      const { data: agentsData, error: agentsError } = await supabase
        .from('agents')
        .select('*')
        .eq('status', 'active');

      if (agentsError) throw agentsError;

      if (!agentsData || agentsData.length === 0) {
        setAgents([]);
        return;
      }

      // Get profiles for each agent
      const userIds = agentsData.map(agent => agent.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, balance')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combine agents with their profile balance
      const enrichedAgents = agentsData.map(agent => {
        const profile = profilesData?.find(p => p.id === agent.user_id);
        return {
          ...agent,
          balance: profile?.balance || 0
        };
      });

      setAgents(enrichedAgents);
    } catch (error) {
      console.error('Erreur lors du chargement des agents:', error);
      setAgents([]);
    }
  };

  const createBalanceFlow = async () => {
    if (!fromAgent || !toAgent || !amount || !reason) {
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    if (fromAgent === toAgent) {
      toast({
        title: "Erreur",
        description: "L'agent source et destination doivent être différents",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsCreating(true);
      
      const transferAmount = parseFloat(amount);
      const fromAgentData = agents.find(a => a.user_id === fromAgent);
      const toAgentData = agents.find(a => a.user_id === toAgent);

      if (!fromAgentData || !toAgentData) {
        throw new Error("Agents non trouvés");
      }

      // Check if source agent has sufficient balance
      if (fromAgentData.balance < transferAmount) {
        toast({
          title: "Solde insuffisant",
          description: `L'agent ${fromAgentData.full_name} n'a pas un solde suffisant`,
          variant: "destructive"
        });
        return;
      }

      // Perform the balance transfer using secure functions
      // Debit source agent
      await supabase.rpc('secure_increment_balance', {
        target_user_id: fromAgent,
        amount: -transferAmount,
        operation_type: 'treasury_rebalancing'
      });

      // Credit destination agent
      await supabase.rpc('secure_increment_balance', {
        target_user_id: toAgent,
        amount: transferAmount,
        operation_type: 'treasury_rebalancing'
      });

      // Log the flow in audit logs
      await supabase.from('audit_logs').insert({
        action: 'balance_flow_transfer',
        table_name: 'treasury_flows',
        record_id: fromAgent,
        old_values: {
          from_agent: fromAgentData.full_name,
          to_agent: toAgentData.full_name
        },
        new_values: {
          amount: transferAmount,
          reason: reason,
          from_country: fromAgentData.country,
          to_country: toAgentData.country
        }
      });

      toast({
        title: "Flux de rééquilibrage créé",
        description: `${transferAmount.toLocaleString()} FCFA transférés de ${fromAgentData.full_name} vers ${toAgentData.full_name}`,
      });

      // Reset form
      setFromAgent("");
      setToAgent("");
      setAmount("");
      setReason("");
      
      // Refresh data
      fetchData();
      onUpdate();
      
    } catch (error) {
      console.error('Erreur lors de la création du flux:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le flux de rééquilibrage",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Complété</Badge>;
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">En cours</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Annulé</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* New Flow Creation */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" />
            Nouveau Flux d'Équilibrage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Agent Source</Label>
              <select 
                value={fromAgent} 
                onChange={(e) => setFromAgent(e.target.value)}
                className="h-10 w-full px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">Sélectionner agent source</option>
                {agents.map((agent) => (
                  <option key={agent.user_id} value={agent.user_id}>
                    {agent.full_name} ({agent.country}) - {agent.balance?.toLocaleString()} FCFA
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Agent Destination</Label>
              <select 
                value={toAgent} 
                onChange={(e) => setToAgent(e.target.value)}
                className="h-10 w-full px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">Sélectionner agent destination</option>
                {agents.map((agent) => (
                  <option key={agent.user_id} value={agent.user_id}>
                    {agent.full_name} ({agent.country}) - {agent.balance?.toLocaleString()} FCFA
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Montant (FCFA)</Label>
              <Input
                type="number"
                placeholder="Montant à transférer"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div>
              <Label>Raison</Label>
              <Input
                placeholder="Motif du rééquilibrage"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              onClick={createBalanceFlow}
              disabled={isCreating}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isCreating ? "Création..." : "Créer le flux"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Flows History */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Historique des Flux d'Équilibrage
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Flow</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Raison</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        Aucun flux d'équilibrage pour le moment
                      </TableCell>
                    </TableRow>
                  ) : (
                    flows.map((flow) => (
                      <TableRow key={flow.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-medium">{flow.from_agent_name}</p>
                              <p className="text-sm text-gray-600">{flow.from_country}</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="font-medium">{flow.to_agent_name}</p>
                              <p className="text-sm text-gray-600">{flow.to_country}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-lg">
                            {flow.amount.toLocaleString()} FCFA
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(flow.status)}</TableCell>
                        <TableCell>{flow.reason}</TableCell>
                        <TableCell>
                          {new Date(flow.created_at).toLocaleDateString('fr-FR')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BalanceFlowTable;
