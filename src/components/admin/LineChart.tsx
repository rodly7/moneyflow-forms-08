
import React from 'react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils/currency';

export const LineChart = () => {
  const { data: revenueData, isLoading } = useQuery({
    queryKey: ['monthly-revenue-chart'],
    queryFn: async () => {
      console.log('🔍 Récupération des données de revenus mensuels...');

      // Récupérer les 6 derniers mois
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        months.push({
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          name: date.toLocaleDateString('fr-FR', { month: 'short' })
        });
      }

      const chartData = [];

      for (const monthInfo of months) {
        const startDate = `${monthInfo.year}-${String(monthInfo.month).padStart(2, '0')}-01`;
        const endDate = new Date(monthInfo.year, monthInfo.month, 0).toISOString().split('T')[0];

        // Récupérer les recharges du mois
        const { data: recharges, error: rechargesError } = await supabase
          .from('recharges')
          .select('amount')
          .eq('status', 'completed')
          .gte('created_at', startDate)
          .lte('created_at', `${endDate}T23:59:59.999Z`);

        if (rechargesError) {
          console.error('Erreur recharges:', rechargesError);
        }

        // Récupérer les transferts du mois
        const { data: transfers, error: transfersError } = await supabase
          .from('transfers')
          .select('amount, fees')
          .eq('status', 'completed')
          .gte('created_at', startDate)
          .lte('created_at', `${endDate}T23:59:59.999Z`);

        if (transfersError) {
          console.error('Erreur transferts:', transfersError);
        }

        // Récupérer les retraits du mois
        const { data: withdrawals, error: withdrawalsError } = await supabase
          .from('withdrawals')
          .select('amount')
          .eq('status', 'completed')
          .gte('created_at', startDate)
          .lte('created_at', `${endDate}T23:59:59.999Z`);

        if (withdrawalsError) {
          console.error('Erreur retraits:', withdrawalsError);
        }

        // Calculer les totaux
        const rechargeTotal = recharges?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;
        const transferTotal = transfers?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
        const transferFees = transfers?.reduce((sum, t) => sum + Number(t.fees || 0), 0) || 0;
        const withdrawalTotal = withdrawals?.reduce((sum, w) => sum + Number(w.amount), 0) || 0;

        // Le revenu = frais de transfert (approximation)
        const revenue = transferFees;

        chartData.push({
          name: monthInfo.name,
          revenue: revenue,
          recharges: rechargeTotal,
          transfers: transferTotal,
          withdrawals: withdrawalTotal
        });
      }

      console.log('✅ Données de revenus calculées:', chartData);
      return chartData;
    },
    refetchInterval: 300000 // Actualiser toutes les 5 minutes
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!revenueData || revenueData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        Aucune donnée disponible
      </div>
    );
  }

  const formatTooltip = (value: number, name: string) => {
    const labels: Record<string, string> = {
      revenue: 'Revenus',
      recharges: 'Recharges',
      transfers: 'Transferts',
      withdrawals: 'Retraits'
    };
    return [formatCurrency(value, 'XAF'), labels[name] || name];
  };

  const formatYAxisTick = (value: number) => {
    // Format for Y-axis with abbreviated values for large numbers
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsLineChart data={revenueData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey="name" 
          className="text-muted-foreground"
        />
        <YAxis 
          className="text-muted-foreground"
          tickFormatter={formatYAxisTick}
        />
        <Tooltip 
          formatter={formatTooltip}
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px'
          }}
        />
        <Line 
          type="monotone" 
          dataKey="revenue" 
          stroke="hsl(var(--primary))" 
          strokeWidth={3}
          dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
        />
        <Line 
          type="monotone" 
          dataKey="recharges" 
          stroke="hsl(var(--chart-2))" 
          strokeWidth={2}
          dot={{ fill: 'hsl(var(--chart-2))', strokeWidth: 1, r: 3 }}
        />
        <Line 
          type="monotone" 
          dataKey="transfers" 
          stroke="hsl(var(--chart-3))" 
          strokeWidth={2}
          dot={{ fill: 'hsl(var(--chart-3))', strokeWidth: 1, r: 3 }}
        />
        <Line 
          type="monotone" 
          dataKey="withdrawals" 
          stroke="hsl(var(--chart-4))" 
          strokeWidth={2}
          dot={{ fill: 'hsl(var(--chart-4))', strokeWidth: 1, r: 3 }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
};
