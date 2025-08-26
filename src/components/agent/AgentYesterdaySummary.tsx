
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils/currency';
import { Calendar, TrendingUp } from 'lucide-react';

interface Props {
  totalVolume: number;
  totalTransactions: number;
}

const AgentYesterdaySummary: React.FC<Props> = ({ totalVolume, totalTransactions }) => {
  const { user } = useAuth();
  const [dailyStats, setDailyStats] = useState({
    volume: totalVolume,
    transactions: totalTransactions
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // For now, we'll use the passed props as mock data
    // In the future, this could fetch real data from recharges and withdrawals tables
    setDailyStats({
      volume: totalVolume,
      transactions: totalTransactions
    });
  }, [totalVolume, totalTransactions]);

  // Mock function to simulate fetching yesterday's data
  const fetchYesterdayData = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Get yesterday's date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStart = new Date(yesterday.setHours(0, 0, 0, 0));
      const yesterdayEnd = new Date(yesterday.setHours(23, 59, 59, 999));

      // For now, we'll use mock data since we don't have a transactions table
      // In a real implementation, you would query recharges and withdrawals tables
      setDailyStats({
        volume: totalVolume,
        transactions: totalTransactions
      });
    } catch (error) {
      console.error('Error fetching yesterday data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Résumé d'hier
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm text-blue-600 font-medium">Volume total</p>
                <p className="text-xl font-bold text-blue-800">
                  {formatCurrency(dailyStats.volume)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm text-green-600 font-medium">Transactions</p>
                <p className="text-xl font-bold text-green-800">
                  {dailyStats.transactions}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AgentYesterdaySummary;
