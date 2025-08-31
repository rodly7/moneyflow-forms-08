
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, getCurrencyForCountry, convertCurrency } from '@/lib/utils/currency';
import { ScrollableContainer } from '@/components/shared/ScrollableContainer';
import CompactHeader from '@/components/dashboard/CompactHeader';
import CompactInfoCard from '@/components/dashboard/CompactInfoCard';
import CompactActionGrid from '@/components/dashboard/CompactActionGrid';
import CompactStatsGrid from '@/components/dashboard/CompactStatsGrid';
import ReliableTransactionsCard from '@/components/dashboard/ReliableTransactionsCard';
import MobileDashboard from '@/components/mobile/MobileDashboard';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { User, Wallet, Plus, Minus, QrCode, History, CreditCard, PiggyBank } from 'lucide-react';
// import { useTransferNotifications } from '@/hooks/useTransferNotifications'; // Désactivé - utilise UnifiedNotificationBell à la place

const Dashboard = () => {
  // ALL HOOKS MUST BE CALLED FIRST - BEFORE ANY CONDITIONAL LOGIC
  const { user, signOut } = useAuth();
  const { isMobile } = useDeviceDetection();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Notifications gérées par UnifiedNotificationBell - pas besoin de hook séparé
  // useTransferNotifications(); // DÉSACTIVÉ

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

  const handleRefresh = async () => {
    await Promise.all([refetchProfile(), refetchBalance()]);
  };

  // NOW we can do conditional returns after ALL hooks have been called
  // Check user role and redirect to appropriate dashboard if needed
  
  // Force immediate navigation for agents to their dashboard
  useEffect(() => {
    if (profile?.role === 'agent') {
      console.log('🚀 Agent détecté - Redirection vers agent-dashboard');
      navigate('/agent-dashboard', { replace: true });
    } else if (profile?.role === 'admin') {
      navigate('/admin-dashboard', { replace: true });
    } else if (profile?.role === 'sub_admin') {
      navigate('/sub-admin-dashboard', { replace: true });
    }
  }, [profile?.role, navigate]);
  
  // Don't render anything if we need to redirect
  if (profile?.role === 'admin' || profile?.role === 'sub_admin' || profile?.role === 'agent') {
    return null;
  }

  // For regular users - unified mobile interface for all devices
  return <MobileDashboard />;
};

export default Dashboard;
