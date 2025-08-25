
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, RefreshCw, ArrowUpRight, ArrowDownLeft, Plus, CreditCard, FileText, Minus } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { useAllTransactions } from "@/hooks/useAllTransactions";
import { useAuth } from "@/contexts/AuthContext";

const ReliableTransactionsCard = () => {
  const { user } = useAuth();
  const { transactions, loading, error, refetch } = useAllTransactions(user?.id);

  console.log("🔍 TRANSACTIONS RÉCENTES - Total récupéré:", transactions.length);
  console.log("📊 TRANSACTIONS RÉCENTES - Détail par type:", {
    recharges: transactions.filter(t => t.type === 'recharge').length,
    retraits: transactions.filter(t => t.type === 'withdrawal').length,
    transferts_envoyés: transactions.filter(t => t.type === 'transfer_sent').length,
    transferts_reçus: transactions.filter(t => t.type === 'transfer_received').length,
    paiements_factures: transactions.filter(t => t.type === 'bill_payment').length,
    en_attente: transactions.filter(t => t.type === 'transfer_pending').length
  });

  // Afficher les 5 transactions les plus récentes
  const recentTransactions = transactions.slice(0, 5);

  // Statistiques par type pour les badges
  const stats = {
    recharges: transactions.filter(t => t.type === 'recharge').length,
    withdrawals: transactions.filter(t => t.type === 'withdrawal').length,
    transfers_sent: transactions.filter(t => t.type === 'transfer_sent').length,
    transfers_received: transactions.filter(t => t.type === 'transfer_received').length,
    bills: transactions.filter(t => t.type === 'bill_payment').length,
    pending: transactions.filter(t => t.type === 'transfer_pending').length
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'recharge': return <Plus className="w-4 h-4 text-green-600" />;
      case 'withdrawal': return <Minus className="w-4 h-4 text-red-600" />;
      case 'transfer_sent': return <ArrowUpRight className="w-4 h-4 text-blue-600" />;
      case 'transfer_received': return <ArrowDownLeft className="w-4 h-4 text-green-600" />;
      case 'transfer_pending': return <Activity className="w-4 h-4 text-orange-600" />;
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
      case 'transfer_pending': return 'bg-orange-100 text-orange-800';
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
      case 'transfer_pending': return 'En attente';
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
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
        
        {/* Statistiques par type */}
        <div className="flex flex-wrap gap-2">
          {stats.recharges > 0 && (
            <Badge variant="secondary" className="bg-green-50 text-green-700">
              <Plus className="w-3 h-3 mr-1" />
              {stats.recharges} recharge{stats.recharges > 1 ? 's' : ''}
            </Badge>
          )}
          {stats.withdrawals > 0 && (
            <Badge variant="secondary" className="bg-red-50 text-red-700">
              <Minus className="w-3 h-3 mr-1" />
              {stats.withdrawals} retrait{stats.withdrawals > 1 ? 's' : ''}
            </Badge>
          )}
          {stats.transfers_sent > 0 && (
            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
              <ArrowUpRight className="w-3 h-3 mr-1" />
              {stats.transfers_sent} envoi{stats.transfers_sent > 1 ? 's' : ''}
            </Badge>
          )}
          {stats.transfers_received > 0 && (
            <Badge variant="secondary" className="bg-green-50 text-green-700">
              <ArrowDownLeft className="w-3 h-3 mr-1" />
              {stats.transfers_received} réception{stats.transfers_received > 1 ? 's' : ''}
            </Badge>
          )}
          {stats.bills > 0 && (
            <Badge variant="secondary" className="bg-purple-50 text-purple-700">
              <FileText className="w-3 h-3 mr-1" />
              {stats.bills} facture{stats.bills > 1 ? 's' : ''}
            </Badge>
          )}
          {stats.pending > 0 && (
            <Badge variant="secondary" className="bg-orange-50 text-orange-700">
              <Activity className="w-3 h-3 mr-1" />
              {stats.pending} en attente
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center p-8 text-red-500">
            <Activity className="w-16 h-16 mx-auto mb-4 text-red-300" />
            <p className="text-lg font-medium">Erreur de chargement</p>
            <p className="text-sm">{error}</p>
            <Button onClick={() => refetch()} className="mt-4">
              Réessayer
            </Button>
          </div>
        ) : recentTransactions.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            <Activity className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Aucune transaction récente</p>
            <p className="text-sm">Vos transactions apparaîtront ici</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
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
                    {new Date(transaction.date).toLocaleDateString('fr-FR', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
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
