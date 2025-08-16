
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, getCurrencyForCountry, convertCurrency } from '@/integrations/supabase/client';
import { ScrollableContainer } from '@/components/shared/ScrollableContainer';
import CompactHeader from '@/components/dashboard/CompactHeader';
import CompactInfoCard from '@/components/dashboard/CompactInfoCard';
import CompactActionGrid from '@/components/dashboard/CompactActionGrid';
import CompactStatsGrid from '@/components/dashboard/CompactStatsGrid';
import TransactionsCard from '@/components/dashboard/TransactionsCard';
import MobileDashboard from '@/components/mobile/MobileDashboard';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { User, Wallet, Plus, Minus, QrCode, History, CreditCard, PiggyBank } from 'lucide-react';
import { useTransferNotifications } from '@/hooks/useTransferNotifications';

const Dashboard = () => {
  // ALL HOOKS MUST BE CALLED FIRST - BEFORE ANY CONDITIONAL LOGIC
  const { user, profile, loading } = useAuth();
  const { isMobile } = useDeviceDetection();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Activer les notifications de transfert
  useTransferNotifications();

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

  // All other hooks
  const userCurrency = useMemo(() => 
    getCurrencyForCountry(profile?.country || "Cameroun"), 
    [profile?.country]
  );

  const convertedBalance = useMemo(() => 
    convertCurrency(balance || 0, "XAF", userCurrency), 
    [balance, userCurrency]
  );

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
      const { signOut } = useAuth();
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
  }, [navigate, toast]);

  const handleRefresh = async () => {
    await refetchBalance();
  };

  const handleDeleteTransaction = useCallback((id: string, type: string) => {
    // Placeholder function - implement transaction deletion logic if needed
    console.log('Delete transaction:', id, type);
  }, []);

  // Gérer les redirections selon le rôle SEULEMENT après que les données soient chargées
  useEffect(() => {
    if (loading || !profile) return;

    console.log('🔍 Vérification du rôle utilisateur:', profile.role);
    
    // Redirections conditionnelles selon le rôle
    if (profile.role === 'admin') {
      console.log('👤 Redirection vers admin dashboard');
      navigate('/admin-dashboard', { replace: true });
      return;
    }
    
    if (profile.role === 'sub_admin') {
      console.log('👤 Redirection vers sub-admin dashboard'); 
      navigate('/sub-admin-dashboard', { replace: true });
      return;
    }
    
    if (profile.role === 'agent') {
      console.log('👤 Redirection vers agent dashboard');
      navigate('/agent-dashboard', { replace: true });
      return;
    }

    console.log('👤 Utilisateur standard, reste sur dashboard');
  }, [profile, loading, navigate]);

  // Afficher le loading pendant que les données se chargent
  if (loading || !profile || isBalanceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-semibold">Chargement de votre tableau de bord...</p>
        </div>
      </div>
    );
  }

  // Pour les utilisateurs normaux - interface mobile unifiée
  return <MobileDashboard />;
};

export default Dashboard;
