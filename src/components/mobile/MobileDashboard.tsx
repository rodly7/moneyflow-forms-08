
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
  Plus
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/integrations/supabase/client";
import { UnifiedNotificationBell } from "@/components/notifications/UnifiedNotificationBell";
import { UserBalanceRechargeButton } from "@/components/user/UserBalanceRechargeButton";
import { useAutoBalanceRefresh } from "@/hooks/useAutoBalanceRefresh";
import { toast } from "sonner";

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

  const userInfo = {
    name: profile?.full_name || 'Utilisateur',
    avatar: profile?.avatar_url,
    initials: profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
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

      <div className="px-4 py-6 space-y-6">
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
                <ArrowDownLeft className="w-5 h-5 mr-3 text-blue-600" />
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
              {Math.floor(Math.random() * 10)}
            </div>
            <div className="text-xs text-gray-500">Aujourd'hui</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {Math.floor(Math.random() * 50)}
            </div>
            <div className="text-xs text-gray-500">Cette semaine</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.floor(Math.random() * 200)}
            </div>
            <div className="text-xs text-gray-500">Ce mois</div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MobileDashboard;
