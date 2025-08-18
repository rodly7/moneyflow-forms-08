
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Send, 
  QrCode, 
  History, 
  PiggyBank, 
  CreditCard, 
  LogOut,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import { formatCurrency } from '@/integrations/supabase/client';
import { useState } from 'react';

const MobileDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(false);

  const { data: balance, isLoading: isBalanceLoading, refetch: refetchBalance } = useQuery({
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

  const handleAction = (action: string) => {
    navigate(`/${action}`);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const actions = [
    { id: 'transfer', label: 'Transférer', icon: Send, color: 'bg-blue-500' },
    { id: 'qr-code', label: 'QR Code', icon: QrCode, color: 'bg-green-500' },
    { id: 'transactions', label: 'Historique', icon: History, color: 'bg-purple-500' },
    { id: 'savings', label: 'Épargnes', icon: PiggyBank, color: 'bg-yellow-500' },
    { id: 'bill-payments', label: 'Factures', icon: CreditCard, color: 'bg-red-500' },
    { id: 'unified-deposit-withdrawal', label: 'Dépôt/Retrait', icon: RefreshCw, color: 'bg-indigo-500' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 text-white overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="bg-white/20 text-white">
              {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-lg font-semibold">
              Bonjour, {profile?.full_name || 'Utilisateur'}
            </h1>
            <p className="text-sm text-white/80">
              Bienvenue sur SendFlow
            </p>
          </div>
        </div>
        <Button
          onClick={handleSignOut}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20"
        >
          <LogOut className="w-5 h-5" />
        </Button>
      </div>

      {/* Balance Card */}
      <div className="px-4 mb-6">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-white/80">Solde disponible</span>
              <Button
                onClick={() => setShowBalance(!showBalance)}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 p-1"
              >
                {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            <div className="text-3xl font-bold mb-2">
              {isBalanceLoading ? (
                <div className="h-8 w-32 bg-white/20 rounded animate-pulse"></div>
              ) : showBalance ? (
                formatCurrency(balance || 0, 'XAF')
              ) : (
                '••••••••'
              )}
            </div>
            <p className="text-xs text-yellow-300">
              ⚡ Actualisation toutes les 5 secondes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="px-4">
        <div className="bg-white rounded-t-3xl p-6 min-h-[400px]">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Actions rapides</h2>
          
          <div className="grid grid-cols-2 gap-4">
            {actions.map((action) => (
              <Button
                key={action.id}
                onClick={() => handleAction(action.id)}
                variant="outline"
                className="h-20 flex-col gap-2 hover:scale-105 transition-transform duration-200 border-gray-200 text-gray-700"
              >
                <div className={`w-8 h-8 rounded-full ${action.color} flex items-center justify-center`}>
                  <action.icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-medium">{action.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileDashboard;
