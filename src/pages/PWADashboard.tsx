
import React from 'react';
import { PWADashboard } from '@/components/pwa/PWADashboard';
import { PWAInstallBanner } from '@/components/pwa/PWAInstallBanner';
import { PWAUpdateBanner } from '@/components/pwa/PWAUpdateBanner';
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const PWADashboardPage = () => {
  const { user } = useAuth();

  // Récupérer les données utilisateur (utilisation des colonnes existantes)
  const { data: userData } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, balance')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Composants PWA globaux */}
      <OfflineIndicator />
      <PWAInstallBanner />
      <PWAUpdateBanner />
      
      {/* Dashboard principal */}
      <PWADashboard
        userBalance={userData?.balance || 0}
        userName={userData?.full_name || 'Utilisateur'}
        userPhone={user?.email || '+221...'}
      />
    </div>
  );
};

export default PWADashboardPage;
