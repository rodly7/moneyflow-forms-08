
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Target, Award, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';

export interface AgentRealTimePerformanceProps {
  userId: string;
}

interface PerformanceData {
  todayVolume: number;
  todayTransactions: number;
  weeklyTarget: number;
  weeklyProgress: number;
  monthlyRank: number;
  totalAgents: number;
  dailyQuota: number;
  quotaProgress: number;
}

const AgentRealTimePerformance: React.FC<AgentRealTimePerformanceProps> = ({ userId }) => {
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    todayVolume: 0,
    todayTransactions: 0,
    weeklyTarget: 500000,
    weeklyProgress: 0,
    monthlyRank: 0,
    totalAgents: 0,
    dailyQuota: 500000,
    quotaProgress: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock data since the database functions don't exist
    const mockData: PerformanceData = {
      todayVolume: 125000,
      todayTransactions: 8,
      weeklyTarget: 500000,
      weeklyProgress: 65,
      monthlyRank: 3,
      totalAgents: 15,
      dailyQuota: 500000,
      quotaProgress: 25
    };

    setTimeout(() => {
      setPerformanceData(mockData);
      setIsLoading(false);
    }, 1000);
  }, [userId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Performance Temps Réel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="w-20 h-4 bg-gray-200 rounded"></div>
                <div className="w-16 h-6 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="w-24 h-4 bg-gray-200 rounded"></div>
                <div className="w-12 h-6 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPerformanceBadge = () => {
    if (performanceData.quotaProgress >= 100) {
      return <Badge className="bg-green-100 text-green-800">Quota Atteint</Badge>;
    } else if (performanceData.quotaProgress >= 75) {
      return <Badge className="bg-yellow-100 text-yellow-800">Proche du Quota</Badge>;
    } else {
      return <Badge variant="outline">En Cours</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Performance Temps Réel
          </div>
          {getPerformanceBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Today's Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">Volume Aujourd'hui</div>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(performanceData.todayVolume)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">Transactions</div>
            <div className="text-2xl font-bold text-green-600">
              {performanceData.todayTransactions}
            </div>
          </div>
        </div>

        {/* Daily Quota Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span className="text-sm font-medium">Quota Journalier</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {performanceData.quotaProgress}%
            </span>
          </div>
          <Progress value={performanceData.quotaProgress} className="h-2" />
          <div className="text-xs text-muted-foreground mt-1">
            {formatCurrency(performanceData.todayVolume)} / {formatCurrency(performanceData.dailyQuota)}
          </div>
        </div>

        {/* Weekly Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Objectif Hebdomadaire</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {performanceData.weeklyProgress}%
            </span>
          </div>
          <Progress value={performanceData.weeklyProgress} className="h-2" />
        </div>

        {/* Monthly Ranking */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-orange-500" />
            <span className="font-medium">Classement Mensuel</span>
          </div>
          <Badge variant="secondary">
            #{performanceData.monthlyRank} / {performanceData.totalAgents}
          </Badge>
        </div>

        {/* Performance Indicators */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-center p-2 bg-green-50 rounded">
            <div className="font-medium text-green-700">Efficacité</div>
            <div className="text-green-600">
              {Math.round((performanceData.todayVolume / performanceData.todayTransactions) || 0)} XAF/trans
            </div>
          </div>
          <div className="text-center p-2 bg-blue-50 rounded">
            <div className="font-medium text-blue-700">Rythme</div>
            <div className="text-blue-600">
              {Math.round(performanceData.quotaProgress / 24)} %/h
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentRealTimePerformance;
