import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAgentQuota } from "@/hooks/useAgentQuota";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/integrations/supabase/client";
import { Target, TrendingUp } from "lucide-react";

const DAILY_QUOTA_LIMIT = 500000; // 500,000 FCFA

const AgentDailyQuota: React.FC = () => {
  const { user } = useAuth();
  const { getAgentQuotaStatus } = useAgentQuota();
  const [quotaData, setQuotaData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuotaStatus = async () => {
      if (!user?.id) {
        console.log('AgentDailyQuota: Pas d\'ID utilisateur');
        return;
      }
      
      try {
        setLoading(true);
        console.log('AgentDailyQuota: Récupération du quota pour l\'agent:', user.id);
        const data = await getAgentQuotaStatus(user.id);
        console.log('AgentDailyQuota: Données quota reçues:', data);
        setQuotaData(data);
      } catch (error) {
        console.error('AgentDailyQuota: Erreur lors de la récupération du quota:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotaStatus();
  }, [user?.id, getAgentQuotaStatus]);

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Quota Journalier
          </CardTitle>
          <Target className="w-4 h-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalDeposits = quotaData?.total_deposits || 0;
  const quotaPercentage = Math.min((totalDeposits / DAILY_QUOTA_LIMIT) * 100, 100);
  const isQuotaReached = totalDeposits >= DAILY_QUOTA_LIMIT;

  console.log('AgentDailyQuota: Affichage - totalDeposits:', totalDeposits, 'quotaPercentage:', quotaPercentage, 'isQuotaReached:', isQuotaReached);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          Quota Journalier (500K FCFA)
        </CardTitle>
        <div className="flex items-center space-x-2">
          {isQuotaReached && <TrendingUp className="w-4 h-4 text-green-600" />}
          <Target className="w-4 h-4 text-blue-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xl font-bold text-gray-900">
              {formatCurrency(totalDeposits, 'XAF')}
            </span>
            <span className="text-sm text-gray-500">
              / {formatCurrency(DAILY_QUOTA_LIMIT, 'XAF')}
            </span>
          </div>
          
          <Progress 
            value={quotaPercentage} 
            className="h-3 w-full"
          />
          
          <div className="flex justify-between items-center text-xs">
            <span className={`${isQuotaReached ? 'text-green-600 font-semibold' : 'text-gray-500'}`}>
              {quotaPercentage.toFixed(1)}% atteint
            </span>
            {isQuotaReached && (
              <span className="text-green-600 font-medium">
                🎉 Quota atteint !
              </span>
            )}
          </div>
          
          {!isQuotaReached && (
            <div className="text-xs text-gray-600">
              Restant: {formatCurrency(DAILY_QUOTA_LIMIT - totalDeposits, 'XAF')}
            </div>
          )}
          
          {isQuotaReached && (
            <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
              ✨ Commission de 1% activée sur tous les dépôts !
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentDailyQuota;