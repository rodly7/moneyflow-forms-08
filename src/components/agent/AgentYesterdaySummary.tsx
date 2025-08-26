
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, TrendingUp, ArrowUpRight, ArrowDownLeft, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/integrations/supabase/client";

interface YesterdayStats {
  withdrawals: number;
  deposits: number;
  totalOperations: number;
  totalCommissions: number;
  withdrawalAmount: number;
  depositAmount: number;
}

const AgentYesterdaySummary = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<YesterdayStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchYesterdayStats = async () => {
    if (!user?.id) return;

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const today = new Date(yesterday);
      today.setDate(today.getDate() + 1);

      // Récupérer les retraits d'hier
      const { data: withdrawals } = await supabase
        .from('withdrawals')
        .select('amount')
        .eq('user_id', user.id)
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', today.toISOString())
        .eq('status', 'completed');

      // Récupérer les dépôts d'hier
      const { data: deposits } = await supabase
        .from('recharges')
        .select('amount')
        .eq('provider_transaction_id', user.id)
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', today.toISOString())
        .eq('status', 'completed');

      const withdrawalAmount = (withdrawals || []).reduce((sum, w) => sum + Number(w.amount), 0);
      const depositAmount = (deposits || []).reduce((sum, d) => sum + Number(d.amount), 0);

      // Calculer les commissions avec les nouveaux taux
      const withdrawalCommissions = withdrawalAmount * 0.002; // 0,2% sur les retraits
      const depositCommissions = depositAmount * 0.005; // 0,5% sur les dépôts
      const totalCommissions = withdrawalCommissions + depositCommissions;

      setStats({
        withdrawals: withdrawals?.length || 0,
        deposits: deposits?.length || 0,
        totalOperations: (withdrawals?.length || 0) + (deposits?.length || 0),
        totalCommissions,
        withdrawalAmount,
        depositAmount
      });
    } catch (error) {
      console.error('Erreur lors du chargement des stats d\'hier:', error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchYesterdayStats();
  }, [user?.id]);

  if (isLoading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardContent className="p-8 text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Impossible de charger les données d'hier</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Résumé global */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Résumé d'hier ({new Date(Date.now() - 86400000).toLocaleDateString('fr-FR')})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold">{stats.totalOperations}</div>
              <div className="text-blue-100">Opérations totales</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{formatCurrency(stats.totalCommissions, 'XAF')}</div>
              <div className="text-blue-100">Commissions totales</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">
                {formatCurrency(stats.withdrawalAmount + stats.depositAmount, 'XAF')}
              </div>
              <div className="text-blue-100">Volume total</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">0,2% / 0,5%</div>
              <div className="text-blue-100">Taux commissions</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Détails par type d'opération */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-700">
              <ArrowDownLeft className="w-5 h-5" />
              Retraits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-red-600">Nombre:</span>
                <span className="font-bold text-red-800">{stats.withdrawals}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-600">Montant:</span>
                <span className="font-bold text-red-800">
                  {formatCurrency(stats.withdrawalAmount, 'XAF')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-600">Commission (0,2%):</span>
                <span className="font-bold text-red-800">
                  {formatCurrency(stats.withdrawalAmount * 0.002, 'XAF')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Plus className="w-5 h-5" />
              Dépôts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-green-600">Nombre:</span>
                <span className="font-bold text-green-800">{stats.deposits}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-600">Montant:</span>
                <span className="font-bold text-green-800">
                  {formatCurrency(stats.depositAmount, 'XAF')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-600">Commission (0,5%):</span>
                <span className="font-bold text-green-800">
                  {formatCurrency(stats.depositAmount * 0.005, 'XAF')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparaison avec aujourd'hui */}
      <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-orange-800 mb-4">Conseil du jour</h3>
          <div className="space-y-2 text-sm text-orange-700">
            {stats.totalOperations >= 20 && (
              <p>✅ Excellente performance hier avec {stats.totalOperations} opérations !</p>
            )}
            {stats.totalOperations < 10 && (
              <p>📈 Vous pouvez augmenter votre activité pour gagner plus de commissions</p>
            )}
            {stats.totalCommissions > 5000 && (
              <p>💰 Superbes commissions hier : {formatCurrency(stats.totalCommissions, 'XAF')} !</p>
            )}
            <p>🎯 Objectif du jour : dépasser les {stats.totalOperations} opérations d'hier</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentYesterdaySummary;
