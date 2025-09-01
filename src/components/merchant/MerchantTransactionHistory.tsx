import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const MerchantTransactionHistory = () => {
  const { profile } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Charger les vraies transactions de l'utilisateur
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!profile?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('merchant_payments')
          .select('*')
          .eq('merchant_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Erreur lors du chargement des transactions:', error);
        } else {
          setTransactions(data || []);
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [profile?.id]);

  // Données d'exemple si aucune transaction réelle
  const exampleTransactions = [
    {
      id: 'TX001',
      amount: 5000,
      business_name: 'Client A',
      status: 'completed',
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      description: 'Commande #123'
    },
    {
      id: 'TX002',
      amount: 2500,
      business_name: 'Client B', 
      status: 'pending',
      created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      description: 'Achat divers'
    }
  ];

  const displayTransactions = transactions.length > 0 ? transactions : exampleTransactions;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Payé</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Échoué</Badge>;
      default:
        return <Badge>Inconnu</Badge>;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique des Paiements</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Chargement des transactions...</p>
          </div>
        ) : displayTransactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Aucun paiement reçu aujourd'hui</p>
            <p className="text-sm text-muted-foreground mt-2">
              Les paiements par QR code apparaîtront ici
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayTransactions.map((transaction) => (
              <div 
                key={transaction.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(transaction.status)}
                  <div>
                    <p className="font-medium">{transaction.business_name || 'Client'}</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.description || 'Paiement'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(transaction.created_at)}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-bold text-lg">
                    {transaction.amount.toLocaleString()} XAF
                  </p>
                  {getStatusBadge(transaction.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MerchantTransactionHistory;