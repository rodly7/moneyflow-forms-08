
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  QrCode, 
  History, 
  DollarSign, 
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Wallet,
  Eye,
  EyeOff,
  RefreshCw,
  Star,
  Trophy,
  MapPin,
  Target,
  BarChart3,
  Menu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/utils/currency';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const MobileAgentDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(false);
  const [todayStats, setTodayStats] = useState({
    transactions: 0,
    volume: 0,
    commission: 0
  });

  useEffect(() => {
    if (!user?.id) return;

    const fetchTodayStats = async () => {
      setLoading(true);
      try {
        // For now, we'll use mock data since we don't have the transactions table
        // In a real implementation, you would query recharges and withdrawals for today
        setTodayStats({
          transactions: 12,
          volume: 150000,
          commission: 3500
        });
      } catch (error) {
        console.error('Error fetching today stats:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les statistiques du jour",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTodayStats();
  }, [user?.id, toast]);

  const toggleBalanceVisibility = () => {
    setShowBalance(!showBalance);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={profile?.avatar_url} alt={profile?.full_name || 'Agent'} />
              <AvatarFallback className="bg-blue-100 text-blue-600">
                {profile?.full_name?.[0]?.toUpperCase() || 'A'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {profile?.full_name || 'Agent'}
              </h1>
              <p className="text-sm text-gray-500">Agent Dashboard</p>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Balance Card */}
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Solde actuel</p>
                <p className="text-2xl font-bold">
                  {showBalance ? formatCurrency(profile?.balance || 0, 'XAF') : '••••••'}
                </p>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={toggleBalanceVisibility}
                  className="mt-2 text-blue-100 hover:bg-blue-700"
                >
                  {showBalance ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                  {showBalance ? 'Masquer' : 'Afficher'}
                </Button>
              </div>
              <Wallet className="w-12 h-12 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        {/* Today's Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-white">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-lg font-bold text-gray-900">{todayStats.transactions}</p>
              <p className="text-xs text-gray-500">Transactions</p>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <DollarSign className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(todayStats.volume, 'XAF')}</p>
              <p className="text-xs text-gray-500">Volume</p>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Star className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(todayStats.commission, 'XAF')}</p>
              <p className="text-xs text-gray-500">Commission</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Actions rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="flex flex-col items-center space-y-2 h-20"
                onClick={() => navigate('/agent/deposit')}
              >
                <ArrowDownLeft className="w-6 h-6 text-green-600" />
                <span className="text-sm">Dépôt</span>
              </Button>

              <Button
                variant="outline"
                className="flex flex-col items-center space-y-2 h-20"
                onClick={() => navigate('/agent/withdrawal')}
              >
                <ArrowUpRight className="w-6 h-6 text-red-600" />
                <span className="text-sm">Retrait</span>
              </Button>

              <Button
                variant="outline"
                className="flex flex-col items-center space-y-2 h-20"
                onClick={() => navigate('/qr-code')}
              >
                <QrCode className="w-6 h-6 text-blue-600" />
                <span className="text-sm">QR Code</span>
              </Button>

              <Button
                variant="outline"
                className="flex flex-col items-center space-y-2 h-20"
                onClick={() => navigate('/agent/history')}
              >
                <History className="w-6 h-6 text-purple-600" />
                <span className="text-sm">Historique</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Performance Summary */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Performance aujourd'hui</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Objectif quotidien</span>
                <Badge variant="secondary">75%</Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
              <p className="text-xs text-gray-500">
                {formatCurrency(375000, 'XAF')} / {formatCurrency(500000, 'XAF')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MobileAgentDashboard;
