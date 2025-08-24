
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Minus, Plus, Eye } from "lucide-react";
import { useAllTransactions } from "@/hooks/useAllTransactions";
import { useState } from "react";
import TransactionDetailModal from "@/components/transactions/TransactionDetailModal";
import { 
  getTransactionIcon, 
  getTransactionTypeLabel, 
  getStatusColor, 
  getStatusLabel 
} from "@/components/transactions/TransactionTypeUtils";

const Transactions = () => {
  const { user } = useAuth();
  const { transactions, loading } = useAllTransactions(user?.id);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  console.log("🎯 Transactions Page - user:", user?.id, "transactions:", transactions.length, "loading:", loading);

  const openTransactionDetail = (transaction: any) => {
    console.log("📖 Opening transaction detail:", transaction);
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const closeTransactionDetail = () => {
    setSelectedTransaction(null);
    setIsModalOpen(false);
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
              Solde Net
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(totalCredits - totalDebits) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(totalCredits - totalDebits).toLocaleString()} XAF
            </div>
            <p className="text-sm text-muted-foreground">
              {transactions.length} transactions totales
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-6 h-6" />
            Toutes vos Transactions
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Historique complet de toutes vos opérations financières
          </p>
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
            <div className="space-y-4">
              {transactions.map((transaction, index) => (
                <div key={transaction.id}>
                  <div 
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer group"
                    onClick={() => openTransactionDetail(transaction)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-3 rounded-full bg-muted group-hover:bg-background transition-colors">
                        {getTransactionIcon(transaction.type, transaction.impact)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-semibold text-lg">{transaction.description}</h3>
                          <Badge className={getStatusColor(transaction.status)}>
                            {getStatusLabel(transaction.status)}
                          </Badge>
                          <Badge variant={transaction.impact === 'credit' ? 'default' : 'destructive'}>
                            {transaction.impact === 'credit' ? '↗️ Entrée' : '↙️ Sortie'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                          <span className="font-medium">{formatDate(transaction.date)}</span>
                          <Badge variant="outline" className="text-xs">
                            {getTransactionTypeLabel(transaction.type)}
                          </Badge>
                          {transaction.reference_id && (
                            <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                              Réf: {transaction.reference_id.substring(0, 8)}
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                          {transaction.verification_code && (
                            <div className="bg-blue-50 p-2 rounded flex items-center gap-1">
                              <span className="text-blue-600">🔒 Code:</span>
                              <span className="font-mono font-bold text-blue-800">{transaction.verification_code}</span>
                            </div>
                          )}

                          {transaction.sender_name && (
                            <div className="bg-green-50 p-2 rounded">
                              <span className="text-green-600">👤 De:</span> {transaction.sender_name}
                            </div>
                          )}

                          {transaction.recipient_full_name && (
                            <div className="bg-orange-50 p-2 rounded">
                              <span className="text-orange-600">👤 Vers:</span> {transaction.recipient_full_name}
                            </div>
                          )}

                          {transaction.withdrawal_phone && (
                            <div className="bg-purple-50 p-2 rounded">
                              <span className="text-purple-600">📱 Tél:</span> {transaction.withdrawal_phone}
                            </div>
                          )}

                          {transaction.recipient_phone && (
                            <div className="bg-indigo-50 p-2 rounded">
                              <span className="text-indigo-600">📱 Destinataire:</span> {transaction.recipient_phone}
                            </div>
                          )}

                          {transaction.fees && transaction.fees > 0 && (
                            <div className="bg-red-50 p-2 rounded">
                              <span className="text-red-600">💰 Frais:</span> {transaction.fees.toLocaleString()} XAF
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right flex flex-col items-end gap-2">
                      <div className={`font-bold text-xl ${
                        transaction.impact === 'credit' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {transaction.impact === 'credit' ? '+' : '-'}
                        {transaction.amount.toLocaleString()} {transaction.currency}
                      </div>
                      
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Eye className="w-4 h-4" />
                        <span className="text-xs">Voir détails</span>
                      </div>
                    </div>
                  </div>
                  
                  {index < transactions.length - 1 && <Separator className="my-2" />}
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
