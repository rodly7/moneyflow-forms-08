
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Users, TrendingUp, AlertTriangle, DollarSign, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import TrustedAgentsTable from "@/components/treasury/TrustedAgentsTable";
import BalanceFlowTable from "@/components/treasury/BalanceFlowTable";
import TreasuryDashboard from "@/components/treasury/TreasuryDashboard";

interface TreasuryStats {
  totalAgentBalance: number;
  totalUserBalance: number;
  balanceDifference: number;
  trustedAgentsCount: number;
  pendingTransactions: number;
}

const AdminTreasury = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState<TreasuryStats>({
    totalAgentBalance: 0,
    totalUserBalance: 0,
    balanceDifference: 0,
    trustedAgentsCount: 0,
    pendingTransactions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchTreasuryStats();
  }, [profile, navigate]);

  const fetchTreasuryStats = async () => {
    try {
      setLoading(true);
      
      // Get all profiles with balances
      const { data: profiles } = await supabase
        .from('profiles')
        .select('role, balance');

      // Get trusted agents count (active agents)
      const { data: trustedAgents } = await supabase
        .from('agents')
        .select('id')
        .eq('status', 'active');

      // Get pending transactions
      const { data: pendingTransfers } = await supabase
        .from('transfers')
        .select('id')
        .eq('status', 'pending');

      if (profiles) {
        const agents = profiles.filter(p => p.role === 'agent');
        const users = profiles.filter(p => p.role === 'user');
        
        const totalAgentBalance = agents.reduce((sum, agent) => sum + (agent.balance || 0), 0);
        const totalUserBalance = users.reduce((sum, user) => sum + (user.balance || 0), 0);
        
        setStats({
          totalAgentBalance,
          totalUserBalance,
          balanceDifference: totalAgentBalance - totalUserBalance,
          trustedAgentsCount: trustedAgents?.length || 0,
          pendingTransactions: pendingTransfers?.length || 0
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques de trésorerie:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques de trésorerie",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!profile || profile.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4">
      <div className="w-full max-w-none">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 w-full">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/main-admin')}
              className="hover:bg-white/50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour Admin
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Système de Trésorerie
            </h1>
          </div>
          <Button 
            onClick={fetchTreasuryStats}
            disabled={loading}
            variant="outline"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Solde Agents</p>
                  <p className="text-2xl font-bold">{(stats.totalAgentBalance / 1000).toFixed(0)}K</p>
                </div>
                <Users className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Solde Utilisateurs</p>
                  <p className="text-2xl font-bold">{(stats.totalUserBalance / 1000).toFixed(0)}K</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className={`${stats.balanceDifference >= 0 
            ? 'bg-gradient-to-r from-orange-600 to-red-600' 
            : 'bg-gradient-to-r from-purple-600 to-pink-600'} text-white`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Différence</p>
                  <p className="text-xl font-bold">{(stats.balanceDifference / 1000).toFixed(0)}K</p>
                </div>
                <BarChart3 className="w-8 h-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Agents Fiables</p>
                  <p className="text-2xl font-bold">{stats.trustedAgentsCount}</p>
                </div>
                <Users className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm">En Attente</p>
                  <p className="text-2xl font-bold">{stats.pendingTransactions}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-yellow-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm shadow-lg rounded-xl h-14">
            <TabsTrigger value="dashboard" className="flex items-center gap-2 h-10">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Tableau de Bord</span>
            </TabsTrigger>
            <TabsTrigger value="agents" className="flex items-center gap-2 h-10">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Agents Fiables</span>
            </TabsTrigger>
            <TabsTrigger value="flows" className="flex items-center gap-2 h-10">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Flux d'Équilibrage</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6 w-full">
            <TreasuryDashboard onRefresh={fetchTreasuryStats} />
          </TabsContent>

          <TabsContent value="agents" className="space-y-6 w-full">
            <TrustedAgentsTable onUpdate={fetchTreasuryStats} />
          </TabsContent>

          <TabsContent value="flows" className="space-y-6 w-full">
            <BalanceFlowTable onUpdate={fetchTreasuryStats} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminTreasury;
