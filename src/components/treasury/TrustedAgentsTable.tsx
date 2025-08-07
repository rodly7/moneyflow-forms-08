
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Edit, Eye, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface TrustedAgent {
  id: string;
  user_id: string;
  agent_id: string;
  full_name: string;
  phone: string;
  country: string;
  status: 'pending' | 'active' | 'suspended' | 'rejected';
  commission_balance: number;
  transactions_count: number;
  user_balance: number;
  created_at: string;
}

interface TrustedAgentsTableProps {
  onUpdate: () => void;
}

const TrustedAgentsTable = ({ onUpdate }: TrustedAgentsTableProps) => {
  const { toast } = useToast();
  const [agents, setAgents] = useState<TrustedAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<TrustedAgent | null>(null);
  const [balanceAdjustment, setBalanceAdjustment] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);

  useEffect(() => {
    fetchTrustedAgents();
  }, []);

  const fetchTrustedAgents = async () => {
    try {
      setLoading(true);
      
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
          user_balance: profile?.balance || 0
        };
      });

      setAgents(enrichedAgents);
    } catch (error) {
      console.error('Erreur lors du chargement des agents fiables:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la liste des agents fiables",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBalanceAdjustment = async () => {
    if (!selectedAgent || !balanceAdjustment || !adjustmentReason) return;

    try {
      setIsAdjusting(true);
      
      const amount = parseFloat(balanceAdjustment);
      if (isNaN(amount)) {
        toast({
          title: "Erreur",
          description: "Montant invalide",
          variant: "destructive"
        });
        return;
      }

      // Use secure balance update function
      const { data: newBalance, error } = await supabase.rpc('secure_increment_balance', {
        target_user_id: selectedAgent.user_id,
        amount: amount,
        operation_type: 'treasury_adjustment'
      });

      if (error) throw error;

      // Log the adjustment
      await supabase.from('audit_logs').insert({
        action: 'treasury_balance_adjustment',
        table_name: 'profiles',
        record_id: selectedAgent.user_id,
        old_values: { old_balance: selectedAgent.user_balance },
        new_values: { 
          new_balance: newBalance, 
          adjustment: amount, 
          reason: adjustmentReason 
        }
      });

      toast({
        title: "Ajustement effectué",
        description: `Solde de ${selectedAgent.full_name} ajusté de ${amount} FCFA`,
      });

      // Reset form and refresh data
      setBalanceAdjustment("");
      setAdjustmentReason("");
      setSelectedAgent(null);
      fetchTrustedAgents();
      onUpdate();
      
    } catch (error) {
      console.error('Erreur lors de l\'ajustement:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'effectuer l'ajustement de solde",
        variant: "destructive"
      });
    } finally {
      setIsAdjusting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Actif</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Suspendu</Badge>;
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">En attente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTrustLevel = (agent: TrustedAgent) => {
    const { transactions_count, user_balance } = agent;
    
    if (transactions_count > 100 && user_balance > 100000) {
      return { level: 'Très fiable', color: 'text-green-600', icon: CheckCircle };
    } else if (transactions_count > 50 && user_balance > 50000) {
      return { level: 'Fiable', color: 'text-blue-600', icon: Shield };
    } else if (transactions_count > 20) {
      return { level: 'Modéré', color: 'text-amber-600', icon: AlertTriangle };
    } else {
      return { level: 'Nouveau', color: 'text-gray-600', icon: XCircle };
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-green-600" />
          Agents Fiables ({agents.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Pays</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Niveau de Confiance</TableHead>
                <TableHead>Solde</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Transactions</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent) => {
                const trustLevel = getTrustLevel(agent);
                const TrustIcon = trustLevel.icon;
                
                return (
                  <TableRow key={agent.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{agent.full_name}</p>
                        <p className="text-sm text-gray-600">{agent.phone}</p>
                        <p className="text-xs text-gray-500">ID: {agent.agent_id}</p>
                      </div>
                    </TableCell>
                    <TableCell>{agent.country}</TableCell>
                    <TableCell>{getStatusBadge(agent.status)}</TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-2 ${trustLevel.color}`}>
                        <TrustIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">{trustLevel.level}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold">
                        {agent.user_balance?.toLocaleString()} FCFA
                      </span>
                    </TableCell>
                    <TableCell>
                      {agent.commission_balance?.toLocaleString()} FCFA
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {agent.transactions_count} trans.
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedAgent(agent)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>
                                Ajuster le solde - {agent.full_name}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Solde actuel</Label>
                                <p className="text-2xl font-bold text-blue-600">
                                  {agent.user_balance?.toLocaleString()} FCFA
                                </p>
                              </div>
                              
                              <div>
                                <Label htmlFor="adjustment">
                                  Montant d'ajustement (+ ou -)
                                </Label>
                                <Input
                                  id="adjustment"
                                  type="number"
                                  placeholder="ex: +50000 ou -25000"
                                  value={balanceAdjustment}
                                  onChange={(e) => setBalanceAdjustment(e.target.value)}
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor="reason">Raison de l'ajustement</Label>
                                <Textarea
                                  id="reason"
                                  placeholder="Expliquez la raison de cet ajustement..."
                                  value={adjustmentReason}
                                  onChange={(e) => setAdjustmentReason(e.target.value)}
                                />
                              </div>
                              
                              <Button
                                onClick={handleBalanceAdjustment}
                                disabled={isAdjusting || !balanceAdjustment || !adjustmentReason}
                                className="w-full"
                              >
                                {isAdjusting ? "Ajustement..." : "Confirmer l'ajustement"}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrustedAgentsTable;
