
import { Badge } from "@/components/ui/badge";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  Wallet,
  Activity 
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";

interface AgentTransaction {
  id: string;
  type: 'client_deposit' | 'client_withdrawal' | 'commission_transfer' | 'balance_recharge';
  amount: number;
  time: string;
  client_phone?: string;
  client_name?: string;
  status: string;
  commission?: number;
  created_at: string;
}

interface AgentTransactionItemProps {
  transaction: AgentTransaction;
}

export const AgentTransactionItem = ({ transaction }: AgentTransactionItemProps) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'client_withdrawal': return <ArrowUpRight className="w-4 h-4" />;
      case 'client_deposit': return <ArrowDownLeft className="w-4 h-4" />;
      case 'commission_transfer': return <Wallet className="w-4 h-4" />;
      case 'balance_recharge': return <Plus className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'client_withdrawal': return 'Retrait Client';
      case 'client_deposit': return 'Dépôt Client';
      case 'commission_transfer': return 'Transfert Commission';
      case 'balance_recharge': return 'Recharge Solde';
      default: return 'Opération';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'client_withdrawal': return 'bg-red-100 text-red-800';
      case 'client_deposit': return 'bg-green-100 text-green-800';
      case 'commission_transfer': return 'bg-blue-100 text-blue-800';
      case 'balance_recharge': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors w-full">
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-full ${getTypeColor(transaction.type)}`}>
          {getTypeIcon(transaction.type)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{getTypeLabel(transaction.type)}</span>
            <Badge
              variant={transaction.status === 'completed' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {transaction.status === 'completed' ? 'Complété' : 
               transaction.status === 'pending' ? 'En cours' : transaction.status}
            </Badge>
          </div>
          <p className="text-sm text-gray-600">
            {transaction.client_name && `${transaction.client_name} - `}
            {transaction.client_phone && `${transaction.client_phone}`}
            {transaction.commission && (
              <span className="text-green-600 ml-2">
                Commission: {formatCurrency(transaction.commission, 'XAF')}
              </span>
            )}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-lg">
          {formatCurrency(transaction.amount, 'XAF')}
        </p>
        <p className="text-sm text-gray-500">{transaction.time}</p>
      </div>
    </div>
  );
};
