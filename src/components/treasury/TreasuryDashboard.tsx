
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TreasuryDashboardProps {
  onRefresh: () => void;
}

interface BalanceAlert {
  type: 'warning' | 'error' | 'info';
  message: string;
  agentName?: string;
  amount?: number;
}

const TreasuryDashboard = ({ onRefresh }: TreasuryDashboardProps) => {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<BalanceAlert[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        checkBalanceAlerts(),
        fetchRecentActivities()
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement du tableau de bord:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkBalanceAlerts = async () => {
    const newAlerts: BalanceAlert[] = [];

    // Check for agents with excessive balances
    const { data: agents } = await supabase
      .from('profiles')
      .select('full_name, balance')
      .eq('role', 'agent');

    agents?.forEach(agent => {
      if (agent.balance > 1000000) { // 1M threshold
        newAlerts.push({
          type: 'warning',
          message: `Solde élevé détecté`,
          agentName: agent.full_name,
          amount: agent.balance
        });
      } else if (agent.balance < 10000) { // Low balance threshold
        newAlerts.push({
          type: 'info',
          message: `Solde faible`,
          agentName: agent.full_name,
          amount: agent.balance
        });
      }
    });

    // Check for pending transactions older than 24h
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { data: oldPending } = await supabase
      .from('transfers')
      .select('id')
      .eq('status', 'pending')
      .lt('created_at', yesterday.toISOString());

    if (oldPending && oldPending.length > 0) {
      newAlerts.push({
        type: 'error',
        message: `${oldPending.length} transactions en attente depuis plus de 24h`
      });
    }

    setAlerts(newAlerts);
  };

  const fetchRecentActivities = async () => {
    const { data: transfers } = await supabase
      .from('transfers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: withdrawals } = await supabase
      .from('withdrawals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    // Combine and sort activities
    const activities = [
      ...(transfers || []).map(t => ({ ...t, type: 'transfer' })),
      ...(withdrawals || []).map(w => ({ ...w, type: 'withdrawal' }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
     .slice(0, 15);

    setRecentActivities(activities);
  };

  const handleRefresh = () => {
    fetchDashboardData();
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Alerts Section */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            Alertes de Trésorerie
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span>Aucune alerte - Système stable</span>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-l-4 ${
                    alert.type === 'error'
                      ? 'bg-red-50 border-red-500 text-red-800'
                      : alert.type === 'warning'
                      ? 'bg-amber-50 border-amber-500 text-amber-800'
                      : 'bg-blue-50 border-blue-500 text-blue-800'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{alert.message}</span>
                    {alert.agentName && (
                      <span className="text-sm">
                        {alert.agentName}: {alert.amount?.toLocaleString()} FCFA
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activities */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Activités Récentes
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentActivities.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aucune activité récente</p>
            ) : (
              recentActivities.map((activity, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="font-medium">
                      {activity.type === 'transfer' 
                        ? `Transfert vers ${activity.recipient_full_name}`
                        : `Retrait - ${activity.withdrawal_phone}`
                      }
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(activity.created_at).toLocaleString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">
                      {activity.amount?.toLocaleString()} FCFA
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      activity.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : activity.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {activity.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TreasuryDashboard;
