
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  QrCode, 
  History, 
  CreditCard, 
  FileText,
  PiggyBank,
  Settings,
  LogOut,
  RefreshCw
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import UnifiedTransactionsCard from '@/components/dashboard/UnifiedTransactionsCard';

const MobileDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Récupérer le profil utilisateur
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useQuery({
    queryKey: ['mobile-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Récupérer le solde
  const { data: balance, isLoading: balanceLoading, refetch: refetchBalance } = useQuery({
    queryKey: ['mobile-balance', user?.id],
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

  const handleRefresh = async () => {
    try {
      await Promise.all([refetchProfile(), refetchBalance()]);
      toast({
        title: "Données actualisées",
        description: "Vos informations ont été mises à jour",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'actualiser les données",
        variant: "destructive"
      });
    }
  };

  const handleSignOut = async () => {
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
  };

  const quickActions = [
    {
      title: "Transférer",
      icon: ArrowUpRight,
      color: "bg-blue-500 hover:bg-blue-600 text-white",
      onClick: () => navigate('/transfer')
    },
    {
      title: "Recevoir",
      icon: ArrowDownLeft,
      color: "bg-green-500 hover:bg-green-600 text-white",
      onClick: () => navigate('/qr-code')
    },
    {
      title: "Recharger",
      icon: Wallet,
      color: "bg-purple-500 hover:bg-purple-600 text-white",
      onClick: () => navigate('/unified-deposit-withdrawal')
    },
    {
      title: "Retirer",
      icon: CreditCard,
      color: "bg-orange-500 hover:bg-orange-600 text-white",
      onClick: () => navigate('/withdraw')
    },
    {
      title: "Factures",
      icon: FileText,
      color: "bg-red-500 hover:bg-red-600 text-white",
      onClick: () => navigate('/bill-payments')
    },
    {
      title: "Épargne",
      icon: PiggyBank,
      color: "bg-teal-500 hover:bg-teal-600 text-white",
      onClick: () => navigate('/savings')
    }
  ];

  if (profileLoading || balanceLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 pb-20">
      {/* Header avec profil et solde */}
      <Card className="mb-6 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">
                  Bonjour {profile?.full_name || 'Utilisateur'}
                </h2>
                <p className="text-sm text-gray-600">
                  {profile?.phone || 'Numéro non renseigné'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                className="border-blue-200 text-blue-700"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="border-red-200 text-red-700"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Solde principal */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Solde disponible</p>
                <h3 className="text-3xl font-bold">
                  {formatCurrency(balance || 0, 'XAF')}
                </h3>
              </div>
              <Wallet className="w-8 h-8 text-blue-200" />
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Badge className="bg-white/20 text-white border-white/30">
                Compte principal
              </Badge>
              <Badge className="bg-green-500/20 text-green-100 border-green-300/30">
                ✓ Vérifié
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions rapides */}
      <Card className="mb-6 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4 text-gray-900">Actions rapides</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                onClick={action.onClick}
                className={`${action.color} h-16 flex flex-col items-center justify-center gap-2 rounded-xl transition-all duration-200 transform hover:scale-105`}
              >
                <action.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{action.title}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transactions récentes avec le nouveau composant unifié */}
      <UnifiedTransactionsCard />

      {/* Bouton pour voir toutes les transactions */}
      <div className="mt-6 text-center">
        <Button
          onClick={() => navigate('/transactions')}
          variant="outline"
          className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
        >
          <History className="w-4 h-4 mr-2" />
          Voir toutes les transactions
        </Button>
      </div>
    </div>
  );
};

export default MobileDashboard;
