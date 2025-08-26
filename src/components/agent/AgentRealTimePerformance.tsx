
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/utils/currency';
import { TrendingUp, Target, Award, Clock } from 'lucide-react';
import { useAgentEarnings } from '@/hooks/useAgentEarnings';

interface PerformanceMetric {
  label: string;
  current: number;
  target: number;
  unit: string;
  icon: React.ReactNode;
  color: string;
}

export const AgentRealTimePerformance: React.FC = () => {
  const { user } = useAuth();
  const { earnings } = useAgentEarnings();
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);

  useEffect(() => {
    // Set up real-time performance metrics
    const performanceMetrics: PerformanceMetric[] = [
      {
        label: 'Gains du jour',
        current: earnings.todayEarnings || 0,
        target: 10000,
        unit: 'XAF',
        icon: <TrendingUp className="w-4 h-4" />,
        color: 'bg-green-500'
      },
      {
        label: 'Transactions du jour',
        current: 12,
        target: 50,
        unit: 'trans',
        icon: <Target className="w-4 h-4" />,
        color: 'bg-blue-500'
      },
      {
        label: 'Objectif mensuel',
        current: earnings.thisMonthEarnings || 0,
        target: 100000,
        unit: 'XAF',
        icon: <Award className="w-4 h-4" />,
        color: 'bg-purple-500'
      }
    ];

    setMetrics(performanceMetrics);
  }, [earnings]);

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getPerformanceStatus = (percentage: number) => {
    if (percentage >= 100) return { label: 'Objectif atteint', color: 'bg-green-100 text-green-800' };
    if (percentage >= 75) return { label: 'Excellent', color: 'bg-blue-100 text-blue-800' };
    if (percentage >= 50) return { label: 'Bon', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'À améliorer', color: 'bg-red-100 text-red-800' };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Performance en Temps Réel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {metrics.map((metric, index) => {
          const progress = getProgressPercentage(metric.current, metric.target);
          const status = getPerformanceStatus(progress);
          
          return (
            <div key={index} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-full ${metric.color} text-white`}>
                    {metric.icon}
                  </div>
                  <span className="font-medium text-sm">{metric.label}</span>
                </div>
                <Badge className={status.color}>
                  {status.label}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>
                    {metric.unit === 'XAF' 
                      ? formatCurrency(metric.current) 
                      : `${metric.current} ${metric.unit}`
                    }
                  </span>
                  <span className="text-gray-500">
                    / {metric.unit === 'XAF' 
                      ? formatCurrency(metric.target) 
                      : `${metric.target} ${metric.unit}`
                    }
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="text-right text-xs text-gray-500">
                  {progress.toFixed(1)}%
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default AgentRealTimePerformance;
