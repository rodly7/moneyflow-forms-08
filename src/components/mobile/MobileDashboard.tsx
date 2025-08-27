import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowUpRight, 
  ArrowDownLeft,
  Plus,
  Send,
  Wallet,
  Eye,
  EyeOff,
  Bell,
  Settings,
  History,
  CreditCard,
  PiggyBank,
  Receipt,
  TrendingUp,
  Users,
  Target
} from "lucide-react";
import { formatCurrency, getCurrencyForCountry, convertCurrency } from "@/lib/utils/currency";
import { useNavigate } from "react-router-dom";

interface MobileDashboardProps {
  // Define any props here
}

const MobileDashboard: React.FC<MobileDashboardProps> = ({ /* props */ }) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isBalanceVisible, setIsBalanceVisible] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [agentCountry, setAgentCountry] = useState("Cameroun"); // Default country

  const { data: transfers, isLoading: transfersLoading } = useQuery({
    queryKey: ['mobile-transfers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('transfers')
        .select('amount, fees, created_at')
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const toggleBalanceVisibility = () => {
    setIsBalanceVisible(!isBalanceVisible);
  };

  const fetchUserBalance = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('balance, country')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserBalance(data.balance || 0);
      setAgentCountry(data.country || "Cameroun");
    } catch (error) {
      console.error('Erreur lors du chargement du solde:', error);
    }
  };

  useEffect(() => {
    fetchUserBalance();
  }, [user]);

  const agentCurrency = getCurrencyForCountry(agentCountry);
  const convertedBalance = convertCurrency(userBalance, "XAF", agentCurrency);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {profile?.full_name || 'Utilisateur'}
                </h1>
                <p className="text-sm text-gray-500">SendFlow</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Bell className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Balance Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Solde Disponible
            </CardTitle>
            <Button
              onClick={toggleBalanceVisibility}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              {isBalanceVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {isBalanceVisible ? formatCurrency(convertedBalance, agentCurrency) : "••••••••"}
            </div>
            <p className="text-xs text-gray-500">
              {isBalanceVisible && agentCurrency !== "XAF" && `(XAF ${formatCurrency(userBalance, "XAF")})`}
            </p>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Actions Rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-20 flex-col gap-2 hover:bg-blue-50 border-blue-200"
                onClick={() => navigate('/withdrawal')}
              >
                <ArrowUpRight className="w-6 h-6 text-blue-600" />
                <span className="text-sm">Retrait</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex-col gap-2 hover:bg-green-50 border-green-200"
                onClick={() => navigate('/deposit')}
              >
                <ArrowDownLeft className="w-6 h-6 text-green-600" />
                <span className="text-sm">Dépôt</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex-col gap-2 hover:bg-purple-50 border-purple-200"
                onClick={() => navigate('/transfer')}
              >
                <Send className="w-6 h-6 text-purple-600" />
                <span className="text-sm">Transfert</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex-col gap-2 hover:bg-orange-50 border-orange-200"
                onClick={() => navigate('/savings')}
              >
                <PiggyBank className="w-6 h-6 text-orange-600" />
                <span className="text-sm">Épargne</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold">
                Transactions Récentes
              </CardTitle>
              <Button variant="link" size="sm" onClick={() => navigate('/history')}>
                <History className="w-4 h-4 mr-1" />
                Voir Tout
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {transfersLoading ? (
              <div className="p-4 text-center">Chargement...</div>
            ) : transfers && transfers.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {transfers.map((transfer, index) => (
                  <div key={index} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium">Transfert</div>
                      <div className="text-xs text-gray-500">
                        {new Date(transfer.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="font-semibold">
                      -{formatCurrency(transfer.amount, 'XAF')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center">Aucune transaction récente</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MobileDashboard;
