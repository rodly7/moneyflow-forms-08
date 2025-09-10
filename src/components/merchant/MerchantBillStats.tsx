import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Receipt,
  Users,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface BillStats {
  today: {
    amount: number;
    count: number;
  };
  week: {
    amount: number;
    count: number;
  };
  month: {
    amount: number;
    count: number;
  };
  uniqueClients: number;
}

const MerchantBillStats = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<BillStats>({
    today: { amount: 0, count: 0 },
    week: { amount: 0, count: 0 },
    month: { amount: 0, count: 0 },
    uniqueClients: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    if (!profile?.id) return;

    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Stats du jour
      const { data: todayData } = await supabase
        .from('merchant_payments')
        .select('amount')
        .eq('merchant_id', profile.id)
        .gte('created_at', today.toISOString());

      const todayAmount = todayData?.reduce((sum, payment) => sum + payment.amount, 0) || 0;

      // Stats de la semaine
      const { data: weekData } = await supabase
        .from('merchant_payments')
        .select('amount')
        .eq('merchant_id', profile.id)
        .gte('created_at', weekAgo.toISOString());

      const weekAmount = weekData?.reduce((sum, payment) => sum + payment.amount, 0) || 0;

      // Stats du mois
      const { data: monthData } = await supabase
        .from('merchant_payments')
        .select('amount, user_id')
        .eq('merchant_id', profile.id)
        .gte('created_at', monthStart.toISOString());

      const monthAmount = monthData?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
      const uniqueClients = new Set(monthData?.map(payment => payment.user_id) || []).size;

      setStats({
        today: { amount: todayAmount, count: todayData?.length || 0 },
        week: { amount: weekAmount, count: weekData?.length || 0 },
        month: { amount: monthAmount, count: monthData?.length || 0 },
        uniqueClients
      });
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Actualiser toutes les 30 secondes
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [profile?.id]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Aujourd'hui */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Aujourd'hui</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {stats.today.amount.toLocaleString()} FCFA
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.today.count} transaction{stats.today.count > 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Cette semaine */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cette semaine</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {stats.week.amount.toLocaleString()} FCFA
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.week.count} transaction{stats.week.count > 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Ce mois */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ce mois</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {stats.month.amount.toLocaleString()} FCFA
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.month.count} transaction{stats.month.count > 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Clients uniques */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Clients uniques</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {stats.uniqueClients}
          </div>
          <p className="text-xs text-muted-foreground">
            Ce mois-ci
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MerchantBillStats;