import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils/currency';
import { useToast } from '@/hooks/use-toast';
import { History, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react';

interface Transaction {
  id: string;
  created_at: string;
  amount: number;
  type: string;
  status: string;
  description: string;
  sender_id: string;
  receiver_id: string;
}

const AgentTransactionHistory = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTransactions();
  }, [user?.id]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      if (!user?.id) {
        console.warn("User ID is missing.");
        return;
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching transactions:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger l'historique des transactions",
          variant: "destructive",
        });
      } else {
        setTransactions(data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshTransactions = async () => {
    await fetchTransactions();
    toast({
      title: "Succès",
      description: "Historique des transactions mis à jour.",
    });
  };

  return (
    <Card className="min-h-[600px]">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-xl font-bold">
          <History className="w-5 h-5 mr-2 inline-block" />
          Historique des Transactions
        </CardTitle>
        <Button onClick={refreshTransactions} disabled={loading} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Rafraîchir
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <p>Chargement des transactions...</p>
          </div>
        ) : transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{transaction.type}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{transaction.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className={`text-sm font-medium ${transaction.type === 'deposit' ? 'text-green-500' : 'text-red-500'}`}>
                        {transaction.type === 'deposit' ? '+' : '-'} {formatCurrency(transaction.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Badge variant={transaction.status === 'completed' ? 'success' : transaction.status === 'pending' ? 'secondary' : 'destructive'}>
                        {transaction.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-48">
            <p>Aucune transaction disponible.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AgentTransactionHistory;
