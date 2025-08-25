
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, RefreshCw, ArrowUpRight, ArrowDownLeft, Plus, FileText, CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { useUnifiedTransactions } from "@/hooks/useUnifiedTransactions";
import { useAuth } from "@/contexts/AuthContext";

const UnifiedTransactionsCard = () => {
  const { user } = useAuth();
  const { transactions, isLoading, refetch } = useUnifiedTransactions(user?.id);

  console.log("🔍 UNIFIED CARD - Transactions reçues:", transactions.length);
  console.log("📊 UNIFIED CARD - Détail:", {
    recharges: transactions.filter(t => t.type === 'recharge').length,
    retraits: transactions.filter(t => t.type === 'withdrawal').length,
    transferts_envoyés: transactions.filter(t => t.type === 'transfer_sent').length,
    transferts_reçus: transactions.filter(t => t.type === 'transfer_received').length,
    factures: transactions.filter(t => t.type === 'bill_payment').length
  });

  // Afficher les 10 transactions les plus récentes
  const recentTransactions = transactions.slice(0, 10);

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
      case 'recharge': return 'bg-green-100 text-green-800 border-green-200';
      case 'withdrawal': return 'bg-red-100 text-red-800 border-red-200';
      case 'transfer_sent': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'transfer_received': return 'bg-green-100 text-green-800 border-green-200';
      case 'bill_payment': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const getAmountColor = (impact: string) => {
    return impact === 'credit' ? 'text-green-600' : 'text-red-600';
  };

  const getAmountPrefix = (impact: string) => {
    return impact === 'credit' ? '+' : '-';
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <span>Transactions Récentes</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {transactions.length} total
            </Badge>
            <Button
              onClick={refetch}
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
        
        {/* Badges de résumé par type */}
        <div className="flex flex-wrap gap-2 mt-2">
          {transactions.filter(t => t.type === 'recharge').length > 0 && (
            <Badge className="bg-green-50 text-green-700 border-green-200">
              <Plus className="w-3 h-3 mr-1" />
              {transactions.filter(t => t.type === 'recharge').length} recharge(s)
            </Badge>
          )}
          {transactions.filter(t => t.type === 'withdrawal').length > 0 && (
            <Badge className="bg-red-50 text-red-700 border-red-200">
              <ArrowUpRight className="w-3 h-3 mr-1" />
              {transactions.filter(t => t.type === 'withdrawal').length} retrait(s)
            </Badge>
          )}
          {transactions.filter(t => t.type === 'transfer_sent').length > 0 && (
            <Badge className="bg-blue-50 text-blue-700 border-blue-200">
              <ArrowUpRight className="w-3 h-3 mr-1" />
              {transactions.filter(t => t.type === 'transfer_sent').length} envoi(s)
            </Badge>
          )}
          {transactions.filter(t => t.type === 'transfer_received').length > 0 && (
            <Badge className="bg-green-50 text-green-700 border-green-200">
              <ArrowDownLeft className="w-3 h-3 mr-1" />
              {transactions.filter(t => t.type === 'transfer_received').length} réception(s)
            </Badge>
          )}
          {transactions.filter(t => t.type === 'bill_payment').length > 0 && (
            <Badge className="bg-purple-50 text-purple-700 border-purple-200">
              <FileText className="w-3 h-3 mr-1" />
              {transactions.filter(t => t.type === 'bill_payment').length} facture(s)
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Chargement des transactions...</span>
          </div>
        ) : recentTransactions.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Aucune transaction récente</p>
            <p className="text-sm">Vos transactions apparaîtront ici automatiquement</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200 border border-gray-200"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className={`p-2 rounded-full border ${getTransactionColor(transaction.type)}`}>
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-gray-900">
                        {getTransactionLabel(transaction.type)}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          transaction.status === 'completed' 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                        }`}
                      >
                        {transaction.status === 'completed' ? 'Complété' : 'En cours'}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 truncate">
                      {transaction.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {transaction.date.toLocaleDateString('fr-FR')} à {transaction.date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="text-right ml-3">
                  <p className={`font-bold text-sm ${getAmountColor(transaction.impact)}`}>
                    {getAmountPrefix(transaction.impact)}{formatCurrency(transaction.amount, transaction.currency)}
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

export default UnifiedTransactionsCard;
