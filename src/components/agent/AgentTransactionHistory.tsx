
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
import { AgentTransactionItem } from "./AgentTransactionItem";

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

      // 1. Fetch client withdrawals - simplified approach
      const { data: withdrawalsRaw } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('agent_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (withdrawalsRaw) {
        // Get user profiles separately
        const userIds = withdrawalsRaw.map(w => w.user_id).filter(Boolean);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, phone')
          .in('id', userIds);

        const profilesMap = new Map();
        profiles?.forEach(p => profilesMap.set(p.id, p));

        withdrawalsRaw.forEach(withdrawal => {
          const profile = profilesMap.get(withdrawal.user_id);
          allTransactions.push({
            id: withdrawal.id,
            type: 'client_withdrawal',
            amount: withdrawal.amount,
            time: new Date(withdrawal.created_at).toLocaleTimeString('fr-FR'),
            client_phone: profile?.phone || '',
            client_name: profile?.full_name || '',
            status: withdrawal.status,
            commission: withdrawal.amount * 0.005,
            created_at: withdrawal.created_at
          });
        });
      }

      // 2. Fetch client deposits - simplified approach
      const { data: depositsRaw } = await supabase
        .from('recharges')
        .select('*')
        .eq('provider_transaction_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (depositsRaw) {
        // Get user profiles separately
        const userIds = depositsRaw.map(d => d.user_id).filter(Boolean);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, phone')
          .in('id', userIds);

        const profilesMap = new Map();
        profiles?.forEach(p => profilesMap.set(p.id, p));

        depositsRaw.forEach(deposit => {
          const profile = profilesMap.get(deposit.user_id);
          allTransactions.push({
            id: deposit.id,
            type: 'client_deposit',
            amount: deposit.amount,
            time: new Date(deposit.created_at).toLocaleTimeString('fr-FR'),
            client_phone: profile?.phone || '',
            client_name: profile?.full_name || '',
            status: deposit.status,
            commission: deposit.amount * 0.01,
            created_at: deposit.created_at
          });
        });
      }

      // 3. Fetch agent transfers - simplified approach
      const { data: transfersRaw } = await supabase
        .from('transfers')
        .select('*')
        .eq('sender_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (transfersRaw) {
        transfersRaw.forEach(transfer => {
          allTransactions.push({
            id: transfer.id,
            type: 'commission_transfer',
            amount: transfer.amount,
            time: new Date(transfer.created_at).toLocaleTimeString('fr-FR'),
            status: transfer.status,
            created_at: transfer.created_at
          });
        });
      }

      // 4. Fetch balance recharges - simplified approach
      const { data: rechargesRaw } = await supabase
        .from('admin_deposits')
        .select('*')
        .eq('target_user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (rechargesRaw) {
        rechargesRaw.forEach(recharge => {
          allTransactions.push({
            id: recharge.id,
            type: 'balance_recharge',
            amount: recharge.converted_amount,
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
              <AgentTransactionItem
                key={`${transaction.type}-${transaction.id}`}
                transaction={transaction}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AgentTransactionHistory;
