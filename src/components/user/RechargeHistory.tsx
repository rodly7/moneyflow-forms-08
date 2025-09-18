import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Transaction {
  id: string;
  amount: number;
  status: string;
  operation_type: string;
  payment_method: string;
  created_at: string;
  updated_at: string;
  request_type: string;
  payment_phone: string;
  notes: string;
  processed_at: string;
  processed_by: string;
  rejection_reason: string;
  user_id: string;
}

interface RechargeHistoryProps {
  onBack?: () => void;
}

const RechargeHistory = ({ onBack }: RechargeHistoryProps) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('user_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user?.id]);

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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Complété';
      case 'pending':
        return 'En cours';
      case 'failed':
        return 'Échoué';
      default:
        return 'Inconnu';
    }
  };

  const formatAmount = (amount: number, type: string) => {
    const sign = type === 'recharge' ? '+' : '-';
    return `${sign}${amount.toLocaleString()} XAF`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="p-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <h1 className="text-lg font-semibold">Historique des transactions</h1>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchTransactions}
            disabled={isLoading}
            className="ml-auto"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="space-y-2 text-right">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-gray-400 text-2xl">💳</span>
            </div>
            <p className="text-gray-500 text-lg">Aucune transaction trouvée</p>
            <p className="text-gray-400 text-sm mt-2">Vos recharges et retraits apparaîtront ici</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <Card key={transaction.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Icône selon le type */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.operation_type === 'recharge' 
                          ? 'bg-green-100' 
                          : 'bg-blue-100'
                      }`}>
                        <span className="text-lg">
                          {transaction.operation_type === 'recharge' ? '📥' : '📤'}
                        </span>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">
                            {transaction.operation_type === 'recharge' 
                              ? 'Transfert envoyé vers' 
                              : 'Paiement par scanner de'
                            }
                          </p>
                          <Badge className={getStatusColor(transaction.status)}>
                            {getStatusText(transaction.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(transaction.created_at), { 
                            addSuffix: true, 
                            locale: fr 
                          })}
                        </p>
                        <p className="text-xs text-gray-400">
                          Vers: {transaction.payment_method}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.operation_type === 'recharge' && transaction.status === 'completed'
                          ? 'text-green-600' 
                          : transaction.operation_type === 'withdrawal' && transaction.status === 'completed'
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }`}>
                        {formatAmount(transaction.amount, transaction.operation_type)}
                      </p>
                      <p className="text-xs text-gray-400">
                        Frais: 0 XAF
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RechargeHistory;