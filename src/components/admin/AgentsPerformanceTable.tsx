import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, DollarSign, AlertTriangle, Award } from "lucide-react";
import { AgentPerformanceData } from "@/hooks/useAdminDashboardData";

interface AgentsPerformanceTableProps {
  agents: AgentPerformanceData[];
  isLoading: boolean;
}

const AgentsPerformanceTable = ({ agents, isLoading }: AgentsPerformanceTableProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'pending': return 'En attente';
      case 'suspended': return 'Suspendu';
      case 'rejected': return 'Rejeté';
      default: return status;
    }
  };

  // Trier les agents par revenus décroissants
  const sortedAgents = [...agents].sort((a, b) => b.total_earnings - a.total_earnings);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Performance des Agents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Performance des Agents ({agents.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {sortedAgents.map((agent, index) => (
            <div 
              key={agent.agent_id} 
              className="flex items-center justify-between p-4 bg-card border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                  {index === 0 && <Award className="w-4 h-4 text-yellow-600" />}
                  {index === 1 && <Award className="w-4 h-4 text-gray-400" />}
                  {index === 2 && <Award className="w-4 h-4 text-amber-600" />}
                  {index > 2 && <span className="text-sm font-medium">{index + 1}</span>}
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{agent.agent_name}</h4>
                    <Badge className={getStatusColor(agent.status)}>
                      {getStatusText(agent.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{agent.agent_phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <div className="flex items-center gap-1 text-green-600">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-medium">{agent.total_earnings.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Revenus</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center gap-1 text-blue-600">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-medium">{(agent.volume_processed / 1000).toFixed(0)}K</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Volume</p>
                </div>

                <div className="text-center">
                  <div className="font-medium text-purple-600">{agent.transfers_count}</div>
                  <p className="text-xs text-muted-foreground">Transferts</p>
                </div>

                {agent.complaints_count > 0 && (
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-red-600">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="font-medium">{agent.complaints_count}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Réclamations</p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {agents.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Aucun agent trouvé</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentsPerformanceTable;