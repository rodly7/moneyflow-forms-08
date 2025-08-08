import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownLeft, Eye, History, CreditCard, Plus } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface Transaction {
  id: string;
  type: 'sent' | 'received' | 'withdrawal' | 'deposit' | 'bill_payment';
  amount: number;
  description: string;
  date: string;
  status: string;
}

const EnhancedTransactionsCard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Récupérer les transferts envoyés
  const { data: sentTransfers } = useQuery({
    queryKey: ['sent-transfers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('transfers')
        .select('*')
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Récupérer les transferts reçus
  const { data: receivedTransfers } = useQuery({
    queryKey: ['received-transfers-history', user?.id],
    queryFn: async () => {
      if (!user?.phone) return [];
      
      const { data, error } = await supabase
        .from('transfers')
        .select('*')
        .eq('recipient_phone', user.phone)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.phone,
  });

  // Récupérer les retraits
  const { data: withdrawals } = useQuery({
    queryKey: ['withdrawals-history', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Récupérer les dépôts/recharges
  const { data: deposits } = useQuery({
    queryKey: ['deposits-history', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('recharges')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Récupérer les paiements de factures depuis bill_payment_history
  const { data: billPayments } = useQuery({
    queryKey: ['bill-payments-history', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('bill_payment_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Combiner et trier toutes les transactions
  const allTransactions: Transaction[] = React.useMemo(() => {
    const transactions: Transaction[] = [];

    // Ajouter les transferts envoyés
    sentTransfers?.forEach(transfer => {
      transactions.push({
        id: `sent_${transfer.id}`,
        type: 'sent',
        amount: transfer.amount,
        description: `Envoyé à ${transfer.recipient_full_name || transfer.recipient_phone}`,
        date: transfer.created_at,
        status: transfer.status
      });
    });

    // Ajouter les transferts reçus
    receivedTransfers?.forEach(transfer => {
      transactions.push({
        id: `received_${transfer.id}`,
        type: 'received',
        amount: transfer.amount,
        description: `Reçu de ${transfer.recipient_full_name || 'un expéditeur'}`,
        date: transfer.created_at,
        status: transfer.status
      });
    });

    // Ajouter les retraits
    withdrawals?.forEach(withdrawal => {
      transactions.push({
        id: `withdrawal_${withdrawal.id}`,
        type: 'withdrawal',
        amount: withdrawal.amount,
        description: `Retrait vers ${withdrawal.withdrawal_phone}`,
        date: withdrawal.created_at,
        status: withdrawal.status
      });
    });

    // Ajouter les dépôts
    deposits?.forEach(deposit => {
      transactions.push({
        id: `deposit_${deposit.id}`,
        type: 'deposit',
        amount: deposit.amount,
        description: `Dépôt ${deposit.payment_method || 'mobile money'}`,
        date: deposit.created_at,
        status: deposit.status
      });
    });

    // Ajouter les paiements de factures
    billPayments?.forEach(payment => {
      transactions.push({
        id: `bill_${payment.id}`,
        type: 'bill_payment',
        amount: payment.amount,
        description: `Paiement de facture`,
        date: payment.payment_date,
        status: payment.status
      });
    });

    // Trier par date décroissante et prendre les 5 plus récentes
    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [sentTransfers, receivedTransfers, withdrawals, deposits, billPayments]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'sent':
        return <ArrowUpRight className="w-4 h-4 text-red-500" />;
      case 'received':
        return <ArrowDownLeft className="w-4 h-4 text-green-500" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-4 h-4 text-blue-500" />;
      case 'deposit':
        return <Plus className="w-4 h-4 text-green-500" />;
      case 'bill_payment':
        return <CreditCard className="w-4 h-4 text-orange-500" />;
      default:
        return <History className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'sent':
      case 'withdrawal':
      case 'bill_payment':
        return 'text-red-600';
      case 'received':
      case 'deposit':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getAmountPrefix = (type: string) => {
    switch (type) {
      case 'sent':
      case 'withdrawal':
      case 'bill_payment':
        return '-';
      case 'received':
      case 'deposit':
        return '+';
      default:
        return '';
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'sent':
        return 'Envoi';
      case 'received':
        return 'Reçu';
      case 'withdrawal':
        return 'Retrait';
      case 'deposit':
        return 'Dépôt';
      case 'bill_payment':
        return 'Facture';
      default:
        return 'Transaction';
    }
  };

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <History className="w-4 h-4" />
            Historique récent
          </CardTitle>
          <button
            onClick={() => navigate('/transactions')}
            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
          >
            <Eye className="w-3 h-3" />
            Voir tout
          </button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {allTransactions.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <History className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Aucune transaction récente</p>
            </div>
          ) : (
            allTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-full">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700 font-medium">
                        {getTransactionTypeLabel(transaction.type)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {transaction.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.date).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${getTransactionColor(transaction.type)}`}>
                    {getAmountPrefix(transaction.type)}{formatCurrency(transaction.amount, 'XAF')}
                  </p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    transaction.status === 'completed' 
                      ? 'bg-green-100 text-green-700' 
                      : transaction.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {transaction.status === 'completed' ? 'Terminé' : 
                     transaction.status === 'pending' ? 'En cours' : transaction.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedTransactionsCard;
