
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Activity, ArrowUpRight, ArrowDownLeft, Plus, Download, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface AgentTransaction {
  id: string;
  type: 'client_deposit' | 'client_withdrawal' | 'commission_withdrawal';
  amount: number;
  time: string;
  client_name?: string;
  client_phone?: string;
  status: string;
  created_at: string;
}

const AgentTransactionHistory = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<AgentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchAgentTransactions = async (date: string) => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);

      const allTransactions: AgentTransaction[] = [];

      // Récupérer les dépôts clients (recharges créées par l'agent)
      const { data: deposits } = await supabase
        .from('recharges')
        .select(`
          *,
          profiles!recharges_user_id_fkey(full_name, phone)
        `)
        .eq('payment_method', 'agent')
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (deposits) {
        deposits.forEach(deposit => {
          const profile = deposit.profiles as any;
          allTransactions.push({
            id: deposit.id,
            type: 'client_deposit',
            amount: Number(deposit.amount),
            time: new Date(deposit.created_at).toLocaleTimeString('fr-FR'),
            client_name: profile?.full_name,
            client_phone: profile?.phone,
            status: deposit.status,
            created_at: deposit.created_at
          });
        });
      }

      // Récupérer les retraits clients (withdrawals traités par l'agent)
      const { data: withdrawals } = await supabase
        .from('withdrawals')
        .select(`
          *,
          profiles!withdrawals_user_id_fkey(full_name, phone)
        `)
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (withdrawals) {
        withdrawals.forEach(withdrawal => {
          const profile = withdrawal.profiles as any;
          allTransactions.push({
            id: withdrawal.id,
            type: 'client_withdrawal',
            amount: Number(withdrawal.amount),
            time: new Date(withdrawal.created_at).toLocaleTimeString('fr-FR'),
            client_name: profile?.full_name,
            client_phone: withdrawal.withdrawal_phone,
            status: withdrawal.status,
            created_at: withdrawal.created_at
          });
        });
      }

      // Récupérer les transferts de commissions (agent vers son solde principal)
      const { data: commissionTransfers } = await supabase
        .from('transfers')
        .select('*')
        .eq('sender_id', user.id)
        .eq('recipient_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (commissionTransfers) {
        commissionTransfers.forEach(transfer => {
          allTransactions.push({
            id: transfer.id,
            type: 'commission_withdrawal',
            amount: Number(transfer.amount),
            time: new Date(transfer.created_at).toLocaleTimeString('fr-FR'),
            status: transfer.status,
            created_at: transfer.created_at
          });
        });
      }

      // Trier par heure décroissante
      allTransactions.sort((a, b) => b.time.localeCompare(a.time));
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
      case 'client_deposit': return <Plus className="w-4 h-4" />;
      case 'client_withdrawal': return <Download className="w-4 h-4" />;
      case 'commission_withdrawal': return <ArrowUpRight className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'client_deposit': return 'Dépôt client';
      case 'client_withdrawal': return 'Retrait client';
      case 'commission_withdrawal': return 'Retrait commission';
      default: return 'Opération';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'client_deposit': return 'bg-green-100 text-green-800';
      case 'client_withdrawal': return 'bg-red-100 text-red-800';
      case 'commission_withdrawal': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAmountColor = (type: string) => {
    switch (type) {
      case 'client_deposit': return 'text-green-600';
      case 'commission_withdrawal': return 'text-blue-600';
      default: return 'text-red-600';
    }
  };

  const getAmountPrefix = (type: string) => {
    return type === 'client_deposit' || type === 'commission_withdrawal' ? '+' : '-';
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Historique des Transactions
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAgentTransactions(selectedDate)}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
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
                key={transaction.id}
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
                        {transaction.status === 'completed' ? 'Complété' : 'En cours'}
                      </Badge>
                    </div>
                    {transaction.client_name && (
                      <p className="text-sm text-gray-600">
                        Client: {transaction.client_name}
                        {transaction.client_phone && ` (${transaction.client_phone})`}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      {format(new Date(transaction.created_at), 'PPp', { locale: fr })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-lg ${getAmountColor(transaction.type)}`}>
                    {getAmountPrefix(transaction.type)}{formatCurrency(transaction.amount, 'XAF')}
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
