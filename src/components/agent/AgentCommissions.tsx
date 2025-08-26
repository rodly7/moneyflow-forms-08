import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, DollarSign, Calendar, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils/currency";

interface AgentCommissionsProps {
  userId?: string;
}

export const AgentCommissions = ({ userId }: AgentCommissionsProps) => {
  const [totalCommissions, setTotalCommissions] = useState(0);
  const [dailyCommissions, setDailyCommissions] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCommissions = async () => {
      if (!userId) return;

      setIsLoading(true);

      try {
        // Total commissions
        const { data: totalData, error: totalError } = await supabase
          .from('agents')
          .select('commission_balance')
          .eq('user_id', userId)
          .single();

        if (totalError) {
          console.error("Erreur total commissions:", totalError);
        } else {
          setTotalCommissions(totalData?.commission_balance || 0);
        }

        // Daily commissions
        const { data: dailyData, error: dailyError } = await supabase
          .from('agent_commissions')
          .select('commission_amount')
          .eq('agent_id', userId)
          .eq('date', selectedDate);

        if (dailyError) {
          console.error("Erreur daily commissions:", dailyError);
        } else {
          const dailySum = dailyData?.reduce((sum, item) => sum + item.commission_amount, 0) || 0;
          setDailyCommissions(dailySum);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des commissions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCommissions();
  }, [userId, selectedDate]);

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Mes Commissions
        </CardTitle>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {formatCurrency(dailyCommissions, 'XAF')}
            </Badge>
          </div>
          <Button
            onClick={() => { }}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Commissions du jour</span>
            </div>
            <div className="text-2xl font-bold text-blue-800">
              {isLoading ? (
                <div className="animate-pulse bg-blue-200 h-8 w-32 rounded"></div>
              ) : (
                formatCurrency(dailyCommissions, 'XAF')
              )}
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">Commissions totales</span>
            </div>
            <div className="text-2xl font-bold text-green-800">
              {isLoading ? (
                <div className="animate-pulse bg-green-200 h-8 w-32 rounded"></div>
              ) : (
                formatCurrency(totalCommissions, 'XAF')
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
