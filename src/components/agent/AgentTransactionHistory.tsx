
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils/currency';
import { History, Eye, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';

interface Transaction {
  id: string;
  created_at: string;
  amount: number;
  type: string;
  status: string;
  description?: string;
  sender_id?: string;
  receiver_id?: string;
}

interface AgentTransactionHistoryProps {
  transactions: Transaction[];
}

const AgentTransactionHistory: React.FC<AgentTransactionHistoryProps> = ({ transactions }) => {
  const { user } = useAuth();
  const [localTransactions, setLocalTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use provided transactions or fetch from recharges/withdrawals tables
    if (transactions && transactions.length > 0) {
      setLocalTransactions(transactions);
      setLoading(false);
    } else {
      fetchTransactions();
    }
  }, [transactions, user?.id]);

  const fetchTransactions = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Fetch recharges and withdrawals instead of transactions table
      const [rechargesResponse, withdrawalsResponse] = await Promise.all([
        supabase
          .from('recharges')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('withdrawals')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      const recharges = (rechargesResponse.data || []).map(r => ({
        id: r.id,
        created_at: r.created_at,
        amount: r.amount,
        type: 'recharge',
        status: r.status,
        description: `Recharge via ${r.payment_provider}`,
        sender_id: r.user_id,
        receiver_id: r.user_id
      }));

      const withdrawals = (withdrawalsResponse.data || []).map(w => ({
        id: w.id,
        created_at: w.created_at,
        amount: w.amount,
        type: 'withdrawal',
        status: w.status,
        description: `Retrait vers ${w.withdrawal_phone}`,
        sender_id: w.user_id,
        receiver_id: w.user_id
      }));

      const allTransactions = [...recharges, ...withdrawals]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      setLocalTransactions(allTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'recharge':
        return <ArrowDownLeft className="w-4 h-4 text-green-600" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Historique des Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Historique des Transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {localTransactions.length > 0 ? (
          <div className="space-y-4">
            {localTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getTransactionIcon(transaction.type)}
                  <div>
                    <p className="font-medium text-sm">
                      {transaction.description || `${transaction.type} - ${formatCurrency(transaction.amount)}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.created_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="font-semibold">
                    {formatCurrency(transaction.amount)}
                  </span>
                  <Badge className={getStatusColor(transaction.status)}>
                    {transaction.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune transaction
            </h3>
            <p className="text-gray-500">
              Vos transactions récentes apparaîtront ici.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AgentTransactionHistory;
