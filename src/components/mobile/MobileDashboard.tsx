
import React from "react";
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
  LogOut
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

  // Configuration du rafraîchissement automatique toutes les 5 secondes
  useAutoBalanceRefresh({
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-20">
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
              <h1 className="text-xl font-semibold">
                Bonjour {profile?.full_name || 'Utilisateur'} 👋
              </h1>
              <p className="text-blue-100 text-base">
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
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Solde masqué automatiquement avec rafraîchissement */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <p className="text-blue-100 text-base mb-2">Solde disponible</p>
          <p className="text-5xl font-bold mb-2">
            ••••••
          </p>
          <div className="flex items-center space-x-2 text-sm text-blue-100">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Mise à jour toutes les 5 secondes</span>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="px-6 -mt-8 relative z-10">
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Actions rapides</h2>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="relative h-28 flex-col gap-3 bg-white border-0 hover:bg-gray-50 transition-all duration-300 hover:scale-105 shadow-lg"
                  onClick={action.onClick}
                >
                  <div className={`p-3 bg-gradient-to-r ${action.color} rounded-full min-w-[42px] min-h-[42px] flex items-center justify-center`}>
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

      {/* Section Paramètres */}
      <div className="px-6 mt-6">
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Support & Paramètres</h2>
            <div className="grid grid-cols-1 gap-4">
              <UserSettingsModal />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MobileDashboard;
