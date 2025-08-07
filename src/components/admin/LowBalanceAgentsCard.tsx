import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, AlertTriangle, DollarSign, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Agent {
  id: string;
  full_name: string | null;
  phone: string;
  balance: number;
  country: string | null;
}

interface LowBalanceAgentsCardProps {
  onDepositToAgent?: (agent: Agent) => void;
  threshold?: number;
}

const LowBalanceAgentsCard = ({ onDepositToAgent, threshold = -100000 }: LowBalanceAgentsCardProps) => {
  const [lowBalanceAgents, setLowBalanceAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchLowBalanceAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, balance, country')
        .eq('role', 'agent')
        .lt('balance', threshold)
        .order('balance', { ascending: true });

      if (error) throw error;
      setLowBalanceAgents(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des agents:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les agents en manque de fonds",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLowBalanceAgents();
    
    // Mettre à jour toutes les 30 secondes
    const interval = setInterval(fetchLowBalanceAgents, 30000);
    
    return () => clearInterval(interval);
  }, [threshold]);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Agents en manque de fonds
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Agents en manque de fonds
          </CardTitle>
          <Badge variant="destructive" className="text-xs">
            {lowBalanceAgents.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {lowBalanceAgents.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Tous les agents ont un solde suffisant
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {lowBalanceAgents.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {agent.full_name || "Nom non défini"}
                  </p>
                  <p className="text-xs text-muted-foreground">{agent.phone}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-medium text-destructive">
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'XAF',
                        maximumFractionDigits: 0
                      }).format(agent.balance)}
                    </span>
                  </div>
                </div>
                {onDepositToAgent && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDepositToAgent(agent)}
                    className="shrink-0 ml-2"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Dépôt
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Seuil d'alerte: {new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'XAF',
              maximumFractionDigits: 0
            }).format(threshold)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LowBalanceAgentsCard;