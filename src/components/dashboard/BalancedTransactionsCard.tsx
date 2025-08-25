
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard, 
  Receipt,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Plus,
  Eye
} from 'lucide-react';
import { useRealtimeTransactions } from '@/hooks/useRealtimeTransactions';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const BalancedTransactionsCard = () => {
  const { user } = useAuth();
  const { transactions, isLoading } = useRealtimeTransactions(user?.id);
  const navigate = useNavigate();

  const getTransactionIcon = (type: string, impact?: string) => {
    switch (type) {
      case 'transfer_sent':
        return <ArrowUpRight className="w-4 h-4 text-red-600" />;
      case 'transfer_received':
        return <ArrowDownLeft className="w-4 h-4 text-green-600" />;
      case 'recharge':
      case 'deposit':
        return <Plus className="w-4 h-4 text-green-600" />;
      case 'withdrawal':
        return <Download className="w-4 h-4 text-red-600" />;
      case 'bill_payment':
        return <Receipt className="w-4 h-4 text-orange-600" />;
      default:
        return <CreditCard className="w-4 h-4" />;
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

  // Créer des groupes équilibrés de transactions par type
  const getBalancedTransactions = () => {
    const recharges = transactions.filter(t => t.type === 'recharge').slice(0, 2);
    const withdrawals = transactions.filter(t => t.type === 'withdrawal').slice(0, 2);
    const transfers = transactions.filter(t => t.type.includes('transfer')).slice(0, 2);
    const billPayments = transactions.filter(t => t.type === 'bill_payment').slice(0, 1);
    
    console.log('🎯 Transactions équilibrées:', {
      recharges: recharges.length,
      withdrawals: withdrawals.length, 
      transfers: transfers.length,
      billPayments: billPayments.length
    });

    const balanced = [...recharges, ...withdrawals, ...transfers, ...billPayments]
      .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
      .slice(0, 6);

    // Si pas assez de transactions équilibrées, compléter avec les plus récentes
    if (balanced.length < 6) {
      const remainingSlots = 6 - balanced.length;
      const usedIds = new Set(balanced.map(t => t.id));
      const additional = transactions
        .filter(t => !usedIds.has(t.id))
        .slice(0, remainingSlots);
      balanced.push(...additional);
    }

    return balanced;
  };

  const handleViewAll = () => {
    navigate('/transactions');
  };

  if (isLoading) {
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
            {[1, 2, 3, 4, 5, 6].map(i => (
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

  const balancedTransactions = getBalancedTransactions();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Transactions récentes
          <Badge variant="outline" className="ml-2">
            {transactions.length} total
          </Badge>
        </CardTitle>
        {transactions.length > 0 && (
          <Button 
            onClick={handleViewAll}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            Voir tout
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {balancedTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Aucune transaction récente</p>
            <p className="text-sm">Vos transactions apparaîtront ici</p>
          </div>
        ) : (
          <div className="space-y-3">
            {balancedTransactions.map((transaction) => (
              <div key={transaction.id} className="flex flex-col p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-white border">
                      {getTransactionIcon(transaction.type, transaction.impact)}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(transaction.status)}
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getStatusColor(transaction.status)}`}
                      >
                        {getStatusLabel(transaction.status)}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${transaction.impact === 'credit' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
                      >
                        {transaction.type === 'recharge' ? 'RECHARGE' : 
                         transaction.type === 'withdrawal' ? 'RETRAIT' :
                         transaction.type.includes('transfer') ? 'TRANSFERT' : 
                         transaction.type === 'bill_payment' ? 'FACTURE' : 'AUTRE'}
                      </Badge>
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
                
                {/* Message complet de la transaction */}
                <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                  <p className="text-sm font-medium text-gray-800 mb-1">
                    {transaction.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <span>{transaction.date.toLocaleDateString('fr-FR')}</span>
                    <span>{transaction.date.toLocaleTimeString('fr-FR')}</span>
                    {transaction.verification_code && transaction.showCode && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                        Code: {transaction.verification_code}
                      </Badge>
                    )}
                  </div>
                  {transaction.sender_name && (
                    <p className="text-xs text-gray-600 mt-1">
                      Expéditeur: {transaction.sender_name}
                    </p>
                  )}
                  {transaction.recipient_full_name && (
                    <p className="text-xs text-gray-600 mt-1">
                      Destinataire: {transaction.recipient_full_name}
                    </p>
                  )}
                  {transaction.withdrawal_phone && (
                    <p className="text-xs text-gray-600 mt-1">
                      Téléphone de retrait: {transaction.withdrawal_phone}
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

export default BalancedTransactionsCard;
