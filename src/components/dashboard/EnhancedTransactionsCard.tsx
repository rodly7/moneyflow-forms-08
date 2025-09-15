
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
import { useAllTransactions } from '@/hooks/useAllTransactions';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const EnhancedTransactionsCard = () => {
  const { user } = useAuth();
  const { transactions, loading } = useAllTransactions(user?.id);
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
      case 'merchant_payment':
        return <CreditCard className="w-4 h-4 text-purple-600" />;
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

  const handleViewAll = () => {
    navigate('/transactions');
  };

  if (loading) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
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

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <CreditCard className="w-6 h-6" />
          Transactions récentes
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
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Aucune transaction récente</p>
            <p className="text-sm">Vos transactions apparaîtront ici</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.slice(0, 5).map((transaction) => (
              <div key={transaction.id} className="flex flex-col p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-white border-2 shadow-sm">
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
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-lg ${getAmountColor(transaction.impact)}`}>
                      {getAmountPrefix(transaction.impact)}{transaction.amount.toLocaleString()} {transaction.currency}
                    </p>
                    {transaction.fees && transaction.fees > 0 && (
                      <p className="text-xs text-gray-500">
                        Frais: {transaction.fees.toLocaleString()} XAF
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Message détaillé de la transaction */}
                <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <CreditCard className="w-3 h-3 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 mb-2">
                        {transaction.description}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                        <span>{transaction.date.toLocaleDateString('fr-FR')}</span>
                        <span>{transaction.date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      
                      <div className="space-y-1">
                        {transaction.verification_code && (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                              Code: {transaction.verification_code}
                            </Badge>
                          </div>
                        )}
                        {transaction.sender_name && (
                          <p className="text-xs text-gray-600">
                            <span className="font-medium">De:</span> {transaction.sender_name}
                          </p>
                        )}
                        {transaction.recipient_full_name && (
                          <p className="text-xs text-gray-600">
                            <span className="font-medium">Vers:</span> {transaction.recipient_full_name}
                          </p>
                        )}
                        {transaction.withdrawal_phone && (
                          <p className="text-xs text-gray-600">
                            <span className="font-medium">Téléphone:</span> {transaction.withdrawal_phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedTransactionsCard;
