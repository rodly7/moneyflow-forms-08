
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
  Download,
  ScanLine,
  PiggyBank,
  History,
  Receipt
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
      return "🟡 🟡 🟡 🟡 🟡 🟡 🟡 🟡";
    }
    return formatCurrency(balance, 'XAF');
  }, [isBalanceVisible]);

  const userInfo = {
    name: profile?.full_name || 'Utilisateur',
    avatar: profile?.avatar_url,
    initials: profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'B'
  };

  // Actions rapides avec les couleurs exactes du design
  const quickActions = [
    {
      title: "Envoyer",
      icon: Send,
      bgColor: "bg-red-500",
      route: "/transfer"
    },
    {
      title: "QR Code", 
      icon: QrCode,
      bgColor: "bg-purple-500",
      route: "/qr-code"
    },
    {
      title: "Scanner",
      icon: ScanLine,
      bgColor: "bg-blue-500", 
      route: "/qr-payment"
    },
    {
      title: "Épargne",
      icon: PiggyBank,
      bgColor: "bg-green-500",
      route: "/savings"
    },
    {
      title: "Historique",
      icon: History,
      bgColor: "bg-orange-500",
      route: "/transactions"
    },
    {
      title: "Factures",
      icon: Receipt,
      bgColor: "bg-purple-600",
      route: "/bills"
    }
  ];

  const currentDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-purple-700 pt-[30px]">
      {/* Header avec dégradé */}
      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16 border-2 border-white/30">
              <AvatarImage src={userInfo.avatar} />
              <AvatarFallback className="bg-white/20 text-white text-xl font-bold">
                {userInfo.initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                Bonjour {userInfo.name} 👋
              </h1>
              <p className="text-white/80 text-sm">
                {currentDate}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <UnifiedNotificationBell />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 rounded-full p-2"
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Carte de solde avec dégradé et coins arrondis */}
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 mb-8 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white/90 text-lg font-medium">Solde disponible</h2>
            <Button
              onClick={toggleBalanceVisibility}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 rounded-full p-2"
            >
              {isBalanceVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </Button>
          </div>
          
          <div className="text-4xl font-bold text-white mb-6">
            {formatBalanceDisplay(profile?.balance || 0)}
          </div>
          
          <div className="flex items-center text-green-400 text-sm mb-4">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
            Mise à jour toutes les 5 secondes
          </div>
        </div>
      </div>

      {/* Actions Rapides sur fond blanc */}
      <div className="bg-white rounded-t-3xl px-6 py-8 min-h-[60vh]">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Actions rapides</h3>
        
        <div className="grid grid-cols-2 gap-6 mb-8">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              onClick={() => navigate(action.route)}
              variant="ghost"
              className="h-auto p-6 flex flex-col items-center gap-4 hover:bg-gray-50 rounded-2xl border border-gray-100"
            >
              <div className={`w-16 h-16 rounded-full ${action.bgColor} flex items-center justify-center`}>
                <action.icon className="w-8 h-8 text-white" />
              </div>
              <span className="text-gray-700 font-medium text-base">
                {action.title}
              </span>
            </Button>
          ))}
        </div>

        {/* Services supplémentaires */}
        <div className="space-y-4">
          <Button
            onClick={() => navigate('/mobile-recharge')}
            variant="outline"
            className="w-full h-14 justify-start rounded-2xl border-gray-200"
          >
            <Plus className="w-6 h-6 mr-4 text-green-600" />
            <span className="text-base font-medium">Recharge Mobile</span>
          </Button>
          
          <Button
            onClick={() => navigate('/withdraw')}
            variant="outline"
            className="w-full h-14 justify-start rounded-2xl border-gray-200"
          >
            <ArrowDownLeft className="w-6 h-6 mr-4 text-red-600" />
            <span className="text-base font-medium">Retirer de l'argent</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MobileDashboard;
