
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, DollarSign, Calendar, Percent } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/integrations/supabase/client";

interface CommissionData {
  date: string;
  withdrawals: number;
  deposits: number;
  totalCommission: number;
  withdrawalCommission: number;
  depositCommission: number;
}

const AgentCommissions = () => {
  const { user } = useAuth();
  const [dailyCommissions, setDailyCommissions] = useState<CommissionData[]>([]);
  const [weeklyCommissions, setWeeklyCommissions] = useState<CommissionData[]>([]);
  const [monthlyCommissions, setMonthlyCommissions] = useState<CommissionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const calculateCommissions = async (period: 'daily' | 'weekly' | 'monthly') => {
    if (!user?.id) return [];

    try {
      const now = new Date();
      let startDate: Date;
      let periods: Date[] = [];

      if (period === 'daily') {
        // Derniers 7 jours
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          periods.push(date);
        }
      } else if (period === 'weekly') {
        // Dernières 4 semaines
        for (let i = 3; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - (i * 7));
          periods.push(date);
        }
      } else {
        // Derniers 6 mois
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now);
          date.setMonth(date.getMonth() - i);
          periods.push(date);
        }
      }

      const commissions: CommissionData[] = [];

      for (const periodStart of periods) {
        const periodEnd = new Date(periodStart);
        if (period === 'daily') {
          periodEnd.setDate(periodEnd.getDate() + 1);
        } else if (period === 'weekly') {
          periodEnd.setDate(periodEnd.getDate() + 7);
        } else {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        }

        // Récupérer les retraits
        const { data: withdrawals } = await supabase
          .from('withdrawals')
          .select('amount')
          .eq('user_id', user.id)
          .gte('created_at', periodStart.toISOString())
          .lt('created_at', periodEnd.toISOString())
          .eq('status', 'completed');

        // Récupérer les dépôts
        const { data: deposits } = await supabase
          .from('recharges')
          .select('amount')
          .eq('provider_transaction_id', user.id)
          .gte('created_at', periodStart.toISOString())
          .lt('created_at', periodEnd.toISOString())
          .eq('status', 'completed');

        // Calculer les commissions selon les nouveaux taux
        const withdrawalCommission = withdrawals?.reduce((sum, w) => sum + (Number(w.amount) * 0.002), 0) || 0; // 0,2% sur les retraits
        const depositCommission = deposits?.reduce((sum, d) => sum + (Number(d.amount) * 0.005), 0) || 0; // 0,5% sur les dépôts

        console.log(`📊 Période ${periodStart.toLocaleDateString('fr-FR')}:`);
        console.log(`- Retraits: ${withdrawals?.length || 0}, Volume: ${withdrawals?.reduce((sum, w) => sum + Number(w.amount), 0) || 0}, Commission: ${withdrawalCommission}`);
        console.log(`- Dépôts: ${deposits?.length || 0}, Volume: ${deposits?.reduce((sum, d) => sum + Number(d.amount), 0) || 0}, Commission: ${depositCommission}`);

        commissions.push({
          date: periodStart.toLocaleDateString('fr-FR'),
          withdrawals: withdrawals?.length || 0,
          deposits: deposits?.length || 0,
          withdrawalCommission,
          depositCommission,
          totalCommission: withdrawalCommission + depositCommission
        });
      }

      return commissions;
    } catch (error) {
      console.error('Erreur lors du calcul des commissions:', error);
      return [];
    }
  };

  const loadCommissions = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Rechargement des commissions...');
      // Forcer le recalcul des performances avant de charger les commissions
      if (user) {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        
        console.log(`📅 Recalcul pour agent ${user.id}, mois ${currentMonth}/${currentYear}`);
        const { data: recalcResult, error: recalcError } = await supabase.rpc('calculate_agent_monthly_performance', {
          agent_id_param: user.id,
          month_param: currentMonth,
          year_param: currentYear
        });
        
        if (recalcError) {
          console.error('❌ Erreur recalcul:', recalcError);
        } else {
          console.log('✅ Recalcul terminé:', recalcResult);
        }
      }
      
      const [daily, weekly, monthly] = await Promise.all([
        calculateCommissions('daily'),
        calculateCommissions('weekly'),
        calculateCommissions('monthly')
      ]);

      setDailyCommissions(daily);
      setWeeklyCommissions(weekly);
      setMonthlyCommissions(monthly);
    } catch (error) {
      console.error('Erreur lors du chargement des commissions:', error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (user?.id) {
      loadCommissions();
    }
  }, [user?.id]);

  const CommissionCard = ({ data, title }: { data: CommissionData[], title: string }) => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      {data.map((item, index) => (
        <Card key={index} className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-gray-700">{item.date}</span>
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-green-600" />
                <span className="font-bold text-green-700">
                  {formatCurrency(item.totalCommission, 'XAF')}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center p-2 bg-red-100 rounded">
                <div className="font-bold text-red-700">{item.withdrawals}</div>
                <div className="text-red-600">Retraits</div>
                <div className="text-xs text-red-500">
                  {formatCurrency(item.withdrawalCommission, 'XAF')}
                </div>
              </div>
              
              <div className="text-center p-2 bg-green-100 rounded">
                <div className="font-bold text-green-700">{item.deposits}</div>
                <div className="text-green-600">Dépôts</div>
                <div className="text-xs text-green-500">
                  {formatCurrency(item.depositCommission, 'XAF')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          Mes Commissions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="daily">Quotidien</TabsTrigger>
            <TabsTrigger value="weekly">Hebdomadaire</TabsTrigger>
            <TabsTrigger value="monthly">Mensuel</TabsTrigger>
          </TabsList>

          <TabsContent value="daily">
            <CommissionCard data={dailyCommissions} title="Commissions des 7 derniers jours" />
          </TabsContent>

          <TabsContent value="weekly">
            <CommissionCard data={weeklyCommissions} title="Commissions des 4 dernières semaines" />
          </TabsContent>

          <TabsContent value="monthly">
            <CommissionCard data={monthlyCommissions} title="Commissions des 6 derniers mois" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AgentCommissions;
