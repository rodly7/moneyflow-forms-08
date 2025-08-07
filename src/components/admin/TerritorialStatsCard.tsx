import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, TrendingUp, Users, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSubAdmin } from "@/hooks/useSubAdmin";

interface TerritorialStats {
  totalUsers: number;
  totalAgents: number;
  totalTransfers: number;
  totalDeposits: number;
  totalWithdrawals: number;
  monthlyVolume: number;
}

export const TerritorialStatsCard = () => {
  const { userCountry } = useSubAdmin();
  const { toast } = useToast();
  const [stats, setStats] = useState<TerritorialStats>({
    totalUsers: 0,
    totalAgents: 0,
    totalTransfers: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    monthlyVolume: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchTerritorialStats = async () => {
    if (!userCountry) return;
    
    setIsLoading(true);
    try {
      // Utilisateurs du territoire
      const { data: users } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('country', userCountry);

      // Transferts du mois actuel depuis le territoire
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: transfers } = await supabase
        .from('transfers')
        .select('amount, sender_id')
        .gte('created_at', startOfMonth.toISOString());

      // Dépôts du mois actuel dans le territoire
      const { data: deposits } = await supabase
        .from('recharges')
        .select('amount')
        .gte('created_at', startOfMonth.toISOString());

      // Retraits du mois actuel dans le territoire
      const { data: withdrawals } = await supabase
        .from('withdrawals')
        .select('amount')
        .gte('created_at', startOfMonth.toISOString());

      const totalUsers = users?.filter(u => u.role === 'user').length || 0;
      const totalAgents = users?.filter(u => u.role === 'agent').length || 0;
      const totalTransfers = transfers?.length || 0;
      const totalDeposits = deposits?.length || 0;
      const totalWithdrawals = withdrawals?.length || 0;
      
      const monthlyVolume = [
        ...(transfers || []).map(t => t.amount),
        ...(deposits || []).map(d => d.amount),
        ...(withdrawals || []).map(w => w.amount)
      ].reduce((sum, amount) => sum + (amount || 0), 0);

      setStats({
        totalUsers,
        totalAgents,
        totalTransfers,
        totalDeposits,
        totalWithdrawals,
        monthlyVolume
      });
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques territoriales:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques du territoire",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTerritorialStats();
  }, [userCountry]);

  if (!userCountry) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">Aucun territoire assigné</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Utilisateurs - {userCountry}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-900">
            {isLoading ? "..." : stats.totalUsers.toLocaleString()}
          </div>
          <p className="text-xs text-blue-600">Utilisateurs actifs</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-emerald-50 to-teal-100 border-emerald-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-emerald-700 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Agents du Territoire
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-900">
            {isLoading ? "..." : stats.totalAgents.toLocaleString()}
          </div>
          <p className="text-xs text-emerald-600">Agents en activité</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-pink-100 border-purple-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Activité Mensuelle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-900">
            {isLoading ? "..." : (stats.totalTransfers + stats.totalDeposits + stats.totalWithdrawals).toLocaleString()}
          </div>
          <p className="text-xs text-purple-600">Transactions ce mois</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-amber-50 to-orange-100 border-amber-200 md:col-span-2 lg:col-span-3">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-amber-700 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Volume d'Affaires Mensuel - {userCountry}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-amber-900">
            {isLoading ? "..." : `${stats.monthlyVolume.toLocaleString()} XAF`}
          </div>
          <div className="mt-2 flex gap-4 text-xs text-amber-600">
            <span>Transferts: {stats.totalTransfers}</span>
            <span>Dépôts: {stats.totalDeposits}</span>
            <span>Retraits: {stats.totalWithdrawals}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};