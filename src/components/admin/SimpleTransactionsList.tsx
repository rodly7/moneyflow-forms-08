
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
      console.log('🔄 Chargement des transactions...');
      setLoading(true);
      
      // Charger tous les types de transactions et commissions Sendflow
      const [transfersResponse, withdrawalsResponse, rechargesResponse, merchantPaymentsResponse, sendflowCommissionsResponse] = await Promise.all([
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
            sender_id
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
            user_id
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
            user_id
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
            user_id
          `)
          .order('created_at', { ascending: false })
          .limit(50),
        
        // Commissions Sendflow
        supabase
          .from('sendflow_commission_payments')
          .select(`
            id,
            amount,
            created_at,
            payment_date,
            merchant_id
          `)
          .order('created_at', { ascending: false })
          .limit(50)
      ]);

      console.log('📊 Réponses reçues:', {
        transfers: transfersResponse.data?.length || 0,
        withdrawals: withdrawalsResponse.data?.length || 0,
        recharges: rechargesResponse.data?.length || 0,
        merchantPayments: merchantPaymentsResponse.data?.length || 0,
        sendflowCommissions: sendflowCommissionsResponse.data?.length || 0,
        transfersError: transfersResponse.error,
        withdrawalsError: withdrawalsResponse.error,
        rechargesError: rechargesResponse.error,
        merchantPaymentsError: merchantPaymentsResponse.error,
        sendflowCommissionsError: sendflowCommissionsResponse.error
      });

      const allTransactions = [];
      
      // Récupérer les noms des utilisateurs en lot
      const allUserIds = new Set();
      
      // Collecter tous les IDs d'utilisateurs
      transfersResponse.data?.forEach(t => allUserIds.add(t.sender_id));
      withdrawalsResponse.data?.forEach(w => allUserIds.add(w.user_id));
      rechargesResponse.data?.forEach(r => allUserIds.add(r.user_id));
      merchantPaymentsResponse.data?.forEach(m => allUserIds.add(m.user_id));
      sendflowCommissionsResponse.data?.forEach(s => allUserIds.add(s.merchant_id));
      
      // Récupérer tous les profils en une seule requête
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', Array.from(allUserIds).filter(id => id) as string[]);
      
      const profileMap = profiles?.reduce((acc, profile) => {
        acc[profile.id] = profile.full_name;
        return acc;
      }, {} as Record<string, string>) || {};

      // Transferts
      if (transfersResponse.data) {
        allTransactions.push(...transfersResponse.data.map(t => ({
          id: t.id,
          amount: t.amount,
          status: t.status,
          created_at: t.created_at,
          sender_full_name: profileMap[t.sender_id] || 'N/A',
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
          sender_full_name: profileMap[w.user_id] || 'N/A',
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
          recipient_full_name: profileMap[r.user_id] || 'N/A',
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
          sender_full_name: profileMap[m.user_id] || 'N/A',
          recipient_full_name: m.business_name,
          recipient_phone: '',
          fees: 0,
          type: 'merchant_payment'
        })));
      }

      // Commissions Sendflow
      if (sendflowCommissionsResponse.data) {
        allTransactions.push(...sendflowCommissionsResponse.data.map(s => ({
          id: s.id,
          amount: s.amount,
          status: 'completed',
          created_at: s.created_at,
          sender_full_name: profileMap[s.merchant_id] || 'N/A',
          recipient_full_name: 'Sendflow Commission',
          recipient_phone: '',
          fees: 0,
          type: 'sendflow_commission'
        })));
      }

      // Trier par date de création
      allTransactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      const finalTransactions = allTransactions.slice(0, 20);
      console.log('✅ Transactions finales chargées:', finalTransactions.length, finalTransactions);
      setTransactions(finalTransactions); // Limiter à 20 transactions
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
        .subscribe(),
      
      supabase
        .channel('sendflow-commissions-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sendflow_commission_payments' }, () => {
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
      case 'sendflow_commission': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'transfer': return 'Transfert';
      case 'withdrawal': return 'Retrait';
      case 'recharge': return 'Recharge';
      case 'merchant_payment': return 'Paiement Marchand';
      case 'sendflow_commission': return 'Commission Sendflow';
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
                  <div className="font-semibold flex items-center gap-1">
                    {new Intl.NumberFormat('fr-FR').format(transaction.amount)} FCFA
                    {transaction.type === 'sendflow_commission' && (
                      <span className="text-xs bg-orange-500 text-white px-1 rounded">SF</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(transaction.created_at).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  {transaction.fees > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Frais: {new Intl.NumberFormat('fr-FR').format(transaction.fees)} FCFA
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
