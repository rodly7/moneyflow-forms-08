
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface Transaction {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  sender_full_name?: string;
  recipient_full_name?: string;
  recipient_phone?: string;
  fees: number;
  type: string;
}

export const SimpleTransactionsList = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const loadTransactions = async () => {
    try {
      setLoading(true);
      
      // Charger tous les types de transactions
      const [transfersResponse, withdrawalsResponse, rechargesResponse, merchantPaymentsResponse] = await Promise.all([
        // Transferts
        supabase
          .from('transfers')
          .select(`
            id,
            amount,
            status,
            created_at,
            recipient_full_name,
            recipient_phone,
            fees,
            sender:profiles!sender_id(full_name)
          `)
          .order('created_at', { ascending: false })
          .limit(50),
        
        // Retraits
        supabase
          .from('withdrawals')
          .select(`
            id,
            amount,
            status,
            created_at,
            withdrawal_phone,
            user:profiles!user_id(full_name)
          `)
          .order('created_at', { ascending: false })
          .limit(50),
        
        // Recharges
        supabase
          .from('recharges')
          .select(`
            id,
            amount,
            status,
            created_at,
            user:profiles!user_id(full_name)
          `)
          .order('created_at', { ascending: false })
          .limit(50),
        
        // Paiements marchands
        supabase
          .from('merchant_payments')
          .select(`
            id,
            amount,
            status,
            created_at,
            business_name,
            user:profiles!user_id(full_name)
          `)
          .order('created_at', { ascending: false })
          .limit(50)
      ]);

      const allTransactions = [];

      // Transferts
      if (transfersResponse.data) {
        allTransactions.push(...transfersResponse.data.map(t => ({
          id: t.id,
          amount: t.amount,
          status: t.status,
          created_at: t.created_at,
          sender_full_name: (t.sender as any)?.full_name || 'N/A',
          recipient_full_name: t.recipient_full_name,
          recipient_phone: t.recipient_phone,
          fees: t.fees || 0,
          type: 'transfer'
        })));
      }

      // Retraits
      if (withdrawalsResponse.data) {
        allTransactions.push(...withdrawalsResponse.data.map(w => ({
          id: w.id,
          amount: w.amount,
          status: w.status,
          created_at: w.created_at,
          sender_full_name: (w.user as any)?.full_name || 'N/A',
          recipient_full_name: 'Retrait',
          recipient_phone: w.withdrawal_phone,
          fees: 0,
          type: 'withdrawal'
        })));
      }

      // Recharges
      if (rechargesResponse.data) {
        allTransactions.push(...rechargesResponse.data.map(r => ({
          id: r.id,
          amount: r.amount,
          status: r.status,
          created_at: r.created_at,
          sender_full_name: 'Recharge',
          recipient_full_name: (r.user as any)?.full_name || 'N/A',
          recipient_phone: '',
          fees: 0,
          type: 'recharge'
        })));
      }

      // Paiements marchands
      if (merchantPaymentsResponse.data) {
        allTransactions.push(...merchantPaymentsResponse.data.map(m => ({
          id: m.id,
          amount: m.amount,
          status: m.status,
          created_at: m.created_at,
          sender_full_name: (m.user as any)?.full_name || 'N/A',
          recipient_full_name: m.business_name,
          recipient_phone: '',
          fees: 0,
          type: 'merchant_payment'
        })));
      }

      // Trier par date de création
      allTransactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setTransactions(allTransactions.slice(0, 20)); // Limiter à 20 transactions
    } catch (error) {
      console.error('Erreur chargement transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
    
    // Configuration du temps réel pour tous les types de transactions
    const channels = [
      supabase
        .channel('transfers-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transfers' }, () => {
          loadTransactions();
        })
        .subscribe(),
      
      supabase
        .channel('withdrawals-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals' }, () => {
          loadTransactions();
        })
        .subscribe(),
      
      supabase
        .channel('recharges-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'recharges' }, () => {
          loadTransactions();
        })
        .subscribe(),
      
      supabase
        .channel('merchant-payments-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'merchant_payments' }, () => {
          loadTransactions();
        })
        .subscribe()
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, []);

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'type') return true;
    return t.status === filter;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'transfer': return 'bg-blue-100 text-blue-800';
      case 'withdrawal': return 'bg-red-100 text-red-800';
      case 'recharge': return 'bg-green-100 text-green-800';
      case 'merchant_payment': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'transfer': return 'Transfert';
      case 'withdrawal': return 'Retrait';
      case 'recharge': return 'Recharge';
      case 'merchant_payment': return 'Paiement Marchand';
      default: return type;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Chargement des transactions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-border rounded-md text-sm focus:ring-2 focus:ring-primary"
        >
          <option value="all">Toutes les transactions</option>
          <option value="completed">Complétées</option>
          <option value="pending">En attente</option>
          <option value="failed">Échouées</option>
        </select>
        
        <Button
          onClick={loadTransactions}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
        
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-muted-foreground">Temps réel</span>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        <strong>{filteredTransactions.length} transactions</strong> - Mise à jour automatique
      </div>

      <div className="max-h-96 overflow-y-auto border rounded-lg">
        <div className="space-y-2 p-2">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune transaction trouvée
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <div 
                key={transaction.id} 
                className="flex items-center justify-between p-3 bg-card border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={getTypeColor(transaction.type)} variant="outline">
                      {getTypeLabel(transaction.type)}
                    </Badge>
                    <Badge variant={getStatusVariant(transaction.status)}>
                      {transaction.status}
                    </Badge>
                  </div>
                  
                  <div className="text-sm">
                    <div className="font-medium truncate">
                      {transaction.sender_full_name} → {transaction.recipient_full_name}
                    </div>
                    {transaction.recipient_phone && (
                      <div className="text-muted-foreground text-xs">
                        {transaction.recipient_phone}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-semibold">
                    {new Intl.NumberFormat('fr-FR').format(transaction.amount)} FCFA
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(transaction.created_at).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
