
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, RefreshCw, ArrowUpRight, ArrowDownLeft, Plus, CreditCard, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { useRealtimeTransactions } from "@/hooks/useRealtimeTransactions";
import { useAuth } from "@/contexts/AuthContext";

const ReliableTransactionsCard = () => {
  const { user } = useAuth();
  const { transactions, isLoading, refetch } = useRealtimeTransactions(user?.id);

  console.log("🔍 Total transactions récupérées:", transactions.length);
  console.log("📊 Types de transactions:", transactions.map(t => t.type));

  // Grouper les transactions par type pour un affichage équilibré
  const groupedTransactions = {
    recharges: transactions.filter(t => t.type === 'recharge').slice(0, 3),
    withdrawals: transactions.filter(t => t.type === 'withdrawal').slice(0, 3),
    transfers_sent: transactions.filter(t => t.type === 'transfer_sent').slice(0, 2),
    transfers_received: transactions.filter(t => t.type === 'transfer_received').slice(0, 2),
    bills: transactions.filter(t => t.type === 'bill_payment').slice(0, 2)
  };

  // Créer une liste équilibrée en prenant des éléments de chaque type
  const balancedTransactions = [
    ...groupedTransactions.recharges,
    ...groupedTransactions.withdrawals,
    ...groupedTransactions.transfers_sent,
    ...groupedTransactions.transfers_received,
    ...groupedTransactions.bills
  ].sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
  .slice(0, 8);

  console.log("⚖️ Transactions équilibrées à afficher:", balancedTransactions.length);
  console.log("📋 Répartition équilibrée:", {
    recharges: groupedTransactions.recharges.length,
    retraits: groupedTransactions.withdrawals.length,
    transferts_envoyés: groupedTransactions.transfers_sent.length,
    transferts_reçus: groupedTransactions.transfers_received.length,
    factures: groupedTransactions.bills.length
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'recharge': return <Plus className="w-4 h-4 text-green-600" />;
      case 'withdrawal': return <ArrowUpRight className="w-4 h-4 text-red-600" />;
      case 'transfer_sent': return <ArrowUpRight className="w-4 h-4 text-blue-600" />;
      case 'transfer_received': return <ArrowDownLeft className="w-4 h-4 text-green-600" />;
      case 'bill_payment': return <FileText className="w-4 h-4 text-purple-600" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'recharge': return 'bg-green-100 text-green-800';
      case 'withdrawal': return 'bg-red-100 text-red-800';
      case 'transfer_sent': return 'bg-blue-100 text-blue-800';
      case 'transfer_received': return 'bg-green-100 text-green-800';
      case 'bill_payment': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'recharge': return 'Recharge';
      case 'withdrawal': return 'Retrait';
      case 'transfer_sent': return 'Envoi';
      case 'transfer_received': return 'Réception';
      case 'bill_payment': return 'Facture';
      default: return type;
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Transactions Récentes
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {transactions.length} total
            </Badge>
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
        
        {/* Affichage du résumé par type */}
        <div className="flex flex-wrap gap-2">
          {groupedTransactions.recharges.length > 0 && (
            <Badge variant="secondary" className="bg-green-50 text-green-700">
              {groupedTransactions.recharges.length} recharge{groupedTransactions.recharges.length > 1 ? 's' : ''}
            </Badge>
          )}
          {groupedTransactions.withdrawals.length > 0 && (
            <Badge variant="secondary" className="bg-red-50 text-red-700">
              {groupedTransactions.withdrawals.length} retrait{groupedTransactions.withdrawals.length > 1 ? 's' : ''}
            </Badge>
          )}
          {groupedTransactions.transfers_sent.length > 0 && (
            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
              {groupedTransactions.transfers_sent.length} envoi{groupedTransactions.transfers_sent.length > 1 ? 's' : ''}
            </Badge>
          )}
          {groupedTransactions.transfers_received.length > 0 && (
            <Badge variant="secondary" className="bg-green-50 text-green-700">
              {groupedTransactions.transfers_received.length} réception{groupedTransactions.transfers_received.length > 1 ? 's' : ''}
            </Badge>
          )}
          {groupedTransactions.bills.length > 0 && (
            <Badge variant="secondary" className="bg-purple-50 text-purple-700">
              {groupedTransactions.bills.length} facture{groupedTransactions.bills.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : balancedTransactions.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            <Activity className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Aucune transaction récente</p>
            <p className="text-sm">Vos transactions apparaîtront ici</p>
          </div>
        ) : (
          <div className="space-y-3">
            {balancedTransactions.map((transaction) => (
              <div
                key={`${transaction.type}-${transaction.id}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${getTransactionColor(transaction.type)}`}>
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {getTransactionLabel(transaction.type)}
                      </span>
                      <Badge
                        variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {transaction.status === 'completed' ? 'Complété' : 
                         transaction.status === 'pending' ? 'En cours' : transaction.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 truncate max-w-48">
                      {transaction.description}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${
                    transaction.impact === 'credit' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.impact === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount, transaction.currency)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(transaction.date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReliableTransactionsCard;
