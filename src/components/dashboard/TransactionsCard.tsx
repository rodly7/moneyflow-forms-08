
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard, 
  Receipt,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useRealtimeTransactions } from '@/hooks/useRealtimeTransactions';
import { useAuth } from '@/contexts/AuthContext';

const TransactionsCard = () => {
  const { user } = useAuth();
  const { transactions, isLoading } = useRealtimeTransactions(user?.id);

  console.log("🎯 TransactionsCard - user:", user?.id, "transactions:", transactions.length, "isLoading:", isLoading);

  const getTransactionIcon = (type: string, impact?: string) => {
    switch (type) {
      case 'transfer_sent':
        return <ArrowUpRight className="w-4 h-4 text-red-600" />;
      case 'transfer_received':
        return <ArrowDownLeft className="w-4 h-4 text-green-600" />;
      case 'deposit':
        return <ArrowDownLeft className="w-4 h-4 text-green-600" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-4 h-4 text-red-600" />;
      case 'bill_payment':
        return <Receipt className="w-4 h-4 text-orange-600" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  const getTransactionMessage = (type: string, amount: number, recipient_name?: string, sender_name?: string, withdrawal_phone?: string) => {
    const formattedAmount = amount.toLocaleString();
    
    switch (type) {
      case 'transfer_sent':
        return `Transfert envoyé de ${formattedAmount} XAF${recipient_name ? ` vers ${recipient_name}` : ''}`;
      case 'transfer_received':
        return `Transfert reçu de ${formattedAmount} XAF${sender_name ? ` de ${sender_name}` : ''}`;
      case 'deposit':
        return `Recharge de ${formattedAmount} XAF effectuée`;
      case 'withdrawal':
        return `Retrait de ${formattedAmount} XAF${withdrawal_phone ? ` vers ${withdrawal_phone}` : ''}`;
      case 'bill_payment':
        return `Paiement de facture de ${formattedAmount} XAF`;
      default:
        return `Transaction de ${formattedAmount} XAF`;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-3 h-3 text-green-600" />;
      case 'pending':
      case 'agent_pending':
        return <Clock className="w-3 h-3 text-yellow-600" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="w-3 h-3 text-red-600" />;
      default:
        return <AlertCircle className="w-3 h-3 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'agent_pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Complété';
      case 'pending':
        return 'En attente';
      case 'agent_pending':
        return 'Agent en attente';
      case 'failed':
        return 'Échoué';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  };

  const getAmountColor = (impact?: string) => {
    if (impact === 'credit') return 'text-green-600';
    if (impact === 'debit') return 'text-red-600';
    return 'text-gray-600';
  };

  const getAmountPrefix = (impact?: string) => {
    if (impact === 'credit') return '+';
    if (impact === 'debit') return '-';
    return '';
  };

  if (isLoading) {
    console.log("⏳ TransactionsCard - Affichage du loader");
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Transactions récentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="space-y-1">
                    <div className="w-32 h-4 bg-gray-200 rounded"></div>
                    <div className="w-24 h-3 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  console.log("📋 TransactionsCard - Rendu des transactions:", transactions.length);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Transactions récentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Aucune transaction récente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.slice(0, 5).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-white border">
                    {getTransactionIcon(transaction.type, transaction.impact)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">
                        {getTransactionMessage(
                          transaction.type, 
                          transaction.amount, 
                          transaction.recipient_full_name,
                          transaction.sender_name,
                          transaction.withdrawal_phone
                        )}
                      </p>
                      {getStatusIcon(transaction.status)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getStatusColor(transaction.status)}`}
                      >
                        {getStatusLabel(transaction.status)}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {transaction.date.toLocaleDateString('fr-FR')}
                      </span>
                      {transaction.verification_code && transaction.showCode && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                          Code: {transaction.verification_code}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${getAmountColor(transaction.impact)}`}>
                    {getAmountPrefix(transaction.impact)}{transaction.amount.toLocaleString()} {transaction.currency}
                  </p>
                  {transaction.fees && transaction.fees > 0 && (
                    <p className="text-xs text-gray-500">
                      Frais: {transaction.fees.toLocaleString()} XAF
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionsCard;
