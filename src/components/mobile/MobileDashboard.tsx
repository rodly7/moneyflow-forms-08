
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard, 
  QrCode,
  Receipt,
  Smartphone,
  Bell
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/integrations/supabase/client";
import EnhancedTransactionsCard from "@/components/dashboard/EnhancedTransactionsCard";
import { UnifiedNotificationBell } from "@/components/notifications/UnifiedNotificationBell";
import { UserSettingsModal } from "@/components/settings/UserSettingsModal";

const MobileDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const quickActions = [
    {
      title: "Envoyer",
      icon: ArrowUpRight,
      color: "from-red-500 to-pink-500",
      onClick: () => navigate('/transfer')
    },
    {
      title: "Recevoir",
      icon: ArrowDownLeft,
      color: "from-green-500 to-emerald-500",
      onClick: () => navigate('/receive')
    },
    {
      title: "Retirer",
      icon: CreditCard,
      color: "from-blue-500 to-cyan-500",
      onClick: () => navigate('/withdraw')
    },
    {
      title: "QR Code",
      icon: QrCode,
      color: "from-purple-500 to-violet-500",
      onClick: () => navigate('/qr-code')
    },
    {
      title: "Reçus",
      icon: Receipt,
      color: "from-orange-500 to-amber-500",
      onClick: () => navigate('/receipts')
    },
    {
      title: "Factures",
      icon: Smartphone,
      color: "from-indigo-500 to-blue-500",
      onClick: () => navigate('/bills')
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-20">
      {/* Header avec notification */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12 border-2 border-white/20">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-white/10 text-white font-semibold">
                {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-lg font-semibold">
                Bonjour {profile?.full_name || 'Utilisateur'} 👋
              </h1>
              <p className="text-blue-100 text-sm">
                {new Date().toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
          <UnifiedNotificationBell />
        </div>

        {/* Solde avec taille augmentée */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <p className="text-blue-100 text-sm mb-2">Solde disponible</p>
          <p className="text-4xl font-bold mb-2">
            {formatCurrency(profile?.balance || 0)}
          </p>
          <div className="flex items-center space-x-2 text-xs text-blue-100">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Compte actif</span>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="px-6 -mt-8 relative z-10">
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Actions rapides</h2>
            <div className="grid grid-cols-3 gap-4">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="relative h-24 flex-col gap-3 bg-white border-0 hover:bg-gray-50 transition-all duration-300 hover:scale-105 shadow-lg"
                  onClick={action.onClick}
                >
                  <div className={`p-2 bg-gradient-to-r ${action.color} rounded-full min-w-[36px] min-h-[36px] flex items-center justify-center`}>
                    <action.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-center">{action.title}</span>
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
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Support & Paramètres</h2>
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
