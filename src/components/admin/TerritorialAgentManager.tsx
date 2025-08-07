import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Shield, CheckCircle, XCircle, Eye, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSubAdmin } from "@/hooks/useSubAdmin";

interface Agent {
  id: string;
  user_id: string;
  agent_id: string;
  full_name: string;
  phone: string;
  country: string;
  status: string;
  commission_balance: number;
  created_at: string;
}

export const TerritorialAgentManager = () => {
  const { userCountry, canValidateAgent } = useSubAdmin();
  const { toast } = useToast();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTerritorialAgents = async () => {
    if (!userCountry) return;
    
    setIsLoading(true);
    try {
      console.log('Fetching agents for country:', userCountry);
      
      // Récupérer d'abord les profils du pays pour obtenir les user_ids
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id')
        .eq('country', userCountry);

      if (profilesError) throw profilesError;
      
      if (!profiles || profiles.length === 0) {
        console.log('No profiles found for country:', userCountry);
        setAgents([]);
        setIsLoading(false);
        return;
      }

      const userIds = profiles.map(p => p.id);
      console.log('Found user IDs:', userIds);

      // Récupérer les agents correspondants
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .in('user_id', userIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('Fetched agents:', data);
      setAgents(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des agents:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les agents du territoire",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  const handleValidateAgent = async (agentId: string) => {
    if (!canValidateAgent) return;

    try {
      const { error } = await supabase
        .from('agents')
        .update({ status: 'active' })
        .eq('id', agentId);

      if (error) throw error;

      toast({
        title: "Agent validé",
        description: "L'agent a été validé avec succès",
      });

      fetchTerritorialAgents();
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de valider l'agent",
        variant: "destructive"
      });
    }
  };

  const handleSuspendAgent = async (agentId: string) => {
    if (!canValidateAgent) return;

    try {
      const { error } = await supabase
        .from('agents')
        .update({ status: 'suspended' })
        .eq('id', agentId);

      if (error) throw error;

      toast({
        title: "Agent suspendu",
        description: "L'agent a été suspendu",
      });

      fetchTerritorialAgents();
    } catch (error) {
      console.error('Erreur lors de la suspension:', error);
      toast({
        title: "Erreur",
        description: "Impossible de suspendre l'agent",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Actif</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800">Suspendu</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  useEffect(() => {
    fetchTerritorialAgents();
  }, [userCountry]);

  if (!userCountry) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">Aucun pays/région assigné(e)</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Gestion des Agents - {userCountry}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Chargement des agents...</p>
          </div>
        ) : agents.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Aucun agent trouvé dans cette zone</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>ID Agent</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell className="font-medium">{agent.full_name}</TableCell>
                  <TableCell>{agent.phone}</TableCell>
                  <TableCell>{agent.agent_id}</TableCell>
                  <TableCell>{getStatusBadge(agent.status)}</TableCell>
                  <TableCell>{agent.commission_balance?.toLocaleString() || 0} XAF</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {agent.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleValidateAgent(agent.id)}
                          className="h-8"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Valider
                        </Button>
                      )}
                      {agent.status === 'active' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleSuspendAgent(agent.id)}
                          className="h-8"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Suspendre
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {/* TODO: Voir détails */}}
                        className="h-8"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};