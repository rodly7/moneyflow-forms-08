
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Send, 
  Download, 
  CreditCard, 
  Receipt, 
  Eye,
  Settings,
  Bell,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Plus
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import BalancedTransactionsCard from "@/components/dashboard/BalancedTransactionsCard";
import { useRealtimeTransactions } from "@/hooks/useRealtimeTransactions";

const Dashboard = () => {
  const { user, profile, loading } = useAuth();
  const { transactions } = useRealtimeTransactions(user?.id);
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [isBalanceLoading, setIsBalanceLoading] = useState(true);

  useEffect(() => {
    if (profile?.balance !== null && profile?.balance !== undefined) {
      setBalance(profile.balance);
      setIsBalanceLoading(false);
    }
  }, [profile?.balance]);

  const handleViewProfile = () => {
    navigate('/profile');
  };

  const handleViewTransactions = () => {
    navigate('/transactions');
  };

  const handleViewNotifications = () => {
    navigate('/notifications');
  };

  const handleViewSettings = () => {
    navigate('/settings');
  };

  // Calculer les statistiques rapides
  const recentRecharges = transactions.filter(t => t.type === 'recharge').length;
  const recentWithdrawals = transactions.filter(t => t.type === 'withdrawal').length;
  const recentTransfers = transactions.filter(t => t.type.includes('transfer')).length;

  if (loading || isBalanceLoading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* En-tête avec profil utilisateur */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback>
              <User className="w-6 h-6" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">
              Bonjour, {profile?.full_name || profile?.phone || 'Utilisateur'}
            </h1>
            <p className="text-sm text-muted-foreground">
              Bienvenue sur votre dashboard SendFlow
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleViewNotifications}>
            <Bell className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleViewSettings}>
            <Settings className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleViewProfile}>
            <User className="w-4 h-4" />
            Profil
          </Button>
        </div>
      </div>

      {/* Carte de solde principal */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-6 h-6" />
            Solde principal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold mb-2">
            {balance?.toLocaleString() || '0'} XAF
          </div>
          <p className="text-blue-100 text-sm">
            Disponible immédiatement
          </p>
        </CardContent>
      </Card>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4 text-green-600" />
              Recharges récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{recentRecharges}</div>
            <p className="text-xs text-muted-foreground">Opérations crédit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Download className="w-4 h-4 text-red-600" />
              Retraits récents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{recentWithdrawals}</div>
            <p className="text-xs text-muted-foreground">Opérations débit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ArrowUpRight className="w-4 h-4 text-purple-600" />
              Transferts récents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{recentTransfers}</div>
            <p className="text-xs text-muted-foreground">Envois et réceptions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <CreditCard className="w-4 h-4" />
              Total transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
            <p className="text-xs text-muted-foreground">Toutes opérations</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button onClick={() => navigate('/transfer')} className="h-16 flex-col gap-2">
          <Send className="w-5 h-5" />
          Envoyer
        </Button>
        <Button onClick={() => navigate('/withdraw')} variant="outline" className="h-16 flex-col gap-2">
          <Download className="w-5 h-5" />
          Retirer
        </Button>
        <Button onClick={() => navigate('/unified-deposit-withdrawal')} variant="outline" className="h-16 flex-col gap-2">
          <Plus className="w-5 h-5" />
          Recharger
        </Button>
        <Button onClick={() => navigate('/bill-payments')} variant="outline" className="h-16 flex-col gap-2">
          <Receipt className="w-5 h-5" />
          Factures
        </Button>
      </div>

      {/* Transactions équilibrées */}
      <BalancedTransactionsCard />
    </div>
  );
};

export default Dashboard;
