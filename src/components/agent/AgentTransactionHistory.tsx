
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Activity, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  Wallet,
  RefreshCw 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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

const AgentTransactionHistory = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<AgentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchAgentTransactions = async (date?: string) => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const startDate = date ? new Date(date) : new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);

      const allTransactions: AgentTransaction[] = [];

      // 1. Fetch client withdrawals
      const { data: withdrawals } = await supabase
        .from('withdrawals')
        .select('id, amount, status, created_at, user_id')
        .eq('agent_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (withdrawals) {
        for (const withdrawal of withdrawals) {
          // Fetch user profile separately
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, phone')
            .eq('id', withdrawal.user_id)
            .single();

          allTransactions.push({
            id: withdrawal.id,
            type: 'client_withdrawal',
            amount: Number(withdrawal.amount),
            time: new Date(withdrawal.created_at).toLocaleTimeString('fr-FR'),
            client_phone: profile?.phone || '',
            client_name: profile?.full_name || '',
            status: withdrawal.status,
            commission: Number(withdrawal.amount) * 0.005,
            created_at: withdrawal.created_at
          });
        }
      }

      // 2. Fetch client deposits
      const { data: deposits } = await supabase
        .from('recharges')
        .select('id, amount, status, created_at, user_id')
        .eq('provider_transaction_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (deposits) {
        for (const deposit of deposits) {
          // Fetch user profile separately
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, phone')
            .eq('id', deposit.user_id)
            .single();

          allTransactions.push({
            id: deposit.id,
            type: 'client_deposit',
            amount: Number(deposit.amount),
            time: new Date(deposit.created_at).toLocaleTimeString('fr-FR'),
            client_phone: profile?.phone || '',
            client_name: profile?.full_name || '',
            status: deposit.status,
            commission: Number(deposit.amount) * 0.01,
            created_at: deposit.created_at
          });
        }
      }

      // 3. Fetch agent transfers
      const { data: transfers } = await supabase
        .from('transfers')
        .select('id, amount, status, created_at')
        .eq('sender_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (transfers) {
        transfers.forEach((transfer) => {
          allTransactions.push({
            id: transfer.id,
            type: 'commission_transfer',
            amount: Number(transfer.amount),
            time: new Date(transfer.created_at).toLocaleTimeString('fr-FR'),
            status: transfer.status,
            created_at: transfer.created_at
          });
        });
      }

      // 4. Fetch balance recharges
      const { data: recharges } = await supabase
        .from('admin_deposits')
        .select('id, converted_amount, status, created_at')
        .eq('target_user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (recharges) {
        recharges.forEach((recharge) => {
          allTransactions.push({
            id: recharge.id,
            type: 'balance_recharge',
            amount: Number(recharge.converted_amount),
            time: new Date(recharge.created_at).toLocaleTimeString('fr-FR'),
            status: recharge.status,
            created_at: recharge.created_at
          });
        });
      }

      // Sort by date descending
      allTransactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setTransactions(allTransactions);

    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique agent:', error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAgentTransactions(selectedDate);
  }, [user?.id, selectedDate]);

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
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Historique des Transactions
        </CardTitle>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {transactions.length} transaction{transactions.length > 1 ? 's' : ''}
            </Badge>
          </div>
          <Button
            onClick={() => fetchAgentTransactions(selectedDate)}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="w-full">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            <Activity className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Aucune transaction ce jour</p>
            <p className="text-sm">Sélectionnez une autre date pour voir l'historique</p>
          </div>
        ) : (
          <div className="space-y-4 w-full">
            {transactions.map((transaction) => (
              <div
                key={`${transaction.type}-${transaction.id}`}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors w-full"
              >
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
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AgentTransactionHistory;
