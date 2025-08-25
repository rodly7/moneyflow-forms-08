
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Download,
  Receipt,
  Plus,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { useCompleteTransactions } from '@/hooks/useCompleteTransactions';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const CompleteRecentTransactions = () => {
  const { user } = useAuth();
  const { transactions, loading } = useCompleteTransactions(user?.id);
  const navigate = useNavigate();

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <Plus className="w-4 h-4 text-green-600" />;
      case 'withdrawal':
        return <Download className="w-4 h-4 text-red-600" />;
      case 'transfer_sent':
        return <ArrowUpRight className="w-4 h-4 text-orange-600" />;
      case 'transfer_received':
        return <ArrowDownLeft className="w-4 h-4 text-green-600" />;
      case 'bill_payment':
        return <Receipt className="w-4 h-4 text-purple-600" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-3 h-3 text-green-600" />;
      case 'pending':
        return <Clock className="w-3 h-3 text-yellow-600" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="w-3 h-3 text-red-600" />;
      default:
        return <Clock className="w-3 h-3 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Dépôt';
      case 'withdrawal':
        return 'Retrait';
      case 'transfer_sent':
        return 'Transfert envoyé';
      case 'transfer_received':
        return 'Transfert reçu';
      case 'bill_payment':
        return 'Paiement facture';
      default:
        return type;
    }
  };

  const getAmountColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'transfer_received':
        return 'text-green-600';
      case 'withdrawal':
      case 'transfer_sent':
      case 'bill_payment':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getAmountPrefix = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'transfer_received':
        return '+';
      case 'withdrawal':
      case 'transfer_sent':
      case 'bill_payment':
        return '-';
      default:
        return '';
    }
  };

  if (loading) {
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Transactions récentes
        </CardTitle>
        {transactions.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/transactions')}
          >
            Voir tout
          </Button>
        )}
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
              <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-white border">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{getTypeLabel(transaction.type)}</span>
                      {getStatusIcon(transaction.status)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Badge variant="outline" className={getStatusColor(transaction.status)}>
                        {transaction.status === 'completed' ? 'Réussi' : 
                         transaction.status === 'pending' ? 'En attente' : 
                         transaction.status === 'failed' ? 'Échoué' : 'Annulé'}
                      </Badge>
                      <span>{transaction.date.toLocaleDateString('fr-FR')}</span>
                      <span>{transaction.date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {(transaction.sender || transaction.recipient) && (
                      <div className="text-xs text-gray-500 mt-1">
                        {transaction.sender && `De: ${transaction.sender}`}
                        {transaction.recipient && `Vers: ${transaction.recipient}`}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${getAmountColor(transaction.type)}`}>
                    {getAmountPrefix(transaction.type)}{transaction.amount.toLocaleString()} {transaction.currency}
                  </div>
                  {transaction.fees && transaction.fees > 0 && (
                    <div className="text-xs text-gray-500">
                      Frais: {transaction.fees.toLocaleString()} XAF
                    </div>
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

export default CompleteRecentTransactions;
