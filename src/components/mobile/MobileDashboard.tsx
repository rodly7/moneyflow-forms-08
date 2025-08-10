
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowUpRight, 
  QrCode,
  Smartphone,
  Scan,
  PiggyBank,
  History,
  LogOut,
  Eye,
  EyeOff
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/integrations/supabase/client";
import EnhancedTransactionsCard from "@/components/dashboard/EnhancedTransactionsCard";
import UnifiedNotificationBell from "@/components/notifications/UnifiedNotificationBell";
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

  // Actions rapides sans "Retirer" et "Recevoir"
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
    },
    {
      title: "Historique",
      icon: History,
      color: "from-orange-500 to-amber-500",
      onClick: () => navigate('/transactions')
    },
    {
      title: "Factures",
      icon: Smartphone,
      color: "from-violet-500 to-purple-500",
      onClick: () => navigate('/bill-payments')
    }
  ];

  const formatBalanceDisplay = (balance: number) => {
    if (!isBalanceVisible) {
      return "••••••••";
    }
    return formatCurrency(balance, 'XAF');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-20">
      {/* Header avec notification et déconnexion */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16 border-2 border-white/20">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-white/10 text-white font-semibold text-2xl">
                {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-semibold">
                Bonjour {profile?.full_name || 'Utilisateur'} 👋
              </h1>
              <p className="text-blue-100 text-xl">
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
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white text-lg p-3"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Solde avec option de masquage */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <p className="text-blue-100 text-2xl">Solde disponible</p>
            <Button
              onClick={toggleBalanceVisibility}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 p-2"
            >
              {isBalanceVisible ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
            </Button>
          </div>
          <p className="text-7xl font-bold mb-4 text-yellow-200">
            {formatBalanceDisplay(currentBalance || profile?.balance || 0)}
          </p>
          <div className="flex items-center space-x-2 text-lg text-blue-100">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span>Mise à jour toutes les 5 secondes</span>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="px-6 -mt-8 relative z-10">
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Actions rapides</h2>
            <div className="grid grid-cols-2 gap-6">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="relative h-32 flex-col gap-4 bg-white border-0 hover:bg-gray-50 transition-all duration-300 hover:scale-105 shadow-lg"
                  onClick={action.onClick}
                >
                  <div className={`p-4 bg-gradient-to-r ${action.color} rounded-full min-w-[48px] min-h-[48px] flex items-center justify-center`}>
                    <action.icon className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-lg font-medium text-center">{action.title}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions récentes */}
      <div className="px-6 mt-8">
        <EnhancedTransactionsCard />
      </div>

      {/* Section Paramètres */}
      <div className="px-6 mt-8">
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Support & Paramètres</h2>
            <div className="grid grid-cols-1 gap-6">
              <UserSettingsModal />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MobileDashboard;
