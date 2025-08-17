
import React, { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Send, 
  ArrowDownLeft, 
  QrCode, 
  CreditCard,
  Eye,
  EyeOff,
  Settings,
  RefreshCw,
  Plus,
  ArrowRightLeft,
  Download
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/integrations/supabase/client";
import { UnifiedNotificationBell } from "@/components/notifications/UnifiedNotificationBell";
import { UserBalanceRechargeButton } from "@/components/user/UserBalanceRechargeButton";
import { useAutoBalanceRefresh } from "@/hooks/useAutoBalanceRefresh";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const MobileDashboard: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [isBalanceVisible, setIsBalanceVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-refresh balance every 5 seconds
  useAutoBalanceRefresh({
    intervalMs: 5000,
    onBalanceChange: useCallback((newBalance: number) => {
      console.log('💰 Balance updated:', newBalance);
    }, [])
  });

  // Récupérer les transactions récentes
  const { data: recentTransactions = [] } = useQuery({
    queryKey: ['recentTransactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const transactions: any[] = [];

      try {
        // Récupérer les dernières transactions (transferts envoyés et reçus)
        const { data: sentTransfers } = await supabase
          .from('transfers')
          .select('*')
          .eq('sender_id', user.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(3);

        const { data: receivedTransfers } = await supabase
          .from('transfers')
          .select('*')
          .eq('recipient_id', user.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(3);

        // Récupérer les derniers retraits
        const { data: withdrawals } = await supabase
          .from('withdrawals')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(2);

        // Ajouter les transferts envoyés
        if (sentTransfers) {
          sentTransfers.forEach(transfer => {
            transactions.push({
              id: transfer.id,
              type: 'transfer_sent',
              amount: -Math.abs(transfer.amount),
              date: new Date(transfer.created_at),
              description: `Vers ${transfer.recipient_full_name || transfer.recipient_phone}`,
              status: transfer.status
            });
          });
        }

        // Ajouter les transferts reçus
        if (receivedTransfers) {
          for (const transfer of receivedTransfers) {
            let senderName = 'Expéditeur';
            try {
              const { data: senderProfile } = await supabase
                .from('profiles')
                .select('full_name, phone')
                .eq('id', transfer.sender_id)
                .single();
              
              if (senderProfile) {
                senderName = senderProfile.full_name || senderProfile.phone || 'Expéditeur';
              }
            } catch (error) {
              console.error('Erreur récupération expéditeur:', error);
            }
            
            transactions.push({
              id: transfer.id,
              type: 'transfer_received',
              amount: Math.abs(transfer.amount),
              date: new Date(transfer.created_at),
              description: `De ${senderName}`,
              status: transfer.status
            });
          }
        }

        // Ajouter les retraits
        if (withdrawals) {
          withdrawals.forEach(withdrawal => {
            transactions.push({
              id: withdrawal.id,
              type: 'withdrawal',
              amount: -Math.abs(withdrawal.amount),
              date: new Date(withdrawal.created_at),
              description: `Retrait ${withdrawal.withdrawal_phone || 'Mobile'}`,
              status: withdrawal.status
            });
          });
        }

        // Trier par date décroissante et prendre les 5 plus récentes
        return transactions
          .sort((a, b) => b.date.getTime() - a.date.getTime())
          .slice(0, 5);

      } catch (error) {
        console.error('Erreur récupération transactions récentes:', error);
        return [];
      }
    },
    enabled: !!user,
  });

  const handleRefreshProfile = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshProfile();
      toast.success('Profil mis à jour');
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshProfile]);

  const toggleBalanceVisibility = useCallback(() => {
    setIsBalanceVisible(prev => !prev);
  }, []);

  const formatBalanceDisplay = useCallback((balance: number) => {
    if (!isBalanceVisible) {
      return "••••••••";
    }
    return formatCurrency(balance, 'XAF');
  }, [isBalanceVisible]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'withdrawal':
        return <Download className="h-4 w-4 text-red-500" />;
      case 'transfer_sent':
        return <ArrowRightLeft className="h-4 w-4 text-blue-500" />;
      case 'transfer_received':
        return <ArrowRightLeft className="h-4 w-4 text-green-500" />;
      default:
        return <ArrowRightLeft className="h-4 w-4 text-gray-500" />;
    }
  };

  const userInfo = {
    name: profile?.full_name || 'Utilisateur',
    avatar: profile?.avatar_url,
    initials: profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-[30px]">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-[30px] z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={userInfo.avatar} />
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {userInfo.initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Bonjour {userInfo.name}
                </h1>
                <p className="text-sm text-gray-500">SendFlow</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <UnifiedNotificationBell />
              <Button
                onClick={handleRefreshProfile}
                variant="ghost"
                size="sm"
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="px-4 py-6 space-y-6 pb-20">
        {/* Balance Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Solde Principal
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
            <div className="text-3xl font-bold text-gray-900 mb-4">
              {formatBalanceDisplay(profile?.balance || 0)}
            </div>
            <UserBalanceRechargeButton />
          </CardContent>
        </Card>

        {/* Actions Rapides */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Actions Rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-20 flex-col gap-2 hover:bg-blue-50 border-blue-200"
                onClick={() => navigate('/transfer')}
              >
                <Send className="w-6 h-6 text-blue-600" />
                <span className="text-sm">Envoyer</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex-col gap-2 hover:bg-green-50 border-green-200"
                onClick={() => navigate('/withdraw')}
              >
                <ArrowDownLeft className="w-6 h-6 text-green-600" />
                <span className="text-sm">Retirer</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex-col gap-2 hover:bg-purple-50 border-purple-200"
                onClick={() => navigate('/qr-code')}
              >
                <QrCode className="w-6 h-6 text-purple-600" />
                <span className="text-sm">QR Code</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex-col gap-2 hover:bg-orange-50 border-orange-200"
                onClick={() => navigate('/bills')}
              >
                <CreditCard className="w-6 h-6 text-orange-600" />
                <span className="text-sm">Factures</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Récentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg font-semibold">Transactions Récentes</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/transactions')}
              className="text-blue-600 hover:text-blue-700"
            >
              Voir tout
            </Button>
          </CardHeader>
          <CardContent>
            {recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-full">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{transaction.description}</p>
                        <p className="text-xs text-gray-500">
                          {format(transaction.date, 'dd MMM à HH:mm', { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${
                        transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()} FCFA
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        transaction.status === 'completed' ? 'bg-green-100 text-green-700' : 
                        transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {transaction.status === 'completed' ? 'Terminé' : 
                         transaction.status === 'pending' ? 'En cours' : transaction.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ArrowRightLeft className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucune transaction récente</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Services */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button
                onClick={() => navigate('/transactions')}
                variant="outline"
                className="w-full h-12 justify-start"
              >
                <ArrowRightLeft className="w-5 h-5 mr-3 text-blue-600" />
                Historique des Transactions
              </Button>
              <Button
                onClick={() => navigate('/mobile-recharge')}
                variant="outline"
                className="w-full h-12 justify-start"
              >
                <Plus className="w-5 h-5 mr-3 text-green-600" />
                Recharge Mobile
              </Button>
              <Button
                onClick={() => navigate('/savings')}
                variant="outline"
                className="w-full h-12 justify-start"
              >
                <Settings className="w-5 h-5 mr-3 text-purple-600" />
                Épargne
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {recentTransactions.filter(t => t.date.toDateString() === new Date().toDateString()).length}
            </div>
            <div className="text-xs text-gray-500">Aujourd'hui</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {recentTransactions.filter(t => {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return t.date >= weekAgo;
              }).length}
            </div>
            <div className="text-xs text-gray-500">Cette semaine</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {recentTransactions.length}
            </div>
            <div className="text-xs text-gray-500">Récentes</div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MobileDashboard;
