
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useAllTransactions } from '@/hooks/useAllTransactions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, CreditCard, Plus, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  getTransactionIcon, 
  getTransactionTypeLabel, 
  getStatusColor, 
  getStatusLabel 
} from '@/components/transactions/TransactionTypeUtils';

const SubAdminStatsTab = () => {
  const { user } = useAuth();
  const { transactions, loading } = useAllTransactions(user?.id);

  console.log("🎯 SubAdminStatsTab - user:", user?.id, "transactions:", transactions.length, "loading:", loading);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Calculer les totaux
  const creditTransactions = transactions.filter(t => t.impact === 'credit');
  const debitTransactions = transactions.filter(t => t.impact === 'debit');
  
  const totalCredits = creditTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalDebits = debitTransactions.reduce((sum, t) => sum + t.amount, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Résumé financier */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Plus className="w-5 h-5" />
              Entrées (Crédits)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalCredits.toLocaleString()} XAF</div>
            <p className="text-sm text-muted-foreground">{creditTransactions.length} opérations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Minus className="w-5 h-5" />
              Sorties (Débits)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalDebits.toLocaleString()} XAF</div>
            <p className="text-sm text-muted-foreground">{debitTransactions.length} opérations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Total Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
            <p className="text-sm text-muted-foreground">
              Solde net: {(totalCredits - totalDebits).toLocaleString()} XAF
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions récentes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Transactions récentes
          </CardTitle>
          <Link to="/transactions">
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-1" />
              Voir tout
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-muted-foreground mb-2">Aucune transaction trouvée</p>
              <p className="text-sm text-muted-foreground">
                Vos transactions apparaîtront ici une fois que vous effectuerez des opérations
              </p>
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
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-medium text-sm">{transaction.description}</h3>
                        <Badge className={getStatusColor(transaction.status)}>
                          {getStatusLabel(transaction.status)}
                        </Badge>
                        <Badge variant={transaction.impact === 'credit' ? 'default' : 'destructive'}>
                          {transaction.impact === 'credit' ? 'Entrée' : 'Sortie'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {getTransactionTypeLabel(transaction.type)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{formatDate(transaction.date)}</span>
                        {transaction.reference_id && (
                          <span className="text-xs font-mono">
                            Réf: {transaction.reference_id.substring(0, 8)}
                          </span>
                        )}
                      </div>
                      
                      {transaction.verification_code && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Code: {transaction.verification_code}
                        </p>
                      )}

                      {transaction.sender_name && (
                        <p className="text-xs text-muted-foreground mt-1">
                          De: {transaction.sender_name}
                        </p>
                      )}

                      {transaction.recipient_full_name && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Vers: {transaction.recipient_full_name}
                        </p>
                      )}

                      {transaction.withdrawal_phone && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Téléphone: {transaction.withdrawal_phone}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`font-semibold ${
                      transaction.impact === 'credit' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {transaction.impact === 'credit' ? '+' : '-'}
                      {transaction.amount.toLocaleString()} {transaction.currency}
                    </div>
                    
                    {transaction.fees && transaction.fees > 0 && (
                      <div className="text-xs text-muted-foreground">
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
    </div>
  );
};

export default SubAdminStatsTab;
