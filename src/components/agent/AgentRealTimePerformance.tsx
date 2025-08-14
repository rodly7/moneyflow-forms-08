
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Activity, Users, RefreshCw, ChevronRight } from "lucide-react";
import { createClient } from '@supabase/supabase-js';
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const SUPABASE_URL = "https://msasycggbiwyxlczknwj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zYXN5Y2dnYml3eXhsY3prbndqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzczNjU5MTMsImV4cCI6MjA1Mjk0MTkxM30.Ezb5GjSg8ApUWR5iNMvVS9bSA7oxudUuYOP2g2ugB_4";

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

interface PerformanceData {
  todayTransactions: number;
  todayVolume: number;
  todayCommissions: number;
  weeklyTransactions: number;
  weeklyVolume: number;
  weeklyCommissions: number;
  monthlyTransactions: number;
  monthlyVolume: number;
  monthlyCommissions: number;
}

const formatCurrency = (amount: number, currency: string = 'XAF'): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const AgentRealTimePerformance = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [performance, setPerformance] = useState<PerformanceData>({
    todayTransactions: 0,
    todayVolume: 0,
    todayCommissions: 0,
    weeklyTransactions: 0,
    weeklyVolume: 0,
    weeklyCommissions: 0,
    monthlyTransactions: 0,
    monthlyVolume: 0,
    monthlyCommissions: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchPerformance = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Récupérer les transactions aujourd'hui
      const { data: todayData } = await supabaseClient
        .from('recharges')
        .select('amount')
        .eq('provider_transaction_id', user.id)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`);

      // Récupérer les retraits aujourd'hui - utiliser user_id au lieu de processed_by
      const { data: withdrawalsData } = await supabaseClient
        .from('withdrawals')
        .select('amount')
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`);

      // Calculs pour aujourd'hui
      const todayDeposits = todayData || [];
      const todayWithdrawals = withdrawalsData || [];
      const todayTransactions = todayDeposits.length + todayWithdrawals.length;
      const todayVolume = [...todayDeposits, ...todayWithdrawals].reduce((sum, t) => sum + Number(t.amount), 0);
      const todayCommissions = todayDeposits.reduce((sum, t) => sum + (Number(t.amount) * 0.01), 0) + 
                              todayWithdrawals.reduce((sum, t) => sum + (Number(t.amount) * 0.005), 0);

      setPerformance({
        todayTransactions,
        todayVolume,
        todayCommissions,
        weeklyTransactions: todayTransactions,
        weeklyVolume: todayVolume,
        weeklyCommissions: todayCommissions,
        monthlyTransactions: todayTransactions,
        monthlyVolume: todayVolume,
        monthlyCommissions: todayCommissions
      });
    } catch (error) {
      console.error('Erreur récupération performances:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
    const interval = setInterval(fetchPerformance, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Performances Temps Réel
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              onClick={fetchPerformance}
              variant="ghost"
              size="sm"
              disabled={isLoading}
              className="h-8 w-8 p-0 hover:bg-blue-100"
            >
              <RefreshCw className={`w-4 h-4 text-blue-600 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              onClick={() => navigate('/agent-performance-dashboard')}
              variant="ghost"
              size="sm"
              className="h-8 px-3 hover:bg-blue-100 text-blue-600"
            >
              <span className="text-sm mr-1">Détails</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Aujourd'hui */}
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-blue-100">
            <div className="text-center">
              <h3 className="text-sm font-medium text-blue-700 mb-2">Aujourd'hui</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Transactions
                  </span>
                  <span className="font-bold">{performance.todayTransactions}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Volume
                  </span>
                  <span className="font-bold">{formatCurrency(performance.todayVolume)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Commissions
                  </span>
                  <span className="font-bold text-green-600">{formatCurrency(performance.todayCommissions)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cette semaine */}
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-green-100">
            <div className="text-center">
              <h3 className="text-sm font-medium text-green-700 mb-2">Cette semaine</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Transactions
                  </span>
                  <span className="font-bold">{performance.weeklyTransactions}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Volume
                  </span>
                  <span className="font-bold">{formatCurrency(performance.weeklyVolume)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Commissions
                  </span>
                  <span className="font-bold text-green-600">{formatCurrency(performance.weeklyCommissions)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ce mois */}
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-purple-100">
            <div className="text-center">
              <h3 className="text-sm font-medium text-purple-700 mb-2">Ce mois</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Transactions
                  </span>
                  <span className="font-bold">{performance.monthlyTransactions}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Volume
                  </span>
                  <span className="font-bold">{formatCurrency(performance.monthlyVolume)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Commissions
                  </span>
                  <span className="font-bold text-green-600">{formatCurrency(performance.monthlyCommissions)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-blue-600">
            🔄 Mise à jour automatique toutes les 30 secondes
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
