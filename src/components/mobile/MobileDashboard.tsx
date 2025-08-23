
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowUpRight, 
  QrCode,
  Scan,
  PiggyBank,
  LogOut,
  Eye,
  EyeOff
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatCurrency, getCurrencyForCountry, convertCurrency } from "@/integrations/supabase/client";
import EnhancedTransactionsCard from "@/components/dashboard/EnhancedTransactionsCard";
import { UnifiedNotificationBell } from "@/components/notifications/UnifiedNotificationBell";
import { UserSettingsModal } from "@/components/settings/UserSettingsModal";
import { useAutoBalanceRefresh } from "@/hooks/useAutoBalanceRefresh";
import { toast } from "sonner";

const MobileDashboard: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isBalanceVisible, setIsBalanceVisible] = useState(false);

  // Configuration du rafraîchissement automatique toutes les 5 secondes
  const { currentBalance } = useAutoBalanceRefresh({
    intervalMs: 5000,
    enableRealtime: true
  });

  // Déterminer la devise basée sur le pays de l'utilisateur
  const userCountry = profile?.country || 'Congo Brazzaville';
  const userCurrency = getCurrencyForCountry(userCountry);
  
  // Convertir le solde de XAF vers la devise de l'utilisateur
  const balanceInXAF = currentBalance || profile?.balance || 0;
  const convertedBalance = convertCurrency(balanceInXAF, "XAF", userCurrency);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth');
      toast.success('Déconnexion réussie');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const toggleBalanceVisibility = () => {
    setIsBalanceVisible(!isBalanceVisible);
  };

  // Actions rapides sans "Historique" et "Factures"
  const quickActions = [
    {
      title: "Envoyer",
      icon: ArrowUpRight,
      color: "from-red-500 to-pink-500",
      onClick: () => navigate('/transfer')
    },
    {
      title: "QR Code",
      icon: QrCode,
      color: "from-purple-500 to-violet-500",
      onClick: () => navigate('/qr-code')
    },
    {
      title: "Scanner",
      icon: Scan,
      color: "from-indigo-500 to-blue-500",
      onClick: () => navigate('/qr-payment')
    },
    {
      title: "Épargne",
      icon: PiggyBank,
      color: "from-teal-500 to-green-500",
      onClick: () => navigate('/savings')
    }
  ];

  const formatBalanceDisplay = (balance: number) => {
    if (!isBalanceVisible) {
      return "••••••••";
    }
    return formatCurrency(balance, userCurrency);
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-y-auto">
      {/* Header avec notification et déconnexion */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-14 w-14 border-2 border-white/20">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-white/10 text-white font-semibold text-lg">
                {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-lg font-semibold leading-tight">
                Bonjour {profile?.full_name || 'Utilisateur'} 👋
              </h1>
              <p className="text-blue-100 text-sm mt-1 leading-relaxed">
                📍 {userCountry}
              </p>
              <p className="text-blue-100 text-sm mt-1 leading-relaxed">
                {new Date().toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <UnifiedNotificationBell />
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white text-sm p-2"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Solde avec option de masquage */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-blue-100 text-lg font-medium leading-tight">Solde disponible</p>
              <p className="text-blue-200 text-xs mt-1">
                💱 Devise: {userCurrency}
              </p>
            </div>
            <Button
              onClick={toggleBalanceVisibility}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 p-2"
            >
              {isBalanceVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </Button>
          </div>
          <p className="text-4xl font-bold mb-2 text-yellow-200 leading-none">
            {formatBalanceDisplay(convertedBalance)}
          </p>
          {userCurrency !== "XAF" && isBalanceVisible && (
            <p className="text-blue-200 text-sm">
              Équivalent : {formatCurrency(balanceInXAF, "XAF")}
            </p>
          )}
          <div className="flex items-center space-x-2 text-sm text-blue-100 mt-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span>Mise à jour toutes les 5 secondes</span>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="px-6 -mt-8 relative z-10">
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-5">Actions rapides</h2>
            <div className="grid grid-cols-2 gap-5">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="relative h-28 flex-col gap-3 bg-white border-0 hover:bg-gray-50 transition-all duration-300 hover:scale-105 shadow-lg"
                  onClick={action.onClick}
                >
                  <div className={`p-3 bg-gradient-to-r ${action.color} rounded-full min-w-[40px] min-h-[40px] flex items-center justify-center`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-base font-medium text-center">{action.title}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions récentes */}
      <div className="px-6 mt-6">
        <EnhancedTransactionsCard />
      </div>

      {/* Section Paramètres - S'étend jusqu'en bas */}
      <div className="px-6 mt-6 mb-0">
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-6 pb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-5">Support & Paramètres</h2>
            <div className="grid grid-cols-1 gap-5">
              <UserSettingsModal />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MobileDashboard;
