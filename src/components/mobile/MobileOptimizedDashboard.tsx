
import { memo, Suspense, useMemo, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, QrCode, Wallet, History, PiggyBank, RefreshCw, LogOut, Crown, Star, Eye, EyeOff, Scan, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, getCurrencyForCountry, convertCurrency } from "@/integrations/supabase/client";
import { CustomerServiceButton } from "@/components/notifications/CustomerServiceButton";
import RechargeAccountButton from "@/components/dashboard/RechargeAccountButton";

interface MobileOptimizedDashboardProps {
  userBalance: number;
  userProfile: any;
  onRefresh: () => void;
  isLoading: boolean;
}

const MobileLoadingSkeleton = memo(() => (
  <div className="space-y-3 p-3">
    {[...Array(3)].map((_, i) => (
      <Card key={i} className="animate-pulse">
        <CardContent className="p-3">
          <div className="h-12 bg-muted rounded"></div>
        </CardContent>
      </Card>
    ))}
  </div>
));

const MobileOptimizedDashboard = memo(({ 
  userBalance, 
  userProfile, 
  onRefresh, 
  isLoading 
}: MobileOptimizedDashboardProps) => {
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
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Mobile Header - Optimized for small screens */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-0.5">
        <div className="bg-white rounded-b-xl">
          <div className="p-3 space-y-3">
            {/* Header Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex-shrink-0">
                  <Crown className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-sm font-bold text-gray-800 truncate">Espace Utilisateur</h1>
                  <p className="text-xs text-gray-600 truncate">Dashboard personnel</p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <CustomerServiceButton />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onRefresh}
                  disabled={isLoading}
                  className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSignOut}
                  className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  <LogOut className="w-3 h-3" />
                </Button>
              </div>
            </div>
            
            {/* User Info Section - Compact for mobile */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {userProfile?.full_name ? userProfile.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-bold text-gray-800 truncate">{userProfile?.full_name || 'Utilisateur'}</h2>
                  <div className="text-xs text-gray-600 truncate">{userProfile?.phone || 'Téléphone non disponible'}</div>
                  {userProfile?.country && (
                    <div className="text-xs text-gray-500 truncate">{userProfile.country}</div>
                  )}
                </div>
              </div>
              {userProfile?.is_verified && (
                <div className="p-1.5 bg-green-500 rounded-full flex-shrink-0">
                  <Star className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content - Optimized spacing for mobile */}
      <div className="p-3 space-y-4 pb-20">
        {/* Balance Card - Mobile optimized */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
          <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-4 rounded-xl text-white shadow-xl">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-white/80 text-xs mb-1">
                    Solde disponible
                  </h3>
                  <div className="text-xs text-white/70">
                    👤 <span className="truncate inline-block max-w-[120px]">{userProfile?.full_name || 'Utilisateur'}</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-white/80 hover:text-white transition-colors p-1.5 flex-shrink-0"
                  aria-label={showBalance ? "Masquer le solde" : "Afficher le solde"}
                >
                  {showBalance ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold bg-gradient-to-r from-yellow-200 to-yellow-400 bg-clip-text text-transparent break-all">
                  {showBalance ? formatCurrency(convertedBalance, userCurrency) : "••••••"}
                </p>
              </div>
              
              <div className="flex justify-center space-x-1">
                <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-pulse"></div>
                <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Grid - 2x3 layout for mobile */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'transfer', icon: ArrowUpRight, label: 'Transférer', colors: 'from-pink-500 to-purple-500', bg: 'from-pink-600 to-purple-600' },
            { key: 'qr-code', icon: QrCode, label: 'Mon QR', colors: 'from-green-500 to-teal-500', bg: 'from-green-600 to-teal-600' },
            { key: 'qr-payment', icon: Scan, label: 'Payer QR', colors: 'from-indigo-500 to-purple-500', bg: 'from-indigo-600 to-purple-600' },
            { key: 'savings', icon: PiggyBank, label: 'Épargnes', colors: 'from-emerald-500 to-green-500', bg: 'from-emerald-600 to-green-600' },
            { key: 'transactions', icon: History, label: 'Historique', colors: 'from-orange-500 to-red-500', bg: 'from-orange-600 to-red-600' },
            { key: 'bill-payments', icon: Zap, label: 'Factures', colors: 'from-yellow-500 to-amber-500', bg: 'from-yellow-600 to-amber-600' },
          ].map(({ key, icon: Icon, label, colors, bg }) => (
            <div key={key} className="group relative">
              <div className={`absolute -inset-0.5 bg-gradient-to-r ${bg} rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-500`}></div>
              <button
                onClick={() => handleAction(key)}
                className="relative w-full h-16 bg-white rounded-lg flex flex-col items-center justify-center gap-1 shadow-lg hover:scale-105 transition-transform duration-300"
              >
                <div className={`p-1.5 bg-gradient-to-r ${colors} rounded-full`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-medium truncate px-1">{label}</span>
              </button>
            </div>
          ))}
        </div>

        {/* Recharge Account Button */}
        <div className="mt-4">
          <RechargeAccountButton 
            fullWidth 
            size="lg" 
            className="h-14 text-base font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg rounded-xl"
          />
        </div>

        {/* Tips Section - Compact for mobile */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-3 rounded-lg border-l-4 border-l-indigo-500">
          <div className="text-xs">
            <div className="flex items-center gap-1 mb-1">
              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
              <span className="font-semibold text-indigo-900">QR Code pour les retraits</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="font-semibold text-purple-900">Transferts instantanés</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

MobileOptimizedDashboard.displayName = 'MobileOptimizedDashboard';
MobileLoadingSkeleton.displayName = 'MobileLoadingSkeleton';

export default MobileOptimizedDashboard;
