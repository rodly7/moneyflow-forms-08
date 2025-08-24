
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Users, Activity, AlertTriangle } from 'lucide-react';

const SubAdminSummaryCard = () => {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['sub-admin-summary'],
    queryFn: async () => {
      // Compter le nombre total de sous-administrateurs
      const { count: totalSubAdmins } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'sub_admin');

      // Compter les sous-admins actifs aujourd'hui
      const today = new Date().toISOString().split('T')[0];
      const { data: activeToday } = await supabase
        .from('sub_admin_daily_requests')
        .select('sub_admin_id')
        .eq('date', today);

      const activeSubAdminsToday = new Set(activeToday?.map(r => r.sub_admin_id) || []).size;

      // Compter les sous-admins qui ont atteint leur quota
      const { data: quotaData } = await supabase
        .from('sub_admin_quota_settings')
        .select('sub_admin_id, daily_limit');

      let quotaReached = 0;
      if (quotaData && activeToday) {
        const requestCounts = activeToday.reduce((acc: Record<string, number>, req) => {
          acc[req.sub_admin_id] = (acc[req.sub_admin_id] || 0) + 1;
          return acc;
        }, {});

        quotaReached = quotaData.filter(quota => 
          (requestCounts[quota.sub_admin_id] || 0) >= quota.daily_limit
        ).length;
      }

      return {
        total: totalSubAdmins || 0,
        active: activeSubAdminsToday,
        quotaReached
      };
    },
    refetchInterval: 60000 // Actualiser chaque minute
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Sous-Administrateurs</CardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-2xl font-bold">{summary?.total || 0}</div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-600" />
              <span className="text-green-600">{summary?.active || 0} actifs</span>
            </div>
            {summary?.quotaReached && summary.quotaReached > 0 && (
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <span className="text-orange-600">{summary.quotaReached} quota atteint</span>
              </div>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            Activité du jour
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubAdminSummaryCard;
