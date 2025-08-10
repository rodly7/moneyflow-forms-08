
import { memo, Suspense, useMemo, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, QrCode, History, PiggyBank, RefreshCw, LogOut, Crown, Star, Eye, EyeOff, Scan, Zap, Phone, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, getCurrencyForCountry, convertCurrency } from "@/integrations/supabase/client";
import { CustomerServiceButton } from "@/components/notifications/CustomerServiceButton";
import { TouchOptimizedButton } from "./TouchOptimizedButton";
import { OptimizedScrollContainer } from "./OptimizedScrollContainer";
import EnhancedTransactionsCard from "@/components/dashboard/EnhancedTransactionsCard";

interface MobileDashboardProps {
  userBalance: number;
  userProfile: any;
  onRefresh: () => void;
  isLoading: boolean;
}

const MobileLoadingSkeleton = memo(() => (
  <div className="h-screen bg-gradient-to-br from-slate-50 to-blue-50">
    <div className="p-4 space-y-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-4">
            <div className="h-16 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
));

const MobileDashboard = memo(({ 
  userBalance, 
  userProfile, 
  onRefresh, 
  isLoading 
}: MobileDashboardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signOut } = useAuth();
  const [showBalance, setShowBalance] = useState(false);

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
    return <MobileLoadingSkeleton />;
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col overflow-hidden">
      {/* Header fixe plus compact */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm flex-shrink-0">
        <div className="px-3 py-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="p-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                <Crown className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base font-bold text-gray-900 truncate">SendFlow</h1>
                <p className="text-xs text-gray-600 truncate">Tableau de bord</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <CustomerServiceButton />
              <button 
                onClick={onRefresh}
                disabled={isLoading}
                className="p-2 h-10 w-10 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-5 h-5 text-gray-700 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={handleSignOut}
                className="p-2 h-10 w-10 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>

          {/* Carte solde avec MONTANT VRAIMENT ÉNORME */}
          <div className="relative group mb-4">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-75"></div>
            <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-xl text-white">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-white/90 text-lg mb-3">Solde disponible</h3>
                  <p className="text-9xl font-bold text-yellow-200 mb-2 break-all leading-none tracking-tighter">
                    {showBalance ? formatCurrency(convertedBalance, userCurrency) : "••••••"}
                  </p>
                </div>
                <button 
                  onClick={() => setShowBalance(!showBalance)}
                  className="p-3 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  {showBalance ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal qui occupe EXACTEMENT tout l'espace restant */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full px-3 py-3 overflow-y-auto">
          <div className="space-y-4 pb-4">
            {/* Informations utilisateur avec avatar et texte agrandis */}
            <Card className="bg-gradient-to-r from-gray-50 to-blue-50 border-l-4 border-l-blue-500">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                    {userProfile?.full_name ? userProfile.full_name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-3xl font-bold text-gray-900 truncate mb-2">
                      {userProfile?.full_name || 'Utilisateur'}
                    </h2>
                    <div className="flex items-center gap-2 text-lg text-gray-600 mb-1">
                      <Phone className="w-5 h-5" />
                      <span className="truncate">{userProfile?.phone || 'Non disponible'}</span>
                    </div>
                    {userProfile?.country && (
                      <div className="flex items-center gap-2 text-lg text-gray-500">
                        <MapPin className="w-5 h-5" />
                        <span className="truncate">{userProfile.country}</span>
                      </div>
                    )}
                  </div>
                  {userProfile?.is_verified && (
                    <div className="p-2 bg-green-500 rounded-full flex-shrink-0">
                      <Star className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions principales avec design amélioré */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3 px-1">Actions rapides</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'transfer', icon: ArrowUpRight, label: 'Transférer', description: 'Envoyer de l\'argent', colors: 'from-pink-500 to-purple-500' },
                  { key: 'qr-code', icon: QrCode, label: 'Mon QR Code', description: 'Partager mon code', colors: 'from-green-500 to-teal-500' },
                  { key: 'qr-payment', icon: Scan, label: 'Scanner QR', description: 'Payer avec QR', colors: 'from-indigo-500 to-blue-500' },
                  { key: 'savings', icon: PiggyBank, label: 'Épargnes', description: 'Gérer mes économies', colors: 'from-emerald-500 to-green-500' },
                  { key: 'transactions', icon: History, label: 'Historique', description: 'Mes transactions', colors: 'from-orange-500 to-red-500' },
                  { key: 'bill-payments', icon: Zap, label: 'Factures', description: 'Payer mes factures', colors: 'from-yellow-500 to-amber-500' },
                ].map(({ key, icon: Icon, label, description, colors }) => (
                  <TouchOptimizedButton
                    key={key}
                    onClick={() => handleAction(key)}
                    className={`h-24 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border-0 group relative overflow-hidden active:scale-95`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${colors} opacity-0 group-hover:opacity-10 transition-opacity`} />
                    <div className="flex flex-col items-center justify-center gap-1.5 relative z-10 p-2">
                      <div className={`p-2 bg-gradient-to-r ${colors} rounded-lg shadow-sm`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-semibold text-white leading-tight">{label}</div>
                        <div className="text-xs text-white/90 leading-tight">{description}</div>
                      </div>
                    </div>
                  </TouchOptimizedButton>
                ))}
              </div>
            </div>

            {/* Historique des transactions */}
            <EnhancedTransactionsCard />

            {/* Section conseils - DERNIER ÉLÉMENT */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-500">
              <CardContent className="p-3">
                <h4 className="text-base font-bold text-blue-900 mb-2 flex items-center gap-2">
                  💡 Conseils & Astuces
                </h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="p-1 bg-blue-500 rounded-full flex-shrink-0 mt-0.5">
                      <QrCode className="w-2 h-2 text-white" />
                    </div>
                    <div className="text-xs text-blue-800">
                      <span className="font-medium">Retraits rapides :</span> Utilisez votre QR code pour des retraits instantanés.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="p-1 bg-purple-500 rounded-full flex-shrink-0 mt-0.5">
                      <ArrowUpRight className="w-2 h-2 text-white" />
                    </div>
                    <div className="text-xs text-purple-800">
                      <span className="font-medium">Transferts :</span> Envoyez de l'argent 24h/24 et 7j/7.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
});

MobileDashboard.displayName = 'MobileDashboard';
MobileLoadingSkeleton.displayName = 'MobileLoadingSkeleton';

export default MobileDashboard;
