
import React, { memo, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Activity,
  Download,
  Upload,
  QrCode,
  Search,
  Bell,
  Settings,
  RefreshCw,
  MapPin
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/integrations/supabase/client";
import AgentBalanceCard from "./AgentBalanceCard";
import AgentCommissions from "./AgentCommissions";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const AgentDashboard = memo(() => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Récupérer les stats de l'agent
  const { data: agentStats } = useQuery({
    queryKey: ['agentStats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      try {
        // Récupérer les transactions de l'agent aujourd'hui
        const today = new Date().toISOString().split('T')[0];
        
        const { data: withdrawals } = await supabase
          .from('withdrawals')
          .select('amount, created_at')
          .eq('agent_id', user.id)
          .gte('created_at', `${today}T00:00:00`)
          .lt('created_at', `${today}T23:59:59`);

        const { data: recharges } = await supabase
          .from('recharges')
          .select('amount, created_at')
          .eq('user_id', user.id)
          .gte('created_at', `${today}T00:00:00`)
          .lt('created_at', `${today}T23:59:59`);

        const todayWithdrawals = withdrawals?.length || 0;
        const todayRecharges = recharges?.length || 0;
        const todayVolume = (withdrawals?.reduce((sum, w) => sum + (w.amount || 0), 0) || 0) +
                           (recharges?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0);

        return {
          todayTransactions: todayWithdrawals + todayRecharges,
          todayVolume,
          todayWithdrawals,
          todayRecharges
        };
      } catch (error) {
        console.error('Erreur récupération stats agent:', error);
        return null;
      }
    },
    enabled: !!user,
    refetchInterval: 30000 // Refresh toutes les 30 secondes
  });

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // Simuler un refresh
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  }, []);

  const userInfo = {
    name: profile?.full_name || 'Agent',
    avatar: profile?.avatar_url,
    initials: profile?.full_name?.[0]?.toUpperCase() || 'A',
    phone: profile?.phone || ''
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-[30px]">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-[30px] z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={userInfo.avatar} />
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {userInfo.initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {userInfo.name}
                </h1>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    Agent SendFlow
                  </Badge>
                  <MapPin className="w-3 h-3 text-gray-400" />
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/notifications')}
              >
                <Bell className="w-4 h-4" />
              </Button>
              <Button
                onClick={handleRefresh}
                variant="ghost"
                size="sm"
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/agent-settings')}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="px-4 py-6 space-y-6 pb-20">
        {/* Balance Card */}
        <AgentBalanceCard />

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Transactions</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {agentStats?.todayTransactions || 0}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-xs text-gray-500 mt-1">Aujourd'hui</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Volume</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(agentStats?.todayVolume || 0, 'XAF', false)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-xs text-gray-500 mt-1">Aujourd'hui</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Retraits</p>
                  <p className="text-2xl font-bold text-red-600">
                    {agentStats?.todayWithdrawals || 0}
                  </p>
                </div>
                <Download className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-xs text-gray-500 mt-1">Aujourd'hui</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Dépôts</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {agentStats?.todayRecharges || 0}
                  </p>
                </div>
                <Upload className="w-8 h-8 text-purple-500" />
              </div>
              <p className="text-xs text-gray-500 mt-1">Aujourd'hui</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions Rapides */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Actions Rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-16 flex-col gap-2 hover:bg-blue-50 border-blue-200"
                onClick={() => navigate('/agent-withdrawal')}
              >
                <Download className="w-5 h-5 text-blue-600" />
                <span className="text-sm">Retrait Client</span>
              </Button>

              <Button
                variant="outline"
                className="h-16 flex-col gap-2 hover:bg-green-50 border-green-200"
                onClick={() => navigate('/agent-deposit')}
              >
                <Upload className="w-5 h-5 text-green-600" />
                <span className="text-sm">Dépôt Client</span>
              </Button>

              <Button
                variant="outline"
                className="h-16 flex-col gap-2 hover:bg-purple-50 border-purple-200"
                onClick={() => navigate('/qr-payment')}
              >
                <QrCode className="w-5 h-5 text-purple-600" />
                <span className="text-sm">Scanner QR</span>
              </Button>

              <Button
                variant="outline"
                className="h-16 flex-col gap-2 hover:bg-yellow-50 border-yellow-200"
                onClick={() => navigate('/agent-services')}
              >
                <Search className="w-5 h-5 text-yellow-600" />
                <span className="text-sm">Rechercher Client</span>
              </Button>

              <Button
                variant="outline"
                className="h-16 flex-col gap-2 hover:bg-indigo-50 border-indigo-200"
                onClick={() => navigate('/commission')}
              >
                <DollarSign className="w-5 h-5 text-indigo-600" />
                <span className="text-sm">Commissions</span>
              </Button>

              <Button
                variant="outline"
                className="h-16 flex-col gap-2 hover:bg-pink-50 border-pink-200"
                onClick={() => navigate('/agent-reports')}
              >
                <Activity className="w-5 h-5 text-pink-600" />
                <span className="text-sm">Rapports</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Commissions Card */}
        <AgentCommissions />
      </div>
    </div>
  );
});

AgentDashboard.displayName = 'AgentDashboard';

export default AgentDashboard;
