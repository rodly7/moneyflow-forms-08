
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, getCurrencyForCountry, convertCurrency } from '@/integrations/supabase/client';
import { useState, useCallback, useMemo } from 'react';
import { User, Wallet, Plus, Minus, QrCode, History, CreditCard, PiggyBank } from 'lucide-react';
import BalanceCard from '@/components/dashboard/BalanceCard';
import { useBalanceCheck } from '@/hooks/useBalanceCheck';
import { useTransferNotifications } from '@/hooks/useTransferNotifications';

const MobileDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Activer les notifications de transfert
  useTransferNotifications();

  const { 
    data: profile, 
    isLoading: isProfileLoading,
    refetch: refetchProfile 
  } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      if (error) {
        console.error('Erreur lors du chargement du profil:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!user?.id,
  });

  const { 
    data: balance, 
    isLoading: isBalanceLoading,
    refetch: refetchBalance 
  } = useQuery({
    queryKey: ['user-balance', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user?.id)
        .single();
      
      if (error) throw error;
      return data?.balance || 0;
    },
    enabled: !!user?.id,
  });

  // Utiliser le hook de vérification du solde faible
  useBalanceCheck(balance || 0);

  // Déterminer le pays et la devise de l'utilisateur
  const userCountry = profile?.country || "Congo Brazzaville";
  const userCurrency = getCurrencyForCountry(userCountry);
  const convertedBalance = useMemo(() => 
    convertCurrency(balance || 0, "XAF", userCurrency), 
    [balance, userCurrency]
  );

  console.log("🌍 Dashboard - Pays:", userCountry, "Devise:", userCurrency, "Solde converti:", convertedBalance);

  const handleAction = useCallback((action: string) => {
    switch (action) {
      case 'transfer':
        navigate('/transfer');
        break;
      case 'deposit':
        navigate('/unified-deposit-withdrawal');
        break;
      case 'withdraw':
        navigate('/withdraw');
        break;
      case 'qr-code':
        navigate('/qr-code');
        break;
      case 'transactions':
        navigate('/transactions');
        break;
      case 'bill-payments':
        navigate('/bill-payments');
        break;
      case 'savings':
        navigate('/savings');
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

  const actionButtons = [
    { id: 'transfer', label: 'Transférer', icon: Plus, color: 'bg-blue-500' },
    { id: 'deposit', label: 'Déposer', icon: Wallet, color: 'bg-green-500' },
    { id: 'withdraw', label: 'Retirer', icon: Minus, color: 'bg-red-500' },
    { id: 'qr-code', label: 'QR Code', icon: QrCode, color: 'bg-purple-500' },
    { id: 'transactions', label: 'Historique', icon: History, color: 'bg-orange-500' },
    { id: 'bill-payments', label: 'Factures', icon: CreditCard, color: 'bg-indigo-500' },
    { id: 'savings', label: 'Épargne', icon: PiggyBank, color: 'bg-pink-500' },
  ];

  const isLoading = isProfileLoading || isBalanceLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête avec profil utilisateur */}
      <div className="bg-white shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">
              {profile?.full_name || 'Utilisateur'}
            </h1>
            <p className="text-sm text-gray-500">
              {profile?.phone} • {userCountry}
            </p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="text-sm text-red-600 font-medium"
        >
          Déconnexion
        </button>
      </div>

      {/* Carte de solde */}
      <div className="p-4">
        <BalanceCard
          balance={balance || 0}
          userCountry={userCountry}
          currency={userCurrency}
          userProfile={profile}
        />
      </div>

      {/* Grille d'actions */}
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h2>
        <div className="grid grid-cols-2 gap-4">
          {actionButtons.map((button) => (
            <button
              key={button.id}
              onClick={() => handleAction(button.id)}
              className={`${button.color} text-white p-4 rounded-lg flex flex-col items-center gap-2 shadow-md active:scale-95 transition-transform`}
            >
              <button.icon className="w-6 h-6" />
              <span className="text-sm font-medium">{button.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Section informative */}
      <div className="p-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">💡 Information</h3>
          <p className="text-sm text-blue-700">
            Votre solde est affiché en <strong>{userCurrency}</strong> selon votre localisation ({userCountry}).
          </p>
          {userCurrency !== "XAF" && (
            <p className="text-xs text-blue-600 mt-1">
              Solde original: {formatCurrency(balance || 0, "XAF")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileDashboard;
