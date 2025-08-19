
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowDownLeft, ArrowUpRight, CreditCard, Receipt, Minus, Plus, Download, ArrowRightLeft } from "lucide-react";
import { useAllTransactions } from "@/hooks/useAllTransactions";
import { useState } from "react";
import TransactionDetailModal from "@/components/transactions/TransactionDetailModal";

const Transactions = () => {
  const { user } = useAuth();
  const { transactions, loading } = useAllTransactions(user?.id);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openTransactionDetail = (transaction: any) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const closeTransactionDetail = () => {
    setSelectedTransaction(null);
    setIsModalOpen(false);
  };

  const getTransactionIcon = (type: string, impact: string) => {
    switch (type) {
      case 'withdrawal':
        return <Download className="w-5 h-5 text-red-600" />;
      case 'transfer_sent':
        return <ArrowUpRight className="w-5 h-5 text-orange-600" />;
      case 'transfer_received':
        return <ArrowDownLeft className="w-5 h-5 text-green-600" />;
      case 'deposit':
        return <Plus className="w-5 h-5 text-blue-600" />;
      case 'bill_payment':
        return <Receipt className="w-5 h-5 text-purple-600" />;
      default:
        return <CreditCard className="w-5 h-5 text-gray-600" />;
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
      <div className="container mx-auto p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Chargement des transactions...</CardTitle>
          </CardHeader>
          <CardContent>
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
    <div className="container mx-auto p-4 space-y-6">
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

      {/* Liste des transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Historique Complet des Transactions</CardTitle>
          <p className="text-sm text-muted-foreground">
            Toutes vos opérations financières : dépôts, retraits, transferts et paiements
          </p>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-muted-foreground mb-2">Aucune transaction trouvée</p>
              <p className="text-sm text-muted-foreground">
                Vos dépôts, retraits, transferts et paiements apparaîtront ici
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction, index) => (
                <div key={transaction.id}>
                  <div 
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => openTransactionDetail(transaction)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-full bg-muted">
                        {getTransactionIcon(transaction.type, transaction.impact)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{transaction.description}</h3>
                          <Badge className={getStatusColor(transaction.status)}>
                            {transaction.status === 'completed' ? 'Complété' : 
                             transaction.status === 'pending' ? 'En attente' : 
                             transaction.status}
                          </Badge>
                          <Badge variant={transaction.impact === 'credit' ? 'default' : 'destructive'}>
                            {transaction.impact === 'credit' ? 'Entrée' : 'Sortie'}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          {formatDate(transaction.date)}
                        </p>
                        
                        {transaction.verification_code && (
                          <p className="text-xs text-muted-foreground">
                            Code: {transaction.verification_code}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`font-semibold text-lg ${
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
                  
                  {index < transactions.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal des détails */}
      <TransactionDetailModal 
        transaction={selectedTransaction}
        isVisible={isModalOpen}
        onClose={closeTransactionDetail}
      />
    </div>
  );
};

export default Transactions;
