
import { memo, Suspense, useMemo, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, QrCode, History, PiggyBank, RefreshCw, LogOut, Bell, Eye, EyeOff, Scan, Zap, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, getCurrencyForCountry, convertCurrency } from "@/integrations/supabase/client";
import { CustomerServiceButton } from "@/components/notifications/CustomerServiceButton";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

const MobileDashboard = memo(() => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [showBalance, setShowBalance] = useState(false);

  const { 
    data: userBalance, 
    isLoading: isBalanceLoading,
    refetch: refetchBalance 
  } = useQuery({
    queryKey: ['user-balance', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { data, error } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data?.balance || 0;
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });

  const userCurrency = useMemo(() => 
    getCurrencyForCountry(profile?.country || "Cameroun"), 
    [profile?.country]
  );

  const convertedBalance = useMemo(() => 
    convertCurrency(userBalance || 0, "XAF", userCurrency), 
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
      navigate('/auth', { replace: true });
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });
    } catch (error) {
      console.error('Erreur déconnexion:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la déconnexion",
        variant: "destructive"
      });
    }
  }, [signOut, navigate, toast]);

  const handleRefresh = useCallback(async () => {
    try {
      await Promise.all([
        refetchBalance(),
        refreshProfile()
      ]);
      toast({
        title: "Données actualisées",
        description: "Vos informations ont été mises à jour",
      });
    } catch (error) {
      console.error('Erreur refresh:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'actualisation",
        variant: "destructive"
      });
    }
  }, [refetchBalance, refreshProfile, toast]);

  if (isBalanceLoading && !userBalance) {
    return <MobileLoadingSkeleton />;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-500 via-purple-500 to-purple-600 overflow-hidden">
      {/* Header Section */}
      <div className="p-4 text-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white text-lg font-bold">
              {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'B'}
            </div>
            <div>
              <h1 className="text-lg font-medium">Bonjour {profile?.full_name || 'Utilisateur'} 👋</h1>
              <p className="text-sm text-white/80">samedi 16 août 2025</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Bell className="w-6 h-6 text-white" />
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">6</span>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/90">Solde disponible</span>
            <button 
              onClick={() => setShowBalance(!showBalance)}
              className="text-white/80 hover:text-white"
            >
              {showBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          
          <div className="text-center mb-4">
            {showBalance ? (
              <div className="text-2xl font-bold text-white">
                {formatCurrency(convertedBalance, userCurrency)}
              </div>
            ) : (
              <div className="flex justify-center gap-1 py-2">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-center gap-2 text-sm text-green-400">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>Mise à jour toutes les 5 secondes</span>
          </div>
        </div>
      </div>

      {/* Actions Section */}
      <div className="bg-white rounded-t-3xl flex-1 p-4 min-h-[60vh]">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Actions rapides</h2>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Envoyer */}
          <button 
            onClick={() => handleAction('transfer')}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center gap-3"
          >
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
              <ArrowUpRight className="w-6 h-6 text-white" />
            </div>
            <span className="font-medium text-gray-800">Envoyer</span>
          </button>

          {/* QR Code */}
          <button 
            onClick={() => handleAction('qr-code')}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center gap-3"
          >
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <span className="font-medium text-gray-800">QR Code</span>
          </button>

          {/* Scanner */}
          <button 
            onClick={() => handleAction('qr-payment')}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center gap-3"
          >
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <Scan className="w-6 h-6 text-white" />
            </div>
            <span className="font-medium text-gray-800">Scanner</span>
          </button>

          {/* Épargne */}
          <button 
            onClick={() => handleAction('savings')}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center gap-3"
          >
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <PiggyBank className="w-6 h-6 text-white" />
            </div>
            <span className="font-medium text-gray-800">Épargne</span>
          </button>

          {/* Historique */}
          <button 
            onClick={() => handleAction('transactions')}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center gap-3"
          >
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
              <History className="w-6 h-6 text-white" />
            </div>
            <span className="font-medium text-gray-800">Historique</span>
          </button>

          {/* Factures */}
          <button 
            onClick={() => handleAction('bill-payments')}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center gap-3"
          >
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <span className="font-medium text-gray-800">Factures</span>
          </button>
        </div>
      </div>
    </div>
  );
});

MobileDashboard.displayName = 'MobileDashboard';
MobileLoadingSkeleton.displayName = 'MobileLoadingSkeleton';

export default MobileDashboard;
