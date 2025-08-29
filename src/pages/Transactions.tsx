
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { CreditCard, Minus, Plus, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
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
      {/* Bouton de retour */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Button>
        <h1 className="text-2xl font-bold">Historique des Transactions</h1>
      </div>

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
            Toutes vos opérations financières avec messages détaillés
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
                    className="flex flex-col p-6 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer space-y-4"
                    onClick={() => openTransactionDetail(transaction)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-full bg-muted">
                          {getTransactionIcon(transaction.type, transaction.impact)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
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

                    {/* Message complet de la transaction */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-l-4 border-blue-500">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <CreditCard className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800 mb-2">Message de la transaction</h4>
                          <p className="text-sm text-gray-700 leading-relaxed mb-3">
                            {transaction.description}
                          </p>
                          
                          <div className="space-y-2">
                            {transaction.verification_code && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-600">Code de vérification:</span>
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                  {transaction.verification_code}
                                </Badge>
                              </div>
                            )}

                            {transaction.sender_name && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-600">Expéditeur:</span>
                                <span className="text-xs text-gray-700">{transaction.sender_name}</span>
                              </div>
                            )}

                            {transaction.recipient_full_name && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-600">Destinataire:</span>
                                <span className="text-xs text-gray-700">{transaction.recipient_full_name}</span>
                              </div>
                            )}

                            {transaction.withdrawal_phone && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-600">Téléphone de retrait:</span>
                                <span className="text-xs text-gray-700">{transaction.withdrawal_phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
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
