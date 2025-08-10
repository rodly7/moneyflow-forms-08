
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
      // Charger les transferts
      const { data: transfers, error: transferError } = await supabase
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
        .limit(100);

      if (transferError) throw transferError;

      const formattedTransactions = transfers?.map(t => ({
        id: t.id,
        amount: t.amount,
        status: t.status,
        created_at: t.created_at,
        sender_full_name: (t.sender as any)?.full_name || 'N/A',
        recipient_full_name: t.recipient_full_name,
        recipient_phone: t.recipient_phone,
        fees: t.fees,
        type: 'transfer'
      })) || [];

      setTransactions(formattedTransactions);
    } catch (error) {
      console.error('Erreur chargement transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  if (loading) {
    return <div style={{ padding: '20px' }}>Chargement des transactions...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        >
          <option value="all">Toutes les transactions</option>
          <option value="completed">Complétées</option>
          <option value="pending">En attente</option>
          <option value="failed">Échouées</option>
        </select>
        
        <button
          onClick={loadTransactions}
          style={{
            padding: '10px 15px',
            backgroundColor: '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Actualiser
        </button>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <strong>Total: {filteredTransactions.length} transactions</strong>
      </div>

      <table style={{ 
        width: '100%', 
        borderCollapse: 'collapse',
        border: '1px solid #ddd'
      }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>ID</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Expéditeur</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Destinataire</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Montant</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Frais</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Statut</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Date</th>
          </tr>
        </thead>
        <tbody>
          {filteredTransactions.map((transaction) => (
            <tr key={transaction.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '12px' }}>
                {transaction.id.slice(0, 8)}...
              </td>
              <td style={{ padding: '12px' }}>{transaction.sender_full_name}</td>
              <td style={{ padding: '12px' }}>
                {transaction.recipient_full_name}
                <br />
                <small style={{ color: '#666' }}>{transaction.recipient_phone}</small>
              </td>
              <td style={{ padding: '12px', fontWeight: 'bold' }}>
                {new Intl.NumberFormat('fr-FR').format(transaction.amount)} FCFA
              </td>
              <td style={{ padding: '12px' }}>
                {new Intl.NumberFormat('fr-FR').format(transaction.fees)} FCFA
              </td>
              <td style={{ padding: '12px' }}>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  backgroundColor: 
                    transaction.status === 'completed' ? '#009900' :
                    transaction.status === 'pending' ? '#ff6600' : '#cc0000',
                  color: 'white'
                }}>
                  {transaction.status}
                </span>
              </td>
              <td style={{ padding: '12px', fontSize: '12px' }}>
                {new Date(transaction.created_at).toLocaleString('fr-FR')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
