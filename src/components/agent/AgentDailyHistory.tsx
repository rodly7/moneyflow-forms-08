import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Activity, ArrowUpRight, ArrowDownLeft, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/integrations/supabase/client";

interface DailyActivity {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  time: string;
  recipient?: string;
  status: string;
}

const AgentDailyHistory = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchDailyActivities = async (date: string) => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);

      // Récupérer les retraits
      const { data: withdrawals } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      // Récupérer les dépôts
      const { data: deposits } = await supabase
        .from('recharges')
        .select('*')
        .eq('provider_transaction_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      const allActivities: DailyActivity[] = [
        ...(withdrawals?.map(w => ({
          id: w.id,
          type: 'withdrawal' as const,
          amount: Number(w.amount),
          time: new Date(w.created_at).toLocaleTimeString('fr-FR'),
          recipient: w.withdrawal_phone,
          status: w.status
        })) || []),
        ...(deposits?.map(d => ({
          id: d.id,
          type: 'deposit' as const,
          amount: Number(d.amount),
          time: new Date(d.created_at).toLocaleTimeString('fr-FR'),
          recipient: d.payment_phone,
          status: d.status
        })) || [])
      ];

      allActivities.sort((a, b) => b.time.localeCompare(a.time));
      setActivities(allActivities);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchDailyActivities(selectedDate);
  }, [user?.id, selectedDate]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'withdrawal': return <ArrowDownLeft className="w-4 h-4" />;
      case 'deposit': return <Plus className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'withdrawal': return 'Retrait';
      case 'deposit': return 'Dépôt';
      default: return 'Opération';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'withdrawal': return 'bg-red-100 text-red-800';
      case 'deposit': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Historique Journalier
        </CardTitle>
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {activities.length} opération{activities.length > 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="w-full">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            <Activity className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Aucune activité ce jour</p>
            <p className="text-sm">Sélectionnez une autre date pour voir l'historique</p>
          </div>
        ) : (
          <div className="space-y-4 w-full">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors w-full"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${getTypeColor(activity.type)}`}>
                    {getTypeIcon(activity.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{getTypeLabel(activity.type)}</span>
                      <Badge
                        variant={activity.status === 'completed' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {activity.status === 'completed' ? 'Complété' : 'En cours'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {activity.recipient && `vers ${activity.recipient}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">
                    {formatCurrency(activity.amount, 'XAF')}
                  </p>
                  <p className="text-sm text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AgentDailyHistory;
