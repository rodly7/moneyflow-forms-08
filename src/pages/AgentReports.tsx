
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, TrendingUp, DollarSign, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";

interface AgentStats {
  totalTransfers: number;
  totalWithdrawals: number;
  totalDeposits: number;
  currentBalance: number;
  amountToAdd: number;
  totalCommissions: number;
  period: string;
}

const AgentReports = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isMobile } = useDeviceDetection();
  
  const [dailyStats, setDailyStats] = useState<AgentStats | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<AgentStats | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<AgentStats | null>(null);
  const [yearlyStats, setYearlyStats] = useState<AgentStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const TARGET_BALANCE = 100000; // 100,000 FCFA cible pour l'agent

  const fetchAgentStats = async (period: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
    if (!user?.id) return null;

    try {
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'daily':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'weekly':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'yearly':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }

      // Récupérer les transferts
      const { data: transfers, error: transfersError } = await supabase
        .from('transfers')
        .select('*')
        .eq('sender_id', user.id)
        .gte('created_at', startDate.toISOString());

      if (transfersError) throw transfersError;

      // Récupérer les retraits
      const { data: withdrawals, error: withdrawalsError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString());

      if (withdrawalsError) throw withdrawalsError;

      // Récupérer les dépôts (recharges)
      const { data: deposits, error: depositsError } = await supabase
        .from('recharges')
        .select('*')
        .eq('provider_transaction_id', user.id)
        .gte('created_at', startDate.toISOString());

      if (depositsError) throw depositsError;

      // Récupérer le solde actuel
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      const currentBalance = profileData.balance || 0;
      const amountToAdd = Math.max(0, TARGET_BALANCE - currentBalance);

      // Calculer les commissions (approximation basée sur 1% des montants)
      const totalTransferAmount = transfers?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const totalWithdrawalAmount = withdrawals?.reduce((sum, w) => sum + Number(w.amount), 0) || 0;
      const totalCommissions = (totalTransferAmount + totalWithdrawalAmount) * 0.01;

      return {
        totalTransfers: transfers?.length || 0,
        totalWithdrawals: withdrawals?.length || 0,
        totalDeposits: deposits?.length || 0,
        currentBalance,
        amountToAdd,
        totalCommissions,
        period
      };
    } catch (error) {
      console.error(`Erreur lors du calcul des stats ${period}:`, error);
      return null;
    }
  };

  const loadAllStats = async () => {
    setIsLoading(true);
    try {
      const [daily, weekly, monthly, yearly] = await Promise.all([
        fetchAgentStats('daily'),
        fetchAgentStats('weekly'),
        fetchAgentStats('monthly'),
        fetchAgentStats('yearly')
      ]);

      setDailyStats(daily);
      setWeeklyStats(weekly);
      setMonthlyStats(monthly);
      setYearlyStats(yearly);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (user?.id) {
      loadAllStats();
    }
  }, [user?.id]);

  if (!profile || profile.role !== 'agent') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-red-600 mb-4">Accès refusé</h2>
              <p className="text-gray-600 mb-4">Cette page est réservée aux agents.</p>
              <Button onClick={() => navigate('/dashboard')} className="w-full">
                Retour au tableau de bord
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const StatsCard = ({ stats, title, icon }: { stats: AgentStats | null, title: string, icon: React.ReactNode }) => {
    if (!stats) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          {icon}
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalTransfers}</div>
                <p className="text-blue-600 text-sm">Transferts effectués</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.totalWithdrawals}</div>
                <p className="text-green-600 text-sm">Retraits effectués</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.totalDeposits}</div>
                <p className="text-purple-600 text-sm">Dépôts effectués</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.totalCommissions.toLocaleString('fr-FR')} XAF
                </div>
                <p className="text-yellow-600 text-sm">Commissions gagnées</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h4 className="text-lg font-semibold">Résumé financier</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold">{stats.currentBalance.toLocaleString('fr-FR')} XAF</div>
                  <p className="text-indigo-100">Solde actuel</p>
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.amountToAdd.toLocaleString('fr-FR')} XAF</div>
                  <p className="text-indigo-100">À ajouter pour 100k</p>
                </div>
              </div>
              {stats.amountToAdd > 0 && (
                <div className="bg-white/20 rounded-lg p-3 mt-4">
                  <p className="text-sm">
                    💡 Ajoutez {stats.amountToAdd.toLocaleString('fr-FR')} XAF pour atteindre l'objectif de 100,000 XAF
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50/50 to-indigo-100/50 py-4 px-4">
      <div className="container max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate('/agent-services')} className="text-gray-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold text-blue-700">Rapports d'Activité</h1>
          <Button 
            variant="outline" 
            onClick={loadAllStats}
            disabled={isLoading}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {isLoading ? "Chargement..." : "Actualiser"}
          </Button>
        </div>

        <Tabs defaultValue="daily" className="w-full">
          <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
            <TabsTrigger value="daily" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {isMobile ? "Jour" : "Quotidien"}
            </TabsTrigger>
            <TabsTrigger value="weekly" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              {isMobile ? "Semaine" : "Hebdomadaire"}
            </TabsTrigger>
            <TabsTrigger value="monthly" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              {isMobile ? "Mois" : "Mensuel"}
            </TabsTrigger>
            <TabsTrigger value="yearly" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              {isMobile ? "Année" : "Annuel"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="daily">
            <StatsCard 
              stats={dailyStats} 
              title="Rapport Quotidien" 
              icon={<Calendar className="w-5 h-5 text-blue-600" />}
            />
          </TabsContent>

          <TabsContent value="weekly">
            <StatsCard 
              stats={weeklyStats} 
              title="Rapport Hebdomadaire" 
              icon={<TrendingUp className="w-5 h-5 text-green-600" />}
            />
          </TabsContent>

          <TabsContent value="monthly">
            <StatsCard 
              stats={monthlyStats} 
              title="Rapport Mensuel" 
              icon={<DollarSign className="w-5 h-5 text-purple-600" />}
            />
          </TabsContent>

          <TabsContent value="yearly">
            <StatsCard 
              stats={yearlyStats} 
              title="Rapport Annuel" 
              icon={<Activity className="w-5 h-5 text-orange-600" />}
            />
          </TabsContent>
        </Tabs>

        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Chargement des statistiques...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentReports;
