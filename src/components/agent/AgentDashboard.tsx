import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreVertical, Edit, Plus, Activity, ArrowUpRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/integrations/supabase/client";
import { supabase } from "@/integrations/supabase/client";
import AgentDailyHistory from "./AgentDailyHistory";
import AgentTransactionHistory from './AgentTransactionHistory';

const AgentDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [balance, setBalance] = useState<number>(0);
  const [commissionBalance, setCommissionBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCommissionLoading, setIsCommissionLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      if (user?.id) {
        setIsLoading(true);
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('balance')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error("Erreur lors de la récupération du solde:", error);
            toast({
              title: "Erreur",
              description: "Impossible de récupérer le solde actuel.",
              variant: "destructive",
            });
          } else {
            setBalance(profile?.balance || 0);
          }
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchBalance();
  }, [user?.id, toast]);

  useEffect(() => {
    const fetchCommissionBalance = async () => {
      if (user?.id) {
        setIsCommissionLoading(true);
        try {
          const { data: agent, error } = await supabase
            .from('agents')
            .select('commission_balance')
            .eq('user_id', user.id)
            .single();

          if (error) {
            console.error("Erreur lors de la récupération du solde de commission:", error);
            toast({
              title: "Erreur",
              description: "Impossible de récupérer le solde de commission.",
              variant: "destructive",
            });
          } else {
            setCommissionBalance(agent?.commission_balance || 0);
          }
        } finally {
          setIsCommissionLoading(false);
        }
      }
    };

    fetchCommissionBalance();
  }, [user?.id, toast]);

  const handleWithdrawCommission = () => {
    navigate('/agent/withdraw-commission');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Bonjour, {user?.user_metadata?.full_name || "Agent"} !
            </h1>
            <p className="text-gray-500">Bienvenue sur votre tableau de bord.</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Ouvrir le menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Modifier le profil</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Solde Principal</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="animate-pulse h-8 bg-gray-200 rounded-md w-3/4"></div>
              ) : (
                <div className="text-2xl font-bold text-blue-600">{formatCurrency(balance, 'XAF')}</div>
              )}
              <p className="text-sm text-gray-500">Solde disponible pour les transactions.</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Solde de Commission</CardTitle>
            </CardHeader>
            <CardContent>
              {isCommissionLoading ? (
                <div className="animate-pulse h-8 bg-gray-200 rounded-md w-3/4"></div>
              ) : (
                <div className="text-2xl font-bold text-green-600">{formatCurrency(commissionBalance, 'XAF')}</div>
              )}
              <p className="text-sm text-gray-500">Commissions accumulées.</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Clients Enregistrés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">245</div>
              <p className="text-sm text-gray-500">Nombre total de clients enregistrés.</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Actions Rapides</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Button className="w-full" onClick={() => navigate('/transfer')}>
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Effectuer un Transfert
              </Button>
              <Button className="w-full" onClick={() => navigate('/deposit')}>
                <Plus className="mr-2 h-4 w-4" />
                Effectuer un Dépôt
              </Button>
            </CardContent>
          </Card>

          {/* Commission Withdrawal */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Retrait de Commission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Retirez vos commissions vers votre solde principal.
              </p>
              <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600" onClick={handleWithdrawCommission}>
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Retirer la Commission
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History - Full Width */}
        <div className="w-full">
          <AgentTransactionHistory />
        </div>

        {/* Recent Activity */}
        <AgentDailyHistory />
      </div>
    </div>
  );
};

export default AgentDashboard;
