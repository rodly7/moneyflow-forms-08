
import { memo, useMemo, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, QrCode, History, PiggyBank, RefreshCw, LogOut, Crown, Star, Eye, EyeOff, Scan, Zap, User, Phone, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, getCurrencyForCountry, convertCurrency } from "@/integrations/supabase/client";
import { CustomerServiceButton } from "@/components/notifications/CustomerServiceButton";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { OptimizedScrollContainer } from "./OptimizedScrollContainer";

interface CompactMobileDashboardProps {
  userBalance: number;
  userProfile: any;
  onRefresh: () => void;
  isLoading: boolean;
}

const CompactMobileDashboard = memo(({ 
  userBalance, 
  userProfile, 
  onRefresh, 
  isLoading 
}: CompactMobileDashboardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signOut } = useAuth();
  const [showBalance, setShowBalance] = useState(false);
  const { isSmallMobile } = useDeviceDetection();

  const userCurrency = useMemo(() => 
    getCurrencyForCountry(userProfile?.country || "Cameroun"), 
    [userProfile?.country]
  );

  const convertedBalance = useMemo(() => 
    convertCurrency(userBalance, "XAF", userCurrency), 
    [userBalance, userCurrency]
  );

  const handleAction = useCallback((action: string) => {
    switch (action) {
      case 'transfer':
        navigate('/transfer');
        break;
      case 'qr-code':
        navigate('/qr-code');
        break;
      case 'qr-payment':
        navigate('/qr-payment');
        break;
      case 'savings':
        navigate('/savings');
        break;
      case 'transactions':
        navigate('/transactions');
        break;
      case 'bill-payments':
        navigate('/bill-payments');
        break;
      default:
        break;
    }
  }, [navigate]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      navigate('/auth');
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la déconnexion",
        variant: "destructive"
      });
    }
  }, [signOut, navigate, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded">
                <Crown className="w-7 h-7 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold text-gray-800 truncate">SendFlow</h1>
                <p className="text-lg text-gray-600 truncate">{userProfile?.full_name || 'Utilisateur'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <CustomerServiceButton />
              <Button 
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
                className="h-10 w-10 p-0 bg-gray-100 hover:bg-gray-200 rounded"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button 
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="h-10 w-10 p-0 bg-gray-100 hover:bg-gray-200 rounded"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          {/* Carte solde considérablement agrandie */}
          <div className="p-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Eye className="w-6 h-6" />
                </div>
                <span className="text-xl font-semibold">Solde disponible</span>
              </div>
              <Button 
                variant="ghost"
                onClick={() => setShowBalance(!showBalance)}
                className="h-10 w-10 p-0 text-white/80 hover:text-white hover:bg-white/10"
              >
                {showBalance ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
              </Button>
            </div>
            <p className="text-5xl font-bold text-yellow-200 text-center mb-2">
              {showBalance ? formatCurrency(convertedBalance, userCurrency) : "••••••"}
            </p>
          </div>
        </div>
      </div>

      {/* Contenu principal qui remplit tout l'espace restant */}
      <div className="flex-1 overflow-hidden">
        <OptimizedScrollContainer maxHeight="100%" showScrollbar={false}>
          <div className="h-full flex flex-col">
            <div className="flex-1 p-3 space-y-4">
              {/* Grille d'actions */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { 
                    key: 'transfer', 
                    icon: ArrowUpRight, 
                    label: 'Envoyer', 
                    colors: 'from-pink-500 to-red-500' 
                  },
                  { 
                    key: 'qr-code', 
                    icon: QrCode, 
                    label: 'Mon QR', 
                    colors: 'from-green-500 to-emerald-500' 
                  },
                  { 
                    key: 'qr-payment', 
                    icon: Scan, 
                    label: 'Scanner', 
                    colors: 'from-blue-500 to-indigo-500' 
                  },
                  { 
                    key: 'savings', 
                    icon: PiggyBank, 
                    label: 'Épargne', 
                    colors: 'from-emerald-500 to-teal-500' 
                  },
                  { 
                    key: 'transactions', 
                    icon: History, 
                    label: 'Historique', 
                    colors: 'from-orange-500 to-amber-500' 
                  },
                  { 
                    key: 'bill-payments', 
                    icon: Zap, 
                    label: 'Factures', 
                    colors: 'from-purple-500 to-violet-500' 
                  },
                ].map(({ key, icon: Icon, label, colors }) => (
                  <Card key={key} className="overflow-hidden shadow-sm">
                    <CardContent className="p-0">
                      <button
                        onClick={() => handleAction(key)}
                        className="w-full h-20 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                      >
                        <div className={`p-2.5 bg-gradient-to-r ${colors} rounded`}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-lg font-medium text-gray-800 text-center leading-tight">
                          {label}
                        </span>
                      </button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Infos utilisateur considérablement agrandies */}
              <Card className="bg-gradient-to-r from-gray-50 to-blue-50 border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                      {userProfile?.full_name ? userProfile.full_name.charAt(0).toUpperCase() : <User className="w-7 h-7" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 text-xl text-gray-600 mb-2">
                        <Phone className="w-6 h-6" />
                        <span className="truncate font-semibold">{userProfile?.phone || 'N/A'}</span>
                      </div>
                      {userProfile?.country && (
                        <div className="flex items-center gap-3 text-lg text-gray-500">
                          <MapPin className="w-5 h-5" />
                          <span className="truncate">{userProfile.country}</span>
                        </div>
                      )}
                    </div>
                    {userProfile?.is_verified && (
                      <div className="p-3 bg-green-500 rounded-full flex-shrink-0">
                        <Star className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Section conseils */}
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <h4 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
                    💡 Conseils
                  </h4>
                  <div className="space-y-3 text-lg text-blue-800">
                    <div className="flex items-center gap-3">
                      <QrCode className="w-5 h-5 flex-shrink-0" />
                      <span>QR pour retraits rapides</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <ArrowUpRight className="w-5 h-5 flex-shrink-0" />
                      <span>Transferts 24h/24</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 flex-shrink-0" />
                      <span>Factures en ligne</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </OptimizedScrollContainer>
      </div>
    </div>
  );
});

CompactMobileDashboard.displayName = 'CompactMobileDashboard';

export default CompactMobileDashboard;
