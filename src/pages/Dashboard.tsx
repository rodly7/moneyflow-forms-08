
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useTransferNotifications } from '@/hooks/useTransferNotifications';
import MobileDashboard from '@/components/mobile/MobileDashboard';
import { useEffect, useRef } from 'react';

const Dashboard = () => {
  const { user, profile, loading } = useAuth();
  const { isMobile } = useDeviceDetection();
  const navigate = useNavigate();
  const { toast } = useToast();
  const hasRedirected = useRef(false);
  
  // Activer les notifications de transfert
  useTransferNotifications();

  const { 
    data: balance, 
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
      
      if (error) {
        console.error('Error fetching balance:', error);
        return profile?.balance || 0;
      }
      return data?.balance || 0;
    },
    enabled: !!user?.id,
    staleTime: 30000, // 30 secondes
    refetchInterval: 60000, // 1 minute
  });

  // Gérer les redirections selon le rôle - une seule fois
  useEffect(() => {
    if (loading || !profile || hasRedirected.current) return;

    console.log('🔍 Vérification du rôle utilisateur:', profile.role);
    
    // Marquer comme ayant redirigé pour éviter les boucles
    hasRedirected.current = true;
    
    // Redirections conditionnelles selon le rôle avec timeout pour éviter les conflits
    setTimeout(() => {
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
    }, 100);
  }, [profile?.role, loading, navigate]);

  // Afficher le loading pendant que les données se chargent
  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-700">Chargement de votre tableau de bord...</p>
          <p className="text-sm text-gray-500 mt-2">Veuillez patienter...</p>
        </div>
      </div>
    );
  }

  // Pour les utilisateurs normaux - interface mobile unifiée
  return <MobileDashboard />;
};

export default Dashboard;
