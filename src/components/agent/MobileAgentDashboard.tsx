import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
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
  Trophy
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/utils/currency';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AgentDashboardProps {
  // Define any props here
}

const MobileAgentDashboard: React.FC<AgentDashboardProps> = ({ /* props */ }) => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isBalanceVisible, setIsBalanceVisible] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionCount, setTransactionCount] = useState(5); // Initial transaction count

  useEffect(() => {
    if (!user?.id) {
      navigate('/auth');
      return;
    }

    fetchData();
  }, [user?.id, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      setBalance(profileData?.balance || 0);

      // Fetch recent transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(transactionCount);

      if (transactionsError) {
        throw transactionsError;
      }

      setTransactions(transactionsData || []);

    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth');
      toast({
        title: "Succès",
        description: "Déconnexion réussie",
      });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la déconnexion",
        variant: "destructive"
      });
    }
  };

  const toggleBalanceVisibility = () => {
    setIsBalanceVisible(!isBalanceVisible);
  };

  const loadMoreTransactions = () => {
    setTransactionCount(prevCount => prevCount + 5);
    fetchData(); // Re-fetch data with increased transaction count
  };

  const formatBalanceDisplay = () => {
    if (!isBalanceVisible) {
      return "••••••••";
    }
    return formatCurrency(balance);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6 rounded-b-2xl shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold">
              Bonjour {profile?.full_name || 'Utilisateur'} 👋
            </h1>
            <p className="text-blue-100">
              Bienvenue sur votre tableau de bord
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
            >
              Déconnexion
            </Button>
          </div>
        </div>

        {/* Balance Card */}
        <Card className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-medium text-blue-100">Solde disponible</h2>
            <Button
              onClick={toggleBalanceVisibility}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
            >
              {isBalanceVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-3xl font-bold text-yellow-200">{formatBalanceDisplay()}</p>
          <p className="text-blue-100 text-sm mt-1">Dernière mise à jour: {new Date().toLocaleTimeString()}</p>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="p-6">
        <h2 className="text-gray-700 font-semibold mb-4">Actions rapides</h2>
        <div className="grid grid-cols-2 gap-4">
          <Button variant="secondary" className="flex items-center justify-center space-x-2" onClick={() => navigate('/transfer')}>
            <ArrowUpRight className="w-4 h-4" />
            <span>Envoyer</span>
          </Button>
          <Button variant="secondary" className="flex items-center justify-center space-x-2" onClick={() => navigate('/deposit')}>
            <ArrowDownLeft className="w-4 h-4" />
            <span>Déposer</span>
          </Button>
          <Button variant="secondary" className="flex items-center justify-center space-x-2" onClick={() => navigate('/qr-code')}>
            <QrCode className="w-4 h-4" />
            <span>QR Code</span>
          </Button>
          <Button variant="secondary" className="flex items-center justify-center space-x-2" onClick={() => navigate('/transactions')}>
            <History className="w-4 h-4" />
            <span>Historique</span>
          </Button>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="p-6">
        <h2 className="text-gray-700 font-semibold mb-4">Transactions récentes</h2>
        {loading ? (
          <div className="text-center">Chargement...</div>
        ) : (
          <ul className="space-y-3">
            {transactions.map(transaction => (
              <Card key={transaction.id} className="bg-white shadow-sm">
                <CardContent className="flex items-center justify-between p-3">
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-gray-500">{new Date(transaction.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'deposit' ? '+' : '-'} {formatCurrency(transaction.amount)}
                    </p>
                    <Badge variant="secondary">{transaction.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </ul>
        )}
        {/* Load More Button */}
        {transactions.length > 0 && (
          <div className="text-center mt-4">
            <Button variant="outline" onClick={loadMoreTransactions} disabled={loading}>
              Charger plus
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileAgentDashboard;
