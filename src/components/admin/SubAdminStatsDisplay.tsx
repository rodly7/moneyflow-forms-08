
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, Activity, TrendingUp, AlertCircle } from 'lucide-react';
import { useSubAdminStats } from '@/hooks/useSubAdminStats';

const SubAdminStatsDisplay = () => {
  const { stats, loading } = useSubAdminStats();

  // Debug: afficher les statistiques reçues
  React.useEffect(() => {
    console.log('📊 Debug SubAdminStatsDisplay - Stats reçues:', stats);
    console.log('⏳ Debug SubAdminStatsDisplay - Loading:', loading);
  }, [stats, loading]);

  if (loading) {
    console.log('🔄 Debug - Affichage du loading...');
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getQuotaColor = () => {
    if (stats.quotaUtilization >= 100) return 'text-red-600 bg-red-50';
    if (stats.quotaUtilization >= 80) return 'text-yellow-600 bg-yellow-50';
    return 'text-blue-600 bg-blue-50';
  };

  console.log('✅ Debug - Rendu des statistiques:', stats);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Quota journalier</span>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {stats.dailyRequests}/{stats.dailyLimit}
          </div>
          <Badge className={`text-xs ${getQuotaColor()}`}>
            {stats.quotaUtilization}% utilisé
          </Badge>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-green-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Utilisateurs gérés</span>
            <Users className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-600">
            {stats.totalUsersManaged}
          </div>
          <span className="text-xs text-gray-500">Dans votre zone</span>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-purple-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Agents gérés</span>
            <UserCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {stats.activeAgents}/{stats.totalAgentsManaged}
          </div>
          <span className="text-xs text-gray-500">Actifs/Total</span>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-orange-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Transactions</span>
            <TrendingUp className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-orange-600">
            {stats.totalTransactions}
          </div>
          {stats.pendingWithdrawals > 0 && (
            <Badge variant="outline" className="text-xs text-orange-600">
              <AlertCircle className="w-3 h-3 mr-1" />
              {stats.pendingWithdrawals} en attente
            </Badge>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubAdminStatsDisplay;
