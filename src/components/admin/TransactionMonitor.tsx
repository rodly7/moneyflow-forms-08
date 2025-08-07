
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, RefreshCw, TrendingUp } from "lucide-react";
// Helper function to format currency
const formatCurrency = (amount: number, currency: string = 'XAF') => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0
  }).format(amount);
};
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Transaction {
  id: string;
  type: 'transfer' | 'withdrawal' | 'deposit';
  amount: number;
  status: string;
  created_at: string;
  sender_name?: string;
  recipient_name?: string;
  phone?: string;
}

const TransactionMonitor = () => {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  const { data: transactions, isLoading, refetch } = useQuery({
    queryKey: ['admin-transactions', timeRange],
    queryFn: async () => {
      const now = new Date();
      let startDate = new Date();
      
      switch (timeRange) {
        case '1h':
          startDate.setHours(now.getHours() - 1);
          break;
        case '24h':
          startDate.setDate(now.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
      }

      // Récupérer les transferts
      const { data: transfers } = await supabase
        .from('transfers')
        .select(`
          id,
          amount,
          status,
          created_at,
          sender_id,
          recipient_full_name
        `)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      // Récupérer les retraits
      const { data: withdrawals } = await supabase
        .from('withdrawals')
        .select(`
          id,
          amount,
          status,
          created_at,
          user_id,
          withdrawal_phone
        `)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      // Récupérer les recharges
      const { data: recharges } = await supabase
        .from('recharges')
        .select(`
          id,
          amount,
          status,
          created_at,
          user_id,
          payment_phone
        `)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      // Combiner et formater toutes les transactions
      const allTransactions: Transaction[] = [
        ...(transfers?.map(t => ({
          id: t.id,
          type: 'transfer' as const,
          amount: t.amount,
          status: t.status,
          created_at: t.created_at,
          recipient_name: t.recipient_full_name,
        })) || []),
        ...(withdrawals?.map(w => ({
          id: w.id,
          type: 'withdrawal' as const,
          amount: w.amount,
          status: w.status,
          created_at: w.created_at,
          phone: w.withdrawal_phone,
        })) || []),
        ...(recharges?.map(r => ({
          id: r.id,
          type: 'deposit' as const,
          amount: r.amount,
          status: r.status,
          created_at: r.created_at,
          phone: r.payment_phone,
        })) || []),
      ];

      return allTransactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    refetchInterval: autoRefresh ? 5000 : false, // Rafraîchir toutes les 5 secondes si activé
  });

  const getTransactionIcon = (type: string, status: string) => {
    if (status === 'pending') return <Clock className="w-4 h-4 text-yellow-500" />;
    if (status === 'completed') return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (status === 'failed') return <XCircle className="w-4 h-4 text-red-500" />;
    
    if (type === 'transfer') return <ArrowUpRight className="w-4 h-4 text-blue-500" />;
    if (type === 'withdrawal') return <ArrowDownLeft className="w-4 h-4 text-red-500" />;
    if (type === 'deposit') return <TrendingUp className="w-4 h-4 text-green-500" />;
    
    return <Clock className="w-4 h-4 text-gray-500" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Complété</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">En attente</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Échoué</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const calculateStats = () => {
    if (!transactions) return { total: 0, completed: 0, pending: 0, failed: 0, volume: 0 };
    
    const stats = transactions.reduce((acc, t) => {
      acc.total += 1;
      acc[t.status as keyof typeof acc] = (acc[t.status as keyof typeof acc] || 0) + 1;
      if (t.status === 'completed') {
        acc.volume += t.amount;
      }
      return acc;
    }, { total: 0, completed: 0, pending: 0, failed: 0, volume: 0 });
    
    return stats;
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      {/* En-tête avec contrôles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Monitoring des Transactions</h2>
          <p className="text-gray-600">Suivi en temps réel de toutes les opérations</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {['1h', '24h', '7d', '30d'].map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range as any)}
                className="rounded-full"
              >
                {range}
              </Button>
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`rounded-full ${autoRefresh ? 'bg-green-50 border-green-200' : ''}`}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin text-green-600' : ''}`} />
            Auto
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="rounded-full"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total</p>
                <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Complétées</p>
                <p className="text-2xl font-bold text-green-900">{stats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-sm font-medium">En attente</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">Échecs</p>
                <p className="text-2xl font-bold text-red-900">{stats.failed}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Volume</p>
                <p className="text-lg font-bold text-purple-900">{formatCurrency(stats.volume, 'XAF')}</p>
              </div>
              <ArrowUpRight className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des transactions */}
      <Card className="backdrop-blur-xl bg-white/90 shadow-2xl border border-white/50 rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-blue-600" />
            Transactions Récentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-gray-600">Chargement des transactions...</p>
            </div>
          ) : transactions && transactions.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      {getTransactionIcon(transaction.type, transaction.status)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 capitalize">
                          {transaction.type === 'transfer' ? 'Transfert' : 
                           transaction.type === 'withdrawal' ? 'Retrait' : 'Dépôt'}
                        </p>
                        {getStatusBadge(transaction.status)}
                      </div>
                      <p className="text-sm text-gray-600">
                        {format(new Date(transaction.created_at), 'PPpp', { locale: fr })}
                      </p>
                      {transaction.recipient_name && (
                        <p className="text-sm text-gray-500">Vers: {transaction.recipient_name}</p>
                      )}
                      {transaction.phone && (
                        <p className="text-sm text-gray-500">{transaction.phone}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-lg ${
                      transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'deposit' ? '+' : '-'}{formatCurrency(transaction.amount, 'XAF')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucune transaction trouvée</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionMonitor;
